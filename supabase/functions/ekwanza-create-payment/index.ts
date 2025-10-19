import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreatePaymentRequest {
  package_id: string
  payment_method: 'qrcode' | 'mcx' | 'referencia'
  mobile_number?: string
}

// PHASE 1: Helper function to parse Microsoft JSON Date format
function parseMicrosoftJsonDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  
  // Formato: /Date(1760873332995)/
  const match = dateStr.match(/\/Date\((\d+)\)\//);
  if (!match) {
    console.warn('⚠️ Date format not recognized:', dateStr);
    return null;
  }
  
  const timestamp = parseInt(match[1], 10);
  const isoDate = new Date(timestamp).toISOString();
  console.log('📅 Date converted:', { original: dateStr, timestamp, iso: isoDate });
  return isoDate;
}

// Helper function to normalize É-kwanza response field names (case-sensitive API)
function normalizePaymentResponse(data: any) {
  const normalized = {
    code: data.Code || data.code || null,
    qrCode: data.QRCode || data.qrCode || null,
    operationCode: data.OperationCode || data.operationCode || null,
    referenceNumber: data.ReferenceNumber || data.referenceNumber || null,
    expirationDate: parseMicrosoftJsonDate(data.ExpirationDate || data.expirationDate),
    message: data.Message || data.message || null
  };
  
  console.log('🔄 Normalized É-kwanza response:', {
    hasCode: !!normalized.code,
    hasQRCode: !!normalized.qrCode,
    hasExpiration: !!normalized.expirationDate,
    expirationDate: normalized.expirationDate
  });
  
  return normalized;
}

