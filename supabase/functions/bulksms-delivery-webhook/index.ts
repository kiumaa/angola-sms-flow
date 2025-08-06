import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeliveryReport {
  id: string
  type: string
  submission: {
    date: string
    to: string
    from: string
  }
  status: {
    type: string
    subtype: string
    description: string
  }
  detail?: {
    message: string
    code: string
  }
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

    const { id: messageId, submission, status, detail } = deliveryReport

    if (!messageId) {
      throw new Error('Missing message ID in delivery report')
    }

    // Map BulkSMS status to our internal status
    let internalStatus = 'sent'
    switch (status.type) {
      case 'DELIVERED':
        internalStatus = 'delivered'
        break
      case 'FAILED':
      case 'REJECTED':
        internalStatus = 'failed'
        break
      default:
        internalStatus = 'sent'
    }

    // Update SMS logs with delivery status
    const { data, error: updateError } = await supabase
      .from('sms_logs')
      .update({
        status: internalStatus,
        delivered_at: internalStatus === 'delivered' ? new Date().toISOString() : null,
        error_message: internalStatus === 'failed' ? (detail?.message || status.description) : null,
        updated_at: new Date().toISOString()
      })
      .eq('gateway_message_id', messageId)
      .eq('gateway_used', 'bulksms')

    if (updateError) {
      console.error('Error updating SMS log:', updateError)
      throw updateError
    }

    console.log(`Updated SMS logs for message_id: ${messageId}, status: ${internalStatus}`)

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