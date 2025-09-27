import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  duration: number
  details?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { test_phone, test_message, gateway } = await req.json()
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const results: DiagnosticResult[] = []
    let overallStatus: 'success' | 'error' | 'warning' = 'success'

    // Test 1: User Authentication
    let startTime = Date.now()
    try {
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        throw new Error('No authorization header')
      }
      
      const token = authHeader.replace('Bearer ', '')
      const { data: user, error } = await supabase.auth.getUser(token)
      
      if (error) throw error
      
      results.push({
        test: 'User Authentication',
        status: 'success',
        message: `User authenticated: ${user.user.email}`,
        duration: Date.now() - startTime
      })
    } catch (error) {
      results.push({
        test: 'User Authentication',
        status: 'error',
        message: error instanceof Error ? error.message : 'Authentication failed',
        duration: Date.now() - startTime
      })
      overallStatus = 'error'
    }

    // Test 2: User Profile Check
    startTime = Date.now()
    try {
      const authHeader = req.headers.get('Authorization')
      const token = authHeader?.replace('Bearer ', '')
      const { data: user } = await supabase.auth.getUser(token!)
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, credits')
        .eq('id', user.user!.id)
        .single()

      if (error) throw error

      results.push({
        test: 'User Profile',
        status: 'success',
        message: `Profile found. Credits: ${profile.credits}`,
        duration: Date.now() - startTime,
        details: { credits: profile.credits }
      })
    } catch (error) {
      results.push({
        test: 'User Profile',
        status: 'error',
        message: error instanceof Error ? error.message : 'Profile check failed',
        duration: Date.now() - startTime
      })
      overallStatus = 'error'
    }

    // Test 3: Gateway Credentials Check
    startTime = Date.now()
    const credsStatus: Record<'bulksms' | 'bulkgate', boolean> = {
      bulksms: !!(Deno.env.get('BULKSMS_TOKEN_ID') && Deno.env.get('BULKSMS_TOKEN_SECRET')),
      bulkgate: !!(Deno.env.get('BULKGATE_APPLICATION_ID') && Deno.env.get('BULKGATE_APPLICATION_TOKEN'))
    }

    if (gateway && (gateway === 'bulksms' || gateway === 'bulkgate')) {
      const gatewayKey = gateway as 'bulksms' | 'bulkgate'
      results.push({
        test: 'Gateway Credentials',
        status: credsStatus[gatewayKey] ? 'success' : 'error',
        message: `${gateway.toUpperCase()} credentials: ${credsStatus[gatewayKey] ? 'configured' : 'missing'}`,
        duration: Date.now() - startTime,
        details: credsStatus
      })
      
      if (!credsStatus[gatewayKey]) overallStatus = 'error'
    } else {
      results.push({
        test: 'Gateway Credentials',
        status: 'error',
        message: 'Invalid gateway specified',
        duration: Date.now() - startTime
      })
      overallStatus = 'error'
    }

    // Test 4: Gateway Connectivity
    startTime = Date.now()
    try {
      let connectivityResult = 'Not tested'
      
      if (gateway === 'bulksms') {
        const tokenId = Deno.env.get('BULKSMS_TOKEN_ID')
        const tokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET')
        
        if (tokenId && tokenSecret) {
          const authString = btoa(`${tokenId}:${tokenSecret}`)
          const response = await fetch('https://api.bulksms.com/v1/profile', {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json'
            }
          })
          connectivityResult = response.ok ? 'Connected' : `HTTP ${response.status}`
        }
      } else if (gateway === 'bulkgate') {
        const appId = Deno.env.get('BULKGATE_APPLICATION_ID')
        const appToken = Deno.env.get('BULKGATE_APPLICATION_TOKEN')
        
        if (appId && appToken) {
          const response = await fetch('https://portal.bulkgate.com/api/1.0/simple/info', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              application_id: appId,
              application_token: appToken
            })
          })
          connectivityResult = response.ok ? 'Connected' : `HTTP ${response.status}`
        }
      }

      results.push({
        test: 'Gateway Connectivity',
        status: connectivityResult === 'Connected' ? 'success' : 'warning',
        message: `Gateway connectivity: ${connectivityResult}`,
        duration: Date.now() - startTime
      })

      if (connectivityResult !== 'Connected' && connectivityResult !== 'Not tested') {
        overallStatus = 'warning'
      }
    } catch (error) {
      results.push({
        test: 'Gateway Connectivity',
        status: 'error',
        message: error instanceof Error ? error.message : 'Connectivity test failed',
        duration: Date.now() - startTime
      })
      if (overallStatus !== 'error') overallStatus = 'warning'
    }

    // Test 5: Credit Debit Test (Optional)
    if (test_phone) {
      startTime = Date.now()
      try {
        const authHeader = req.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '')
        const { data: user } = await supabase.auth.getUser(token!)
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, credits')
          .eq('id', user.user!.id)
          .single()

        if (!profile) throw new Error('Profile not found')

        // Test debit operation
        const { error: debitError } = await supabase.rpc('debit_user_credits', {
          _account_id: profile.id,
          _amount: 1,
          _reason: 'Diagnostic test debit'
        })

        if (debitError) throw debitError

        // Test refund operation
        const { error: refundError } = await supabase.rpc('credit_user_account', {
          _account_id: profile.id,
          _amount: 1,
          _reason: 'Diagnostic test refund'
        })

        if (refundError) throw refundError

        results.push({
          test: 'Credit Operations',
          status: 'success',
          message: 'Credit debit and refund operations completed successfully',
          duration: Date.now() - startTime
        })
      } catch (error) {
        results.push({
          test: 'Credit Operations',
          status: 'error',
          message: error instanceof Error ? error.message : 'Credit operations failed',
          duration: Date.now() - startTime
        })
        overallStatus = 'error'
      }
    }

    // Generate recommendations
    const recommendations = generateRecommendations(results)

    return new Response(JSON.stringify({
      success: true,
      overallStatus,
      results,
      recommendations,
      summary: {
        total_tests: results.length,
        passed: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        warnings: results.filter(r => r.status === 'warning').length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Diagnostic test error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      overallStatus: 'error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function generateRecommendations(results: DiagnosticResult[]): string[] {
  const recommendations: string[] = []
  
  results.forEach(result => {
    if (result.status === 'error') {
      switch (result.test) {
        case 'User Authentication':
          recommendations.push('Check your authentication token and ensure you are logged in')
          break
        case 'User Profile':
          recommendations.push('Verify your user profile exists and has sufficient credits')
          break
        case 'Gateway Credentials':
          recommendations.push('Configure your SMS gateway credentials in the admin settings')
          break
        case 'Gateway Connectivity':
          recommendations.push('Check your internet connection and gateway service status')
          break
        case 'Credit Operations':
          recommendations.push('Review your credit balance and account permissions')
          break
      }
    } else if (result.status === 'warning') {
      recommendations.push(`Warning in ${result.test}: ${result.message}`)
    }
  })

  if (recommendations.length === 0) {
    recommendations.push('All diagnostic tests passed successfully!')
  }

  return recommendations
}