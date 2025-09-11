import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSMessage {
  to: string;
  from: string;
  text: string;
  campaignId?: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
  gateway: string;
}

interface FallbackResult {
  finalResult: SMSResult;
  attempts: {
    gateway: string;
    result: SMSResult;
    timestamp: string;
  }[];
  fallbackUsed: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const { message, userId } = await req.json() as {
      message: SMSMessage;
      userId: string;
    };

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing message or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get gateway credentials from secrets
    const bulkSMSTokenId = Deno.env.get('BULKSMS_TOKEN_ID');
    const bulkSMSTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET');
    const bulkGateApiKey = Deno.env.get('BULKGATE_API_KEY');

    // Detect country from phone number
    const countryCode = detectCountryFromPhone(message.to);
    console.log(`📍 Country detected: ${countryCode} for number: ${message.to}`);

    // Select gateway based on country
    const selectedGateway = selectGatewayForCountry(countryCode);
    const fallbackGateway = selectedGateway === 'bulkgate' ? 'bulksms' : 'bulkgate';

    console.log(`🎯 Selected gateway: ${selectedGateway}, Fallback: ${fallbackGateway}`);

    const attempts: FallbackResult['attempts'] = [];
    let finalResult: SMSResult;
    let fallbackUsed = false;

    // Try primary gateway
    const primaryResult = await sendViaSingleGateway(
      selectedGateway,
      message,
      { bulkSMSTokenId, bulkSMSTokenSecret, bulkGateApiKey }
    );

    attempts.push({
      gateway: selectedGateway,
      result: primaryResult,
      timestamp: new Date().toISOString()
    });

    if (primaryResult.success) {
      finalResult = primaryResult;
    } else {
      // Try fallback gateway
      console.log(`🔄 Primary gateway failed, trying fallback: ${fallbackGateway}`);
      fallbackUsed = true;

      const fallbackResult = await sendViaSingleGateway(
        fallbackGateway,
        message,
        { bulkSMSTokenId, bulkSMSTokenSecret, bulkGateApiKey }
      );

      attempts.push({
        gateway: fallbackGateway,
        result: fallbackResult,
        timestamp: new Date().toISOString()
      });

      finalResult = fallbackResult;
    }

    // Log the SMS attempt
    await logSMSAttempt(supabase, userId, message, {
      finalResult,
      attempts,
      fallbackUsed
    });

    // Update user credits if successful
    if (finalResult.success && finalResult.cost) {
      await updateUserCredits(supabase, userId, -finalResult.cost);
    }

    const response: FallbackResult = {
      finalResult,
      attempts,
      fallbackUsed
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Gateway dispatcher error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function detectCountryFromPhone(phoneNumber: string): string {
  const normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  if (normalized.startsWith('+244') || normalized.startsWith('244')) {
    return 'AO'; // Angola
  }
  
  if (normalized.startsWith('+351') || normalized.startsWith('351')) {
    return 'PT'; // Portugal
  }

  if (normalized.startsWith('+258') || normalized.startsWith('258')) {
    return 'MZ'; // Mozambique
  }

  if (normalized.startsWith('+238') || normalized.startsWith('238')) {
    return 'CV'; // Cape Verde
  }

  // Add more country codes as needed
  return 'UNKNOWN';
}

function selectGatewayForCountry(countryCode: string): string {
  // Angola and PALOP countries prefer BulkGate
  const bulkGateCountries = ['AO', 'MZ', 'CV', 'GW', 'ST', 'TL'];
  
  if (bulkGateCountries.includes(countryCode)) {
    return 'bulkgate';
  }
  
  // Other countries use BulkSMS
  return 'bulksms';
}

async function sendViaSingleGateway(
  gateway: string,
  message: SMSMessage,
  credentials: {
    bulkSMSTokenId?: string;
    bulkSMSTokenSecret?: string;
    bulkGateApiKey?: string;
  }
): Promise<SMSResult> {
  try {
    if (gateway === 'bulksms') {
      return await sendViaBulkSMS(message, credentials.bulkSMSTokenId!, credentials.bulkSMSTokenSecret!);
    } else if (gateway === 'bulkgate') {
      return await sendViaBulkGate(message, credentials.bulkGateApiKey!);
    } else {
      return {
        success: false,
        error: `Unknown gateway: ${gateway}`,
        gateway
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      gateway
    };
  }
}

async function sendViaBulkSMS(message: SMSMessage, tokenId: string, tokenSecret: string): Promise<SMSResult> {
  try {
    const auth = btoa(`${tokenId}:${tokenSecret}`);
    
    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: message.to,
        from: message.from,
        body: message.text
      })
    });

