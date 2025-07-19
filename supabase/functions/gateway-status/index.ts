
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: { user } } = await supabase.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    )

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!userRole || userRole.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { gateway } = await req.json()

    if (!gateway) {
      return new Response(
        JSON.stringify({ error: 'Gateway name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const gatewayName = gateway;

    let balance = null
    let status = 'inactive'
    let error = null

    try {
      if (gatewayName === 'bulksms') {
        const tokenId = Deno.env.get('BULKSMS_TOKEN_ID')
        const tokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET')
        
        if (tokenId && tokenSecret) {
          const auth = btoa(`${tokenId}:${tokenSecret}`)
          const response = await fetch('https://api.bulksms.com/v1/profile', {
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const profile = await response.json()
            balance = {
              credits: profile.credit?.balance || 0,
              currency: 'ZAR'
            }
            status = 'active'
          } else {
            error = `HTTP ${response.status}: ${await response.text()}`
          }
        } else {
          error = 'Missing credentials'
        }
      } else if (gatewayName === 'bulkgate') {
        const apiKey = Deno.env.get('BULKGATE_API_KEY')
        
        if (apiKey) {
          console.log('Testing BulkGate connection with API key:', apiKey ? 'Present' : 'Missing')
          
          // Parse the API key - should be in format "application_id:application_token"
          const [applicationId, applicationToken] = apiKey.includes(':') 
            ? apiKey.split(':') 
            : [apiKey, ''] // fallback if no separator found
          
          console.log('Application ID present:', applicationId ? 'Yes' : 'No')
          console.log('Application Token present:', applicationToken ? 'Yes' : 'No')
          
          const response = await fetch('https://portal.bulkgate.com/api/2.0/advanced/info', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              'application_id': applicationId,
              'application_token': applicationToken
            })
          })

          console.log('BulkGate API response status:', response.status)
          console.log('BulkGate API response headers:', Object.fromEntries(response.headers.entries()))
          
          if (response.ok) {
            const contentType = response.headers.get('content-type') || ''
            
            if (contentType.includes('application/json')) {
              const result = await response.json()
              console.log('BulkGate balance response:', result)
              
              // Handle success response format: { "data": { "credit": 215.8138, "currency": "credits" } }
              if (result.data) {
                balance = {
                  credits: result.data.credit || 0,
                  currency: result.data.currency === 'credits' ? 'EUR' : result.data.currency || 'EUR'
                }
                status = 'active'
              } else {
                console.error('Unexpected response format:', result)
                error = 'Unexpected response format from BulkGate API'
              }
            } else {
              const responseText = await response.text()
              console.error('BulkGate API returned non-JSON response:', responseText.substring(0, 200))
              error = `API returned ${contentType} instead of JSON`
            }
          } else {
            const contentType = response.headers.get('content-type') || ''
            
            if (contentType.includes('application/json')) {
              const errorResponse = await response.json()
              console.error('BulkGate API error response:', errorResponse)
              error = `HTTP ${response.status}: ${errorResponse.error || 'Unknown error'}`
            } else {
              const errorText = await response.text()
              console.error('BulkGate API error:', errorText.substring(0, 200))
              error = `HTTP ${response.status}: ${errorText.substring(0, 100)}`
            }
          }
        } else {
          error = 'Missing BULKGATE_API_KEY'
        }
      } else {
        error = 'Unknown gateway'
      }
    } catch (e) {
      console.error(`Error checking ${gatewayName} status:`, e)
      error = e.message
    }

    const result = {
      gateway: gatewayName,
      status,
      balance,
      error,
      lastChecked: new Date().toISOString()
    }

    console.log(`Gateway ${gatewayName} status result:`, result)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in gateway-status function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
