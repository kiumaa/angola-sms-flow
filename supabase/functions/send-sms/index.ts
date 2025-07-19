
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  phoneNumber: string;
  message: string;
  campaignId?: string;
  isTest?: boolean;
}

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const limit = rateLimitMap.get(userId);
  
  if (!limit || now > limit.resetTime) {
    // Reset or create new limit (10 requests per minute)
    rateLimitMap.set(userId, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (limit.count >= 10) {
    return false; // Rate limit exceeded
  }
  
  limit.count++;
  return true;
};

const validateAngolanPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  const patterns = [
    /^\+244[9][0-9]{8}$/,
    /^244[9][0-9]{8}$/,
    /^[9][0-9]{8}$/,
  ];
  return patterns.some(pattern => pattern.test(cleanPhone));
};

const normalizePhone = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleanPhone.startsWith('+244')) return cleanPhone;
  if (cleanPhone.startsWith('244')) return '+' + cleanPhone;
  if (cleanPhone.startsWith('9') && cleanPhone.length === 9) return '+244' + cleanPhone;
  
  return phone;
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Maximum 10 requests per minute.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { phoneNumber, message, campaignId, isTest = false }: SMSRequest = await req.json();

    // Validate inputs
    if (!phoneNumber || !message) {
      throw new Error('Phone number and message are required');
    }

    if (!validateAngolanPhone(phoneNumber)) {
      throw new Error('Invalid Angolan phone number format');
    }

    if (message.length > 160) {
      throw new Error('Message too long (max 160 characters)');
    }

    // Sanitize message
    const sanitizedMessage = message
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .trim();

    const normalizedPhone = normalizePhone(phoneNumber);
    const startTime = Date.now();

    // Get primary gateway
    const { data: primaryGateway } = await supabase
      .from('sms_gateways')
      .select('*')
      .eq('is_primary', true)
      .eq('is_active', true)
      .single();

    if (!primaryGateway) {
      throw new Error('No active primary gateway configured');
    }

    let success = false;
    let error = null;
    let gatewayUsed = primaryGateway.name;
    let fallbackAttempted = false;

    try {
      // Try primary gateway first
      if (primaryGateway.name === 'bulkgate') {
        const response = await fetch('https://portal.bulkgate.com/api/1.0/simple/transactional', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            application_id: Deno.env.get('BULKGATE_API_KEY'),
            application_token: Deno.env.get('BULKGATE_API_KEY'),
            number: normalizedPhone,
            text: sanitizedMessage,
            sender_id: 'SMSao',
            sender_id_value: 'SMSao'
          })
        });

        const result = await response.json();
        
        if (response.ok && result.data && result.data.status === 'accepted') {
          success = true;
        } else {
          throw new Error(result.error?.message || 'BulkGate API error');
        }
      }
    } catch (primaryError) {
      console.error('Primary gateway failed:', primaryError);
      error = primaryError.message;

      // Try fallback gateway (BulkSMS)
      try {
        fallbackAttempted = true;
        gatewayUsed = 'bulksms';

        const response = await fetch('https://api.bulksms.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${Deno.env.get('BULKSMS_TOKEN_ID')}:${Deno.env.get('BULKSMS_TOKEN_SECRET')}`)}`,
          },
          body: JSON.stringify({
            to: normalizedPhone,
            body: sanitizedMessage,
            from: 'SMSao'
          })
        });

        if (response.ok) {
          success = true;
          error = null;
        } else {
          const fallbackResult = await response.json();
          throw new Error(fallbackResult.detail || 'BulkSMS API error');
        }
      } catch (fallbackError) {
        console.error('Fallback gateway also failed:', fallbackError);
        error = fallbackError.message;
      }
    }

    const responseTime = Date.now() - startTime;

    // Log SMS attempt
    if (campaignId) {
      await supabase.from('sms_logs').insert({
        campaign_id: campaignId,
        user_id: user.id,
        phone_number: normalizedPhone,
        message: sanitizedMessage,
        status: success ? 'sent' : 'failed',
        gateway_used: gatewayUsed,
        original_gateway: primaryGateway.name,
        fallback_attempted: fallbackAttempted,
        error_message: error,
        cost_credits: success ? 1 : 0,
        sent_at: success ? new Date().toISOString() : null
      });

      // Update campaign stats
      if (success) {
        await supabase.rpc('increment_campaign_sent', { 
          campaign_id: campaignId 
        });
      } else {
        await supabase.rpc('increment_campaign_failed', { 
          campaign_id: campaignId 
        });
      }

      // Deduct credits only on successful send and not test
      if (success && !isTest) {
        await supabase.rpc('deduct_user_credits', { 
          user_id: user.id, 
          credit_amount: 1 
        });
      }
    }

    return new Response(
      JSON.stringify({
        success,
        gateway: gatewayUsed,
        fallbackUsed: fallbackAttempted,
        responseTime,
        error: error
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('SMS send error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
