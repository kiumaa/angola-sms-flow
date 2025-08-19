import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SENDER ID UTILITIES - MANDATO SMSAO
const DEFAULT_SENDER_ID = 'SMSAO';
const DEPRECATED_SENDER_IDS = ['ONSMS', 'SMS'];

function resolveSenderId(input?: string | null): string {
  if (!input || input.trim() === '') return DEFAULT_SENDER_ID;
  const normalized = input.trim().toUpperCase();
  if (DEPRECATED_SENDER_IDS.includes(normalized)) {
    console.warn(`Sender ID depreciado detectado: ${input} → substituído por ${DEFAULT_SENDER_ID}`);
    return DEFAULT_SENDER_ID;
  }
  if (!normalized.match(/^[A-Za-z0-9]{1,11}$/)) {
    console.warn(`Sender ID inválido detectado: ${input} → substituído por ${DEFAULT_SENDER_ID}`);
    return DEFAULT_SENDER_ID;
  }
  return normalized;
}

interface SMSRequest {
  contacts: string[]
  message: string
  senderId?: string
  campaignId?: string
  isTest?: boolean
  userId?: string // For internal function calls
}

interface BulkSMSResponse {
  success: boolean
  to: string
  messageId?: string
  error?: string
}

// Função para buscar credenciais do banco de dados
async function getBulkSMSCredentials(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('sms_configurations')
      .select('api_token_id, api_token_secret')
      .eq('gateway_name', 'bulksms')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Erro ao buscar credenciais do banco:', error);
      // Fallback para variáveis de ambiente
      return {
        tokenId: Deno.env.get('BULKSMS_TOKEN_ID'),
        tokenSecret: Deno.env.get('BULKSMS_TOKEN_SECRET')
      };
    }

    console.log('Credenciais carregadas do banco de dados');
    return {
      tokenId: data.api_token_id,
      tokenSecret: data.api_token_secret
    };
  } catch (error) {
    console.error('Erro ao conectar com banco para credenciais:', error);
    // Fallback para variáveis de ambiente
    return {
      tokenId: Deno.env.get('BULKSMS_TOKEN_ID'),
      tokenSecret: Deno.env.get('BULKSMS_TOKEN_SECRET')
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== BulkSMS Function Started ===');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { contacts, message, senderId, campaignId, isTest = false, userId }: SMSRequest = await req.json()

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Request details:', {
      contacts: contacts?.length,
      message: message?.substring(0, 50) + '...',
      senderId,
      userId,
      isTest
    });

    // Normalizar Sender ID usando helper
    const resolvedSenderId = resolveSenderId(senderId);
    console.log(`Sender ID normalizado: "${senderId}" → "${resolvedSenderId}"`);

    if (!contacts || contacts.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No contacts provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!message) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No message provided'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validar Sender ID apenas se não for o padrão SMSAO
    if (resolvedSenderId !== DEFAULT_SENDER_ID) {
      const { data: senderData, error: senderError } = await supabase
        .from('sender_ids')
        .select('*')
        .eq('user_id', userId)
        .eq('sender_id', resolvedSenderId)
        .eq('status', 'approved')
        .single()

      if (senderError || !senderData) {
        console.warn(`Sender ID personalizado "${resolvedSenderId}" não aprovado, usando padrão ${DEFAULT_SENDER_ID}`);
        // Forçar uso do padrão
        resolvedSenderId = DEFAULT_SENDER_ID;
      } else {
        console.log(`Using approved Sender ID: ${resolvedSenderId} for user: ${userId}`)
      }
    } else {
      console.log(`Using default Sender ID: ${resolvedSenderId}`)
    }

    // Buscar credenciais do banco de dados
    const credentials = await getBulkSMSCredentials(supabase);
    const bulkSMSTokenId = credentials.tokenId;
    const bulkSMSTokenSecret = credentials.tokenSecret;

    if (!bulkSMSTokenId) {
      console.error('BulkSMS credentials not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'BulkSMS API credentials not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Using BulkSMS Token ID: ${bulkSMSTokenId.substring(0, 8)}...`)
    console.log(`Token Secret available: ${!!bulkSMSTokenSecret}`)
    console.log(`Sending SMS to ${contacts.length} contacts with sender: ${resolvedSenderId}`)

    // Send SMS via BulkSMS API v1
    const bulkSMSResponse = await sendViaBulkSMSProduction(
      contacts,
      message,
      resolvedSenderId, // Usar sender ID normalizado
      bulkSMSTokenId,
      bulkSMSTokenSecret,
      isTest
    )

    // Parse response and calculate totals
    const totalSent = bulkSMSResponse.filter(r => r.success).length
    const totalFailed = bulkSMSResponse.filter(r => !r.success).length
    const totalCost = totalSent

    console.log(`Results: ${totalSent} sent, ${totalFailed} failed`);

    // Log SMS records
    for (const result of bulkSMSResponse) {
      try {
        await supabase
          .from('sms_logs')
          .insert({
            campaign_id: campaignId || null, // Allow null for test SMS
            user_id: userId,
            phone_number: result.to,
            message: message,
            status: result.success ? 'sent' : 'failed',
            gateway_used: 'bulksms',
            gateway_message_id: result.messageId,
            cost_credits: 1,
            error_message: result.success ? null : result.error,
            sent_at: result.success ? new Date().toISOString() : null
          })
      } catch (logError) {
        console.error('Error logging SMS:', logError);
        // Don't fail the whole operation if logging fails
      }
    }

    // Update user credits if not test
    if (!isTest && totalSent > 0) {
      const creditsUsed = Math.ceil(totalCost)
      try {
        await supabase.rpc('add_user_credits', {
          user_id: userId,
          credit_amount: -creditsUsed
        })
        console.log(`Debited ${creditsUsed} credits from user ${userId}`);
      } catch (creditError) {
        console.error('Error updating credits:', creditError);
        // Don't fail the operation if credit update fails
      }
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

  } catch (error: any) {
    console.error('BulkSMS sending error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function sendViaBulkSMSProduction(
  contacts: string[],
  message: string,
  senderId: string,
  apiTokenId: string,
  apiTokenSecret: string,
  isTest: boolean = false
): Promise<BulkSMSResponse[]> {
  
  // Format phone numbers correctly
  const formattedContacts = contacts.map(contact => {
    let cleanContact = contact.trim().replace(/[\s\-\(\)]/g, '');
    
    // If already starts with +, return as is
    if (cleanContact.startsWith('+')) {
      return cleanContact;
    }
    
    // Remove leading zeros
    if (cleanContact.startsWith('0')) {
      cleanContact = cleanContact.substring(1);
    }
    
    // If starts with 244, ensure correct format
    if (cleanContact.startsWith('244')) {
      return `+${cleanContact}`;
    } 
    
    // Only add Angola prefix if it looks like a local Angolan number (starts with 9)
    if (cleanContact.startsWith('9') && cleanContact.length === 9) {
      return `+244${cleanContact}`;
    }
    
    // For other numbers, assume they need + prefix
    return cleanContact.startsWith('+') ? cleanContact : `+${cleanContact}`;
  })

  console.log(`Formatted contacts:`, formattedContacts)

  // Prepare messages for API v1
  const messages = formattedContacts.map(contact => ({
    to: contact,
    from: senderId,
    body: message
  }))

  console.log(`Sending ${formattedContacts.length} SMS via BulkSMS API v1`)

  // Create proper Basic Auth with TokenID:TokenSecret
  const authString = `${apiTokenId}:${apiTokenSecret || ''}`;

  try {
    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(authString)}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(messages)
    })

    const responseData = await response.json()
    console.log('BulkSMS API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });

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
      const errorMessage = responseData.detail || responseData.error?.description || `HTTP ${response.status}`;
      console.error('BulkSMS API error:', errorMessage);
      
      formattedContacts.forEach(contact => {
        results.push({
          success: false,
          to: contact,
          messageId: undefined,
          error: errorMessage
        })
      })
    }

    return results
  } catch (error: any) {
    console.error('Error calling BulkSMS API v1:', error)
    return formattedContacts.map(contact => ({
      success: false,
      to: contact,
      messageId: undefined,
      error: error.message || 'Network error'
    }))
  }
}