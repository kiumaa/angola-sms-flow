import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
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

    // Get payment_id from request
    let payment_id: string

    if (req.method === 'POST') {
      const body = await req.json()
      payment_id = body.payment_id
    } else {
      // GET method - extract from URL
      const url = new URL(req.url)
      payment_id = url.pathname.split('/').pop() || ''
    }

    if (!payment_id) {
      return new Response(JSON.stringify({ error: 'Payment ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Checking status for payment:', payment_id)

    // Use service role to get payment details
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('ekwanza_payments')
      .select('*')
      .eq('id', payment_id)
      .eq('user_id', user.id) // Security: only owner can check
      .single()

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError)
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // If already paid, return current status
    if (payment.status === 'paid') {
      console.log('Payment already confirmed:', payment_id)
      return new Response(JSON.stringify({
        status: 'paid',
        paid_at: payment.paid_at,
        credits_added: true,
        amount: payment.amount,
        payment_method: payment.payment_method
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check if expired
    if (payment.expiration_date) {
      const expirationDate = new Date(payment.expiration_date)
      if (expirationDate < new Date()) {
        console.log('Payment expired:', payment_id)
        
        // Update to expired status if not already
        if (payment.status !== 'expired') {
          await supabaseAdmin
            .from('ekwanza_payments')
            .update({ status: 'expired' })
            .eq('id', payment.id)
        }
        
        return new Response(JSON.stringify({
          status: 'expired',
          expiration_date: payment.expiration_date
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Query É-kwanza API for current status
    if (payment.ekwanza_code) {
      try {
        const apiStatus = await checkEkwanzaStatus(payment.ekwanza_code)
        console.log('É-kwanza API status:', apiStatus)
        
        const newStatus = mapEkwanzaStatus(apiStatus.state)
        let paidAtValue = payment.paid_at
        
        // Update status if changed
        if (newStatus !== payment.status) {
          console.log(`Updating payment ${payment.id} from ${payment.status} to ${newStatus}`)
          
          const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString()
          }
          
          if (newStatus === 'paid' && apiStatus.paidAt) {
            updateData.paid_at = apiStatus.paidAt
            paidAtValue = apiStatus.paidAt
          }
          
          await supabaseAdmin
            .from('ekwanza_payments')
            .update(updateData)
            .eq('id', payment.id)
          
          // If newly paid, process payment
          if (newStatus === 'paid') {
            await processPaymentConfirmation(supabaseAdmin, payment)
          }
        }
        
        return new Response(JSON.stringify({
          status: newStatus,
          ekwanza_code: payment.ekwanza_code,
          amount: payment.amount,
          expiration_date: payment.expiration_date,
          created_at: payment.created_at,
          paid_at: paidAtValue,
          payment_method: payment.payment_method
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
        
      } catch (apiError) {
        console.error('Error checking É-kwanza status:', apiError)
        // Return current status from database
      }
    }

    // Return current database status
    return new Response(JSON.stringify({
      status: payment.status,
      ekwanza_code: payment.ekwanza_code,
      reference_number: payment.reference_number,
      amount: payment.amount,
      expiration_date: payment.expiration_date,
      created_at: payment.created_at,
      paid_at: payment.paid_at,
      payment_method: payment.payment_method
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Status check error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Status check failed'
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Get base URL for É-kwanza API
function getBaseUrl(): string {
  const configuredUrl = Deno.env.get('EKWANZA_BASE_URL')
  
  if (configuredUrl) {
    console.log('📍 Using EKWANZA_BASE_URL:', configuredUrl)
    return configuredUrl.replace(/\/$/, '')
  }
  
  // Fallback para domínio oficial É-kwanza (confirmado pela equipa)
  console.log('📍 Using fallback baseUrl: login.microsoftonline.com/auth.appypay.co.ao')
  return 'https://login.microsoftonline.com/auth.appypay.co.ao'
}

// Check payment status via É-kwanza API
async function checkEkwanzaStatus(ekwanzaCode: string): Promise<any> {
  const baseUrl = getBaseUrl()
  const notificationToken = Deno.env.get('EKWANZA_NOTIFICATION_TOKEN')
  
  const url = `${baseUrl}/Ticket/${ekwanzaCode}/State`
  
  console.log('🔍 Checking É-kwanza status:', { ekwanzaCode, url })
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${notificationToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ É-kwanza status API error:', response.status, errorText)
    throw new Error(`É-kwanza status check failed: ${response.status}`)
  }
  
  const data = await response.json()
  return data
}

// Map É-kwanza status to our internal status
function mapEkwanzaStatus(ekwanzaStatus: string): string {
  switch (ekwanzaStatus.toUpperCase()) {
    case 'PAID':
      return 'paid'
    case 'PENDING':
      return 'pending'
    case 'EXPIRED':
      return 'expired'
    case 'CANCELED':
    case 'CANCELLED':
      return 'cancelled'
    default:
      console.warn('Unknown É-kwanza status:', ekwanzaStatus)
      return 'pending'
  }
}

// Process payment confirmation (similar to webhook)
async function processPaymentConfirmation(supabase: any, payment: any): Promise<void> {
  try {
    console.log('Processing payment confirmation for:', payment.id)
    
    // Get transaction details
    const { data: transaction } = await supabase
      .from('transactions')
      .select('user_id, credits_purchased')
      .eq('id', payment.transaction_id)
      .single()
    
    if (!transaction) {
      console.error('Transaction not found:', payment.transaction_id)
      return
    }
    
    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.transaction_id)
    
    // Add credits to user
    const { error: creditError } = await supabase.rpc('add_user_credits', {
      user_id: transaction.user_id,
      credit_amount: transaction.credits_purchased
    })
    
    if (creditError) {
      console.error('Error adding credits:', creditError)
      
      // Log for manual review
      await supabase.from('admin_audit_logs').insert({
        admin_id: null,
        action: 'ekwanza_polling_credit_add_failed',
        details: { 
          payment_id: payment.id,
          user_id: transaction.user_id,
          credits: transaction.credits_purchased,
          error: creditError.message,
          operation_context: 'system'
        }
      })
    } else {
      console.log(`✅ Added ${transaction.credits_purchased} credits via polling`)
      
      // Log successful confirmation via polling
      await supabase.from('admin_audit_logs').insert({
        admin_id: null,
        action: 'ekwanza_polling_confirmed',
        target_user_id: transaction.user_id,
        details: {
          payment_id: payment.id,
          transaction_id: payment.transaction_id,
          credits: transaction.credits_purchased,
          payment_method: payment.payment_method,
          operation_context: 'system'
        }
      })
    }
  } catch (error) {
    console.error('Error processing payment confirmation:', error)
  }
}
