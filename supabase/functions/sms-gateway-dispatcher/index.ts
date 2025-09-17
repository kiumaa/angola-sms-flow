import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSMessage {
  to: string;
  from?: string;
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
  effectiveSenderId?: string;
  overrideUsed?: string;
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

    console.log('🚀 SMS Gateway Dispatcher called for user:', userId);

    // Check for manual gateway override first
    const { data: overrideType } = await supabase.rpc('get_active_gateway_override');
    console.log('🎯 Active gateway override:', overrideType);

    // Get effective sender ID for user
    const { data: effectiveSenderId } = await supabase.rpc('get_effective_sender_id', {
      _user_id: userId,
      _requested_sender_id: message.from || null
    });
    console.log('📋 Effective sender ID:', effectiveSenderId);

    // Update message with effective sender ID
    const messageWithSender: SMSMessage = {
      ...message,
      from: effectiveSenderId || 'SMSAO'
    };

    // Get gateway credentials from secrets
    const bulkSMSTokenId = Deno.env.get('BULKSMS_TOKEN_ID');
    const bulkSMSTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET');
    const bulkGateApiKey = Deno.env.get('BULKGATE_API_KEY');

    // Enhanced country detection with validation
    const countryCode = detectCountryFromPhone(messageWithSender.to);
    console.log(`🌍 Country detected: ${countryCode} for number: ${messageWithSender.to}`);
    
    // Special handling for Angola
    if (countryCode === 'AO') {
      console.log(`🇦🇴 Angola SMS - Enhanced BulkGate routing activated`);
    }

    let selectedGateway: string;
    let fallbackGateway: string;

    // Apply manual override logic
    if (overrideType && overrideType !== 'none') {
      if (overrideType === 'force_bulksms') {
        selectedGateway = 'bulksms';
        fallbackGateway = 'bulkgate';
        console.log('🔧 Manual override: Forcing BulkSMS');
      } else if (overrideType === 'force_bulkgate') {
        selectedGateway = 'bulkgate';
        fallbackGateway = 'bulksms';
        console.log('🔧 Manual override: Forcing BulkGate');
      } else {
        // Fallback to automatic routing
        selectedGateway = selectGatewayForCountry(countryCode);
        fallbackGateway = selectedGateway === 'bulkgate' ? 'bulksms' : 'bulkgate';
      }
    } else {
      // Automatic routing
      selectedGateway = selectGatewayForCountry(countryCode);
      fallbackGateway = selectedGateway === 'bulkgate' ? 'bulksms' : 'bulkgate';
    }

    console.log(`🎯 Selected gateway: ${selectedGateway}, Fallback: ${fallbackGateway}`);

    const attempts: FallbackResult['attempts'] = [];
    let finalResult: SMSResult;
    let fallbackUsed = false;

    // Try primary gateway
    const primaryResult = await sendViaSingleGateway(
      selectedGateway,
      messageWithSender,
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
        messageWithSender,
        { bulkSMSTokenId, bulkSMSTokenSecret, bulkGateApiKey }
      );

      attempts.push({
        gateway: fallbackGateway,
        result: fallbackResult,
        timestamp: new Date().toISOString()
      });

      finalResult = fallbackResult;
    }

    // Log the SMS attempt with enhanced details
    await logSMSAttempt(supabase, userId, messageWithSender, {
      finalResult,
      attempts,
      fallbackUsed,
      effectiveSenderId: messageWithSender.from,
      overrideUsed: overrideType && overrideType !== 'none' ? overrideType : undefined
    });

    // Update user credits if successful
    if (finalResult.success && finalResult.cost) {
      await updateUserCredits(supabase, userId, -finalResult.cost);
    }

    const response: FallbackResult = {
      finalResult,
      attempts,
      fallbackUsed,
      effectiveSenderId: messageWithSender.from,
      overrideUsed: overrideType && overrideType !== 'none' ? overrideType : undefined
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

// Enhanced country detection with better Angola support
function detectCountryFromPhone(phoneNumber: string): string {
  const normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Angola - Enhanced detection
  if (normalized.startsWith('+244') || normalized.startsWith('244') || 
      (normalized.length === 9 && normalized.startsWith('9'))) {
    return 'AO'; // Angola
  }
  
  // Other PALOP countries
  if (normalized.startsWith('+258') || normalized.startsWith('258')) {
    return 'MZ'; // Mozambique
  }

  if (normalized.startsWith('+238') || normalized.startsWith('238')) {
    return 'CV'; // Cape Verde
  }

  if (normalized.startsWith('+245') || normalized.startsWith('245')) {
    return 'GW'; // Guinea-Bissau
  }

  if (normalized.startsWith('+239') || normalized.startsWith('239')) {
    return 'ST'; // São Tomé and Príncipe
  }

  if (normalized.startsWith('+670') || normalized.startsWith('670')) {
    return 'TL'; // Timor-Leste
  }

  // Portugal
  if (normalized.startsWith('+351') || normalized.startsWith('351')) {
    return 'PT'; // Portugal
  }

  // Brazil
  if (normalized.startsWith('+55') || normalized.startsWith('55')) {
    return 'BR'; // Brazil
  }

  console.log(`⚠️ Unknown country for phone: ${phoneNumber}`);
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
    console.log(`🚀 BulkSMS: Sending to ${message.to} with Sender ID: ${message.from}`);
    
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
    console.log(`📨 BulkSMS Response:`, { status: response.status, data });

    if (response.ok && data.length > 0) {
      console.log(`✅ BulkSMS: Message sent successfully - ID: ${data[0].id}`);
      return {
        success: true,
        messageId: data[0].id,
        gateway: 'bulksms',
        cost: 1 // Default cost
      };
    } else {
      console.error(`❌ BulkSMS: Send failed -`, data);
      return {
        success: false,
        error: data.detail || 'Failed to send via BulkSMS',
        gateway: 'bulksms'
      };
    }
  } catch (error) {
    console.error(`💥 BulkSMS: Connection error -`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'BulkSMS connection error',
      gateway: 'bulksms'
    };
  }
}

