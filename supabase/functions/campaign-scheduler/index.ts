import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Campaign scheduler started at', new Date().toISOString())

    // Process scheduled campaigns that are ready to queue
    const now = new Date().toISOString()
    
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, name, schedule_at, timezone')
      .eq('status', 'scheduled')
      .lte('schedule_at', now)
      .order('schedule_at', { ascending: true })
      .limit(20)

    if (error) {
      console.error('Error fetching scheduled campaigns:', error)
      throw error
    }

    if (!campaigns || campaigns.length === 0) {
      console.log('No scheduled campaigns ready to process')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No campaigns to schedule',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Found ${campaigns.length} campaigns ready to schedule`)

    let processed = 0
    for (const campaign of campaigns) {
      try {
        // Move from scheduled to queued status
        const { error: updateError } = await supabase
          .from('campaigns')
          .update({ 
            status: 'queued',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaign.id)
          .eq('status', 'scheduled') // Ensure it's still scheduled (avoid race conditions)

        if (updateError) {
          console.error(`Error updating campaign ${campaign.id}:`, updateError)
          continue
        }

        console.log(`Scheduled campaign "${campaign.name}" (${campaign.id}) moved to queue`)
        processed++

        // Optional: Trigger campaign worker immediately
        // You could call the campaign-worker function here if needed
        try {
          await supabase.functions.invoke('campaign-worker', {
            body: { trigger: 'scheduled' }
          })
        } catch (workerError) {
          console.warn('Failed to trigger campaign worker:', workerError)
          // Non-critical - worker will pick it up on next run
        }

      } catch (error) {
        console.error(`Error processing campaign ${campaign.id}:`, error)
        
        // Mark campaign as failed if there's a critical error
        await supabase
          .from('campaigns')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', campaign.id)
      }
    }

    // Clean up old completed/failed campaigns (optional maintenance)
    await cleanupOldCampaigns(supabase)

    console.log(`Campaign scheduler completed. Processed ${processed} campaigns.`)

    return new Response(JSON.stringify({ 
      success: true,
      processed,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Campaign scheduler error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Campaign scheduler error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function cleanupOldCampaigns(supabase: any) {
  try {
    // Clean up campaigns older than 90 days that are completed or failed
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90)
    
    console.log(`Cleaning up campaigns older than ${cutoffDate.toISOString()}`)

    // First, delete old campaign targets (they reference campaigns)
    const { error: targetsError } = await supabase
      .from('campaign_targets')
      .delete()
      .lt('queued_at', cutoffDate.toISOString())
      .in('status', ['delivered', 'failed', 'undeliverable', 'canceled'])

    if (targetsError) {
      console.warn('Error cleaning up old campaign targets:', targetsError)
    }

    // Then delete old campaigns
    const { error: campaignsError, count } = await supabase
      .from('campaigns')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .in('status', ['completed', 'failed', 'canceled'])

    if (campaignsError) {
      console.warn('Error cleaning up old campaigns:', campaignsError)
    } else if (count && count > 0) {
      console.log(`Cleaned up ${count} old campaigns`)
    }

  } catch (error) {
    console.warn('Error during cleanup:', error)
    // Non-critical - don't throw
  }
}

// Export for cron job scheduling
export { serve }