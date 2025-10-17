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
      console.error('❌ É-kwanza API error:', error)
      
      // Extract detailed error info
      const errorDetails: any = {
        message: error instanceof Error ? error.message : 'Unknown error',
        payment_method,
        reference_code
      }
      
      // Check for DNS/network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorDetails.type = 'NETWORK'
        errorDetails.suggestion = 'Verificar configuração do endpoint EKWANZA_BASE_URL'
      } else if (error instanceof TypeError && (error.message.includes('dns') || error.message.includes('lookup'))) {
        errorDetails.type = 'NETWORK'
        errorDetails.suggestion = 'Erro de DNS - verificar endpoint É-kwanza'
      }
      
      console.error('Error details:', errorDetails)
      
      // Rollback transaction
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id)
      
      return new Response(JSON.stringify({ 
        error: errorDetails.type || 'API_ERROR',
        message: 'Falha de conexão com o provedor É-kwanza (DNS/Conectividade)',
        details: errorDetails.message,
        suggestion: errorDetails.suggestion
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

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
        ekwanza_code: ekwanzaResponse.code || null,
        ekwanza_operation_code: ekwanzaResponse.operationCode || null,
        qr_code_base64: ekwanzaResponse.qrCode || null,
        reference_number: ekwanzaResponse.referenceNumber || null,
        status: 'pending',
        expiration_date: ekwanzaResponse.expirationDate || null,
        raw_response: ekwanzaResponse
      })
      .select()
      .single()

    if (paymentError || !payment) {
      console.error('Error saving payment:', paymentError)
      return new Response(JSON.stringify({ error: 'Error saving payment data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

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

// Helper: Get base URL with fallback
function getBaseUrl(): string {
  let baseUrl = Deno.env.get('EKWANZA_BASE_URL')
  
  // Fallback: derive from OAuth URL if base URL is invalid
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
  
  console.log('📍 É-kwanza baseUrl:', baseUrl)
  return baseUrl || 'https://partnersapi.e-kwanza.ao'
}

// Helper: Create QR Code payment via Ticket API
async function createQRCodePayment(
  amount: number,
  referenceCode: string,
  mobileNumber: string
): Promise<any> {
  const baseUrl = getBaseUrl()
  const notificationToken = Deno.env.get('EKWANZA_NOTIFICATION_TOKEN')
  
  const url = `${baseUrl}/Ticket/${notificationToken}?amount=${amount}&referenceCode=${referenceCode}&mobileNumber=${mobileNumber}`
  
  console.log('🎫 Creating QR Code payment:', { amount, referenceCode, mobileNumber, url })
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ QR Code API error:', response.status, errorText)
    throw new Error(`É-kwanza QR Code API error: ${response.status}`)
  }
  
  const data = await response.json()
  console.log('✅ QR Code payment created:', data)
  return data
}

// Helper: Get OAuth2 token
async function getOAuth2Token(): Promise<string> {
  const oauthUrl = Deno.env.get('EKWANZA_OAUTH_URL')
  const clientId = Deno.env.get('EKWANZA_CLIENT_ID')
  const clientSecret = Deno.env.get('EKWANZA_CLIENT_SECRET')
  const resource = Deno.env.get('EKWANZA_RESOURCE')
  
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId!,
    client_secret: clientSecret!,
    resource: resource!
  })
  
  console.log('Requesting OAuth2 token...')
  
  const response = await fetch(oauthUrl!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('OAuth2 error:', response.status, errorText)
    throw new Error(`OAuth2 failed: ${response.status}`)
  }
  
  const data = await response.json()
  console.log('OAuth2 token obtained successfully')
  return data.access_token
}

// Helper: Create Multicaixa Express payment
async function createMCXPayment(
  amount: number,
  referenceCode: string,
  mobileNumber: string
): Promise<any> {
  const baseUrl = getBaseUrl()
  const merchantNumber = Deno.env.get('EKWANZA_MERCHANT_NUMBER')
  const paymentMethodId = Deno.env.get('EKWANZA_GPO_PAYMENT_METHOD')
  
  // Get OAuth2 token
  const accessToken = await getOAuth2Token()
  
  const url = `${baseUrl}/api/v1/GPO`
  const body = {
    paymentMethodId: paymentMethodId,
    amount: amount,
    referenceCode: referenceCode,
    mobileNumber: mobileNumber,
    merchantNumber: merchantNumber,
    description: `Créditos SMS AO`
  }
  
  console.log('💳 Creating MCX payment:', { body, url })
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ MCX API error:', response.status, errorText)
    throw new Error(`É-kwanza MCX API error: ${response.status}`)
  }
  
  const data = await response.json()
  console.log('✅ MCX payment created:', data)
  return data
}

// Helper: Create Referência EMIS payment
async function createReferenciaPayment(
  amount: number,
  referenceCode: string
): Promise<any> {
  const baseUrl = getBaseUrl()
  const merchantNumber = Deno.env.get('EKWANZA_MERCHANT_NUMBER')
  const paymentMethodId = Deno.env.get('EKWANZA_REF_PAYMENT_METHOD')
  
  // Get OAuth2 token
  const accessToken = await getOAuth2Token()
  
  const url = `${baseUrl}/api/v1/REF`
  const body = {
    paymentMethodId: paymentMethodId,
    amount: amount,
    referenceCode: referenceCode,
    merchantNumber: merchantNumber,
    description: `Créditos SMS AO`
  }
  
  console.log('📄 Creating Referência payment:', { body, url })
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ Referência API error:', response.status, errorText)
    throw new Error(`É-kwanza Referência API error: ${response.status}`)
  }
  
  const data = await response.json()
  console.log('✅ Referência payment created:', data)
  return data
}
