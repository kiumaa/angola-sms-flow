import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SENDER ID UTILITIES - MANDATO SMSAO
const DEFAULT_SENDER_ID = 'SMSAO';
const DEPRECATED_SENDER_IDS = ['ONSMS', 'SMS'];

function resolveSenderId(input?: string | null): string {
  if (!input || input.trim() === '') return DEFAULT_SENDER_ID;
  const normalized = input.trim().toUpperCase();
  if (DEPRECATED_SENDER_IDS.includes(normalized)) {
    console.warn(`Sender ID depreciado detectado: ${input} → substituído por ${DEFAULT_SENDER_ID}`);
    return DEFAULT_SENDER_ID;
  }
  if (!normalized.match(/^[A-Za-z0-9]{1,11}$/)) {
    console.warn(`Sender ID inválido detectado: ${input} → substituído por ${DEFAULT_SENDER_ID}`);
    return DEFAULT_SENDER_ID;
  }
  return normalized;
}

interface SendOTPRequest {
  phone: string;
}

interface BulkSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Helper function to hash OTP code with pepper
async function hashOTPCode(code: string, pepper: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + pepper);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate 6-digit OTP code
function generateOTPCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get client IP from request
function getClientIP(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const clientIP = req.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (clientIP) {
    return clientIP;
  }
  return 'unknown';
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
    const otpPepper = Deno.env.get('OTP_PEPPER')!;
    
    if (!otpPepper) {
      console.error('OTP_PEPPER not configured');
      return new Response(
        JSON.stringify({ error: 'OTP service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { phone }: SendOTPRequest = await req.json();
    const clientIP = getClientIP(req);

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate phone format (basic validation)
    if (!/^\+\d{10,15}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Rate limiting: Check attempts in last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: recentAttempts, error: attemptsError } = await supabase
      .from('otp_requests')
      .select('attempts')
      .eq('phone', phone)
      .gte('created_at', thirtyMinutesAgo);

    if (attemptsError) {
      console.error('Error checking rate limit:', attemptsError);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate total attempts in last 30 minutes
    const totalAttempts = recentAttempts.reduce((sum, attempt) => sum + (attempt.attempts || 1), 0);
    
    if (totalAttempts >= 3) {
      console.log(`Rate limit exceeded for phone ${phone}: ${totalAttempts} attempts in last 30 minutes`);
      return new Response(
        JSON.stringify({ 
          error: 'Muitas tentativas. Tente novamente em 30 minutos.',
          retryAfter: 30 * 60 // seconds
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate OTP code and hash it
    const otpCode = generateOTPCode();
    const hashedCode = await hashOTPCode(otpCode, otpPepper);

    // Create OTP request with hash (never store plain code)
    const { data: otpRequest, error: createError } = await supabase
      .from('otp_requests')
      .insert({
        phone,
        code: hashedCode, // Store hash, not plain text
        used: false,
        attempts: 1,
        ip_address: clientIP,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating OTP request:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create OTP request' }),
        { 
          status: 500, 
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

    // Send SMS via BulkSMS (use plain code for SMS, but log with hash)
    const smsResult = await sendViaBulkSMS(phone, otpCode, bulkSmsTokenId, bulkSmsTokenSecret);
    
    if (!smsResult.success) {
      console.error('Failed to send SMS:', smsResult.error);
      
      // Clean up OTP request if SMS failed
      await supabase
        .from('otp_requests')
        .delete()
        .eq('id', otpRequest.id);
        
      return new Response(
        JSON.stringify({ error: 'Falha ao enviar código OTP. Tente novamente.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log SMS in database (NEVER log the plain OTP code)
    const logResult = await supabase
      .from('sms_logs')
      .insert({
        gateway_used: 'bulksms',
        phone_number: phone,
        message: 'Código OTP enviado', // Generic message, no actual code
        gateway_message_id: smsResult.messageId,
        status: 'sent',
        user_id: null // No user context for OTP
      });

    if (logResult.error) {
      console.error('Failed to log SMS:', logResult.error);
      // Don't fail the request if logging fails
    }

    console.log(`OTP request created for phone ${phone}, expires in 5 minutes`);
    // NEVER log the actual OTP code

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: smsResult.messageId,
        expiresIn: 300 // 5 minutes in seconds
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
          from: resolveSenderId('SMSAO'), // Usar helper para garantir normalização
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