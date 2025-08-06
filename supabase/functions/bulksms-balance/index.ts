import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (userError || !user) {
      throw new Error('Invalid authorization')
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleError || roleData?.role !== 'admin') {
      throw new Error('Unauthorized: Admin access required')
    }

    // Get BulkSMS API token
    const bulkSMSToken = Deno.env.get('BULKSMS_TOKEN_ID')

    if (!bulkSMSToken) {
      throw new Error('BulkSMS API token not configured')
    }

    console.log('Fetching BulkSMS balance...')

    // Get balance from BulkSMS API v1
    const response = await fetch('https://api.bulksms.com/v1/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${bulkSMSToken}:`)}`
      }
    })

    const responseData = await response.json()
    console.log('BulkSMS profile response:', responseData)

    if (response.ok) {
      return new Response(
        JSON.stringify({
          success: true,
          balance: responseData.credits?.balance || 0,
          currency: responseData.currency || 'USD',
          company: responseData.company || 'Unknown',
          lastUpdated: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      throw new Error(`BulkSMS API error: ${responseData.detail?.message || response.statusText}`)
    }

  } catch (error) {
    console.error('BulkSMS balance error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})