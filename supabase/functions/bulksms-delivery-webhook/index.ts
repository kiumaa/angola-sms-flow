import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkSMSDeliveryReport {
  message_id?: string
  batch_id?: string
  to?: string
  status?: string
  error_code?: string | null
  completed_at?: string
  payload?: any
  // Legacy EAPI format support
  id?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('BulkSMS delivery webhook received')

    const deliveryReport: BulkSMSDeliveryReport = await req.json()
    console.log('Delivery report data:', JSON.stringify(deliveryReport, null, 2))

    // Support both API v1 and Legacy EAPI formats
    const messageId = deliveryReport.message_id || deliveryReport.batch_id || deliveryReport.id
    
    if (!messageId) {
      console.error('Missing message ID in delivery report')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing message ID or batch ID in delivery report' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Map BulkSMS status to our internal status
    let internalStatus = 'pending'
    const statusType = deliveryReport.status?.toLowerCase() || 'unknown'
    
    switch (statusType) {
      case 'submitted':
      case 'sent':
      case 'accepted':
        internalStatus = 'sent'
        break
      case 'delivered':
        internalStatus = 'delivered'
        break
      case 'failed':
      case 'rejected':
      case 'expired':
        internalStatus = 'failed'
        break
      default:
        internalStatus = statusType
    }

    console.log(`Processing delivery report for message ID: ${messageId}, status: ${statusType} -> ${internalStatus}`)

    const deliveredAt = internalStatus === 'delivered' ? new Date().toISOString() : null

    // Upsert into sms_logs table (original functionality)
    const { data, error } = await supabase
      .from('sms_logs')
      .upsert({
        gateway_message_id: messageId,
        gateway_used: 'bulksms',
        phone_number: deliveryReport.to || '',
        message: 'Delivery report update',
        status: internalStatus,
        error_code: deliveryReport.error_code,
        completed_at: deliveryReport.completed_at ? new Date(deliveryReport.completed_at).toISOString() : null,
        payload: deliveryReport,
        delivered_at: deliveredAt,
        updated_at: new Date().toISOString(),
        user_id: '00000000-0000-0000-0000-000000000000' // Default system user for webhook updates
      }, {
        onConflict: 'gateway_message_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error upserting SMS log:', error)
      // Try to update existing record if upsert failed
      const { error: updateError } = await supabase
        .from('sms_logs')
        .update({
          status: internalStatus,
          error_code: deliveryReport.error_code,
          completed_at: deliveryReport.completed_at ? new Date(deliveryReport.completed_at).toISOString() : null,
          payload: deliveryReport,
          delivered_at: deliveredAt,
          updated_at: new Date().toISOString()
        })
        .eq('gateway_message_id', messageId)
        .eq('gateway_used', 'bulksms')

      if (updateError) {
        console.error('Error updating SMS log:', updateError)
        throw updateError
      }
    }

    // Also update campaign targets if this is a campaign SMS (new functionality)
    const { data: targetData, error: targetError } = await supabase
      .from('campaign_targets')
      .update({
        status: internalStatus,
        delivered_at: deliveredAt,
        error_code: internalStatus === 'failed' ? deliveryReport.error_code : null,
        error_detail: internalStatus === 'failed' ? deliveryReport.status : null
      })
      .eq('bulksms_message_id', messageId)
      .select('campaign_id')

    if (targetError) {
      console.error('Error updating campaign target:', targetError)
      // Don't throw - this is not critical for SMS logs
    } else if (targetData && targetData.length > 0) {
      const campaign_id = targetData[0].campaign_id
      console.log(`Updated campaign target for campaign ${campaign_id}`)
      
      // Update campaign stats
      try {
        await supabase.rpc('update_campaign_stats', { _campaign_id: campaign_id })
        console.log(`Updated stats for campaign ${campaign_id}`)
      } catch (statsError) {
        console.warn('Failed to update campaign stats:', statsError)
      }
    }

    console.log(`Successfully processed delivery report for message ID: ${messageId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Delivery report processed successfully',
        message_id: messageId,
        status: internalStatus
      }),
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
        error: error.message || 'Unknown error processing delivery report'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})