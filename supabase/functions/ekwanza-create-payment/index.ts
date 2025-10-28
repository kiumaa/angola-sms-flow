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

// Helper to detect MIME type from base64 QR code
function detectQrMimeType(base64: string | null): string {
  if (!base64) return 'image/png';
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('Qk')) return 'image/bmp';
  return 'image/png';
}

// Helper function to normalize É-kwanza response field names (case-sensitive API)
function normalizePaymentResponse(data: any) {
  const normalized = {
    code: data.Code || data.code || null,
    qrCode: data.QRCode || data.qrCode || null,
    qrMimeType: detectQrMimeType(data.QRCode || data.qrCode),
    operationCode: data.OperationCode || data.operationCode || null,
    referenceNumber: data.ReferenceNumber || data.referenceNumber || null,
    expirationDate: parseMicrosoftJsonDate(data.ExpirationDate || data.expirationDate),
    message: data.Message || data.message || null
  };
  
  console.log('🔄 Normalized É-kwanza response:', {
    hasCode: !!normalized.code,
    hasQRCode: !!normalized.qrCode,
    qrMimeType: normalized.qrMimeType,
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
        // Let createMCXPayment handle retry/fallback across all domains
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
      
      // Extract technical details if present
      const technicalDetails = (error as any).technical_details || null
      
      // PHASE 2: Enhanced network error handling
      const errorDetails: any = {
        message: error instanceof Error ? error.message : 'Unknown error',
        payment_method,
        reference_code,
        timestamp: new Date().toISOString(),
        technical_details: technicalDetails
      }
      
      // Map specific error types
      if (error instanceof Error) {
        const errorMsg = error.message
        
        // Specific error codes from functions
        if (errorMsg === 'QR_ENDPOINT_NOT_FOUND') {
          errorDetails.type = 'QR_ENDPOINT_NOT_FOUND'
          errorDetails.suggestion = 'Endpoint /api/v1/Ticket não encontrado. Verifique a configuração da API.'
        }
        else if (errorMsg === 'MCX_UNAVAILABLE') {
          errorDetails.type = 'MCX_ENDPOINT_NOT_FOUND'
          errorDetails.suggestion = 'Nenhum endpoint MCX (/GPO, /gpo, /MCX) funcionou. Verifique a configuração da API.'
        }
        else if (errorMsg === 'REF_ENDPOINT_NOT_FOUND') {
          errorDetails.type = 'REF_ENDPOINT_NOT_FOUND'
          errorDetails.suggestion = 'Endpoint de Referência não disponível. Use Multicaixa Express como alternativa.'
        }
        else if (errorMsg === 'REF_NETWORK_ERROR' || error instanceof TypeError || 
            /dns error|failed to lookup|ENOTFOUND|ECONN|network/i.test(errorMsg)) {
          errorDetails.type = 'NETWORK'
          errorDetails.suggestion = 'Verifique sua conexão de internet ou tente Transferência Bancária'
          
          console.error('🌐 Network connectivity issue detected:', {
            error_type: 'DNS/Network failure',
            suggestion: 'IP whitelist may be required',
            alternative_methods: ['bank_transfer', 'contact_support']
          })
        }
        // 400/401/403 Provider errors
        else if (errorMsg.match(/40[013]/)) {
          errorDetails.type = 'PROVIDER_ERROR'
          errorDetails.suggestion = 'Erro do provedor É-kwanza. Verifique configuração.'
        }
        // Generic API errors
        else if (errorMsg.includes('API error')) {
          errorDetails.type = 'API_ERROR'
        }
      }
      
      console.error('📋 Error details summary:', errorDetails)
      
      // Rollback transaction
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id)
      
      // Build user-friendly response with clear guidance
      let message = 'Erro ao processar pagamento'
      let suggestion = errorDetails.suggestion
      
      if (errorDetails.type === 'QR_ENDPOINT_NOT_FOUND') {
        message = 'Endpoint QR Code não encontrado.'
      } else if (errorDetails.type === 'MCX_ENDPOINT_NOT_FOUND') {
        message = 'Endpoint MCX Express não encontrado.'
      } else if (errorDetails.type === 'REF_ENDPOINT_NOT_FOUND') {
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
        technical_details: technicalDetails,
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
      qr_mime_type: normalized.qrMimeType,
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
      qr_mime_type: normalized.qrMimeType,
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

// Helper: Get base URLs for retry (NEVER include OAuth domain)
function getBaseUrls(): string[] {
  const configuredUrl = Deno.env.get('EKWANZA_BASE_URL')
  const oauthUrl = Deno.env.get('EKWANZA_OAUTH_URL')
  
  const urls: string[] = []
  
  // 1. Priority: Configured URL (if not OAuth domain)
  if (configuredUrl && !configuredUrl.includes('oauth') && !configuredUrl.includes('login.microsoft')) {
    urls.push(configuredUrl.replace(/\/$/, ''))
    console.log('📍 Using EKWANZA_BASE_URL:', configuredUrl)
  }
  
  // 2. Try ekz-partnersapi domain
  urls.push('https://ekz-partnersapi.e-kwanza.ao')
  
  // 3. Fallback to partnersapi domain
  urls.push('https://partnersapi.e-kwanza.ao')
  
  // Remove duplicates
  const uniqueUrls = [...new Set(urls)]
  console.log('🔄 Will try URLs in order:', uniqueUrls)
  return uniqueUrls
}

// Helper: Create QR Code payment via Ticket API with retry
async function createQRCodePayment(
  amount: number,
  referenceCode: string,
  mobileNumber: string
): Promise<any> {
  console.log('🎯 === INÍCIO QR CODE PAYMENT ===')
  
  const baseUrls = getBaseUrls()
  const notificationToken = Deno.env.get('EKWANZA_NOTIFICATION_TOKEN')
  const path = `/Ticket/${notificationToken}?amount=${amount}&referenceCode=${referenceCode}&mobileNumber=${mobileNumber}`
  
  console.log('📋 Parâmetros QR Code:', {
    amount,
    referenceCode,
    mobileNumber,
    hasToken: !!notificationToken,
    tokenPrefix: notificationToken?.substring(0, 8) + '***'
  })
  console.log('🌐 Base URLs a testar:', baseUrls)
  
  const allAttempts: any[] = []
  let lastError: any = null
  
  for (let i = 0; i < baseUrls.length; i++) {
    const baseUrl = baseUrls[i]
    const url = `${baseUrl}${path}`
    
    console.log(`\n🔍 Tentativa ${i + 1}/${baseUrls.length}: ${url}`)
    
    const attempt: any = {
      attempt_number: i + 1,
      url,
      timestamp: new Date().toISOString()
    }
    
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      
      console.log('📤 Request headers:', {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      })
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeout)
      
      attempt.status = response.status
      attempt.headers = Object.fromEntries(response.headers.entries())
      
      console.log(`📥 Response status: ${response.status}`)
      console.log(`📥 Response headers:`, attempt.headers)
      
      if (response.ok) {
        const data = await response.json()
        attempt.success = true
        attempt.response_keys = Object.keys(data)
        
        console.log(`✅ === QR CODE PAYMENT SUCESSO! ===`)
        console.log(`🎉 URL que funcionou: ${url}`)
        console.log(`📝 IMPORTANTE: Confirme EKWANZA_BASE_URL=${baseUrl}`)
        console.log(`📊 Response keys:`, attempt.response_keys)
        
        allAttempts.push(attempt)
        return data
      } else {
        const errorText = await response.text()
        attempt.success = false
        attempt.error_body = errorText.substring(0, 500)
        
        console.error(`❌ Falha ${response.status}:`, errorText.substring(0, 300))
        lastError = attempt
      }
    } catch (error) {
      attempt.success = false
      attempt.error = error instanceof Error ? error.message : String(error)
      attempt.error_type = error.name
      
      console.error(`❌ Exceção ao conectar:`, {
        error: attempt.error,
        type: attempt.error_type
      })
      
      lastError = attempt
    }
    
    allAttempts.push(attempt)
  }
  
  console.error('❌ === FIM QR CODE PAYMENT (TODAS TENTATIVAS FALHARAM) ===')
  console.error('📊 Resumo completo:', JSON.stringify(allAttempts, null, 2))
  
  const error: any = new Error('QR_ENDPOINT_NOT_FOUND')
  error.technical_details = {
    method: 'qrcode',
    attempts: allAttempts,
    last_error: lastError,
    base_urls_tried: baseUrls,
    total_attempts: allAttempts.length
  }
  throw error
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

// Helper: Create Multicaixa Express payment with retry and multi-path attempts
async function createMCXPayment(
  amount: number,
  referenceCode: string,
  mobileNumber: string
): Promise<any> {
  console.log('🎯 === INÍCIO MCX EXPRESS PAYMENT ===')
  
  const baseUrls = getBaseUrls()
  const merchantNumber = Deno.env.get('EKWANZA_MERCHANT_NUMBER')
  const paymentMethodId = Deno.env.get('EKWANZA_GPO_PAYMENT_METHOD')
  
  console.log('📋 Configuração MCX:', {
    amount,
    referenceCode,
    mobileNumber,
    merchantNumber,
    paymentMethodId
  })
  
  // Get OAuth2 token
  console.log('🔐 Obtendo OAuth2 token...')
  const accessToken = await getOAuth2Token()
  console.log('✅ OAuth2 token obtido:', accessToken ? 'SIM' : 'NÃO')
  
  const body = {
    paymentMethodId: paymentMethodId,
    amount: amount,
    referenceCode: referenceCode,
    mobileNumber: mobileNumber,
    merchantNumber: merchantNumber,
    description: `Créditos SMS AO`
  }
  
  // Multiple path variants (case-sensitivity)
  const pathVariants = [
    '/api/v1/GPO',
    '/api/v1/gpo',
    '/api/v1/MCX',
    '/api/v1/Mcx',
    '/api/v1/mcx',
    '/api/v1/payments/mcx'
  ]
  
  console.log('🌐 Base URLs:', baseUrls)
  console.log('🛣️ Path variants a testar:', pathVariants)
  console.log('📤 Request body:', JSON.stringify(body, null, 2))
  
  const allAttempts: any[] = []
  let lastError: any = null
  
  for (const baseUrl of baseUrls) {
    for (const path of pathVariants) {
      const url = `${baseUrl}${path}`
      
      console.log(`\n🔍 Tentando: ${url}`)
      
      const attempt: any = {
        url,
        base_url: baseUrl,
        path,
        timestamp: new Date().toISOString()
      }
      
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 15000)
        
        console.log('📤 Headers:', {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer [TOKEN]'
        })
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(body),
          signal: controller.signal
        })
        
        clearTimeout(timeout)
        
        attempt.status = response.status
        attempt.headers = Object.fromEntries(response.headers.entries())
        
        console.log(`📥 Response status: ${response.status}`)
        console.log(`📥 Headers:`, attempt.headers)
        
        if (response.ok) {
          const data = await response.json()
          attempt.success = true
          attempt.response_keys = Object.keys(data)
          
          console.log(`✅ === MCX EXPRESS FUNCIONA! ===`)
          console.log(`🎉 URL CORRETA: ${url}`)
          console.log(`📝 IMPORTANTE: Configurar EKWANZA_BASE_URL=${baseUrl}`)
          console.log(`📝 IMPORTANTE: Path correto: ${path}`)
          console.log(`📊 Response keys:`, attempt.response_keys)
          
          allAttempts.push(attempt)
          return data
        }
        
        const errorText = await response.text()
        attempt.success = false
        attempt.error_body = errorText.substring(0, 500)
        
        // Se 404, tentar próximo path
        if (response.status === 404) {
          console.log(`⏭️ 404 em ${path}, tentando próximo...`)
          lastError = attempt
          allAttempts.push(attempt)
          continue
        }
        
        // Se 4xx diferente de 404, abortar (erro de payload)
        if (response.status >= 400 && response.status < 500) {
          console.error(`🚫 Erro do cliente (${response.status}):`, errorText.substring(0, 300))
          attempt.abort_reason = 'Client error (not 404)'
          allAttempts.push(attempt)
          throw new Error(`MCX error: ${response.status}`)
        }
        
        lastError = attempt
        allAttempts.push(attempt)
      } catch (error) {
        attempt.success = false
        attempt.error = error instanceof Error ? error.message : String(error)
        attempt.error_type = error.name
        
        console.error(`❌ Exceção:`, {
          error: attempt.error,
          type: attempt.error_type
        })
        
        lastError = attempt
        allAttempts.push(attempt)
      }
    }
  }
  
  console.error('❌ === FIM MCX EXPRESS (TODAS TENTATIVAS FALHARAM) ===')
  console.error('📊 Total de tentativas:', allAttempts.length)
  console.error('📊 Resumo completo:', JSON.stringify(allAttempts, null, 2))
  
  const error: any = new Error('MCX_UNAVAILABLE')
  error.technical_details = {
    method: 'mcx',
    attempts: allAttempts,
    last_error: lastError,
    base_urls_tried: baseUrls,
    paths_tried: pathVariants,
    total_attempts: allAttempts.length
  }
  throw error
}