    const data = await response.json();

    if (response.ok && data.length > 0) {
      return {
        success: true,
        messageId: data[0].id,
        gateway: 'bulksms',
        cost: 1 // Default cost
      };
    } else {
      return {
        success: false,
        error: data.detail || 'Failed to send via BulkSMS',
        gateway: 'bulksms'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'BulkSMS connection error',
      gateway: 'bulksms'
    };
  }
}

async function sendViaBulkGate(message: SMSMessage, apiKey: string): Promise<SMSResult> {
  try {
    console.log(`🚀 BulkGate: Sending to ${message.to} with Sender ID: SMSAO`);
    
    const response = await fetch('https://portal.bulkgate.com/api/1.0/simple/transactional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        application_id: apiKey,
        application_token: apiKey,
        number: message.to,
        text: message.text,
        sender_id: "text", // BulkGate requires this field for text sender ID
        sender_id_value: "SMSAO" // Always use our approved Sender ID
      })
    });

    const data = await response.json();
    console.log(`📨 BulkGate Response:`, { status: response.status, data });

    if (response.ok && data.data && data.data.status === 'accepted') {
      console.log(`✅ BulkGate: Message sent successfully - ID: ${data.data.sms_id}`);
      return {
        success: true,
        messageId: data.data.sms_id,
        gateway: 'bulkgate',
        cost: 1 // Default cost
      };
    } else {
      console.error(`❌ BulkGate: Send failed -`, data);
      return {
        success: false,
        error: data.error?.message || 'Failed to send via BulkGate',
        gateway: 'bulkgate'
      };
    }
  } catch (error) {
    console.error(`💥 BulkGate: Connection error -`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'BulkGate connection error',
      gateway: 'bulkgate'
    };
  }
}

async function logSMSAttempt(
  supabase: any,
  userId: string,
  message: SMSMessage,
  result: FallbackResult
) {
  try {
    await supabase.from('sms_logs').insert({
      user_id: userId,
      phone_number: message.to,
      message: message.text,
      status: result.finalResult.success ? 'sent' : 'failed',
      gateway_used: result.finalResult.gateway,
      gateway_message_id: result.finalResult.messageId,
      error_message: result.finalResult.error,
      cost_credits: result.finalResult.cost || 1,
      fallback_attempted: result.fallbackUsed,
      country_code: detectCountryFromPhone(message.to),
      gateway_priority: result.attempts[0]?.gateway === result.finalResult.gateway ? 'primary' : 'fallback',
      payload: {
        attempts: result.attempts,
        countryDetected: detectCountryFromPhone(message.to),
        fallbackUsed: result.fallbackUsed,
        senderIdUsed: result.finalResult.gateway === 'bulkgate' ? 'SMSAO' : message.from,
        routingDecision: {
          countryCode: detectCountryFromPhone(message.to),
          selectedGateway: result.attempts[0]?.gateway,
          fallbackGateway: result.attempts[1]?.gateway,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Failed to log SMS attempt:', error);
  }
}

async function updateUserCredits(supabase: any, userId: string, creditsDelta: number) {
  try {
    const { error } = await supabase.rpc('add_user_credits', {
      user_id: userId,
      credit_amount: creditsDelta
    });

    if (error) {
      console.error('Failed to update user credits:', error);
    }
  } catch (error) {
    console.error('Error updating credits:', error);
  }
}
