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
  userId: string
  isTest?: boolean
}

interface SMSResult {
  success: boolean
  to: string
  messageId?: string
  error?: string
}

async function getSecureBulkSMSCredentials(): Promise<{ tokenId?: string; tokenSecret?: string }> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Try to get from Supabase Secrets first
    const { data: tokenIdSecret } = await supabase
      .from('vault')
      .select('decrypted_secret')
      .eq('name', 'BULKSMS_TOKEN_ID')
      .single();
      
    const { data: tokenSecretSecret } = await supabase
      .from('vault')
      .select('decrypted_secret')
      .eq('name', 'BULKSMS_TOKEN_SECRET')
      .single();
    
    if (tokenIdSecret?.decrypted_secret && tokenSecretSecret?.decrypted_secret) {
      return {
        tokenId: tokenIdSecret.decrypted_secret,
        tokenSecret: tokenSecretSecret.decrypted_secret
      };
    }
    
    // Fallback to environment variables
    return {
      tokenId: Deno.env.get('BULKSMS_TOKEN_ID'),
      tokenSecret: Deno.env.get('BULKSMS_TOKEN_SECRET')
    };
  } catch (error) {
    console.error('Error loading secure credentials:', error);
    // Secure fallback to environment variables
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

    // Get secure BulkSMS credentials
    const { tokenId: bulkSMSTokenId, tokenSecret: bulkSMSTokenSecret } = await getSecureBulkSMSCredentials();

    if (!bulkSMSTokenId || !bulkSMSTokenSecret) {
      return new Response(JSON.stringify({
        success: false,
        error: 'BulkSMS credentials not configured'
      }), {
        status: 500,
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
    let finalSenderId = resolvedSenderId;
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
        // Usar o padrão
        finalSenderId = DEFAULT_SENDER_ID;
      } else {
        console.log(`Using approved Sender ID: ${resolvedSenderId} for user: ${userId}`)
      }
    }

    // Log only partial credentials for security
    console.log(`Using secure BulkSMS Token ID: ${bulkSMSTokenId.substring(0, 4)}****`)
    console.log(`Secure Token Secret available: ${!!bulkSMSTokenSecret}`)
    console.log(`Sending SMS to ${contacts.length} contacts with sender: ${finalSenderId}`)

    // Send SMS via BulkSMS API v1
    const bulkSMSResponse = await sendViaBulkSMSProduction(
      contacts,
      message,
      finalSenderId,
      bulkSMSTokenId,
      bulkSMSTokenSecret,
      isTest
    );

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
            phone: result.to,
            message: message,
            status: result.success ? 'sent' : 'failed',
            provider: 'bulksms',
            cost_credits: 1,
            user_id: userId,
            campaign_id: campaignId,
            message_id: result.messageId,
            error_detail: result.error || null,
            is_test: isTest
          });
      } catch (logError) {
        console.error('Error logging SMS:', logError);
      }
    }

    // Update user credits if not test
    if (!isTest && totalSent > 0) {
      try {
        await supabase.rpc('debit_user_credits', {
          user_id: userId,
          amount: totalCost,
          reason: `SMS sent via BulkSMS: ${totalSent} messages`
        });
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
    );

  } catch (error) {
    console.error('BulkSMS sending error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function sendViaBulkSMSProduction(
  contacts: string[],
  message: string,
  senderId: string,
  apiTokenId: string,
  apiTokenSecret: string,
  isTest: boolean = false
): Promise<SMSResult[]> {
  console.log(`Preparing to send via BulkSMS v1: ${contacts.length} contacts`)
  
  // Format phone numbers and deduplicate
  const formattedContacts = [...new Set(contacts
    .map(phone => phone.replace(/\s+/g, ''))
    .filter(phone => phone.startsWith('+244') && phone.length >= 13)
  )];

  console.log(`Valid contacts after formatting: ${formattedContacts.length}`)

  if (formattedContacts.length === 0) {
    return [{
      success: false,
      to: 'invalid',
      error: 'No valid Angola phone numbers provided'
    }];
  }

  try {
    // Create authentication header
    const authString = btoa(`${apiTokenId}:${apiTokenSecret}`);
    
    // Prepare batch payload
    const messages = formattedContacts.map(phone => ({
      to: phone,
      body: message,
      from: senderId
    }));

    console.log(`Sending ${messages.length} SMS messages via BulkSMS`);

    // Call BulkSMS API v1
    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
        'User-Agent': 'SMS-AO-Production/1.0'
      },
      body: JSON.stringify(messages)
    });

    console.log(`BulkSMS API responded with status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BulkSMS API error response:', errorText);
      
      return formattedContacts.map(contact => ({
        success: false,
        to: contact,
        messageId: undefined,
        error: `BulkSMS API error: ${response.status} - ${errorText}`
      }));
    }

    const responseData = await response.json();
    console.log(`BulkSMS response:`, JSON.stringify(responseData, null, 2));

    // Process each response
    const results: SMSResult[] = [];
    
    if (Array.isArray(responseData)) {
      responseData.forEach((item, index) => {
        const contact = formattedContacts[index] || 'unknown';
        
        if (item.id && item.type === 'SENT') {
          results.push({
            success: true,
            to: contact,
            messageId: item.id
          });
        } else {
          const errorMessage = item.status?.description || item.detail || 'Unknown error';
          results.push({
            success: false,
            to: contact,
            messageId: undefined,
            error: errorMessage
          });
        }
      });
    } else if (responseData.id) {
      // Single message response
      results.push({
        success: true,
        to: formattedContacts[0],
        messageId: responseData.id
      });
    } else {
      // Unexpected response format
      return formattedContacts.map(contact => ({
        success: false,
        to: contact,
        messageId: undefined,
        error: 'Unexpected API response format'
      }));
    }

    console.log(`Processed ${results.length} SMS results`);
    return results;

  } catch (error) {
    console.error('Error calling BulkSMS API v1:', error)
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    return formattedContacts.map(contact => ({
      success: false,
      to: contact,
      messageId: undefined,
      error: errorMessage
    }));
  }
}