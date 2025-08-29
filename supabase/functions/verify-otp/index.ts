import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOTPRequest {
  phone: string;
  code: string;
  fullName?: string;
  company?: string;
  email?: string;
}

// Helper function to hash OTP code with pepper
async function hashOTPCode(code: string, pepper: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code + pepper);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    const { phone, code, fullName, company, email }: VerifyOTPRequest = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone and code are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate international phone format
    if (!/^\+\d{8,15}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: 'Formato de telefone inválido' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate supported countries
    const supportedCountries = ['+244', '+351', '+55', '+258', '+238', '+239'];
    const isSupported = supportedCountries.some(code => phone.startsWith(code));
    
    if (!isSupported) {
      return new Response(
        JSON.stringify({ error: 'País não suportado' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Hash the provided code to compare with stored hash
    const hashedCode = await hashOTPCode(code, otpPepper);

    // Enhanced OTP lookup - find the most recent valid OTP for this phone
    console.log(`Attempting to verify OTP for ${phone} with hash ${hashedCode.substring(0, 8)}...`);
    
    // First, get ALL recent OTPs for this phone for debugging
    const { data: allRecentOtps } = await supabase
      .from('otp_requests')
      .select('id, code, used, expires_at, created_at')
      .eq('phone', phone)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .order('created_at', { ascending: false });
    
    console.log(`Found ${allRecentOtps?.length || 0} recent OTPs for phone ${phone}:`, allRecentOtps);

    // Find the most recent valid OTP that matches the hash
    const { data: otpRequest, error: findError } = await supabase
      .from('otp_requests')
      .select('*')
      .eq('phone', phone)
      .eq('code', hashedCode)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    console.log(`OTP verification for ${phone}: found valid OTP = ${!!otpRequest}`);

    if (findError) {
      console.error('Error finding OTP request:', findError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro interno do servidor' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!otpRequest) {
      console.log(`No valid OTP found for phone ${phone} with provided code`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Código inválido ou expirado. Solicite um novo código.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mark OTP as used and clean up other OTPs for this phone
    const { error: updateError } = await supabase
      .from('otp_requests')
      .update({ used: true })
      .eq('id', otpRequest.id);

    if (updateError) {
      console.error('Error marking OTP as used:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao processar verificação' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Clean up other unused OTPs for this phone to prevent future conflicts
    const { error: cleanupError } = await supabase
      .from('otp_requests')
      .update({ used: true })
      .eq('phone', phone)
      .eq('used', false)
      .neq('id', otpRequest.id);
    
    if (cleanupError) {
      console.log('Note: Could not clean up other OTPs:', cleanupError);
    } else {
      console.log('Cleaned up other unused OTPs for phone:', phone);
    }
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user exists with this phone number
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .eq('phone', phone)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let userId = profile?.user_id;
    let isNewUser = false;

    // If no user exists, create a new user
    if (!profile) {
      // Use provided email or generate temp email
      const userEmail = email || `user+${phone.replace('+', '')}@temp.smsao.ao`;
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'; // Temp password
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: tempPassword,
        phone: phone,
        user_metadata: {
          phone: phone,
          full_name: fullName || `Usuário ${phone}`,
          company: company,
          registration_method: 'otp'
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      userId = authData.user.id;
      isNewUser = true;

      // Update profile with complete data (the trigger should have created the profile)
      await supabase
        .from('profiles')
        .update({ 
          phone: phone,
          email: userEmail,
          full_name: fullName || `Usuário ${phone}`,
          company_name: company || null
        })
        .eq('user_id', userId);
    }

    // Create session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: profile?.email || email || `user+${phone.replace('+', '')}@temp.smsao.ao`,
      options: {
        redirectTo: `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard`
      }
    });

    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create session' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`OTP verification successful for phone ${phone}, user: ${userId}, new: ${isNewUser}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        user_id: userId,
        is_new_user: isNewUser,
        magic_link: sessionData.properties?.hashed_token ? 
          `${supabaseUrl}/auth/v1/verify?token=${sessionData.properties.hashed_token}&type=magiclink&redirect_to=${encodeURIComponent(req.headers.get('origin') || 'http://localhost:5173')}/dashboard` :
          sessionData.properties?.action_link,
        redirect_url: `${req.headers.get('origin') || 'http://localhost:5173'}/dashboard`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in verify-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});