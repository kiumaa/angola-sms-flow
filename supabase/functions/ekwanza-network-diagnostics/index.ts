import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Test DNS resolution for both domains
async function testDNS(domain: string): Promise<boolean> {
  try {
    const response = await fetch(`https://${domain}`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000) // 5s timeout
    })
    return true // DNS resolved if we got any response
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('dns')) {
      return false // DNS failed
    }
    return true // Other errors mean DNS worked
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🔍 Starting É-kwanza network diagnostics...')
    
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
      dns: {}
    }
    
    // Test DNS for both domains
    console.log('Testing DNS resolution...')
    results.dns.ekz_partnersapi = await testDNS('ekz-partnersapi.e-kwanza.ao')
    results.dns.partnersapi = await testDNS('partnersapi.e-kwanza.ao')
    
    // Use the domain that has working DNS
    const baseUrl = results.dns.ekz_partnersapi 
      ? 'https://ekz-partnersapi.e-kwanza.ao'
      : results.dns.partnersapi
      ? 'https://partnersapi.e-kwanza.ao'
      : 'https://ekz-partnersapi.e-kwanza.ao' // fallback to try anyway
    
    results.baseUrl = baseUrl
    
    const oauthUrl = Deno.env.get('EKWANZA_OAUTH_URL')
    const clientId = Deno.env.get('EKWANZA_CLIENT_ID')
    const clientSecret = Deno.env.get('EKWANZA_CLIENT_SECRET')
    const resource = Deno.env.get('EKWANZA_RESOURCE')
    const notificationToken = Deno.env.get('EKWANZA_NOTIFICATION_TOKEN')
    
    // SECURITY: Log sanitized credentials (never log full secrets)
    console.log('OAuth Config:', {
      oauth_url: oauthUrl,
      client_id: clientId?.substring(0, 8) + '***',
      client_secret: '[REDACTED]',
      resource: resource
    })
    
    // Test 1: OAuth endpoint
    console.log('Testing OAuth endpoint...')
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId!,
        client_secret: clientSecret!,
        resource: resource!
      })
      
      // SECURITY: Never log the full request body with credentials
      console.log('Requesting OAuth2 token... (credentials redacted)')
      
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
        // SECURITY: Never log OAuth request with credentials
        console.log('Obtaining access token... (credentials redacted)')
        const tokenResp = await fetch(oauthUrl!, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        })
        if (tokenResp.ok) {
          const tokenData = await tokenResp.json()
          accessToken = tokenData.access_token
          console.log('Access token obtained:', accessToken.substring(0, 12) + '***')
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
      dns_ok_ekz: results.dns.ekz_partnersapi,
      dns_ok_partners: results.dns.partnersapi,
      oauth_ok: results.tests.oauth?.ok || false,
      health: !results.dns.ekz_partnersapi && !results.dns.partnersapi ? 'DNS_FAILURE' :
              errorTests.length === 0 ? 'HEALTHY' : 
              dnsErrors.length > 0 ? 'DNS_ISSUES' : 'API_ERRORS',
      recommendation: !results.dns.ekz_partnersapi && !results.dns.partnersapi
        ? 'CRÍTICO: Nenhum domínio É-kwanza resolve DNS. Necessário whitelist de IP estático do Supabase.'
        : dnsErrors.length > 0 
        ? `Use ${results.dns.ekz_partnersapi ? 'ekz-partnersapi' : 'partnersapi'}.e-kwanza.ao`
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
