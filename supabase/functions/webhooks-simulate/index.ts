import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SimulateWebhookRequest {
  to: string
  message_id?: string
  status: 'Delivered' | 'Failed' | 'Submitted'
  completed_at?: string
  error_code?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow in development/staging
    const environment = Deno.env.get('ENVIRONMENT') || 'development'
    if (environment === 'production') {
      return new Response(
        JSON.stringify({ success: false, error: 'Simulator not available in production' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403,
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Webhook simulator request received')

    const request: SimulateWebhookRequest = await req.json()
    console.log('Simulation request:', JSON.stringify(request, null, 2))

    if (!request.to) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number (to) is required' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Create mock delivery report
    const messageId = request.message_id || `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()
    
    const mockDeliveryReport = {
      message_id: messageId,
      batch_id: messageId,
      to: request.to,
      status: request.status || 'Delivered',
      error_code: request.error_code || null,
      completed_at: request.completed_at || now,
      payload: {
        simulated: true,
        timestamp: now,
        simulator_version: '1.0'
      }
    }

    console.log('Generated mock delivery report:', JSON.stringify(mockDeliveryReport, null, 2))

    // Create a sample SMS log entry first (if it doesn't exist)
    const { data: existingLog } = await supabase
      .from('sms_logs')
      .select('id')
      .eq('gateway_message_id', messageId)
      .single()

    if (!existingLog) {
      const { error: insertError } = await supabase
        .from('sms_logs')
        .insert({
          gateway_message_id: messageId,
          gateway_used: 'bulksms',
          phone_number: request.to,
          message: 'Simulated SMS message for testing webhook delivery',
          status: 'sent',
          user_id: '00000000-0000-0000-0000-000000000000', // System user
          created_at: now
        })

      if (insertError) {
        console.error('Error creating sample SMS log:', insertError)
      } else {
        console.log('Created sample SMS log for simulation')
      }
    }

    // Now simulate the webhook by calling our delivery webhook function
    const deliveryWebhookUrl = `${supabaseUrl}/functions/v1/bulksms-delivery-webhook`
    const response = await fetch(deliveryWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify(mockDeliveryReport)
    })

    const webhookResult = await response.json()
    
    if (!response.ok) {
      throw new Error(`Webhook call failed: ${webhookResult.error}`)
    }

    console.log('Webhook simulation completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook simulation completed',
        simulation: {
          message_id: messageId,
          phone_number: request.to,
          status: request.status,
          webhook_response: webhookResult
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook simulator error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in webhook simulation'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})