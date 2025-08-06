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
  success: boolean
  to: string
  messageId?: string
  error?: string
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

    const { contacts, message, senderId = 'SMSAO', campaignId, isTest = false }: SMSRequest = await req.json()

    if (!contacts || contacts.length === 0) {
      throw new Error('No contacts provided')
    }

    if (!message) {
      throw new Error('No message provided')
    }

    // Validate Sender ID if not default (allow both SMSAO and SMS.AO as default)
    const defaultSenderIds = ['SMSAO', 'SMS.AO']
    if (!defaultSenderIds.includes(senderId)) {
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
    } else {
      console.log(`Using default Sender ID: ${senderId}`)
    }

    // Get BulkSMS API token from secrets
    const bulkSMSToken = Deno.env.get('BULKSMS_TOKEN_ID')

    if (!bulkSMSToken) {
      throw new Error('BulkSMS API token not configured')
    }

    console.log(`Using BulkSMS token: ${bulkSMSToken.substring(0, 8)}...`)

    // Send SMS via BulkSMS API v1
    const bulkSMSResponse = await sendViaBulkSMSProduction(
      contacts,
      message,
      senderId,
      bulkSMSToken,
      isTest
    )

    // Parse response and calculate totals
    const totalSent = bulkSMSResponse.filter(r => r.success).length
    const totalFailed = bulkSMSResponse.filter(r => !r.success).length
    const totalCost = totalSent

    // Log SMS records
    for (const result of bulkSMSResponse) {
      await supabase
        .from('sms_logs')
        .insert({
          campaign_id: campaignId || null, // Allow null for test SMS
          user_id: user.id,
          phone_number: result.to,
          message: message,
          status: result.success ? 'sent' : 'failed',
          gateway_used: 'bulksms',
          gateway_message_id: result.messageId,
          cost_credits: 1,
          error_message: result.success ? null : result.error,
          sent_at: result.success ? new Date().toISOString() : null
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
        messageId: bulkSMSResponse.find(r => r.success)?.messageId,
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

async function sendViaBulkSMSProduction(
  contacts: string[],
  message: string,
  senderId: string,
  apiToken: string,
  isTest: boolean = false
): Promise<BulkSMSResponse[]> {
  
  // Format phone numbers for Angola (+244)
  const formattedContacts = contacts.map(contact => {
    if (!contact.startsWith('+244') && !contact.startsWith('244')) {
      return `+244${contact.replace(/^0+/, '')}`
    }
    return contact.startsWith('+') ? contact : `+${contact}`
  })

  // Prepare messages for API v1
  const messages = formattedContacts.map(contact => ({
    to: contact,
    from: senderId,
    body: message
  }))

  console.log(`Sending ${formattedContacts.length} SMS via BulkSMS API v1 with sender: ${senderId}`)
  console.log(`Using API Token: ${apiToken.substring(0, 8)}...`)

  try {
    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${apiToken}:`)}`
      },
      body: JSON.stringify({ messages })
    })

    const responseData = await response.json()
    console.log('BulkSMS API v1 response:', responseData)

    const results: BulkSMSResponse[] = []

    if (response.ok && Array.isArray(responseData)) {
      responseData.forEach((result, index) => {
        const contact = formattedContacts[index]
        if (result.id) {
          results.push({
            success: true,
            to: contact,
            messageId: result.id,
            error: undefined
          })
        } else {
          results.push({
            success: false,
            to: contact,
            messageId: undefined,
            error: result.error?.description || 'Unknown error'
          })
        }
      })
    } else {
      // Se houve erro na requisição, marcar todos como falha
      formattedContacts.forEach(contact => {
        results.push({
          success: false,
          to: contact,
          messageId: undefined,
          error: responseData.detail || responseData.error?.description || `HTTP ${response.status}`
        })
      })
    }

    return results
  } catch (error) {
    console.error('Error calling BulkSMS API v1:', error)
    return formattedContacts.map(contact => ({
      success: false,
      to: contact,
      messageId: undefined,
      error: error.message
    }))
  }
}