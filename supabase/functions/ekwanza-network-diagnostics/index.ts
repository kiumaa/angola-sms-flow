import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get base URL with fallback
function getBaseUrl(): string {
  let baseUrl = Deno.env.get('EKWANZA_BASE_URL')
  
  if (!baseUrl || baseUrl.includes('ekz-partnersapi')) {
    const oauthUrl = Deno.env.get('EKWANZA_OAUTH_URL')
    if (oauthUrl) {
      try {
        const parsedUrl = new URL(oauthUrl)
        baseUrl = parsedUrl.origin
        console.log('⚠️  Using fallback baseUrl from OAuth:', baseUrl)
      } catch (e) {
        console.error('Failed to parse OAuth URL for fallback:', e)
      }
    }
  }
  
  return baseUrl || 'https://partnersapi.e-kwanza.ao'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔍 Starting É-kwanza network diagnostics...')
    
    const results: any = {
      timestamp: new Date().toISOString(),
      baseUrl: getBaseUrl(),
      tests: {}
    }
    
    const baseUrl = getBaseUrl()
    const oauthUrl = Deno.env.get('EKWANZA_OAUTH_URL')
    const clientId = Deno.env.get('EKWANZA_CLIENT_ID')
    const clientSecret = Deno.env.get('EKWANZA_CLIENT_SECRET')
    const resource = Deno.env.get('EKWANZA_RESOURCE')
    const notificationToken = Deno.env.get('EKWANZA_NOTIFICATION_TOKEN')
    
    // Test 1: OAuth endpoint
    console.log('Testing OAuth endpoint...')
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId!,
        client_secret: clientSecret!,
        resource: resource!
      })
      
      const oauthResponse = await fetch(oauthUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      })
      
      results.tests.oauth = {
        url: oauthUrl,
        status: oauthResponse.status,
        ok: oauthResponse.ok,
        statusText: oauthResponse.statusText,
        result: oauthResponse.ok ? 'SUCCESS' : 'FAILED'
      }
      
      if (oauthResponse.ok) {
        const data = await oauthResponse.json()
        results.tests.oauth.hasAccessToken = !!data.access_token
      }
    } catch (error) {
      results.tests.oauth = {
        url: oauthUrl,
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof TypeError ? 'DNS/Network' : 'Other'
      }
    }
    
    // Test 2: Ticket endpoint (QR Code)
    console.log('Testing Ticket endpoint...')
    try {
      const ticketUrl = `${baseUrl}/Ticket/${notificationToken}?amount=100&referenceCode=TEST-${Date.now()}&mobileNumber=244900000000`
      
      const ticketResponse = await fetch(ticketUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      results.tests.ticket = {
        url: ticketUrl.replace(/mobileNumber=\d+/, 'mobileNumber=REDACTED'),
        status: ticketResponse.status,
        ok: ticketResponse.ok,
        statusText: ticketResponse.statusText,
        result: ticketResponse.status < 500 ? 'REACHABLE' : 'SERVER_ERROR'
      }
    } catch (error) {
      results.tests.ticket = {
        url: `${baseUrl}/Ticket`,
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof TypeError ? 'DNS/Network' : 'Other'
      }
    }
    
    // Test 3: REF endpoint (requires OAuth)
    console.log('Testing REF endpoint...')
    try {
      // Try to get token first
      let accessToken = 'TEST_TOKEN'
      if (results.tests.oauth?.hasAccessToken) {
        const params = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId!,
          client_secret: clientSecret!,
          resource: resource!
        })
        const tokenResp = await fetch(oauthUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        })
        if (tokenResp.ok) {
          const tokenData = await tokenResp.json()
          accessToken = tokenData.access_token
        }
      }
      
      const refUrl = `${baseUrl}/api/v1/REF`
      const refResponse = await fetch(refUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethodId: 'TEST',
          amount: 100,
          referenceCode: `TEST-${Date.now()}`,
          merchantNumber: 'TEST',
          description: 'Connectivity test'
        })
      })
      
      results.tests.ref = {
        url: refUrl,
        status: refResponse.status,
        ok: refResponse.ok,
        statusText: refResponse.statusText,
        result: refResponse.status < 500 ? 'REACHABLE' : 'SERVER_ERROR'
      }
    } catch (error) {
      results.tests.ref = {
        url: `${baseUrl}/api/v1/REF`,
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof TypeError ? 'DNS/Network' : 'Other'
      }
    }
    
    // Test 4: GPO endpoint (requires OAuth)
    console.log('Testing GPO endpoint...')
    try {
      let accessToken = 'TEST_TOKEN'
      if (results.tests.oauth?.hasAccessToken) {
        const params = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId!,
          client_secret: clientSecret!,
          resource: resource!
        })
        const tokenResp = await fetch(oauthUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        })
        if (tokenResp.ok) {
          const tokenData = await tokenResp.json()
          accessToken = tokenData.access_token
        }
      }
      
      const gpoUrl = `${baseUrl}/api/v1/GPO`
      const gpoResponse = await fetch(gpoUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethodId: 'TEST',
          amount: 100,
          referenceCode: `TEST-${Date.now()}`,
          mobileNumber: '244900000000',
          merchantNumber: 'TEST',
          description: 'Connectivity test'
        })
      })
      
      results.tests.gpo = {
        url: gpoUrl,
        status: gpoResponse.status,
        ok: gpoResponse.ok,
        statusText: gpoResponse.statusText,
        result: gpoResponse.status < 500 ? 'REACHABLE' : 'SERVER_ERROR'
      }
    } catch (error) {
      results.tests.gpo = {
        url: `${baseUrl}/api/v1/GPO`,
        result: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof TypeError ? 'DNS/Network' : 'Other'
      }
    }
    
    // Overall health assessment
    const allTests = Object.values(results.tests)
    const errorTests = allTests.filter((t: any) => t.result === 'ERROR')
    const dnsErrors = errorTests.filter((t: any) => t.type === 'DNS/Network')
    
    results.summary = {
      total_tests: allTests.length,
      errors: errorTests.length,
      dns_errors: dnsErrors.length,
      health: errorTests.length === 0 ? 'HEALTHY' : 
              dnsErrors.length > 0 ? 'DNS_ISSUES' : 'API_ERRORS',
      recommendation: dnsErrors.length > 0 
        ? 'Verifique a configuração EKWANZA_BASE_URL. Use: https://partnersapi.e-kwanza.ao'
        : errorTests.length > 0
        ? 'Endpoints alcançáveis mas com erros de API. Verifique credenciais.'
        : 'Todos os endpoints estão acessíveis.'
    }
    
    console.log('✅ Diagnostics completed:', results.summary)
    
    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Diagnostics error:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Diagnostics failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
