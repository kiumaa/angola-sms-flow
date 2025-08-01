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

interface RouteeResponse {
  trackingId: string
  to: string
  from: string
  body: string
  status: string
  parts: number
  cost: number
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

    // Get Routee API token from secrets
    const routeeApiToken = Deno.env.get('ROUTEE_API_TOKEN')

    if (!routeeApiToken) {
      throw new Error('Routee API token not configured')
    }

    // Send SMS via Routee
    const routeeResponse = await sendViaRoutee(
      contacts,
      message,
      senderId,
      routeeApiToken,
      isTest
    )

    // Parse response and calculate totals
    const totalSent = routeeResponse.filter(r => r.status === 'Queued' || r.status === 'Sent').length
    const totalFailed = routeeResponse.filter(r => r.status !== 'Queued' && r.status !== 'Sent').length
    const totalCost = routeeResponse.reduce((acc, r) => acc + (r.cost || 1), 0)

    // Log SMS records
    for (const result of routeeResponse) {
      await supabase
        .from('sms_logs')
        .insert({
          campaign_id: campaignId,
          user_id: user.id,
          phone_number: result.to,
          message: message,
          status: result.status === 'Queued' || result.status === 'Sent' ? 'sent' : 'failed',
          gateway_used: 'routee',
          gateway_message_id: result.trackingId,
          cost_credits: Math.ceil(result.cost || 1),
          error_message: result.status !== 'Queued' && result.status !== 'Sent' ? result.status : null,
          sent_at: result.status === 'Queued' || result.status === 'Sent' ? new Date().toISOString() : null
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
        messageIds: routeeResponse.map(r => r.trackingId),
        gateway: 'routee'
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

async function sendViaRoutee(
  contacts: string[],
  message: string,
  senderId: string,
  apiToken: string,
  isTest: boolean = false
): Promise<RouteeResponse[]> {
  
  // Format phone numbers for Angola (+244)
  const formattedContacts = contacts.map(contact => {
    if (!contact.startsWith('+244') && !contact.startsWith('244')) {
      return `+244${contact.replace(/^0+/, '')}`
    }
    return contact.startsWith('+') ? contact : `+${contact}`
  })

  const results: RouteeResponse[] = []

  // Send SMS to each contact (Routee doesn't have bulk endpoint)
  for (const contact of formattedContacts) {
    try {
      const payload = {
        body: message,
        to: contact, // String conforme documentação oficial
        from: senderId,
        callback: {
          url: `${supabaseUrl}/functions/v1/routee-webhook`,
          strategy: 'OnChange'
        }
      }

      const response = await fetch('https://connect.routee.net/sms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Routee API error for ${contact}:`, response.status, errorText)
        
        results.push({
          trackingId: `error_${Date.now()}_${Math.random()}`,
          to: contact,
          from: senderId,
          body: message,
          status: 'Failed',
          parts: 1,
          cost: 0
        })
        continue
      }

      const data = await response.json()
      
      // Handle successful response conforme documentação oficial
      results.push({
        trackingId: data.trackingId,
        to: contact,
        from: data.from,
        body: data.body,
        status: data.status,
        parts: data.bodyAnalysis?.parts || 1,
        cost: data.bodyAnalysis?.parts || 1 // Custo baseado no número de partes
      })

    } catch (error) {
      console.error(`Error sending SMS to ${contact}:`, error)
      
      results.push({
        trackingId: `error_${Date.now()}_${Math.random()}`,
        to: contact,
        from: senderId,
        body: message,
        status: 'Failed',
        parts: 1,
        cost: 0
      })
    }
  }

  return results
}