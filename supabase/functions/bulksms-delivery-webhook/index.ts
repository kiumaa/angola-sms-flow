import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeliveryReport {
  batch_id: string
  message_id: string
  msisdn: string
  status: string
  submitted_at: string
  completed_at?: string
  error?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('BulkSMS delivery webhook received')

    const deliveryReport: DeliveryReport = await req.json()
    console.log('Delivery report data:', deliveryReport)

    const { batch_id, message_id, status, completed_at, error } = deliveryReport

    if (!batch_id) {
      throw new Error('Missing batch_id in delivery report')
    }

    // Map BulkSMS status to our internal status
    let internalStatus = 'sent'
    if (status === 'Delivered') {
      internalStatus = 'delivered'
    } else if (status === 'Failed' || error) {
      internalStatus = 'failed'
    }

    // Update SMS logs with delivery status
    const { data, error: updateError } = await supabase
      .from('sms_logs')
      .update({
        status: internalStatus,
        gateway_message_id: message_id,
        delivered_at: completed_at ? new Date(completed_at).toISOString() : null,
        error_message: error || null,
        updated_at: new Date().toISOString()
      })
      .eq('gateway_message_id', batch_id)
      .eq('gateway_used', 'bulksms')

    if (updateError) {
      console.error('Error updating SMS log:', updateError)
      throw updateError
    }

    console.log(`Updated SMS logs for batch_id: ${batch_id}, status: ${internalStatus}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Delivery report processed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('BulkSMS delivery webhook error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})