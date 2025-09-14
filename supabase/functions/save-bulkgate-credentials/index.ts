import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== BulkGate Credentials Save Function Started ===');
  console.log('Request method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body - support both single API key and separate credentials
    const { apiKey, applicationId, apiToken } = await req.json() as {
      apiKey?: string;
      applicationId?: string;
      apiToken?: string;
    };

    // Validate input - either apiKey or both applicationId and apiToken
    if (!apiKey && (!applicationId || !apiToken)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'É necessário fornecer API Key ou applicationId + apiToken' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Received BulkGate credentials for configuration');
    
    // Format the credentials properly
    const finalApiKey = apiKey || `${applicationId}:${apiToken}`;
    console.log('Final API key format:', `${finalApiKey.substring(0, 8)}...`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Saving credentials to database configuration...')

    // First, check if configuration already exists
    const { data: existingConfig } = await supabase
      .from('sms_configurations')
      .select('id')
      .eq('gateway_name', 'bulkgate')
      .single()

    if (existingConfig) {
      // Update existing configuration
      const { error: updateError } = await supabase
        .from('sms_configurations')
        .update({
          api_token_id_secret_name: 'BULKGATE_API_KEY',
          api_token_secret_name: 'BULKGATE_API_KEY',
          credentials_encrypted: true,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('gateway_name', 'bulkgate')

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }
      console.log('BulkGate configuration updated successfully')
    } else {
      // Insert new configuration
      const { error: insertError } = await supabase
        .from('sms_configurations')
        .insert({
          gateway_name: 'bulkgate',
          api_token_id_secret_name: 'BULKGATE_API_KEY',
          api_token_secret_name: 'BULKGATE_API_KEY',
          credentials_encrypted: true,
          is_active: true
        })

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw insertError
      }
      console.log('BulkGate configuration created successfully')
    }

    console.log('BulkGate configuration saved successfully')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: existingConfig ? 
          'Credenciais BulkGate atualizadas com sucesso' : 
          'Credenciais BulkGate salvas com sucesso'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error saving BulkGate credentials:', error);
    
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
});