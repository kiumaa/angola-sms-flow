import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Ensuring profile for user:', user.id);

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, credits')
      .eq('user_id', user.id)
      .single();

    if (existingProfile) {
      console.log('Profile already exists:', existingProfile.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          profileId: existingProfile.id,
          credits: existingProfile.credits,
          created: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get default free credits from site settings
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'free_credits_new_user')
      .single();

    const freeCredits = settingsData?.value ? parseInt(settingsData.value) : 5;

    console.log('Creating new profile with', freeCredits, 'credits');

    // Create profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
        credits: freeCredits
      })
      .select('id, credits')
      .single();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw new Error('Failed to create profile: ' + profileError.message);
    }

    console.log('Profile created:', newProfile.id);

    // Ensure user has client role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'client')
      .single();

    if (!existingRole) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'client'
        });

      if (roleError) {
        console.error('Error creating user role:', roleError);
        // Don't throw here, profile creation is more important
      } else {
        console.log('Client role created for user');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        profileId: newProfile.id,
        credits: newProfile.credits,
        created: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ensure-profile function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});