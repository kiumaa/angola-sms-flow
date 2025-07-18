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

    const { gatewayName } = await req.json()

    if (!gatewayName) {
      return new Response(
        JSON.stringify({ error: 'Gateway name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
            error = `HTTP ${response.status}`
          }
        }
      } else if (gatewayName === 'bulkgate') {
        const apiKey = Deno.env.get('BULKGATE_API_KEY')
        
        if (apiKey) {
          const response = await fetch('https://api.bulkgate.com/v2.0/credit/balance', {
            headers: {
              'Authorization': `Bearer ${apiKey}`
            }
          })

          if (response.ok) {
            const result = await response.json()
            balance = {
              credits: result.data?.balance || 0,
              currency: result.data?.currency || 'EUR'
            }
            status = 'active'
          } else {
            error = `HTTP ${response.status}`
          }
        }
      }
    } catch (e) {
      console.error(`Error checking ${gatewayName} status:`, e)
      error = e.message
    }

    return new Response(
      JSON.stringify({
        gateway: gatewayName,
        status,
        balance,
        error,
        lastChecked: new Date().toISOString()
      }),
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