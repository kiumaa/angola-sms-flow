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
  senderId?: string
}

serve(async (req) => {
  console.log('SMS Function started:', new Date().toISOString())
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing SMS request...')
    
    // Get auth header for user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header found')
      throw new Error('Authorization header required')
    }

    console.log('Auth header present, creating Supabase client...')

    // Create Supabase client for user operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      throw new Error('User not authenticated')
    }

    console.log('User authenticated:', user.email)

    const requestBody = await req.json()
    console.log('Request body:', JSON.stringify(requestBody, null, 2))
    
    const { campaignId, recipients, message, senderId }: SendSMSRequest = requestBody

    if (!campaignId || !recipients || !message) {
      console.error('Missing required fields')
      throw new Error('Campaign ID, recipients, and message are required')
    }

    console.log(`Processing SMS campaign ${campaignId} for ${recipients.length} recipients`)

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Check user credits and get default sender ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits, default_sender_id')
      .eq('user_id', user.id)
      .single()

    const userCredits = profile?.credits || 0
    console.log(`User has ${userCredits} credits, needs ${recipients.length}`)
    
    if (userCredits < recipients.length) {
      throw new Error(`Insufficient credits. You have ${userCredits} credits but need ${recipients.length}`)
    }

    // BulkSMS API credentials
    const tokenId = Deno.env.get('BULKSMS_TOKEN_ID')
    const tokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET')
    
    console.log('BulkSMS credentials check:', { 
      hasTokenId: !!tokenId, 
      hasTokenSecret: !!tokenSecret,
      tokenIdLength: tokenId?.length || 0
    })
    
    if (!tokenId || !tokenSecret) {
      console.error('Missing BulkSMS credentials')
      throw new Error('BulkSMS credentials not configured')
    }

    // Prepare Basic Auth header
    const basicAuth = btoa(`${tokenId}:${tokenSecret}`)
    console.log('Basic auth prepared, starting SMS sending...')

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
          from: senderId || profile?.default_sender_id || 'SMSao'
        }

        console.log('SMS data:', JSON.stringify(smsData, null, 2))

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
        console.log(`BulkSMS API response for ${phoneNumber}:`, {
          status: response.status,
          ok: response.ok,
          result: JSON.stringify(result, null, 2)
        })

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
          console.log(`✅ SMS sent successfully to ${phoneNumber}`)
        } else {
          // Failed
          totalFailed++
          const errorMsg = result.detail || result.message || `HTTP ${response.status}`
          console.error(`❌ Failed to send SMS to ${phoneNumber}:`, errorMsg)
          
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
        console.error(`Exception sending SMS to ${phoneNumber}:`, error)
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

    console.log(`SMS sending completed: ${totalSent} sent, ${totalFailed} failed`)

    // Insert SMS logs
    if (smsLogs.length > 0) {
      const { error: logsError } = await supabaseAdmin
        .from('sms_logs')
        .insert(smsLogs)
      
      if (logsError) {
        console.error('Error inserting SMS logs:', logsError)
      } else {
        console.log('SMS logs inserted successfully')
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
      } else {
        console.log(`Credits updated: ${userCredits} -> ${userCredits - totalSent}`)
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
    } else {
      console.log('Campaign status updated successfully')
    }

    const response = {
      success: true,
      totalSent,
      totalFailed,
      creditsUsed: totalSent,
      remainingCredits: userCredits - totalSent
    }

    console.log('Sending success response:', JSON.stringify(response, null, 2))

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in send-sms function:', error)
    const errorResponse = { error: error.message }
    console.log('Sending error response:', JSON.stringify(errorResponse, null, 2))
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})