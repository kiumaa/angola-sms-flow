import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { corsHeaders } from '../_shared/cors.ts';

interface SendQuickBody {
  sender_id?: string;
  recipients: string[];
  message: string;
  estimate?: { segments: number; credits: number };
}

interface BulkSMSMessage {
  to: string;
  body: string;
  from?: string;
}

interface BulkSMSResponse {
  id: string;
  type: string;
  from: string;
  to: string;
  body: string;
  encoding: string;
  protocolId: number;
  messageClass: number;
  numberOfParts: number;
  creditCost: number;
  submission: {
    date: string;
    requestId: string;
  };
  status: {
    type: string;
    subtype: string;
  };
}

const BULKSMS_API_URL = 'https://api.bulksms.com/v1/messages';

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user profile and credits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, credits')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const body = (await req.json()) as SendQuickBody;
    const senderId = body.sender_id || 'SMSAO';
    const message = (body.message || '').trim();
    const recipients = Array.from(new Set(body.recipients || [])).filter(Boolean);
    const estimatedCredits = body.estimate?.credits || recipients.length;

    if (!message || recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'Mensagem e destinatários são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user has enough credits
    if (profile.credits < estimatedCredits) {
      return new Response(JSON.stringify({ 
        error: 'Créditos insuficientes',
        required: estimatedCredits,
        available: profile.credits
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get BulkSMS credentials
    const bulkSmsTokenId = Deno.env.get('BULKSMS_TOKEN_ID');
    const bulkSmsTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET');

    if (!bulkSmsTokenId || !bulkSmsTokenSecret) {
      return new Response(JSON.stringify({ error: 'BulkSMS credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare authentication header
    const credentials = btoa(`${bulkSmsTokenId}:${bulkSmsTokenSecret}`);
    const authHeaderValue = `Basic ${credentials}`;

    // Send messages in batches to avoid API limits
    const batches = chunk(recipients, 100);
    const results: any[] = [];
    let totalSent = 0;
    let totalCreditCost = 0;

    for (const batch of batches) {
      // Prepare BulkSMS payload
      const messages: BulkSMSMessage[] = batch.map(recipient => ({
        to: recipient,
        body: message,
        from: senderId
      }));

      try {
        const response = await fetch(BULKSMS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeaderValue,
          },
          body: JSON.stringify(messages)
        });

        const responseData = await response.json();

        if (!response.ok) {
          console.error('BulkSMS API error:', responseData);
          
          // Log failed batch
          for (const recipient of batch) {
            await supabase.from('sms_logs').insert({
              user_id: user.id,
              phone_number: recipient,
              message,
              sender_id: senderId,
              status: 'failed',
              gateway: 'bulksms',
              error_message: responseData.detail?.message || 'Unknown error',
              cost_credits: 0
            });
          }

          continue; // Continue with next batch
        }

        // Process successful responses
        if (Array.isArray(responseData)) {
          for (const smsResponse of responseData as BulkSMSResponse[]) {
            totalSent++;
            totalCreditCost += smsResponse.creditCost || 1;

            // Log successful SMS
            await supabase.from('sms_logs').insert({
              user_id: user.id,
              phone_number: smsResponse.to,
              message: smsResponse.body,
              sender_id: smsResponse.from,
              status: smsResponse.status?.type === 'ACCEPTED' ? 'sent' : 'failed',
              gateway: 'bulksms',
              gateway_message_id: smsResponse.id,
              cost_credits: smsResponse.creditCost || 1
            });
          }
          results.push(responseData);
        }

      } catch (error) {
        console.error('Error sending batch:', error);
        
        // Log failed batch
        for (const recipient of batch) {
          await supabase.from('sms_logs').insert({
            user_id: user.id,
            phone_number: recipient,
            message,
            sender_id: senderId,
            status: 'failed',
            gateway: 'bulksms',
            error_message: `Network error: ${error.message}`,
            cost_credits: 0
          });
        }
      }
    }

    // Debit credits only for actually sent messages
    if (totalSent > 0) {
      const { error: debitError } = await supabase.rpc('debit_user_credits', {
        _account_id: profile.id,
        _amount: totalCreditCost,
        _reason: `Quick SMS send to ${totalSent} recipient(s)`
      });

      if (debitError) {
        console.error('Error debiting credits:', debitError);
        // Don't fail the request as SMS were already sent
      }
    }

    return new Response(JSON.stringify({
      success: true,
      sent: totalSent,
      total_recipients: recipients.length,
      credits_debited: totalCreditCost,
      batches: results.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-quick-sms function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});