// Helper: Create Referência EMIS payment with retry logic
async function createReferenciaPayment(
  amount: number,
  referenceCode: string
): Promise<any> {
  console.log('🎯 === INÍCIO REFERÊNCIA EMIS PAYMENT ===')
  
  const baseUrls = getBaseUrls()
  const merchantNumber = Deno.env.get('EKWANZA_MERCHANT_NUMBER')
  const paymentMethodId = Deno.env.get('EKWANZA_REF_PAYMENT_METHOD')
  
  console.log('📋 Configuração Referência:', {
    amount,
    referenceCode,
    merchantNumber,
    paymentMethodId
  })
  
  // Get OAuth2 token
  console.log('🔐 Obtendo OAuth2 token...')
  const accessToken = await getOAuth2Token()
  console.log('✅ OAuth2 token obtido:', accessToken ? 'SIM' : 'NÃO')
  
  const body = {
    paymentMethodId: paymentMethodId,
    amount: amount,
    referenceCode: referenceCode,
    merchantNumber: merchantNumber,
    description: `Créditos SMS AO`
  }
  
  // Try different URL variants (case sensitivity, trailing slash)
  const pathVariants = ['/api/v1/REF', '/api/v1/Ref', '/api/v1/REF/']
  
  console.log('🌐 Base URLs:', baseUrls)
  console.log('🛣️ Paths a testar:', pathVariants)
  console.log('📤 Request body:', JSON.stringify(body, null, 2))
  
  const allAttempts: any[] = []
  let lastError: any = null
  
  for (const baseUrl of baseUrls) {
    for (const path of pathVariants) {
      const url = `${baseUrl}${path}`
      
      console.log(`\n🔍 Tentando: ${url}`)
      
      const attempt: any = {
        url,
        base_url: baseUrl,
        path,
        timestamp: new Date().toISOString()
      }
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        console.log('📤 Headers:', {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer [TOKEN]'
        })
        
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
        
        attempt.status = response.status
        attempt.headers = Object.fromEntries(response.headers.entries())
        
        console.log(`📥 Response status: ${response.status}`)
        console.log(`📥 Headers:`, attempt.headers)
        
        if (response.ok) {
          const data = await response.json()
          attempt.success = true
          attempt.response_keys = Object.keys(data)
          
          console.log(`✅ === REFERÊNCIA EMIS FUNCIONA! ===`)
          console.log(`🎉 URL CORRETA: ${url}`)
          console.log(`📝 IMPORTANTE: Configurar EKWANZA_BASE_URL=${baseUrl}`)
          console.log(`📝 IMPORTANTE: Path correto: ${path}`)
          console.log(`📊 Response keys:`, attempt.response_keys)
          
          allAttempts.push(attempt)
          return data
        }
        
        const errorText = await response.text()
        attempt.success = false
        attempt.error_body = errorText.substring(0, 500)
        
        console.error(`❌ Falha ${response.status}:`, errorText.substring(0, 300))
        
        // If not 404 and not 5xx, throw immediately (auth/config error)
        if (response.status !== 404 && response.status < 500) {
          attempt.abort_reason = 'Client error (not 404)'
          allAttempts.push(attempt)
          throw new Error(`É-kwanza Referência API error: ${response.status}`)
        }
        
        lastError = attempt
        allAttempts.push(attempt)
        
        // If not 404, don't try other path variants for this baseUrl
        if (response.status !== 404) {
          break
        }
      } catch (error) {
        // Detect DNS/Network errors more broadly
        const isNetworkError = error instanceof TypeError || 
          /dns error|failed to lookup|ENOTFOUND|ECONN|network/i.test(error instanceof Error ? error.message : '')
        
        attempt.success = false
        
        if (isNetworkError) {
          attempt.error = 'NETWORK'
          attempt.error_message = error instanceof Error ? error.message : 'Network error'
          
          console.error(`❌ Network/DNS error:`, attempt.error_message)
          console.log(`🔄 Tentando próximo baseUrl...`)
          
          lastError = attempt
          allAttempts.push(attempt)
          break // Try next baseUrl
        }
        
        if (error.name === 'AbortError') {
          attempt.error = 'TIMEOUT'
          attempt.error_message = 'Request took too long (>15s)'
          
          console.error(`❌ Timeout`)
          
          lastError = attempt
          allAttempts.push(attempt)
          break
        }
        
        // Re-throw non-network errors
        throw error
      }
    }
  }
  
  console.error('❌ === FIM REFERÊNCIA EMIS (TODAS TENTATIVAS FALHARAM) ===')
  console.error('📊 Total de tentativas:', allAttempts.length)
  console.error('📊 Resumo completo:', JSON.stringify(allAttempts, null, 2))
  
  // Determine error type
  if (allAttempts.some(a => a.status === 404)) {
    const error: any = new Error('REF_ENDPOINT_NOT_FOUND')
    error.technical_details = {
      method: 'referencia',
      attempts: allAttempts,
      last_error: lastError,
      base_urls_tried: baseUrls,
      paths_tried: pathVariants,
      total_attempts: allAttempts.length
    }
    throw error
  }
  
  const error: any = new TypeError('REF_NETWORK_ERROR')
  error.technical_details = {
    method: 'referencia',
    attempts: allAttempts,
    last_error: lastError,
    base_urls_tried: baseUrls,
    paths_tried: pathVariants,
    total_attempts: allAttempts.length
  }
  throw error
}
