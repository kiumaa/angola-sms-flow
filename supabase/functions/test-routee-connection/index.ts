import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestConnectionRequest {
  applicationId: string
  applicationSecret: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { applicationId, applicationSecret }: TestConnectionRequest = await req.json()

    if (!applicationId || !applicationSecret) {
      throw new Error('Application ID and Secret are required')
    }

    // First, get OAuth token
    const tokenResponse = await fetch('https://connect.routee.net/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: applicationId,
        client_secret: applicationSecret
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`OAuth failed: ${tokenResponse.status} - ${errorText}`)
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      throw new Error('No access token received from OAuth')
    }

    // Test connection to Routee - formato correto conforme documentação
    const testPayload = {
      body: 'Test connection from SMS Marketing Angola',
      to: '+244900000000', // String, não array
      from: 'TEST'
    }

    const response = await fetch('https://connect.routee.net/sms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    })

    let success = false
    let balance = 0
    let errorMessage = ''

    if (response.ok) {
      success = true
      // Try to get balance if available (Routee may not expose this publicly)
      try {
        const balanceResponse = await fetch('https://connect.routee.net/balance', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json()
          balance = balanceData.balance || 0
        }
      } catch (balanceError) {
        console.log('Balance endpoint not available:', balanceError)
      }
    } else if (response.status === 401 || response.status === 403) {
      errorMessage = 'Token inválido ou sem permissões'
    } else {
      const errorText = await response.text()
      errorMessage = `Erro na API: ${response.status} - ${errorText}`
    }

    return new Response(
      JSON.stringify({
        success,
        balance,
        error: errorMessage || null,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Test connection error:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})