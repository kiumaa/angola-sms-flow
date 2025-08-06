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

interface BulkSMSLegacyResponse {
  success: boolean
  to: string
  batchId?: string
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

    // Get BulkSMS API token from secrets (Legacy EAPI uses only token, no secret)
    const bulkSMSToken = Deno.env.get('BULKSMS_TOKEN_ID') || 'F3F6606E497344F5A0DE5CD616AF8883-02-A'

    if (!bulkSMSToken) {
      throw new Error('BulkSMS API token not configured')
    }

    // Send SMS via BulkSMS Legacy EAPI
    const bulkSMSResponse = await sendViaBulkSMSLegacy(
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
          campaign_id: campaignId,
          user_id: user.id,
          phone_number: result.to,
          message: message,
          status: result.success ? 'sent' : 'failed',
          gateway_used: 'bulksms',
          gateway_message_id: result.batchId,
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
        batchId: bulkSMSResponse.find(r => r.success)?.batchId,
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

async function sendViaBulkSMSLegacy(
  contacts: string[],
  message: string,
  senderId: string,
  apiToken: string,
  isTest: boolean = false
): Promise<BulkSMSLegacyResponse[]> {
  
  // Format phone numbers for Angola (+244)
  const formattedContacts = contacts.map(contact => {
    if (!contact.startsWith('+244') && !contact.startsWith('244')) {
      return `+244${contact.replace(/^0+/, '')}`
    }
    return contact.startsWith('+') ? contact : `+${contact}`
  })

  const results: BulkSMSLegacyResponse[] = []

  try {
    // BulkSMS Legacy EAPI payload
    const payload = new URLSearchParams()
    payload.append('command', 'SEND')
    payload.append('username', apiToken)
    payload.append('password', '') // Password is empty for API token auth
    payload.append('message', message)
    payload.append('msisdn', formattedContacts.join(','))
    payload.append('sender', senderId)
    payload.append('bulkSMSMode', '1')

    console.log(`Sending ${formattedContacts.length} SMS via BulkSMS Legacy EAPI with sender: ${senderId}`)

    const response = await fetch('https://api-legacy2.bulksms.com/eapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: payload
    })

    const responseText = await response.text()
    console.log('BulkSMS Legacy EAPI response:', responseText)

    // Parse Legacy EAPI response format: "0: Accepted for delivery|batch_id:12345"
    const lines = responseText.split('\n').filter(line => line.trim())
    
    for (let i = 0; i < formattedContacts.length; i++) {
      const contact = formattedContacts[i]
      const responseLine = lines[i] || lines[0] // Fallback to first line if not enough responses
      
      if (responseLine) {
        const parts = responseLine.split('|')
        const statusPart = parts[0]
        const batchPart = parts.find(p => p.includes('batch_id:'))
        
        const [statusCode, statusText] = statusPart.split(': ', 2)
        const batchId = batchPart ? batchPart.split(':')[1] : undefined
        
        const success = statusCode === '0' // Status code 0 means success
        
        results.push({
          success,
          to: contact,
          batchId: success ? batchId : undefined,
          error: success ? undefined : `${statusCode}: ${statusText}`
        })
      } else {
        results.push({
          success: false,
          to: contact,
          error: 'No response from BulkSMS Legacy EAPI'
        })
      }
    }

  } catch (error) {
    console.error(`Error sending SMS via BulkSMS Legacy EAPI:`, error)
    
    // Create error responses for all contacts
    formattedContacts.forEach(contact => {
      results.push({
        success: false,
        to: contact,
        error: error.message
      })
    })
  }

  return results
}