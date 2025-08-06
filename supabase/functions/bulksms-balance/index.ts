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

    console.log('Fetching BulkSMS balance via Legacy EAPI...')

    // Get balance from BulkSMS Legacy EAPI
    const response = await fetch('https://api-legacy2.bulksms.com/eapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${bulkSMSToken}:`)}`
      },
      body: new URLSearchParams({
        command: 'CHECKACCOUNT'
      })
    })

    const responseText = await response.text()
    console.log('BulkSMS Legacy EAPI balance response:', responseText)

    if (response.ok) {
      // Parse Legacy EAPI balance response: "0: SUCCESS|credits:1000"
      const [statusCode, statusText] = responseText.split(': ', 2)
      
      if (statusCode === '0') {
        const creditsMatch = responseText.match(/credits:(\d+(\.\d+)?)/)
        const credits = creditsMatch ? parseFloat(creditsMatch[1]) : 0
        
        return new Response(
          JSON.stringify({
            success: true,
            balance: credits,
            currency: 'USD',
            company: 'BulkSMS Account',
            lastUpdated: new Date().toISOString()
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      } else {
        throw new Error(`BulkSMS EAPI error: ${statusCode}: ${statusText}`)
      }
    } else {
      throw new Error(`BulkSMS EAPI HTTP error: ${response.status} ${response.statusText}`)
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