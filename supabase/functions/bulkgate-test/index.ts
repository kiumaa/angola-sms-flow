import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get BulkGate credentials
    const bulkgateApiKey = Deno.env.get('BULKGATE_API_KEY')
    
    if (!bulkgateApiKey) {
      console.error('❌ BulkGate API key not found in environment')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'BulkGate API key not configured' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }

    console.log(`🔐 BulkGate API Key format: ${bulkgateApiKey.substring(0, 6)}... (length: ${bulkgateApiKey.length})`)
    
    // Check if it's applicationId:applicationToken format
    const hasColon = bulkgateApiKey.includes(':')
    console.log(`🔍 Has colon separator: ${hasColon}`)
    
    if (hasColon) {
      const [applicationId, applicationToken] = bulkgateApiKey.split(':')
      console.log(`📋 ApplicationId: ${applicationId}`)
      console.log(`🔑 ApplicationToken: ${applicationToken.substring(0, 6)}...`)
      
      // Test v2 API
      console.log('🎯 Testing v2 API...')
      try {
        const v2Response = await fetch('https://portal.bulkgate.com/api/2.0/advanced/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({
            application_id: parseInt(applicationId),
            application_token: applicationToken
          })
        })
        
        console.log(`📊 v2 API Status: ${v2Response.status}`)
        console.log(`📊 v2 API Headers:`, Object.fromEntries(v2Response.headers.entries()))
        
        const v2Data = await v2Response.text()
        console.log(`📊 v2 API Raw Response: ${v2Data}`)
        
        if (v2Response.ok) {
          const v2Json = JSON.parse(v2Data)
          return new Response(JSON.stringify({
            success: true,
            api_version: 'v2',
            status: v2Response.status,
            data: v2Json,
            test_type: 'advanced_info'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (v2Error) {
        const v2ErrorMessage = v2Error instanceof Error ? v2Error.message : 'V2 API error';
        console.error('❌ v2 API Error:', v2ErrorMessage)
      }
      
      // Test v1 API
      console.log('🔄 Testing v1 API...')
      try {
        const v1Response = await fetch('https://portal.bulkgate.com/api/1.0/advanced/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({
            application_id: applicationId,
            application_token: applicationToken
          })
        })
        
        console.log(`📊 v1 API Status: ${v1Response.status}`)
        console.log(`📊 v1 API Headers:`, Object.fromEntries(v1Response.headers.entries()))
        
        const v1Data = await v1Response.text()
        console.log(`📊 v1 API Raw Response: ${v1Data}`)
        
          if (v1Response.ok) {
            const v1Json = JSON.parse(v1Data)
            return new Response(JSON.stringify({
              success: true,
              api_version: 'v1',
              status: v1Response.status,
              data: v1Json,
              test_type: 'advanced_info'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          } else {
          return new Response(JSON.stringify({
            success: false,
            api_version: 'v1',
            status: v1Response.status,
            error: v1Data,
            test_type: 'advanced_info'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (v1Error) {
        const v1ErrorMessage = v1Error instanceof Error ? v1Error.message : 'V1 API error';
        console.error('❌ v1 API Error:', v1ErrorMessage)
        return new Response(JSON.stringify({
          success: false,
          error: v1ErrorMessage,
          test_type: 'connection_error'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        })
      }
    } else {
      // Bearer token format is not supported for Advanced Info
      console.log('❌ Invalid BulkGate API key format (expected applicationId:applicationToken).');
      return new Response(JSON.stringify({
        success: false,
        api_version: 'v2',
        status: 400,
        error: 'Formato inválido da chave BulkGate. Use applicationId:applicationToken',
        test_type: 'advanced_info'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected error';
    console.error('❌ Unexpected error:', errorMessage)
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})