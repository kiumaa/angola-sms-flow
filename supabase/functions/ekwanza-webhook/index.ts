import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
}

interface EkwanzaWebhookPayload {
  code: string
  operationCode: string
  status: string
  amount: number
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get signature from header
    const receivedSignature = req.headers.get('x-signature')
    if (!receivedSignature) {
      console.error('SECURITY ALERT: Missing signature header')
      return new Response('Missing signature', { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse webhook payload
    const body: EkwanzaWebhookPayload = await req.json()
    console.log('Received É-kwanza webhook:', { 
      code: body.code,
      operationCode: body.operationCode,
      status: body.status,
      amount: body.amount
    })

    // Validate HMAC-SHA256 signature
    const isValid = await validateSignature(
      body.code,
      body.operationCode,
      receivedSignature
    )

    if (!isValid) {
      const ip = req.headers.get('x-forwarded-for') || 'unknown'
      console.error('SECURITY ALERT: Invalid É-kwanza signature', {
        ip,
        code: body.code,
        timestamp: new Date().toISOString()
      })
      
      // Log security incident
      await supabase.from('admin_audit_logs').insert({
        admin_id: '00000000-0000-0000-0000-000000000000',
        action: 'ekwanza_invalid_signature',
        details: { 
          code: body.code,
          ip_address: ip,
          operation_code: body.operationCode
        }
      })
      
      return new Response('Invalid signature', { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Signature validated successfully')

    // Find payment by ekwanza_code or reference_code
    let { data: payment, error: paymentError } = await supabase
      .from('ekwanza_payments')
      .select(`
        *,
        transactions (
          id,
          user_id,
          credits_purchased,
          amount_kwanza
        )
      `)
      .eq('ekwanza_code', body.code)
      .single()

    // If not found by ekwanza_code, try reference_code
    if (paymentError || !payment) {
      const { data: paymentByRef } = await supabase
        .from('ekwanza_payments')
        .select(`
          *,
          transactions (
            id,
            user_id,
            credits_purchased,
            amount_kwanza
          )
        `)
        .eq('reference_code', body.code)
        .single()
      
      payment = paymentByRef
    }

    if (!payment) {
      console.error('Payment not found for code:', body.code)
      return new Response(JSON.stringify({ 
        status: "1",
        error: "Payment not found"
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Found payment:', payment.id)

    // Check idempotency - if already processed, return success
    if (payment.status === 'paid') {
      console.log('Payment already processed (idempotent):', payment.id)
      return new Response(JSON.stringify({ status: "0" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate amount matches
    const expectedAmount = parseFloat(payment.amount.toString())
    const receivedAmount = parseFloat(body.amount.toString())
    
    if (Math.abs(expectedAmount - receivedAmount) > 0.01) {
      console.error('Amount mismatch:', {
        expected: expectedAmount,
        received: receivedAmount,
        payment_id: payment.id
      })
      
      await supabase.from('admin_audit_logs').insert({
        admin_id: '00000000-0000-0000-0000-000000000000',
        action: 'ekwanza_amount_mismatch',
        details: { 
          payment_id: payment.id,
          expected: expectedAmount,
          received: receivedAmount
        }
      })
      
      return new Response(JSON.stringify({ 
        status: "1",
        error: "Amount mismatch" 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Processing payment confirmation...')

    // Update ekwanza_payments
    const { error: updatePaymentError } = await supabase
      .from('ekwanza_payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        callback_received_at: new Date().toISOString(),
        raw_callback: body
      })
      .eq('id', payment.id)

    if (updatePaymentError) {
      console.error('Error updating payment:', updatePaymentError)
      throw updatePaymentError
    }

    // Update transaction
    const { error: updateTransactionError } = await supabase
      .from('transactions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.transaction_id)

    if (updateTransactionError) {
      console.error('Error updating transaction:', updateTransactionError)
      throw updateTransactionError
    }

    // Add credits to user
    const transaction = Array.isArray(payment.transactions) 
      ? payment.transactions[0] 
      : payment.transactions

    const { error: creditError } = await supabase.rpc('add_user_credits', {
      user_id: transaction.user_id,
      credit_amount: transaction.credits_purchased
    })

    if (creditError) {
      console.error('Error adding credits:', creditError)
      
      // Log for manual review but don't fail the webhook
      await supabase.from('admin_audit_logs').insert({
        admin_id: '00000000-0000-0000-0000-000000000000',
        action: 'ekwanza_credit_add_failed',
        details: { 
          payment_id: payment.id,
          user_id: transaction.user_id,
          credits: transaction.credits_purchased,
          error: creditError.message
        }
      })
    } else {
      console.log(`✅ Added ${transaction.credits_purchased} credits to user ${transaction.user_id}`)
    }

    // Log successful payment confirmation
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    await supabase.from('admin_audit_logs').insert({
      admin_id: '00000000-0000-0000-0000-000000000000',
      action: 'ekwanza_payment_confirmed',
      target_user_id: transaction.user_id,
      details: {
        payment_id: payment.id,
        transaction_id: payment.transaction_id,
        amount: payment.amount,
        credits: transaction.credits_purchased,
        payment_method: payment.payment_method,
        ekwanza_code: body.code,
        operation_code: body.operationCode
      },
      ip_address: ip
    })

    console.log('✅ Payment processed successfully')

    // Return success to É-kwanza
    return new Response(JSON.stringify({ status: "0" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Webhook processing error'
    
    return new Response(JSON.stringify({ 
      status: "1",
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Validate HMAC-SHA256 signature
async function validateSignature(
  code: string,
  operationCode: string,
  receivedSignature: string
): Promise<boolean> {
  try {
    const merchantNumber = Deno.env.get('EKWANZA_MERCHANT_NUMBER')
    const notificationToken = Deno.env.get('EKWANZA_NOTIFICATION_TOKEN')
    const apiKey = Deno.env.get('EKWANZA_API_KEY')
    
    if (!merchantNumber || !notificationToken || !apiKey) {
      console.error('Missing É-kwanza credentials')
      return false
    }
    
    // Construct message as per É-kwanza documentation
    const message = code + operationCode + merchantNumber + notificationToken
    
    console.log('Validating signature for message length:', message.length)
    
    // Generate HMAC-SHA256
    const encoder = new TextEncoder()
    const keyData = encoder.encode(apiKey)
    const messageData = encoder.encode(message)
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    const hashArray = Array.from(new Uint8Array(signature))
    const hashHex = hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    const isValid = hashHex.toLowerCase() === receivedSignature.toLowerCase()
    
    if (!isValid) {
      console.log('Signature mismatch:', {
        expected: hashHex.substring(0, 20) + '...',
        received: receivedSignature.substring(0, 20) + '...'
      })
    }
    
    return isValid
    
  } catch (error) {
    console.error('Signature validation error:', error)
    return false
  }
}