// Helper function to test É-kwanza connectivity
async function testEkwanzaConnectivity(baseUrl: string, timeoutMs: number = 5000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(baseUrl, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // 404 is actually OK - it means we reached the server
    return response.ok || response.status === 404;
  } catch (error) {
    console.error('Connectivity test failed:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const body: CreatePaymentRequest = await req.json()
    const { package_id, payment_method, mobile_number } = body

    // Validate input
    if (!package_id || !payment_method) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!['qrcode', 'mcx', 'referencia'].includes(payment_method)) {
      return new Response(JSON.stringify({ error: 'Invalid payment method' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate mobile number for qrcode and mcx
    if ((payment_method === 'qrcode' || payment_method === 'mcx') && !mobile_number) {
      return new Response(JSON.stringify({ error: 'Mobile number required for this payment method' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get package details using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: creditPackage, error: packageError } = await supabaseAdmin
      .from('credit_packages')
      .select('*')
      .eq('id', package_id)
      .eq('is_active', true)
      .single()

    if (packageError || !creditPackage) {
      console.error('Package not found:', packageError)
      return new Response(JSON.stringify({ error: 'Package not found or inactive' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create transaction
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.id,
        package_id: creditPackage.id,
        amount_kwanza: creditPackage.price_kwanza,
        credits_purchased: creditPackage.credits,
        status: 'pending',
        payment_method: payment_method
      })
      .select()
      .single()

    if (transactionError || !transaction) {
      console.error('Error creating transaction:', transactionError)
      
      // Check for rate limit error (P0001)
      if (transactionError?.code === 'P0001' && transactionError?.message?.includes('rate limit')) {
        return new Response(JSON.stringify({ 
          error: 'RATE_LIMIT',
          message: 'Limite de tentativas atingido. Aguarde ~1 minuto e tente novamente.',
          retry_after: 60
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      return new Response(JSON.stringify({ error: 'Error creating transaction' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Generate unique reference code
    const timestamp = Date.now()
    const userId = user.id.slice(0, 8)
    const reference_code = `SMSAO-${timestamp}-${userId}`

    console.log(`Creating É-kwanza payment:`, {
      user_id: user.id,
      payment_method,
      package_id,
      amount: creditPackage.price_kwanza,
      reference_code
    })

    // PHASE 2: Check if Referência EMIS is enabled
    if (payment_method === 'referencia') {
      const referenciaEnabled = Deno.env.get('ENABLE_REFERENCIA_EMIS') === 'true';
      
      if (!referenciaEnabled) {
        console.log('Referência EMIS is disabled via environment variable');
        
        // Rollback transaction
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'failed' })
          .eq('id', transaction.id);
        
        return new Response(JSON.stringify({
          success: false,
          error: 'ENDPOINT_NOT_FOUND',
          message: 'Referência EMIS temporariamente indisponível',
          suggestion: 'Use Multicaixa Express (MCX) ou Transferência Bancária como alternativa'
        }), { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }

    // Call É-kwanza API based on payment method
    let ekwanzaResponse: any
    
    try {
      if (payment_method === 'qrcode') {
        ekwanzaResponse = await createQRCodePayment(
          creditPackage.price_kwanza,
          reference_code,
          mobile_number!
        )
      } else if (payment_method === 'mcx') {
        // PHASE 3: Test connectivity first
        const baseUrls = getBaseUrls()
        const isConnected = await testEkwanzaConnectivity(baseUrls[0], 5000);
        
        if (!isConnected) {
          console.warn('MCX connectivity test failed');
          
          // Rollback transaction
          await supabaseAdmin
            .from('transactions')
            .update({ status: 'failed' })
            .eq('id', transaction.id);
          
          return new Response(JSON.stringify({
            success: false,
            error: 'NETWORK',
            message: 'Não foi possível conectar ao servidor É-kwanza',
            suggestion: 'Verifique sua conexão de internet ou tente Transferência Bancária',
            details: 'O servidor do É-kwanza pode estar temporariamente indisponível ou seu IP pode precisar ser autorizado'
          }), { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        
        ekwanzaResponse = await createMCXPayment(
          creditPackage.price_kwanza,
          reference_code,
          mobile_number!
        )
      } else if (payment_method === 'referencia') {
        ekwanzaResponse = await createReferenciaPayment(
          creditPackage.price_kwanza,
          reference_code
        )
      }
    } catch (error) {
      console.error('❌ É-kwanza API error:', {
        error: error instanceof Error ? error.message : error,
        timestamp: new Date().toISOString(),
        payment_method,
        reference_code
      })
      
      // PHASE 2: Enhanced network error handling
      const errorDetails: any = {
        message: error instanceof Error ? error.message : 'Unknown error',
        payment_method,
        reference_code,
        timestamp: new Date().toISOString()
      }
      
      // Map specific error types
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        
        // Network/DNS errors (broader detection)
        if (error instanceof TypeError || 
            /dns error|failed to lookup|ENOTFOUND|ECONN|network/i.test(error.message)) {
          errorDetails.type = 'NETWORK'
          errorDetails.suggestion = 'Verifique sua conexão de internet ou tente Transferência Bancária'
          
          console.error('🌐 Network connectivity issue detected:', {
            error_type: 'DNS/Network failure',
            suggestion: 'IP whitelist may be required',
            alternative_methods: ['bank_transfer', 'contact_support']
          })
        }
        // 404 Endpoint not found
        else if (error.message.includes('404 ENDPOINT')) {
          errorDetails.type = 'ENDPOINT_NOT_FOUND'
          errorDetails.suggestion = 'Endpoint de Referência não disponível. Use Multicaixa Express como alternativa.'
        }
        // 400/401/403 Provider errors
        else if (error.message.match(/40[013]/)) {
          errorDetails.type = 'PROVIDER_ERROR'
          errorDetails.suggestion = 'Erro do provedor É-kwanza. Verifique configuração.'
        }
        // Generic API errors
        else if (error.message.includes('API error')) {
          errorDetails.type = 'API_ERROR'
        }
      }
      
      console.error('📋 Error details summary:', errorDetails)
      
      // Rollback transaction
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id)
      
      // PHASE 2: Build user-friendly response with clear guidance
      let message = 'Erro ao processar pagamento'
      let suggestion = errorDetails.suggestion
      
      if (errorDetails.type === 'ENDPOINT_NOT_FOUND') {
        message = 'Endpoint de Referência não encontrado (404).'
      } else if (errorDetails.type === 'PROVIDER_ERROR') {
        message = 'Erro do provedor É-kwanza.'
      } else if (errorDetails.type === 'NETWORK') {
        message = 'Não foi possível conectar ao servidor É-kwanza.'
        suggestion = 'Verifique sua conexão de internet ou use Transferência Bancária como alternativa.'
      }
      
      // Return 200 with structured error for better frontend handling
      return new Response(JSON.stringify({ 
        success: false,
        error: errorDetails.type || 'API_ERROR',
        message,
        suggestion,
        details: error instanceof Error ? error.message.substring(0, 100) : undefined
      }), {
        status: 200, // 200 for cleaner frontend handling
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PHASE 1: Normalize response from É-kwanza API
    const normalized = normalizePaymentResponse(ekwanzaResponse);

    // PHASE 3: Log payment data before saving to database
    console.log('💾 Attempting to save payment to database:', {
      payment_method,
      has_expiration: !!normalized.expirationDate,
      expiration_value: normalized.expirationDate,
      has_qr_code: !!normalized.qrCode,
      ekwanza_code: normalized.code
    });

    // Save payment in database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('ekwanza_payments')
      .insert({
        user_id: user.id,
        transaction_id: transaction.id,
        payment_method: payment_method,
        amount: creditPackage.price_kwanza,
        reference_code: reference_code,
        mobile_number: mobile_number || null,
        ekwanza_code: normalized.code,
        ekwanza_operation_code: normalized.operationCode,
        qr_code_base64: normalized.qrCode,
        reference_number: normalized.referenceNumber,
        status: 'pending',
        expiration_date: normalized.expirationDate,
        raw_response: ekwanzaResponse
      })
      .select()
      .single()

    if (paymentError || !payment) {
      console.error('❌ Error saving payment to database:', {
        error: paymentError,
        code: paymentError?.code,
        message: paymentError?.message,
        details: paymentError?.details
      })
      return new Response(JSON.stringify({ error: 'Error saving payment data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('✅ Payment saved to database successfully:', payment.id);

    console.log(`É-kwanza payment created successfully:`, {
      payment_id: payment.id,
      ekwanza_code: payment.ekwanza_code,
      reference_number: payment.reference_number
    })

    // Return payment details to frontend
    return new Response(JSON.stringify({
      success: true,
      payment_id: payment.id,
      transaction_id: transaction.id,
      payment_method: payment_method,
      amount: creditPackage.price_kwanza,
      credits: creditPackage.credits,
      ekwanza_code: payment.ekwanza_code,
      qr_code: payment.qr_code_base64,
      reference_number: payment.reference_number,
      expiration_date: payment.expiration_date,
      reference_code: reference_code
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Helper: Get base URLs for retry
function getBaseUrls(): string[] {
  const baseUrl = Deno.env.get('EKWANZA_BASE_URL')
  const urls: string[] = []
  
  // 1. Use EKWANZA_BASE_URL if explicitly set
  if (baseUrl) {
    urls.push(baseUrl)
    console.log('📍 Using EKWANZA_BASE_URL:', baseUrl)
  }
  
  // 2. Try ekz-partnersapi domain
  if (!urls.includes('https://ekz-partnersapi.e-kwanza.ao')) {
    urls.push('https://ekz-partnersapi.e-kwanza.ao')
  }
  
  // 3. Fallback to partnersapi domain
  if (!urls.includes('https://partnersapi.e-kwanza.ao')) {
    urls.push('https://partnersapi.e-kwanza.ao')
  }
  
  console.log('🔄 Will try URLs in order:', urls)
  return urls
}

// Helper: Create QR Code payment via Ticket API with retry
async function createQRCodePayment(
  amount: number,
  referenceCode: string,
  mobileNumber: string
): Promise<any> {
  const baseUrls = getBaseUrls()
  const notificationToken = Deno.env.get('EKWANZA_NOTIFICATION_TOKEN')
  const path = `/Ticket/${notificationToken}?amount=${amount}&referenceCode=${referenceCode}&mobileNumber=${mobileNumber}`
  
  let lastError: any = null
  
  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}${path}`
    
    console.log('🎫 Attempting QR Code payment:', { baseUrl, referenceCode, mobileNumber })
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ QR Code payment created via ${baseUrl}:`, data)
        return data
      }
      
      const errorText = await response.text()
      console.error(`❌ QR Code failed on ${baseUrl}:`, response.status, errorText.substring(0, 200))
      
      // If not a DNS/network error, throw immediately
      if (response.status !== 404 && response.status < 500) {
        throw new Error(`É-kwanza QR Code API error: ${response.status}`)
      }
      
      lastError = { baseUrl, status: response.status, text: errorText }
    } catch (error) {
      // Detect DNS/Network errors more broadly
      const isNetworkError = error instanceof TypeError || 
        /dns error|failed to lookup|ENOTFOUND|ECONN|network/i.test(error instanceof Error ? error.message : '')
      
      if (isNetworkError) {
        console.error(`❌ Network/DNS error on ${baseUrl}:`, error instanceof Error ? error.message : error)
        console.log(`🔄 Trying next baseUrl...`)
        lastError = { baseUrl, error: 'NETWORK', message: error instanceof Error ? error.message : 'Network error' }
        continue
      }
      
      if (error.name === 'AbortError') {
        console.error(`❌ Timeout on ${baseUrl}`)
        lastError = { baseUrl, error: 'TIMEOUT', message: 'Request took too long (>15s)' }
        continue
      }
      
      // Re-throw non-network errors
      throw error
    }
  }
  
  // All URLs failed
  console.error('❌ All QR Code URLs failed:', lastError)
  throw new TypeError('Network/DNS error: Could not reach É-kwanza API')
}

// Helper: Get OAuth2 token
async function getOAuth2Token(): Promise<string> {
  const oauthUrl = Deno.env.get('EKWANZA_OAUTH_URL')
  const clientId = Deno.env.get('EKWANZA_CLIENT_ID')
  const clientSecret = Deno.env.get('EKWANZA_CLIENT_SECRET')
  const resource = Deno.env.get('EKWANZA_RESOURCE')
  
  // SECURITY: Log sanitized credentials (never log full secrets)
  console.log('OAuth Request Config:', {
    oauth_url: oauthUrl,
    client_id: clientId?.substring(0, 8) + '***',
    client_secret: '[REDACTED]',
    resource: resource,
    grant_type: 'client_credentials'
  })
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId!,
    client_secret: clientSecret!,
    resource: resource!
  })
  
  const response = await fetch(oauthUrl!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('OAuth2 error:', response.status, errorText.substring(0, 100))
    throw new Error(`OAuth2 failed: ${response.status}`)
  }
  
  const data = await response.json()
  console.log('OAuth2 token obtained successfully')
  return data.access_token
}

// Helper: Create Multicaixa Express payment with retry
async function createMCXPayment(
  amount: number,
  referenceCode: string,
  mobileNumber: string
): Promise<any> {
  const baseUrls = getBaseUrls()
  const merchantNumber = Deno.env.get('EKWANZA_MERCHANT_NUMBER')
  const paymentMethodId = Deno.env.get('EKWANZA_GPO_PAYMENT_METHOD')
  
  // Get OAuth2 token
  const accessToken = await getOAuth2Token()
  
  const body = {
    paymentMethodId: paymentMethodId,
    amount: amount,
    referenceCode: referenceCode,
    mobileNumber: mobileNumber,
    merchantNumber: merchantNumber,
    description: `Créditos SMS AO`
  }
  
  let lastError: any = null
  
  for (const baseUrl of baseUrls) {
    const url = `${baseUrl}/api/v1/GPO`
    
    console.log('💳 Attempting MCX payment:', { baseUrl, merchantNumber, referenceCode })
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ MCX payment created via ${baseUrl}:`, data)
        return data
      }
      
      const errorText = await response.text()
      console.error(`❌ MCX failed on ${baseUrl}:`, response.status, errorText.substring(0, 200))
      
      // If not a DNS/network error, throw immediately
      if (response.status !== 404 && response.status < 500) {
        throw new Error(`É-kwanza MCX API error: ${response.status}`)
      }
      
      lastError = { baseUrl, status: response.status, text: errorText }
    } catch (error) {
      // Detect DNS/Network errors more broadly
      const isNetworkError = error instanceof TypeError || 
        /dns error|failed to lookup|ENOTFOUND|ECONN|network/i.test(error instanceof Error ? error.message : '')
      
      if (isNetworkError) {
        console.error(`❌ Network/DNS error on ${baseUrl}:`, error instanceof Error ? error.message : error)
        console.log(`🔄 Trying next baseUrl...`)
        lastError = { baseUrl, error: 'NETWORK', message: error instanceof Error ? error.message : 'Network error' }
        continue
      }
      
      if (error.name === 'AbortError') {
        console.error(`❌ Timeout on ${baseUrl}`)
        lastError = { baseUrl, error: 'TIMEOUT', message: 'Request took too long (>15s)' }
        continue
      }
      
      // Re-throw non-network errors
      throw error
    }
  }
  
  // All URLs failed
  console.error('❌ All MCX URLs failed:', lastError)
  throw new TypeError('Network/DNS error: Could not reach É-kwanza API')
}

// Helper: Create Referência EMIS payment with retry logic
async function createReferenciaPayment(
  amount: number,
  referenceCode: string
): Promise<any> {
  const baseUrls = getBaseUrls()
  const merchantNumber = Deno.env.get('EKWANZA_MERCHANT_NUMBER')
  const paymentMethodId = Deno.env.get('EKWANZA_REF_PAYMENT_METHOD')
  
  // Get OAuth2 token
  const accessToken = await getOAuth2Token()
  
  const body = {
    paymentMethodId: paymentMethodId,
    amount: amount,
    referenceCode: referenceCode,
    merchantNumber: merchantNumber,
    description: `Créditos SMS AO`
  }
  
  // Try different URL variants (case sensitivity, trailing slash)
  const pathVariants = ['/api/v1/REF', '/api/v1/Ref', '/api/v1/REF/']
  
  let lastError: any = null
  
  for (const baseUrl of baseUrls) {
    for (const path of pathVariants) {
      const url = `${baseUrl}${path}`
      
      console.log(`📄 Attempting Referência payment:`, { baseUrl, path, merchantNumber, referenceCode })
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Referência payment created via ${baseUrl}${path}:`, data)
          return data
        }
        
        const errorText = await response.text()
        console.error(`❌ Referência failed on ${baseUrl}${path}:`, response.status, errorText.substring(0, 200))
        
        // If not 404 and not 5xx, throw immediately (auth/config error)
        if (response.status !== 404 && response.status < 500) {
          throw new Error(`É-kwanza Referência API error: ${response.status}`)
        }
        
        lastError = { baseUrl, path, status: response.status, text: errorText }
        
        // If not 404, don't try other path variants for this baseUrl
        if (response.status !== 404) {
          break
        }
      } catch (error) {
        // Detect DNS/Network errors more broadly
        const isNetworkError = error instanceof TypeError || 
          /dns error|failed to lookup|ENOTFOUND|ECONN|network/i.test(error instanceof Error ? error.message : '')
        
        if (isNetworkError) {
          console.error(`❌ Network/DNS error on ${baseUrl}${path}:`, error instanceof Error ? error.message : error)
          console.log(`🔄 Trying next baseUrl...`)
          lastError = { baseUrl, path, error: 'NETWORK', message: error instanceof Error ? error.message : 'Network error' }
          break // Try next baseUrl
        }
        
        if (error.name === 'AbortError') {
          console.error(`❌ Timeout on ${baseUrl}${path}`)
          lastError = { baseUrl, path, error: 'TIMEOUT', message: 'Request took too long (>15s)' }
          break
        }
        
        // Re-throw non-network errors
        throw error
      }
    }
  }
  
  // All URLs failed
  if (lastError?.status === 404) {
    console.error('❌ All Referência URLs returned 404')
    throw new Error('É-kwanza Referência API error: 404 ENDPOINT')
  }
  
  console.error('❌ All Referência URLs failed:', lastError)
  throw new TypeError('Network/DNS error: Could not reach É-kwanza API')
}
