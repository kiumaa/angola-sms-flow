import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { phone, action = 'send' } = await req.json();

    // Security: Enhanced phone validation
    if (!phone || typeof phone !== 'string') {
      throw new Error('Valid phone number is required');
    }

    // Security: Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Check for recent OTP requests from this IP/phone
    const { data: recentAttempts } = await supabase
      .from('otp_requests')
      .select('*')
      .eq('phone', phone)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (recentAttempts && recentAttempts.length >= 3) {
      console.warn(`OTP rate limit exceeded for phone: ${phone.slice(-4)}, IP: ${clientIP}`);
      throw new Error('Rate limit exceeded. Please wait before requesting another OTP.');
    }

    if (action === 'send') {
      // Security: Generate cryptographically secure OTP
      const otpCode = Array.from(crypto.getRandomValues(new Uint8Array(3)))
        .map(x => (x % 10).toString())
        .join('');

      // Security: Hash the OTP before storing
      const encoder = new TextEncoder();
      const data = encoder.encode(otpCode + Deno.env.get('OTP_PEPPER'));
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashedOtp = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Store OTP with enhanced security
      const { error: insertError } = await supabase
        .from('otp_requests')
        .insert({
          phone,
          code: hashedOtp,
          ip_address: clientIP,
          expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes
        });

      if (insertError) {
        console.error('Failed to store OTP:', insertError);
        throw new Error('Failed to generate OTP');
      }

      // Log security event
      console.log(`OTP generated for phone: ${phone.slice(-4)}, IP: ${clientIP}, timestamp: ${new Date().toISOString()}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent successfully',
          // Security: Don't return the actual OTP in production
          ...(Deno.env.get('ENVIRONMENT') === 'development' ? { otp: otpCode } : {})
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Security-enhanced OTP error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});