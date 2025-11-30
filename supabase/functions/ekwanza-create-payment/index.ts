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
  // Suportar diferentes formatos de resposta (QR Code, MCX, REF)
  const normalized = {
    code: data.Code || data.code || data.ekwanzaTransactionId || data.merchantTransactionId || null,
    qrCode: data.QRCode || data.qrCode || null,
    qrMimeType: detectQrMimeType(data.QRCode || data.qrCode),
    operationCode: data.OperationCode || data.operationCode || data.ekzOperationCode || null,
    referenceNumber: data.ReferenceNumber || data.referenceNumber || null,
    expirationDate: parseMicrosoftJsonDate(data.ExpirationDate || data.expirationDate || data.expiresAt),
    message: data.Message || data.message || data.statusMessage || null
  };
  
  console.log('🔄 Normalized É-kwanza response:', {
    hasCode: !!normalized.code,
    hasQRCode: !!normalized.qrCode,
    qrMimeType: normalized.qrMimeType,
    hasExpiration: !!normalized.expirationDate,
    expirationDate: normalized.expirationDate,
    hasOperationCode: !!normalized.operationCode,
    hasReferenceNumber: !!normalized.referenceNumber
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
        // MCX Errors - melhorados
        else if (errorMsg === 'MCX_UNAVAILABLE' || errorMsg === 'MCX_ENDPOINT_NOT_FOUND') {
          errorDetails.type = 'MCX_ENDPOINT_NOT_FOUND'
          errorDetails.suggestion = 'Endpoint MCX Express (/api/v1/GPO) não encontrado. Verifique EKWANZA_BASE_URL e configuração da API.'
        }
        else if (errorMsg === 'MCX_CONFIG_MISSING') {
          errorDetails.type = 'MCX_CONFIG_MISSING'
          errorDetails.suggestion = 'Configuração MCX incompleta. Verifique EKWANZA_MERCHANT_NUMBER e EKWANZA_GPO_PAYMENT_METHOD.'
        }
        else if (errorMsg === 'MCX_OAUTH_FAILED') {
          errorDetails.type = 'MCX_OAUTH_FAILED'
          errorDetails.suggestion = 'Falha na autenticação OAuth2. Verifique EKWANZA_OAUTH_URL, CLIENT_ID, CLIENT_SECRET e RESOURCE.'
        }
        else if (errorMsg === 'MCX_NETWORK_ERROR' || errorMsg === 'MCX_TIMEOUT') {
          errorDetails.type = 'MCX_NETWORK_ERROR'
          errorDetails.suggestion = 'Não foi possível conectar ao servidor É-kwanza. Verifique conectividade ou whitelist de IP.'
        }
        else if (errorMsg === 'MCX_UNAUTHORIZED') {
          errorDetails.type = 'MCX_UNAUTHORIZED'
          errorDetails.suggestion = 'Token OAuth2 inválido ou expirado. Verifique credenciais OAuth2.'
        }
        else if (errorMsg === 'MCX_BAD_REQUEST') {
          errorDetails.type = 'MCX_BAD_REQUEST'
          errorDetails.suggestion = 'Requisição inválida. Verifique payload (amount, mobileNumber, referenceCode).'
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
        message = 'Endpoint MCX Express não encontrado. Verifique configuração da API.'
      } else if (errorDetails.type === 'MCX_CONFIG_MISSING') {
        message = 'Configuração MCX Express incompleta. Verifique secrets no Supabase.'
      } else if (errorDetails.type === 'MCX_OAUTH_FAILED') {
        message = 'Falha na autenticação OAuth2 para MCX Express.'
      } else if (errorDetails.type === 'MCX_NETWORK_ERROR' || errorDetails.type === 'MCX_TIMEOUT') {
        message = 'Não foi possível conectar ao servidor É-kwanza (MCX Express).'
        suggestion = 'Verifique conectividade ou whitelist de IP. Tente novamente em alguns instantes.'
      } else if (errorDetails.type === 'MCX_UNAUTHORIZED') {
        message = 'Token OAuth2 inválido para MCX Express. Verifique credenciais.'
      } else if (errorDetails.type === 'MCX_BAD_REQUEST') {
        message = 'Requisição inválida para MCX Express. Verifique os dados fornecidos.'
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

    // Validar que temos pelo menos um código de identificação
    if (!normalized.code) {
      console.error('❌ Resposta da API não contém código de identificação:', {
        ekwanzaResponse,
        normalized,
        payment_method
      })
      
      // Rollback transaction
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id)
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'INVALID_RESPONSE',
        message: 'A resposta da API É-kwanza não contém um código de identificação válido.',
        suggestion: 'Tente novamente ou use outro método de pagamento.',
        technical_details: {
          payment_method,
          response_keys: Object.keys(ekwanzaResponse || {}),
          normalized
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // PHASE 3: Log payment data before saving to database
    console.log('💾 Attempting to save payment to database:', {
      payment_method,
      has_expiration: !!normalized.expirationDate,
      expiration_value: normalized.expirationDate,
      has_qr_code: !!normalized.qrCode,
      qr_mime_type: normalized.qrMimeType,
      ekwanza_code: normalized.code,
      operation_code: normalized.operationCode
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
        details: paymentError?.details,
        normalized_code: normalized.code
      })
      
      // Rollback transaction
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id)
      
      return new Response(JSON.stringify({ 
        success: false,
        error: 'DATABASE_ERROR',
        message: 'Erro ao salvar dados do pagamento no banco de dados.',
        suggestion: 'Tente novamente. Se o problema persistir, entre em contato com o suporte.',
        technical_details: {
          payment_method,
          error_code: paymentError?.code,
          error_message: paymentError?.message
        }
      }), {
        status: 200,
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
      attempt.error_type = error instanceof Error ? error.name : 'UnknownError'
      
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

// Helper: Create Multicaixa Express payment (MCX Express - Gateway Principal)
// Conforme documentação oficial v2.5: Gateway de Pagamentos Online (GPO)
async function createMCXPayment(
  amount: number,
  referenceCode: string,
  mobileNumber: string
): Promise<any> {
  console.log('🎯 === MCX EXPRESS PAYMENT (GATEWAY PRINCIPAL) ===')
  
  const baseUrl = Deno.env.get('EKWANZA_BASE_URL') || 'https://ekz-partnersapi.e-kwanza.ao'
  const merchantNumber = Deno.env.get('EKWANZA_MERCHANT_NUMBER') // Nº conta: 01465115
  const paymentMethodId = Deno.env.get('EKWANZA_GPO_PAYMENT_METHOD') // paymentMethodGPO
  const apiKey = Deno.env.get('EKWANZA_GPO_API_KEY') || paymentMethodId // ApiKey GPO (mesmo valor que paymentMethodGPO)
  
  // Validação de configuração obrigatória
  if (!merchantNumber || !paymentMethodId) {
    const error: any = new Error('MCX_CONFIG_MISSING')
    error.technical_details = {
      method: 'mcx',
      missing_config: {
        merchantNumber: !merchantNumber,
        paymentMethodId: !paymentMethodId
      }
    }
    throw error
  }
  
  console.log('📋 Configuração MCX:', {
    baseUrl,
    amount,
    referenceCode,
    mobileNumber: mobileNumber.substring(0, 4) + '***',
    merchantNumber,
    paymentMethodId: paymentMethodId.substring(0, 8) + '***',
    hasApiKey: !!apiKey
  })
  
  // Get OAuth2 token
  console.log('🔐 Obtendo OAuth2 token...')
  let accessToken: string
  try {
    accessToken = await getOAuth2Token()
    console.log('✅ OAuth2 token obtido com sucesso')
  } catch (error) {
    console.error('❌ Falha ao obter OAuth2 token:', error)
    const oauthError: any = new Error('MCX_OAUTH_FAILED')
    oauthError.technical_details = {
      method: 'mcx',
      oauth_error: error instanceof Error ? error.message : String(error)
    }
    throw oauthError
  }
  
  // Formato do número de telefone para MCX Express
  // A API espera apenas os 9 dígitos (sem código do país, sem espaços)
  // Exemplo: "923456789" (não "+244923456789" ou "923 456 789")
  let phoneNumber = mobileNumber.replace(/\s/g, '').replace(/^\+244/, '').replace(/^244/, '').replace(/\D/g, '')
  
  // Validar formato angolano (9 dígitos começando com 9)
  if (!/^9\d{8}$/.test(phoneNumber)) {
    console.error('❌ Formato de telefone inválido:', { 
      original: mobileNumber, 
      cleaned: phoneNumber,
      expected: '9 dígitos começando com 9 (ex: 923456789)'
    })
    const error: any = new Error('MCX_BAD_REQUEST')
    error.technical_details = {
      method: 'mcx',
      error_type: 'invalid_phone_format',
      original_phone: mobileNumber,
      cleaned_phone: phoneNumber,
      expected_format: '9 dígitos começando com 9'
    }
    throw error
  }
  
  console.log('📱 Número de telefone formatado:', {
    original: mobileNumber,
    formatted: phoneNumber
  })
  
  // Payload conforme documentação oficial v2.5 - Gateway de Pagamentos Online (GPO)
  // Formato: { amount, currency, description, merchantTransactionId, paymentMethod, paymentInfo, options }
  const body = {
    amount: amount,
    currency: "AOA",
    description: "Créditos SMS AO",
    merchantTransactionId: referenceCode, // ID único da transação
    paymentMethod: `GPO_${paymentMethodId}`, // Formato: GPO_{paymentMethodId}
    paymentInfo: {
      phoneNumber: phoneNumber // Número sem código do país (9 dígitos: 9XXXXXXXX)
    },
    options: {
      MerchantIdentifier: merchantNumber, // Nº conta do comerciante
      ApiKey: apiKey || paymentMethodId // Chave API AppyPay para autenticar comerciante
    }
  }
  
  console.log('📦 Payload MCX completo:', {
    amount: body.amount,
    currency: body.currency,
    merchantTransactionId: body.merchantTransactionId,
    paymentMethod: body.paymentMethod,
    paymentInfo: { phoneNumber: phoneNumber.substring(0, 3) + '***' + phoneNumber.slice(-2) },
    options: {
      MerchantIdentifier: body.options.MerchantIdentifier,
      ApiKey: (body.options.ApiKey || '').substring(0, 8) + '***'
    }
  })
  
  // Tentar endpoints: primeiro v2.0/charges (conforme doc), depois /api/v1/GPO (fallback)
  const endpoints = [
    `${baseUrl}/v2.0/charges`, // Endpoint conforme documentação oficial
    `${baseUrl}/api/v1/GPO` // Endpoint alternativo (fallback)
  ]
  
  console.log('📤 Request payload:', {
    method: 'POST',
    hasToken: !!accessToken,
    endpoints: endpoints,
    body: { 
      ...body, 
      paymentInfo: { phoneNumber: phoneNumber.substring(0, 4) + '***' },
      options: { ...body.options, ApiKey: (apiKey || paymentMethodId).substring(0, 8) + '***' }
    }
  })
  
  // Tentar ambos os endpoints (v2.0/charges primeiro, depois /api/v1/GPO como fallback)
  let lastError: any = null
  
  for (const url of endpoints) {
    console.log(`🔍 Tentando endpoint: ${url}`)
    
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000) // 20s timeout
      
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
      
      console.log(`📥 Response status: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        let errorText: string
        try {
          errorText = await response.text()
        } catch (textError) {
          errorText = `Erro ao ler resposta: ${textError instanceof Error ? textError.message : String(textError)}`
        }
        
        console.error(`❌ MCX API Error (${response.status}) em ${url}:`, errorText.substring(0, 500))
        
        // Se 404, tentar próximo endpoint
        if (response.status === 404 && endpoints.indexOf(url) < endpoints.length - 1) {
          console.log(`⏭️ Endpoint ${url} retornou 404, tentando próximo...`)
          lastError = { url, status: response.status, error: errorText }
          continue
        }
        
        // Tentar fazer parse do erro como JSON para obter mais detalhes
        let errorData: any = null
        try {
          if (errorText && errorText.trim().startsWith('{')) {
            errorData = JSON.parse(errorText)
            console.log('📋 Error response parsed:', errorData)
          }
        } catch (parseErr) {
          // Não é JSON, usar texto como está
        }
        
        // Mapear erros HTTP para códigos específicos
        let errorCode = 'MCX_API_ERROR'
        if (response.status === 401) {
          errorCode = 'MCX_UNAUTHORIZED'
        } else if (response.status === 404) {
          errorCode = 'MCX_ENDPOINT_NOT_FOUND'
        } else if (response.status === 400) {
          errorCode = 'MCX_BAD_REQUEST'
        } else if (response.status >= 500) {
          errorCode = 'MCX_SERVER_ERROR'
        }
        
        const error: any = new Error(errorCode)
        error.technical_details = {
          method: 'mcx',
          http_status: response.status,
          http_status_text: response.statusText,
          error_body: errorText.substring(0, 1000),
          error_data: errorData,
          url,
          request_body: { 
            ...body, 
            paymentInfo: { phoneNumber: phoneNumber.substring(0, 4) + '***' },
            options: { ...body.options, ApiKey: '[REDACTED]' }
          }
        }
        throw error
      }
      
      // Tentar fazer parse do JSON
      let data: any
      try {
        const responseText = await response.text()
        console.log('📥 Response body (first 500 chars):', responseText.substring(0, 500))
        
        if (!responseText || responseText.trim() === '') {
          console.error('❌ Response body está vazio')
          throw new Error('MCX_API_ERROR: Response body is empty')
        }
        
        data = JSON.parse(responseText)
        console.log('✅ === MCX EXPRESS PAYMENT CRIADO COM SUCESSO! ===')
        console.log(`🎉 Endpoint que funcionou: ${url}`)
        console.log('📊 Response keys:', Object.keys(data))
        console.log('📊 Response data completo:', JSON.stringify(data, null, 2))
        console.log('🎉 Código MCX:', data.Code || data.code || data.ekwanzaTransactionId || data.merchantTransactionId || 'N/A')
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do JSON:', parseError)
        const parseErr: any = new Error('MCX_API_ERROR')
        parseErr.technical_details = {
          method: 'mcx',
          error_type: 'json_parse_error',
          parse_error: parseError instanceof Error ? parseError.message : String(parseError),
          url,
          response_status: response.status
        }
        throw parseErr
      }
      
      // Normalizar resposta (pode vir em formatos diferentes da API v2.5)
      // A resposta pode ter diferentes estruturas dependendo do endpoint
      const normalizedResponse = {
        Code: data.Code || data.code || data.ekwanzaTransactionId || data.merchantTransactionId || null,
        OperationCode: data.OperationCode || data.operationCode || data.ekzOperationCode || data.operationCode || null,
        Message: data.Message || data.message || data.statusMessage || 'Pagamento criado com sucesso',
        ExpirationDate: data.ExpirationDate || data.expirationDate || data.expiresAt || null,
        // Campos adicionais que podem vir na resposta
        ReferenceNumber: data.ReferenceNumber || data.referenceNumber || null,
        Status: data.Status || data.status || null
      }
      
      console.log('🔄 Resposta normalizada:', normalizedResponse)
      
      return normalizedResponse
      
    } catch (error) {
      // Se não é erro de rede, re-throw imediatamente
      if (error instanceof Error && !error.message.includes('MCX_')) {
        // Erros de rede/DNS - tentar próximo endpoint
        if (error.message.includes('fetch') || 
            error.message.includes('dns') || 
            error.message.includes('ENOTFOUND') ||
            error.message.includes('ECONN') ||
            error.name === 'AbortError') {
          console.log(`⚠️ Erro ao conectar com ${url}, tentando próximo endpoint...`)
          lastError = { url, error: error.message }
          continue
        }
      }
      
      // Re-throw outros erros
      throw error
    }
  }
  
  // Se chegou aqui, todos os endpoints falharam
  console.error('❌ === TODOS OS ENDPOINTS MCX FALHARAM ===')
  const finalError: any = new Error('MCX_ENDPOINT_NOT_FOUND')
  finalError.technical_details = {
    method: 'mcx',
    endpoints_tried: endpoints,
    last_error: lastError
  }
  throw finalError
}

// Helper: Create Referência EMIS payment
// Conforme documentação oficial v2.5: Pagamento por Referência
async function createReferenciaPayment(
  amount: number,
  referenceCode: string
): Promise<any> {
  console.log('🎯 === REFERÊNCIA EMIS PAYMENT ===')
  
  const baseUrl = Deno.env.get('EKWANZA_BASE_URL') || 'https://ekz-partnersapi.e-kwanza.ao'
  const merchantNumber = Deno.env.get('EKWANZA_MERCHANT_NUMBER')
  const paymentMethodId = Deno.env.get('EKWANZA_REF_PAYMENT_METHOD')
  const apiKey = Deno.env.get('EKWANZA_REF_API_KEY') || paymentMethodId // ApiKey REF
  
  // Validação de configuração obrigatória
  if (!merchantNumber || !paymentMethodId) {
    const error: any = new Error('REF_CONFIG_MISSING')
    error.technical_details = {
      method: 'referencia',
      missing_config: {
        merchantNumber: !merchantNumber,
        paymentMethodId: !paymentMethodId
      }
    }
    throw error
  }
  
  console.log('📋 Configuração Referência:', {
    baseUrl,
    amount,
    referenceCode,
    merchantNumber,
    paymentMethodId: paymentMethodId.substring(0, 8) + '***',
    hasApiKey: !!apiKey
  })
  
  // Get OAuth2 token
  console.log('🔐 Obtendo OAuth2 token...')
  let accessToken: string
  try {
    accessToken = await getOAuth2Token()
    console.log('✅ OAuth2 token obtido com sucesso')
  } catch (error) {
    console.error('❌ Falha ao obter OAuth2 token:', error)
    const oauthError: any = new Error('REF_OAUTH_FAILED')
    oauthError.technical_details = {
      method: 'referencia',
      oauth_error: error instanceof Error ? error.message : String(error)
    }
    throw oauthError
  }
  
  // Payload conforme documentação oficial v2.5 - Pagamento por Referência
  // Formato: { amount, currency, description, merchantTransactionId, paymentMethod, options }
  const body = {
    amount: amount,
    currency: "AOA",
    description: "Créditos SMS AO",
    merchantTransactionId: referenceCode, // ID único da transação
    paymentMethod: `REF_${paymentMethodId}`, // Formato: REF_{paymentMethodId}
    options: {
      MerchantIdentifier: merchantNumber, // Nº conta do comerciante
      ApiKey: apiKey || paymentMethodId // Chave API AppyPay para autenticar comerciante
    }
  }
  
  // Tentar endpoints: primeiro v2.0/charges (conforme doc), depois /api/v1/REF (fallback)
  const endpoints = [
    `${baseUrl}/v2.0/charges`, // Endpoint conforme documentação oficial
    `${baseUrl}/api/v1/REF` // Endpoint alternativo (fallback)
  ]
  
  console.log('📤 Request payload:', {
    method: 'POST',
    hasToken: !!accessToken,
    endpoints: endpoints,
    body: { 
      ...body, 
      options: { ...body.options, ApiKey: (apiKey || paymentMethodId).substring(0, 8) + '***' }
    }
  })
  
  // Tentar ambos os endpoints (v2.0/charges primeiro, depois /api/v1/REF como fallback)
  let lastError: any = null
  
  for (const url of endpoints) {
    console.log(`🔍 Tentando endpoint: ${url}`)
    
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000) // 20s timeout
      
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
      
      console.log(`📥 Response status: ${response.status} ${response.statusText}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ REF API Error (${response.status}) em ${url}:`, errorText.substring(0, 500))
        
        // Se 404, tentar próximo endpoint
        if (response.status === 404 && endpoints.indexOf(url) < endpoints.length - 1) {
          console.log(`⏭️ Endpoint ${url} retornou 404, tentando próximo...`)
          lastError = { url, status: response.status, error: errorText }
          continue
        }
        
        // Mapear erros HTTP para códigos específicos
        let errorCode = 'REF_API_ERROR'
        if (response.status === 401) {
          errorCode = 'REF_UNAUTHORIZED'
        } else if (response.status === 404) {
          errorCode = 'REF_ENDPOINT_NOT_FOUND'
        } else if (response.status === 400) {
          errorCode = 'REF_BAD_REQUEST'
        } else if (response.status >= 500) {
          errorCode = 'REF_SERVER_ERROR'
        }
        
        const error: any = new Error(errorCode)
        error.technical_details = {
          method: 'referencia',
          http_status: response.status,
          http_status_text: response.statusText,
          error_body: errorText.substring(0, 1000),
          url,
          request_body: { 
            ...body, 
            options: { ...body.options, ApiKey: '[REDACTED]' }
          }
        }
        throw error
      }
      
      const data = await response.json()
      console.log('✅ === REFERÊNCIA EMIS PAYMENT CRIADO COM SUCESSO! ===')
      console.log(`🎉 Endpoint que funcionou: ${url}`)
      console.log('📊 Response keys:', Object.keys(data))
      console.log('🎉 Código REF:', data.Code || data.code || data.referenceNumber || 'N/A')
      
      // Normalizar resposta (pode vir em formatos diferentes)
      return {
        Code: data.Code || data.code || data.referenceNumber,
        OperationCode: data.OperationCode || data.operationCode || data.ekzOperationCode,
        ReferenceNumber: data.ReferenceNumber || data.referenceNumber,
        Message: data.Message || data.message || 'Referência criada com sucesso',
        ExpirationDate: data.ExpirationDate || data.expirationDate
      }
      
    } catch (error) {
      // Se não é erro de rede, re-throw imediatamente
      if (error instanceof Error && !error.message.includes('REF_')) {
        // Erros de rede/DNS - tentar próximo endpoint
        if (error.message.includes('fetch') || 
            error.message.includes('dns') || 
            error.message.includes('ENOTFOUND') ||
            error.message.includes('ECONN') ||
            error.name === 'AbortError') {
          console.log(`⚠️ Erro ao conectar com ${url}, tentando próximo endpoint...`)
          lastError = { url, error: error.message }
          continue
        }
      }
      
      // Re-throw outros erros
      throw error
    }
  }
  
  // Se chegou aqui, todos os endpoints falharam
  console.error('❌ === TODOS OS ENDPOINTS REF FALHARAM ===')
  const finalError: any = new Error('REF_ENDPOINT_NOT_FOUND')
  finalError.technical_details = {
    method: 'referencia',
    endpoints_tried: endpoints,
    last_error: lastError
  }
  throw finalError
}
