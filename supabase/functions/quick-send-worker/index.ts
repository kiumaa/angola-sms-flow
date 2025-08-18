import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// BulkSMS API integration
async function sendViaBulkSMS(phone: string, message: string, senderId: string) {
  const tokenId = Deno.env.get('BULKSMS_TOKEN_ID')
  const tokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET')
  
  if (!tokenId || !tokenSecret) {
    throw new Error('BulkSMS credentials not configured')
  }

  const credentials = btoa(`${tokenId}:${tokenSecret}`)
  
  const payload = {
    from: senderId,
    to: phone,
    body: message,
    encoding: 'AUTO'
  }

  console.log(`Sending SMS via BulkSMS to ${phone} from ${senderId}`)
  console.log('BulkSMS payload:', JSON.stringify(payload))
  const startTime = Date.now()

  const response = await fetch('https://api.bulksms.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  })

  const responseTime = Date.now() - startTime
  let responseData

  try {
    responseData = await response.json()
  } catch (error) {
    console.error('Failed to parse BulkSMS response as JSON:', error)
    const responseText = await response.text()
    console.error('Raw response:', responseText)
    throw new Error(`BulkSMS API error: ${response.status} - ${responseText}`)
  }

  console.log(`BulkSMS API response (${response.status}):`, responseData)

  if (!response.ok) {
    const errorMessage = responseData?.detail?.message || responseData?.message || `HTTP ${response.status}`
    console.error('BulkSMS API error:', errorMessage, responseData)
    throw new Error(`BulkSMS API error: ${errorMessage}`)
  }
  
  return {
    messageId: responseData.id,
    status: responseData.status?.type || 'ACCEPTED',
    responseTime
  }
}

async function processTargets(supabase: any, jobId: string) {
  console.log(`Processing targets for job: ${jobId}`)

  // Update job status to processing
  await supabase
    .from('quick_send_jobs')
    .update({ status: 'processing' })
    .eq('id', jobId)

  // Get job details
  const { data: job, error: jobError } = await supabase
    .from('quick_send_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    console.error('Job not found:', jobError)
    return
  }

  // Get queued targets
  const { data: targets, error: targetsError } = await supabase
    .from('quick_send_targets')
    .select('*')
    .eq('job_id', jobId)
    .eq('status', 'queued')
    .order('created_at')

  if (targetsError) {
    console.error('Error fetching targets:', targetsError)
    return
  }

  if (!targets || targets.length === 0) {
    console.log('No queued targets found')
    return
  }

  console.log(`Found ${targets.length} targets to process`)

  let creditsSpent = 0
  const batchSize = 10 // Process in batches to avoid overwhelming the API
  
  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize)
    
    for (const target of batch) {
      try {
        console.log(`Processing target ${target.id}: ${target.phone_e164}`)

        // Update target status to sending
        await supabase
          .from('quick_send_targets')
          .update({ status: 'sending' })
          .eq('id', target.id)

        // Debit credits from user profile
        const { error: debitError } = await supabase.rpc('debit_user_credits', {
          _account_id: job.account_id,
          _amount: target.segments,
          _reason: `Quick Send SMS to ${target.phone_e164}`,
          _meta: { jobId: job.id, targetId: target.id }
        })

        if (debitError) {
          console.error('Credit debit failed:', debitError)
          await supabase
            .from('quick_send_targets')
            .update({ 
              status: 'failed',
              error_code: 'CREDIT_DEBIT_FAILED',
              error_detail: debitError.message
            })
            .eq('id', target.id)
          continue
        }

        creditsSpent += target.segments

        // Send via BulkSMS
        const smsResult = await sendViaBulkSMS(
          target.phone_e164,
          target.rendered_message,
          job.sender_id
        )

        // Update target with success
        await supabase
          .from('quick_send_targets')
          .update({
            status: 'sent',
            bulksms_message_id: smsResult.messageId,
            sent_at: new Date().toISOString()
          })
          .eq('id', target.id)

        // Log to sms_logs for reporting
        await supabase
          .from('sms_logs')
          .insert({
            user_id: job.created_by,
            phone_number: target.phone_e164,
            message: target.rendered_message,
            status: 'sent',
            cost_credits: target.segments,
            gateway_used: 'bulksms',
            gateway_message_id: smsResult.messageId,
            sent_at: new Date().toISOString(),
            payload: {
              jobId: job.id,
              targetId: target.id,
              senderId: job.sender_id
            }
          })

        console.log(`Target ${target.id} processed successfully`)

      } catch (error) {
        console.error(`Error processing target ${target.id}:`, error)
        
        // Update target with failure
        await supabase
          .from('quick_send_targets')
          .update({
            status: 'failed',
            error_code: 'SMS_SEND_FAILED',
            error_detail: error.message
          })
          .eq('id', target.id)
      }

      // Rate limiting - wait 200ms between messages
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  // Update job with credits spent and completion status
  const { data: remainingTargets, error: remainingError } = await supabase
    .from('quick_send_targets')
    .select('status')
    .eq('job_id', jobId)
    .in('status', ['queued', 'sending'])

  const hasRemainingTargets = remainingTargets && remainingTargets.length > 0

  await supabase
    .from('quick_send_jobs')
    .update({
      status: hasRemainingTargets ? 'processing' : 'completed',
      credits_spent: creditsSpent,
      completed_at: hasRemainingTargets ? null : new Date().toISOString()
    })
    .eq('id', jobId)

  console.log(`Job ${jobId} processing complete. Credits spent: ${creditsSpent}`)
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { jobId } = await req.json()

    if (!jobId) {
      throw new Error('Job ID is required')
    }

    // Process targets in background
    EdgeRuntime.waitUntil(processTargets(supabase, jobId))

    return new Response(
      JSON.stringify({ success: true, message: 'Processing started' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Quick send worker error:', error)
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