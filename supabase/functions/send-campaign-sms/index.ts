import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SENDER ID UTILITIES - MANDATO SMSAO
const DEFAULT_SENDER_ID = 'SMSAO';
const DEPRECATED_SENDER_IDS = ['ONSMS', 'SMS'];

function resolveSenderId(input?: string | null): string {
  if (!input || input.trim() === '') return DEFAULT_SENDER_ID;
  const normalized = input.trim().toUpperCase();
  if (DEPRECATED_SENDER_IDS.includes(normalized)) {
    console.warn(`Sender ID depreciado detectado: ${input} → substituído por ${DEFAULT_SENDER_ID}`);
    return DEFAULT_SENDER_ID;
  }
  if (!normalized.match(/^[A-Za-z0-9]{1,11}$/)) {
    console.warn(`Sender ID inválido detectado: ${input} → substituído por ${DEFAULT_SENDER_ID}`);
    return DEFAULT_SENDER_ID;
  }
  return normalized;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get campaign targets that are queued
    const { data: targets, error: targetsError } = await supabaseClient
      .from('campaign_targets')
      .select(`
        *,
        campaigns (
          id,
          name,
          message_template,
          sender_id,
          account_id
        )
      `)
      .eq('status', 'queued')
      .limit(100) // Process 100 at a time

    if (targetsError) {
      throw new Error(`Failed to fetch targets: ${targetsError.message}`)
    }

    if (!targets || targets.length === 0) {
      console.log('No queued targets found')
      return new Response(
        JSON.stringify({ message: 'No queued targets', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processed = 0
    const batchSize = 10
    
    // Process targets in batches
    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (target) => {
        try {
          // Update target status to sending
          await supabaseClient
            .from('campaign_targets')
            .update({ 
              status: 'sending',
              last_attempt_at: new Date().toISOString()
            })
            .eq('id', target.id)

          // Render message with variables
          let renderedMessage = target.campaigns.message_template
          
          // Basic variable substitution (can be enhanced)
          // Replace {nome}, {phone}, etc. with actual contact data
          if (target.contact_id) {
            // You could fetch contact data here and replace variables
            renderedMessage = renderedMessage.replace('{nome}', 'Cliente')
          }

          // Send SMS via BulkSMS com sender ID normalizado
          const normalizedSenderId = resolveSenderId(target.campaigns.sender_id);
          console.log(`Campaign ${target.campaigns.id} usando sender ID: "${target.campaigns.sender_id}" → "${normalizedSenderId}"`);
          
          const smsResult = await supabaseClient.functions.invoke('send-sms-bulksms', {
            body: {
              to: target.phone_e164,
              message: renderedMessage,
              sender_id: normalizedSenderId
            }
          })

          if (smsResult.error) {
            throw new Error(`SMS sending failed: ${smsResult.error.message}`)
          }

          // Update target with success
          await supabaseClient
            .from('campaign_targets')
            .update({ 
              status: 'sent',
              sent_at: new Date().toISOString(),
              rendered_message: renderedMessage,
              cost_credits: target.segments,
              bulksms_message_id: smsResult.data?.message_id || null
            })
            .eq('id', target.id)

          // Update campaign stats
          await supabaseClient.rpc('update_campaign_stats', {
            _campaign_id: target.campaign_id
          })

          processed++
          console.log(`Successfully sent SMS for target ${target.id}`)

        } catch (error) {
          console.error(`Failed to send SMS for target ${target.id}:`, error)
          
          // Update target with failure
          await supabaseClient
            .from('campaign_targets')
            .update({ 
              status: 'failed',
              error_detail: error.message,
              tries: (target.tries || 0) + 1
            })
            .eq('id', target.id)
        }
      }))

      // Small delay between batches to avoid overwhelming the SMS gateway
      if (i + batchSize < targets.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log(`Campaign worker processed ${processed} targets`)

    return new Response(
      JSON.stringify({ 
        message: 'Campaign targets processed',
        processed,
        total: targets.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Campaign worker error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})