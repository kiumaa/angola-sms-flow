import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeliveryReport {
  id: string
  phoneNumber: string
  networkCode: string
  status: string
  cost: string
  messageId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const reports: DeliveryReport[] = await req.json()
    
    console.log('Received delivery reports:', reports)

    // Process each delivery report
    for (const report of reports) {
      const status = mapAfricasTalkingStatus(report.status)
      
      // Update SMS log with delivery status
      const { error } = await supabase
        .from('sms_logs')
        .update({
          status: status,
          delivered_at: status === 'delivered' ? new Date().toISOString() : null,
          error_message: status === 'failed' ? report.status : null
        })
        .eq('gateway_message_id', report.messageId)

      if (error) {
        console.error('Error updating SMS log:', error)
      } else {
        console.log(`Updated SMS log for messageId: ${report.messageId}, status: ${status}`)
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: reports.length }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
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

function mapAfricasTalkingStatus(atStatus: string): string {
  switch (atStatus.toLowerCase()) {
    case 'success':
    case 'sent':
      return 'sent'
    case 'delivered':
      return 'delivered'
    case 'failed':
    case 'rejected':
    case 'unknown':
      return 'failed'
    default:
      return 'pending'
  }
}