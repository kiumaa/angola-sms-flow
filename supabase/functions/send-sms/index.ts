import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendSMSRequest {
  campaignId: string
  recipients: string[]
  message: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get auth header for user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization header required')
    }

    // Create Supabase client for user operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    const { campaignId, recipients, message }: SendSMSRequest = await req.json()

    if (!campaignId || !recipients || !message) {
      throw new Error('Campaign ID, recipients, and message are required')
    }

    console.log(`Starting SMS campaign ${campaignId} for ${recipients.length} recipients`)

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Check user credits
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('user_id', user.id)
      .single()

    const userCredits = profile?.credits || 0
    if (userCredits < recipients.length) {
      throw new Error(`Insufficient credits. You have ${userCredits} credits but need ${recipients.length}`)
    }

    // BulkSMS API credentials
    const tokenId = Deno.env.get('BULKSMS_TOKEN_ID')
    const tokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET')
    
    if (!tokenId || !tokenSecret) {
      throw new Error('BulkSMS credentials not configured')
    }

    // Prepare Basic Auth header
    const basicAuth = btoa(`${tokenId}:${tokenSecret}`)

    let totalSent = 0
    let totalFailed = 0
    const smsLogs = []

    // Send SMS to each recipient
    for (const phoneNumber of recipients) {
      try {
        console.log(`Sending SMS to ${phoneNumber}`)

        // Prepare SMS data for BulkSMS API
        const smsData = {
          to: phoneNumber,
          body: message,
          from: 'SMSao'
        }

        // Send SMS via BulkSMS API
        const response = await fetch('https://api.bulksms.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${basicAuth}`
          },
          body: JSON.stringify(smsData)
        })

        const result = await response.json()
        console.log(`BulkSMS API response for ${phoneNumber}:`, result)

        if (response.ok && result.id) {
          // Success
          totalSent++
          smsLogs.push({
            campaign_id: campaignId,
            user_id: user.id,
            phone_number: phoneNumber,
            message: message,
            status: 'sent',
            cost_credits: 1,
            sent_at: new Date().toISOString()
          })
        } else {
          // Failed
          totalFailed++
          const errorMsg = result.detail || result.message || 'Unknown error'
          console.error(`Failed to send SMS to ${phoneNumber}:`, errorMsg)
          
          smsLogs.push({
            campaign_id: campaignId,
            user_id: user.id,
            phone_number: phoneNumber,
            message: message,
            status: 'failed',
            error_message: errorMsg,
            cost_credits: 0
          })
        }
      } catch (error) {
        console.error(`Error sending SMS to ${phoneNumber}:`, error)
        totalFailed++
        smsLogs.push({
          campaign_id: campaignId,
          user_id: user.id,
          phone_number: phoneNumber,
          message: message,
          status: 'failed',
          error_message: error.message,
          cost_credits: 0
        })
      }
    }

    // Insert SMS logs
    if (smsLogs.length > 0) {
      const { error: logsError } = await supabaseAdmin
        .from('sms_logs')
        .insert(smsLogs)
      
      if (logsError) {
        console.error('Error inserting SMS logs:', logsError)
      }
    }

    // Deduct credits (only for sent messages)
    if (totalSent > 0) {
      const { error: creditsError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          credits: userCredits - totalSent,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (creditsError) {
        console.error('Error updating credits:', creditsError)
      }
    }

    // Update campaign status
    const { error: campaignError } = await supabaseAdmin
      .from('sms_campaigns')
      .update({
        status: 'completed',
        total_sent: totalSent,
        total_failed: totalFailed,
        total_recipients: recipients.length,
        credits_used: totalSent,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (campaignError) {
      console.error('Error updating campaign:', campaignError)
    }

    console.log(`Campaign ${campaignId} completed: ${totalSent} sent, ${totalFailed} failed`)

    return new Response(
      JSON.stringify({
        success: true,
        totalSent,
        totalFailed,
        creditsUsed: totalSent,
        remainingCredits: userCredits - totalSent
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in send-sms function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})