// Enhanced Angola phone validation
function validateAngolaPhone(phoneNumber: string): boolean {
  const normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Angola: +244 9XXXXXXXX (mobile) or +244 2XXXXXXXX (landline)
  const angolaPatterns = [
    /^\+244[9][0-9]{8}$/,     // +244 9XXXXXXXX (mobile)
    /^244[9][0-9]{8}$/,       // 244 9XXXXXXXX (mobile)
    /^[9][0-9]{8}$/,          // 9XXXXXXXX (local mobile)
    /^\+244[2][0-9]{7}$/,     // +244 2XXXXXXX (landline)
    /^244[2][0-9]{7}$/,       // 244 2XXXXXXX (landline)
  ];
  
  return angolaPatterns.some(pattern => pattern.test(normalized));
}

async function sendViaBulkGate(message: SMSMessage, apiKey: string): Promise<SMSResult> {
  try {
    console.log(`🚀 BulkGate Enhanced: Sending to ${message.to}`);
    
    // Enhanced phone validation for Angola
    const countryCode = detectCountryFromPhone(message.to);
    if (countryCode === 'AO' && !validateAngolaPhone(message.to)) {
      console.warn(`⚠️ BulkGate Angola: Invalid phone format: ${message.to}`);
      return {
        success: false,
        error: 'Formato de número angolano inválido. Use +244 9XXXXXXXX para móvel',
        gateway: 'bulkgate'
      };
    }

    // Determine API format and prioritize v2
    let isV2Format = !apiKey.includes(':');
    const senderToUse = message.from || 'SMSAO';
    
    console.log(`📱 Angola optimized - Sender: ${senderToUse}, Phone: ${message.to}`);

    // PRIORITY: Try v2 API first if token format allows
    if (isV2Format) {
      console.log('🎯 BulkGate: Attempting v2 API...');
      
      const v2Response = await fetch('https://portal.bulkgate.com/api/2.0/application/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SMS-AO-Platform/2.0'
        },
        body: JSON.stringify({
          recipients: [{
            number: message.to.replace('+', ''),
            country: 'ao'
          }],
          text: message.text,
          sender_id: senderToUse,
          sender_type: 'text',
          unicode: /[^\x00-\x7F]/.test(message.text)
        })
      });

      const v2Data = await v2Response.json();
      console.log(`📨 BulkGate v2: Status ${v2Response.status}`, v2Data);

      if (v2Response.ok && v2Data.data && Array.isArray(v2Data.data) && v2Data.data.length > 0) {
        const result = v2Data.data[0];
        if (result.status === 'accepted') {
          console.log(`✅ BulkGate v2: Success - ID: ${result.sms_id}`);
          return {
            success: true,
            messageId: result.sms_id?.toString(),
            gateway: 'bulkgate',
            cost: calculateAngolaMessageCost(message.text)
          };
        } else {
          console.error(`❌ BulkGate v2: Message not accepted -`, result);
          return {
            success: false,
            error: result.error || 'Message not accepted by BulkGate v2',
            gateway: 'bulkgate'
          };
        }
      } else if (v2Response.status === 401 || v2Response.status === 404) {
        console.log('🔄 BulkGate v2 failed, falling back to v1...');
        // Continue to v1 fallback
      } else {
        console.error(`❌ BulkGate v2 Error:`, v2Data);
        return {
          success: false,
          error: v2Data.error?.message || `BulkGate v2 error: ${v2Response.status}`,
          gateway: 'bulkgate'
        };
      }
    }

    // FALLBACK: v1 API with enhanced Angola support
    console.log('📞 BulkGate: Using v1 API (Angola optimized)...');
    
    const parts = apiKey.split(':');
    if (parts.length !== 2) {
      console.error('❌ BulkGate: Invalid credentials format for v1');
      return {
        success: false,
        error: 'Formato de credenciais inválido para BulkGate v1',
        gateway: 'bulkgate'
      };
    }

    const [applicationId, applicationToken] = parts;
    console.log(`🔑 BulkGate v1: ${applicationId}:${'*'.repeat(applicationToken.length)}`);

    const v1Response = await fetch('https://portal.bulkgate.com/api/1.0/simple/transactional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SMS-AO-Platform/1.0'
      },
      body: JSON.stringify({
        application_id: applicationId,
        application_token: applicationToken,
        number: message.to.replace('+', ''),
        text: message.text,
        country: 'ao', // Specific for Angola
        sender_id: 'text',
        sender_id_value: senderToUse,
        unicode: /[^\x00-\x7F]/.test(message.text) // Auto-detect unicode
      })
    });

    const v1Data = await v1Response.json();
    console.log(`📨 BulkGate v1: Status ${v1Response.status}`, JSON.stringify(v1Data, null, 2));

    if (v1Response.ok && v1Data.data && Array.isArray(v1Data.data) && v1Data.data.length > 0) {
      const result = v1Data.data[0];
      if (result.status === 'accepted') {
        console.log(`✅ BulkGate v1: Angola SMS sent - ID: ${result.sms_id}`);
        return {
          success: true,
          messageId: result.sms_id?.toString(),
          gateway: 'bulkgate',
          cost: calculateAngolaMessageCost(message.text)
        };
      } else {
        console.error(`❌ BulkGate v1: Send failed -`, result);
        return {
          success: false,
          error: result.error || 'Message not accepted by BulkGate',
          gateway: 'bulkgate'
        };
      }
    } else {
      console.error(`❌ BulkGate v1: API error -`, v1Data);
      return {
        success: false,
        error: v1Data.error?.message || `BulkGate v1 error: ${v1Response.status}`,
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

// Enhanced cost calculation for Angola
function calculateAngolaMessageCost(text: string): number {
  const length = text.length;
  const isUnicode = /[^\x00-\x7F]/.test(text);
  
  // SMS pricing for Angola (BulkGate specific)
  if (isUnicode) {
    // Unicode messages have lower character limit
    return Math.ceil(length / 70);
  } else {
    // Standard SMS
    return Math.ceil(length / 160);
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
        senderIdUsed: result.effectiveSenderId || 'SMSAO',
        overrideUsed: result.overrideUsed || null,
        routingDecision: {
          countryCode: detectCountryFromPhone(message.to),
          selectedGateway: result.attempts[0]?.gateway,
          fallbackGateway: result.attempts[1]?.gateway,
          overrideType: result.overrideUsed || 'automatic',
          senderIdResolution: {
            requested: message.from,
            effective: result.effectiveSenderId,
            source: result.effectiveSenderId === 'SMSAO' ? 'default' : 'user_approved'
          },
          timestamp: new Date().toISOString()
        }
      }
    });

    console.log('📝 SMS attempt logged with override and sender ID tracking');
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
