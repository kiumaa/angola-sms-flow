import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BulkSMSDeliveryUpdate {
  id: string; // BulkSMS message ID
  status: {
    type: string; // DELIVERED, FAILED, etc.
    subtype?: string;
  };
  submission: {
    date: string;
  };
  relatedSentMessageId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const updates: BulkSMSDeliveryUpdate[] = await req.json()
    console.log(`Received ${updates.length} delivery updates from BulkSMS`)

    for (const update of updates) {
      await processDeliveryUpdate(supabase, update)
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: updates.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processDeliveryUpdate(supabase: any, update: BulkSMSDeliveryUpdate) {
  try {
    console.log(`Processing delivery update for message ${update.id}: ${update.status.type}`)

    // Find the campaign target by BulkSMS message ID
    const { data: targets, error: findError } = await supabase
      .from('campaign_targets')
      .select('id, campaign_id, status')
      .eq('bulksms_message_id', update.id)
      .limit(1)

    if (findError) {
      console.error('Error finding target:', findError)
      return
    }

    if (!targets || targets.length === 0) {
      console.log(`No target found for BulkSMS message ID ${update.id}`)
      return
    }

    const target = targets[0]
    const newStatus = mapBulkSMSStatus(update.status.type)
    
    // Only update if status changed
    if (target.status === newStatus) {
      console.log(`Target ${target.id} already has status ${newStatus}`)
      return
    }

    // Update campaign target status
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (newStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    } else if (newStatus === 'failed') {
      updateData.error_code = update.status.subtype || 'DELIVERY_FAILED'
      updateData.error_detail = `BulkSMS delivery failed: ${update.status.type}`
    }

    const { error: updateError } = await supabase
      .from('campaign_targets')
      .update(updateData)
      .eq('id', target.id)

    if (updateError) {
      console.error(`Error updating target ${target.id}:`, updateError)
      return
    }

    console.log(`Updated target ${target.id} to status ${newStatus}`)

    // Update campaign stats
    await supabase.rpc('update_campaign_stats', { 
      _campaign_id: target.campaign_id 
    })

    // Check if campaign is complete
    await checkCampaignCompletion(supabase, target.campaign_id)

  } catch (error) {
    console.error(`Error processing delivery update for ${update.id}:`, error)
  }
}

function mapBulkSMSStatus(bulkSMSStatus: string): string {
  switch (bulkSMSStatus.toLowerCase()) {
    case 'delivered':
      return 'delivered'
    case 'failed':
    case 'rejected':
    case 'unknown':
      return 'failed'
    case 'buffered':
    case 'submitted':
      return 'sent'
    default:
      return 'sent'
  }
}

async function checkCampaignCompletion(supabase: any, campaignId: string) {
  try {
    // Check if all targets are in final states
    const { data: pendingTargets } = await supabase
      .from('campaign_targets')
      .select('id')
      .eq('campaign_id', campaignId)
      .not('status', 'in', '("delivered","failed","undeliverable")')
      .limit(1)

    if (!pendingTargets || pendingTargets.length === 0) {
      // All targets processed - mark campaign as completed
      await supabase
        .from('campaigns')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', campaignId)
        .eq('status', 'sending') // Only update if still in sending status

      console.log(`Campaign ${campaignId} marked as completed`)
    }
  } catch (error) {
    console.error(`Error checking campaign completion for ${campaignId}:`, error)
  }
}