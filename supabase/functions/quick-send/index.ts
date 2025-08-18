import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalizePhoneAngola } from '../_shared/phoneNormalization.ts'
import { calculateSMSSegments } from '../_shared/smsUtils.ts'
import { resolveSenderId } from '../_shared/senderIdUtils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QuickSendRequest {
  message: string
  recipients: string[]
  senderId?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create client with anon key for user authentication
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid authorization')
    }

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { message, recipients, senderId }: QuickSendRequest = await req.json()

    if (!message || message.trim().length === 0) {
      throw new Error('Message is required')
    }

    if (!recipients || recipients.length === 0) {
      throw new Error('Recipients are required')
    }

    // Get user profile to get account_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, credits')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found')
    }

    // Normalize and deduplicate phone numbers
    const validRecipients = []
    const invalidRecipients = []

    for (const phone of recipients) {
      const normalized = normalizePhoneAngola(phone.trim())
      if (normalized.ok && normalized.e164) {
        if (!validRecipients.some(r => r.phone_e164 === normalized.e164)) {
          validRecipients.push({ phone_e164: normalized.e164, original: phone.trim() })
        }
      } else {
        invalidRecipients.push({ phone: phone.trim(), reason: normalized.reason })
      }
    }

    if (validRecipients.length === 0) {
      throw new Error('No valid recipients found')
    }

    // Calculate segments and credits
    const segmentInfo = calculateSMSSegments(message)
    const creditsEstimated = validRecipients.length * segmentInfo.segments
    
    // Check if user has enough credits
    if (profile.credits < creditsEstimated) {
      throw new Error(`Insufficient credits. Required: ${creditsEstimated}, Available: ${profile.credits}`)
    }

    // Resolve sender ID
    const resolvedSenderId = resolveSenderId(senderId)

    // Create quick send job
    const { data: job, error: jobError } = await supabase
      .from('quick_send_jobs')
      .insert({
        account_id: profile.id,
        created_by: user.id,
        message,
        sender_id: resolvedSenderId,
        total_recipients: validRecipients.length,
        segments_avg: segmentInfo.segments,
        credits_estimated: creditsEstimated,
        status: 'queued'
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      throw new Error('Failed to create job')
    }

    // Create targets for each recipient
    const targets = validRecipients.map(recipient => ({
      job_id: job.id,
      phone_e164: recipient.phone_e164,
      rendered_message: message, // For now, no template merging since no contact data
      segments: segmentInfo.segments,
      status: 'queued'
    }))

    const { error: targetsError } = await supabase
      .from('quick_send_targets')
      .insert(targets)

    if (targetsError) {
      console.error('Error creating targets:', targetsError)
      throw new Error('Failed to create targets')
    }

    // Trigger quick send worker
    try {
      await supabase.functions.invoke('quick-send-worker', {
        body: { jobId: job.id }
      })
    } catch (workerError) {
      console.error('Error invoking worker:', workerError)
      // Don't fail the request if worker invocation fails, it will be picked up later
    }

    console.log(`Quick send job created: ${job.id} with ${validRecipients.length} targets`)

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        validRecipients: validRecipients.length,
        invalidRecipients: invalidRecipients.length,
        creditsEstimated,
        segmentInfo,
        invalidDetails: invalidRecipients
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Quick send error:', error)
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