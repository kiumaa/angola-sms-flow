import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOTPRequest {
  phone: string;
  code: string;
}

interface BulkSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { phone, code }: SendOTPRequest = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone and code are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get BulkSMS credentials from environment
    const bulkSmsTokenId = Deno.env.get('BULKSMS_TOKEN_ID');
    const bulkSmsTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET');

    if (!bulkSmsTokenId || !bulkSmsTokenSecret) {
      console.error('BulkSMS credentials not configured');
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send SMS via BulkSMS
    const smsResult = await sendViaBulkSMS(phone, code, bulkSmsTokenId, bulkSmsTokenSecret);
    
    if (!smsResult.success) {
      console.error('Failed to send SMS:', smsResult.error);
      return new Response(
        JSON.stringify({ error: 'Falha ao enviar OTP' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log SMS in database
    const logResult = await supabase
      .from('sms_logs')
      .insert({
        gateway: 'bulksms',
        sender: 'SMSAO',
        to: phone,
        message: `Seu código de acesso é: ${code}`,
        batch_id: smsResult.messageId,
        status: 'submitted',
        user_id: user.id
      });

    if (logResult.error) {
      console.error('Failed to log SMS:', logResult.error);
      // Don't fail the request if logging fails
    }

    console.log('OTP sent successfully to:', phone, 'Message ID:', smsResult.messageId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: smsResult.messageId 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Send OTP via BulkSMS API
 */
async function sendViaBulkSMS(
  phone: string, 
  code: string, 
  tokenId: string, 
  tokenSecret: string
): Promise<BulkSMSResponse> {
  try {
    const authHeader = `Basic ${btoa(`${tokenId}:${tokenSecret}`)}`;
    
    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        messages: [{
          to: phone,
          from: 'SMSAO',
          content: `Seu código de acesso é: ${code}`
        }]
      })
    });

    const result = await response.json();

    if (response.ok && Array.isArray(result) && result[0]?.id) {
      return {
        success: true,
        messageId: result[0].id
      };
    } else {
      return {
        success: false,
        error: result.detail || result.error?.description || `HTTP ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}