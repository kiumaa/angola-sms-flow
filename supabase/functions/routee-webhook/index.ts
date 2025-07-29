import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RouteeWebhookPayload {
  trackingId: string
  to: string
  from: string
  status: string
  timestamp: string
  errorCode?: string
  errorDescription?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse webhook payload
    const payload: RouteeWebhookPayload = await req.json()
    
    console.log('Received Routee webhook:', payload)

    // Map Routee status to our internal status
    const mapStatus = (routeeStatus: string): string => {
      switch (routeeStatus.toLowerCase()) {
        case 'delivered':
          return 'delivered'
        case 'failed':
        case 'expired':
        case 'rejected':
          return 'failed'
        case 'sent':
        case 'queued':
          return 'sent'
        default:
          return 'pending'
      }
    }

    const internalStatus = mapStatus(payload.status)
    
    // Update SMS log with delivery status
    const { error: updateError } = await supabase
      .from('sms_logs')
      .update({
        status: internalStatus,
        delivered_at: payload.status.toLowerCase() === 'delivered' ? new Date(payload.timestamp).toISOString() : null,
        error_message: payload.errorDescription || null
      })
      .eq('gateway_message_id', payload.trackingId)
      .eq('gateway_used', 'routee')

    if (updateError) {
      console.error('Error updating SMS log:', updateError)
      throw updateError
    }

    console.log(`Updated SMS log for trackingId: ${payload.trackingId}, status: ${internalStatus}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        trackingId: payload.trackingId,
        status: internalStatus
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Routee webhook error:', error)
    
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