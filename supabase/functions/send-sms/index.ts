import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  phoneNumber: string
  message: string
  senderId?: string
  campaignId?: string
  isTest?: boolean
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
    
    // Get user from auth header using the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error('Authentication error:', userError)
      throw new Error('Invalid authorization')
    }

    console.log(`Authenticated user: ${user.id}`)

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { phoneNumber, message, senderId = 'SMSAO', campaignId, isTest = false }: SMSRequest = await req.json()

    if (!phoneNumber) {
      throw new Error('No phone number provided')
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

    // Forward to BulkSMS function (pass user ID internally)
    const { data: bulkSMSResponse, error: bulkSMSError } = await supabase.functions.invoke('send-sms-bulksms', {
      body: {
        contacts: [phoneNumber], // Convert single phone to array for BulkSMS function
        message,
        senderId,
        campaignId,
        isTest,
        userId: user.id // Pass authenticated user ID instead of auth header
      }
    })

    if (bulkSMSError) {
      throw bulkSMSError
    }

    return new Response(
      JSON.stringify({
        success: true,
        gateway: 'bulksms',
        totalSent: bulkSMSResponse.totalSent || 0,
        totalFailed: bulkSMSResponse.totalFailed || 0,
        creditsUsed: bulkSMSResponse.creditsUsed || 0,
        messageId: bulkSMSResponse.messageId,
        responseTime: bulkSMSResponse.responseTime || 0
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
        error: error.message,
        gateway: 'bulksms'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})