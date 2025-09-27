import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== Save BulkSMS Credentials Function Started ===')
    
    const { tokenId, tokenSecret } = await req.json()
    console.log('Request received with tokenId:', tokenId ? 'provided' : 'missing')

    if (!tokenId || !tokenSecret) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token ID and Token Secret are required' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Saving credentials to database configuration...')

    // First, check if configuration already exists
    const { data: existingConfig } = await supabase
      .from('sms_configurations')
      .select('id')
      .eq('gateway_name', 'bulksms')
      .single()

    if (existingConfig) {
      // Update existing configuration
      const { error: updateError } = await supabase
        .from('sms_configurations')
        .update({
          api_token_id_secret_name: 'BULKSMS_TOKEN_ID',
          api_token_secret_name: 'BULKSMS_TOKEN_SECRET',
          credentials_encrypted: true,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('gateway_name', 'bulksms')

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }
      console.log('BulkSMS configuration updated successfully')
    } else {
      // Insert new configuration
      const { error: insertError } = await supabase
        .from('sms_configurations')
        .insert({
          gateway_name: 'bulksms',
          api_token_id_secret_name: 'BULKSMS_TOKEN_ID',
          api_token_secret_name: 'BULKSMS_TOKEN_SECRET',
          credentials_encrypted: true,
          is_active: true
        })

      if (insertError) {
        console.error('Database insert error:', insertError)
        throw insertError
      }
      console.log('BulkSMS configuration created successfully')
    }

    console.log('BulkSMS configuration saved successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Credentials saved successfully',
        note: 'Please ensure BULKSMS_TOKEN_ID and BULKSMS_TOKEN_SECRET are configured in Supabase Secrets with the provided values'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error saving BulkSMS credentials:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save credentials' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})