
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  contacts: string[]
  message: string
  senderId?: string
  campaignId?: string
  isTest?: boolean
}

interface AfricasTalkingResponse {
  SMSMessageData: {
    Message: string
    Recipients: Array<{
      statusCode: number
      number: string
      status: string
      cost: string
      messageId: string
    }>
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (userError || !user) {
      throw new Error('Invalid authorization')
    }

    const { contacts, message, senderId = 'SMSao', campaignId, isTest = false }: SMSRequest = await req.json()

    if (!contacts || contacts.length === 0) {
      throw new Error('No contacts provided')
    }

    if (!message) {
      throw new Error('No message provided')
    }

    // Get Africa's Talking credentials from secrets
    const atUsername = Deno.env.get('AT_USERNAME')
    const atApiKey = Deno.env.get('AT_API_KEY')

    if (!atUsername || !atApiKey) {
      throw new Error('Africa\'s Talking credentials not configured')
    }

    // Send SMS via Africa's Talking
    const atResponse = await sendViaAfricasTalking(
      contacts,
      message,
      senderId,
      atUsername,
      atApiKey,
      isTest
    )

    // Parse response
    const recipients = atResponse.SMSMessageData?.Recipients || []
    const totalSent = recipients.filter(r => r.status === 'Success').length
    const totalFailed = recipients.filter(r => r.status !== 'Success').length
    const totalCost = recipients.reduce((acc, r) => acc + (parseFloat(r.cost) || 0), 0)

    // Log SMS records
    for (const recipient of recipients) {
      await supabase
        .from('sms_logs')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          phone_number: recipient.number,
          message: message,
          status: recipient.status === 'Success' ? 'sent' : 'failed',
          gateway_used: 'africastalking',
          gateway_message_id: recipient.messageId,
          cost_credits: Math.ceil(parseFloat(recipient.cost) || 1),
          error_message: recipient.status !== 'Success' ? recipient.status : null,
          sent_at: recipient.status === 'Success' ? new Date().toISOString() : null
        })
    }

    // Update user credits if not test
    if (!isTest && totalSent > 0) {
      const creditsUsed = Math.ceil(totalCost)
      await supabase.rpc('add_user_credits', {
        user_id: user.id,
        credit_amount: -creditsUsed
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        totalSent,
        totalFailed,
        creditsUsed: isTest ? 0 : Math.ceil(totalCost),
        messageIds: recipients.map(r => r.messageId),
        gateway: 'africastalking'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('SMS sending error:', error)
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

async function sendViaAfricasTalking(
  contacts: string[],
  message: string,
  senderId: string,
  username: string,
  apiKey: string,
  isTest: boolean = false
): Promise<AfricasTalkingResponse> {
  
  // Format phone numbers for Angola (+244)
  const formattedContacts = contacts.map(contact => {
    if (!contact.startsWith('+244') && !contact.startsWith('244')) {
      return `+244${contact.replace(/^0+/, '')}`
    }
    return contact
  })

  const baseUrl = isTest 
    ? 'https://api.sandbox.africastalking.com/version1'
    : 'https://api.africastalking.com/version1'

  const response = await fetch(`${baseUrl}/messaging`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'apiKey': apiKey,
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      username: username,
      to: formattedContacts.join(','),
      from: senderId,
      message: message
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Africa's Talking API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  if (!data.SMSMessageData) {
    throw new Error('Invalid response from Africa\'s Talking')
  }

  return data
}
