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
        const v2Response = await fetch('https://portal.bulkgate.com/api/2.0/application/info', {
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
            test_type: 'application_info'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (v2Error) {
        console.error('❌ v2 API Error:', v2Error.message)
      }
      
      // Test v1 API
      console.log('🔄 Testing v1 API...')
      try {
        const v1Response = await fetch('https://portal.bulkgate.com/api/1.0/info/user', {
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
            test_type: 'user_info'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          return new Response(JSON.stringify({
            success: false,
            api_version: 'v1',
            status: v1Response.status,
            error: v1Data,
            test_type: 'user_info'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (v1Error) {
        console.error('❌ v1 API Error:', v1Error.message)
        return new Response(JSON.stringify({
          success: false,
          error: v1Error.message,
          test_type: 'connection_error'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        })
      }
    } else {
      // Test as Bearer token
      console.log('🔄 Testing as Bearer token...')
      try {
        const bearerResponse = await fetch('https://portal.bulkgate.com/api/2.0/application/info', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${bulkgateApiKey}`,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        })
        
        console.log(`📊 Bearer API Status: ${bearerResponse.status}`)
        const bearerData = await bearerResponse.text()
        console.log(`📊 Bearer API Raw Response: ${bearerData}`)
        
        return new Response(JSON.stringify({
          success: bearerResponse.ok,
          api_version: 'v2_bearer',
          status: bearerResponse.status,
          data: bearerResponse.ok ? JSON.parse(bearerData) : bearerData,
          test_type: 'bearer_token'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (bearerError) {
        console.error('❌ Bearer API Error:', bearerError.message)
        return new Response(JSON.stringify({
          success: false,
          error: bearerError.message,
          test_type: 'bearer_error'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        })
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})