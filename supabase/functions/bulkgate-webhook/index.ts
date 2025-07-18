import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const webhook = await req.json()
    console.log('BulkGate webhook received:', webhook)

    // BulkGate webhook format example:
    // {
    //   id: "message_id",
    //   status: "delivered" | "sent" | "failed" | "rejected",
    //   delivered_at: "2024-01-01T12:00:00Z",
    //   error: "error_message_if_failed"
    // }

    const messageId = webhook.id
    const status = webhook.status
    const deliveredAt = webhook.delivered_at
    const error = webhook.error

    if (!messageId) {
      console.log('No message ID in webhook')
      return new Response('OK', { status: 200 })
    }

    // Map BulkGate status to our internal status
    let mappedStatus = 'pending'
    if (status === 'sent') mappedStatus = 'sent'
    else if (status === 'delivered') mappedStatus = 'delivered'
    else if (status === 'failed' || status === 'rejected') mappedStatus = 'failed'

    // Update SMS log with delivery status
    const updateData: any = {
      status: mappedStatus,
      updated_at: new Date().toISOString()
    }

    if (deliveredAt) {
      updateData.delivered_at = deliveredAt
    }

    if (error && mappedStatus === 'failed') {
      updateData.error_message = error
    }

    const { data, error: dbError } = await supabase
      .from('sms_logs')
      .update(updateData)
      .eq('gateway_message_id', messageId)
      .eq('gateway_used', 'bulkgate')

    if (dbError) {
      console.error('Error updating SMS log:', dbError)
    } else {
      console.log(`Updated SMS log for message ${messageId} with status ${mappedStatus}`)
    }

    return new Response('OK', { status: 200 })

  } catch (error) {
    console.error('Error processing BulkGate webhook:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
})