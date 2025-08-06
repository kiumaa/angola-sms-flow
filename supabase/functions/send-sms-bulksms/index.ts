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

interface BulkSMSResponse {
  id: string
  to: string
  from: string
  body: string
  status: {
    type: string
    subtype: string
  }
  userSuppliedId?: string
  numberOfParts: number
  creditCost: number
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

    const { contacts, message, senderId = 'SMS.AO', campaignId, isTest = false }: SMSRequest = await req.json()

    if (!contacts || contacts.length === 0) {
      throw new Error('No contacts provided')
    }

    if (!message) {
      throw new Error('No message provided')
    }

    // Validate Sender ID if not default
    if (senderId !== 'SMS.AO') {
      const { data: senderData, error: senderError } = await supabase
        .from('sender_ids')
        .select('*')
        .eq('user_id', user.id)
        .eq('sender_id', senderId)
        .eq('status', 'approved')
        .single()

      if (senderError || !senderData) {
        throw new Error(`Sender ID "${senderId}" não está aprovado. Verifique seus Sender IDs em /sender-ids`)
      }

      console.log(`Using approved Sender ID: ${senderId} for user: ${user.id}`)
    }

    // Get BulkSMS credentials from secrets
    const bulkSMSTokenId = Deno.env.get('BULKSMS_TOKEN_ID')
    const bulkSMSTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET')

    if (!bulkSMSTokenId || !bulkSMSTokenSecret) {
      throw new Error('BulkSMS credentials not configured')
    }

    // Send SMS via BulkSMS
    const bulkSMSResponse = await sendViaBulkSMS(
      contacts,
      message,
      senderId,
      bulkSMSTokenId,
      bulkSMSTokenSecret,
      isTest
    )

    // Parse response and calculate totals
    const totalSent = bulkSMSResponse.filter(r => r.status.type === 'ACCEPTED').length
    const totalFailed = bulkSMSResponse.filter(r => r.status.type !== 'ACCEPTED').length
    const totalCost = bulkSMSResponse.reduce((acc, r) => acc + (r.creditCost || 1), 0)

    // Log SMS records
    for (const result of bulkSMSResponse) {
      await supabase
        .from('sms_logs')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          phone_number: result.to,
          message: message,
          status: result.status.type === 'ACCEPTED' ? 'sent' : 'failed',
          gateway_used: 'bulksms',
          gateway_message_id: result.id,
          cost_credits: Math.ceil(result.creditCost || 1),
          error_message: result.status.type !== 'ACCEPTED' ? `${result.status.type}: ${result.status.subtype}` : null,
          sent_at: result.status.type === 'ACCEPTED' ? new Date().toISOString() : null
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
        messageIds: bulkSMSResponse.map(r => r.id),
        gateway: 'bulksms'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('BulkSMS sending error:', error)
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

async function sendViaBulkSMS(
  contacts: string[],
  message: string,
  senderId: string,
  tokenId: string,
  tokenSecret: string,
  isTest: boolean = false
): Promise<BulkSMSResponse[]> {
  
  // Format phone numbers for Angola (+244)
  const formattedContacts = contacts.map(contact => {
    if (!contact.startsWith('+244') && !contact.startsWith('244')) {
      return `+244${contact.replace(/^0+/, '')}`
    }
    return contact.startsWith('+') ? contact : `+${contact}`
  })

  // Create Basic Auth header
  const authString = btoa(`${tokenId}:${tokenSecret}`)
  
  const results: BulkSMSResponse[] = []

  // BulkSMS supports bulk sending
  try {
    const payload = formattedContacts.map(contact => ({
      to: contact,
      body: message,
      from: senderId,
      userSuppliedId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }))

    console.log(`Sending ${payload.length} SMS via BulkSMS with sender: ${senderId}`)

    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`BulkSMS API error:`, response.status, errorText)
      
      // Create error responses for all contacts
      formattedContacts.forEach(contact => {
        results.push({
          id: `error_${Date.now()}_${Math.random()}`,
          to: contact,
          from: senderId,
          body: message,
          status: {
            type: 'FAILED',
            subtype: `HTTP ${response.status}: ${errorText}`
          },
          numberOfParts: 1,
          creditCost: 0
        })
      })
      
      return results
    }

    const data = await response.json()
    
    // BulkSMS returns an array of message responses
    if (Array.isArray(data)) {
      results.push(...data.map((item: any) => ({
        id: item.id,
        to: item.to,
        from: item.from,
        body: item.body,
        status: item.status,
        userSuppliedId: item.userSuppliedId,
        numberOfParts: item.numberOfParts || 1,
        creditCost: item.numberOfParts || 1
      })))
    } else {
      // Single message response
      results.push({
        id: data.id,
        to: data.to,
        from: data.from,
        body: data.body,
        status: data.status,
        userSuppliedId: data.userSuppliedId,
        numberOfParts: data.numberOfParts || 1,
        creditCost: data.numberOfParts || 1
      })
    }

  } catch (error) {
    console.error(`Error sending SMS via BulkSMS:`, error)
    
    // Create error responses for all contacts
    formattedContacts.forEach(contact => {
      results.push({
        id: `error_${Date.now()}_${Math.random()}`,
        to: contact,
        from: senderId,
        body: message,
        status: {
          type: 'FAILED',
          subtype: error.message
        },
        numberOfParts: 1,
        creditCost: 0
      })
    })
  }

  return results
}