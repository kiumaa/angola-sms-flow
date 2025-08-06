import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeliveryReport {
  id: string
  status: {
    type: string
    description?: string
  }
  messageId?: string
  batchId?: string
  to?: string
  from?: string
  // Campos de compatibilidade para Legacy EAPI
  batch_id?: string
  message_id?: string
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

    // Support both API v1 and Legacy EAPI formats
    const messageId = deliveryReport.id || deliveryReport.message_id
    const batchId = deliveryReport.batchId || deliveryReport.batch_id || deliveryReport.id
    
    if (!messageId && !batchId) {
      throw new Error('Missing message ID or batch ID in delivery report')
    }

    // Map BulkSMS API v1 status to our internal status
    let internalStatus = 'sent'
    const statusType = deliveryReport.status?.type?.toLowerCase() || deliveryReport.status
    
    switch (statusType) {
      case 'sent':
      case 'accepted':
        internalStatus = 'sent'
        break
      case 'delivered':
        internalStatus = 'delivered'
        break
      case 'failed':
      case 'rejected':
        internalStatus = 'failed'
        break
      default:
        internalStatus = 'pending'
    }

    // Update SMS logs with delivery status
    const { data, error: updateError } = await supabase
      .from('sms_logs')
      .update({
        status: internalStatus,
        delivered_at: internalStatus === 'delivered' ? new Date().toISOString() : null,
        error_message: deliveryReport.status?.description || null,
        updated_at: new Date().toISOString()
      })
      .eq('gateway_message_id', batchId || messageId)
      .eq('gateway_used', 'bulksms')

    if (updateError) {
      console.error('Error updating SMS log:', updateError)
      throw updateError
    }

    console.log(`Updated SMS logs for message ID: ${messageId || batchId}, status: ${internalStatus}`)

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