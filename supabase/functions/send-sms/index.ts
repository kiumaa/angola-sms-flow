import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendSMSRequest {
  campaignId: string
  recipients: string[]
  message: string
  senderId?: string
}

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

interface GatewayConfig {
  id: string;
  name: string;
  displayName: string;
  isActive: boolean;
  isPrimary: boolean;
  apiEndpoint: string;
  authType: 'basic' | 'bearer';
}

// SMS Gateway implementations
class BulkSMSGateway {
  name = 'bulksms';
  displayName = 'BulkSMS';
  
  constructor(private tokenId: string, private tokenSecret: string) {}

  private getAuthHeader(): string {
    return `Basic ${btoa(`${this.tokenId}:${this.tokenSecret}`)}`;
  }

  async sendSingle(message: SMSMessage): Promise<SMSResult> {
    try {
      const response = await fetch('https://api.bulksms.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify({
          to: message.to,
          body: message.text,
          from: message.from
        })
      });

      const result = await response.json();

      if (response.ok && result.id) {
        return {
          success: true,
          messageId: result.id,
          gateway: this.name,
          cost: 1
        };
      } else {
        return {
          success: false,
          error: result.detail || result.message || `HTTP ${response.status}`,
          gateway: this.name
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        gateway: this.name
      };
    }
  }
}

class BulkGateGateway {
  name = 'bulkgate';
  displayName = 'BulkGate';
  
  constructor(private apiKey: string) {}

  private getAuthHeader(): string {
    return `Bearer ${this.apiKey}`;
  }

  async sendSingle(message: SMSMessage): Promise<SMSResult> {
    try {
      const response = await fetch('https://api.bulkgate.com/v2.0/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify({
          messages: [{
            to: message.to,
            from: message.from,
            text: message.text
          }]
        })
      });

      const result = await response.json();

      if (response.ok && result.data && result.data.length > 0) {
        const messageResult = result.data[0];
        
        if (messageResult.status === 'accepted') {
          return {
            success: true,
            messageId: messageResult.id,
            gateway: this.name,
            cost: messageResult.price || 1
          };
        } else {
          return {
            success: false,
            error: messageResult.error || 'Message not accepted',
            gateway: this.name
          };
        }
      } else {
        return {
          success: false,
          error: result.error?.message || `HTTP ${response.status}`,
          gateway: this.name
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        gateway: this.name
      };
    }
  }
}

// Gateway Manager
class SMSGatewayManager {
  private gateways: Map<string, any> = new Map();
  private configs: GatewayConfig[] = [];

  initialize(credentials: { bulksmsTokenId?: string; bulksmsTokenSecret?: string; bulkgateApiKey?: string; }): void {
    this.gateways.clear();

    if (credentials.bulksmsTokenId && credentials.bulksmsTokenSecret) {
      const bulkSMSGateway = new BulkSMSGateway(credentials.bulksmsTokenId, credentials.bulksmsTokenSecret);
      this.gateways.set('bulksms', bulkSMSGateway);
    }

    if (credentials.bulkgateApiKey) {
      const bulkGateGateway = new BulkGateGateway(credentials.bulkgateApiKey);
      this.gateways.set('bulkgate', bulkGateGateway);
    }
  }

  setConfigs(configs: GatewayConfig[]): void {
    this.configs = configs;
  }

  private getPrimaryGateway(): any | null {
    const primaryConfig = this.configs.find(c => c.isPrimary && c.isActive);
    if (!primaryConfig) return null;
    return this.gateways.get(primaryConfig.name) || null;
  }

  private getFallbackGateway(): any | null {
    const activeConfigs = this.configs.filter(c => c.isActive && !c.isPrimary);
    if (activeConfigs.length === 0) return null;
    return this.gateways.get(activeConfigs[0].name) || null;
  }

  private shouldFallback(error: string): boolean {
    const fallbackErrors = [
      'insufficient credits',
      'saldo insuficiente',
      'sender id not approved',
      'timeout',
      'connection failed',
      'server error',
      'rate limit'
    ];

    const errorLower = error.toLowerCase();
    return fallbackErrors.some(err => errorLower.includes(err));
  }

  async sendWithFallback(message: SMSMessage): Promise<FallbackResult> {
    const attempts: FallbackResult['attempts'] = [];
    let finalResult: SMSResult;
    let fallbackUsed = false;

    const primaryGateway = this.getPrimaryGateway();
    const fallbackGateway = this.getFallbackGateway();

    if (!primaryGateway) {
      throw new Error('No primary gateway configured');
    }

    try {
      console.log(`Attempting to send SMS via primary gateway: ${primaryGateway.name}`);
      const primaryResult = await primaryGateway.sendSingle(message);
      
      attempts.push({
        gateway: primaryGateway.name,
        result: primaryResult,
        timestamp: new Date().toISOString()
      });

      if (primaryResult.success) {
        finalResult = primaryResult;
      } else {
        console.log(`Primary gateway failed: ${primaryResult.error}`);
        
        if (fallbackGateway && this.shouldFallback(primaryResult.error || '')) {
          console.log(`Attempting fallback to: ${fallbackGateway.name}`);
          fallbackUsed = true;
          
          try {
            const fallbackResult = await fallbackGateway.sendSingle(message);
            
            attempts.push({
              gateway: fallbackGateway.name,
              result: fallbackResult,
              timestamp: new Date().toISOString()
            });

            finalResult = fallbackResult;
          } catch (fallbackError) {
            const fallbackResult: SMSResult = {
              success: false,
              error: fallbackError.message,
              gateway: fallbackGateway.name
            };

            attempts.push({
              gateway: fallbackGateway.name,
              result: fallbackResult,
              timestamp: new Date().toISOString()
            });

            finalResult = fallbackResult;
          }
        } else {
          finalResult = primaryResult;
        }
      }
    } catch (primaryError) {
      const primaryResult: SMSResult = {
        success: false,
        error: primaryError.message,
        gateway: primaryGateway.name
      };

      attempts.push({
        gateway: primaryGateway.name,
        result: primaryResult,
        timestamp: new Date().toISOString()
      });

      if (fallbackGateway && this.shouldFallback(primaryError.message)) {
        console.log(`Primary gateway exception, attempting fallback to: ${fallbackGateway.name}`);
        fallbackUsed = true;
        
        try {
          const fallbackResult = await fallbackGateway.sendSingle(message);
          
          attempts.push({
            gateway: fallbackGateway.name,
            result: fallbackResult,
            timestamp: new Date().toISOString()
          });

          finalResult = fallbackResult;
        } catch (fallbackError) {
          const fallbackResult: SMSResult = {
            success: false,
            error: fallbackError.message,
            gateway: fallbackGateway.name
          };

          attempts.push({
            gateway: fallbackGateway.name,
            result: fallbackResult,
            timestamp: new Date().toISOString()
          });

          finalResult = fallbackResult;
        }
      } else {
        finalResult = primaryResult;
      }
    }

    return {
      finalResult,
      attempts,
      fallbackUsed
    };
  }
}

serve(async (req) => {
  console.log('SMS Function started:', new Date().toISOString())
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Processing SMS request...')
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header found')
      throw new Error('Authorization header required')
    }

    console.log('Auth header present, creating Supabase client...')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      throw new Error('User not authenticated')
    }

    console.log('User authenticated:', user.email)

    const requestBody = await req.json()
    console.log('Request body:', JSON.stringify(requestBody, null, 2))
    
    const { campaignId, recipients, message, senderId }: SendSMSRequest = requestBody

    if (!campaignId || !recipients || !message) {
      console.error('Missing required fields')
      throw new Error('Campaign ID, recipients, and message are required')
    }

    console.log(`Processing SMS campaign ${campaignId} for ${recipients.length} recipients`)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Get user credits and default sender ID
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('credits, default_sender_id')
      .eq('user_id', user.id)
      .single()

    const userCredits = profile?.credits || 0
    console.log(`User has ${userCredits} credits, needs ${recipients.length}`)
    
    if (userCredits < recipients.length) {
      throw new Error(`Insufficient credits. You have ${userCredits} credits but need ${recipients.length}`)
    }

    // Get gateway configurations
    const { data: gatewayConfigs } = await supabaseAdmin
      .from('sms_gateways')
      .select('*')
      .eq('is_active', true)
      .order('is_primary', { ascending: false })

    if (!gatewayConfigs || gatewayConfigs.length === 0) {
      throw new Error('No active SMS gateways configured')
    }

    // Initialize gateway manager
    const gatewayManager = new SMSGatewayManager()
    
    // Get credentials
    const bulksmsTokenId = Deno.env.get('BULKSMS_TOKEN_ID')
    const bulksmsTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET')
    const bulkgateApiKey = Deno.env.get('BULKGATE_API_KEY')

    gatewayManager.initialize({
      bulksmsTokenId,
      bulksmsTokenSecret,
      bulkgateApiKey
    })

    gatewayManager.setConfigs(gatewayConfigs.map(config => ({
      id: config.id,
      name: config.name,
      displayName: config.display_name,
      isActive: config.is_active,
      isPrimary: config.is_primary,
      apiEndpoint: config.api_endpoint,
      authType: config.auth_type
    })))

    let totalSent = 0
    let totalFailed = 0
    const smsLogs = []

    // Send SMS to each recipient using gateway manager
    for (const phoneNumber of recipients) {
      try {
        console.log(`Sending SMS to ${phoneNumber}`)

        const smsMessage: SMSMessage = {
          to: phoneNumber,
          from: senderId || profile?.default_sender_id || 'SMSao',
          text: message,
          campaignId
        }

        const result = await gatewayManager.sendWithFallback(smsMessage)
        
        console.log(`SMS result for ${phoneNumber}:`, {
          success: result.finalResult.success,
          gateway: result.finalResult.gateway,
          fallbackUsed: result.fallbackUsed,
          attempts: result.attempts.length
        })

        if (result.finalResult.success) {
          totalSent++
          smsLogs.push({
            campaign_id: campaignId,
            user_id: user.id,
            phone_number: phoneNumber,
            message: message,
            status: 'sent',
            cost_credits: result.finalResult.cost || 1,
            sent_at: new Date().toISOString(),
            gateway_used: result.finalResult.gateway,
            gateway_message_id: result.finalResult.messageId,
            fallback_attempted: result.fallbackUsed,
            original_gateway: result.attempts[0]?.gateway
          })
          console.log(`✅ SMS sent successfully to ${phoneNumber} via ${result.finalResult.gateway}`)
        } else {
          totalFailed++
          console.error(`❌ Failed to send SMS to ${phoneNumber}:`, result.finalResult.error)
          
          smsLogs.push({
            campaign_id: campaignId,
            user_id: user.id,
            phone_number: phoneNumber,
            message: message,
            status: 'failed',
            error_message: result.finalResult.error,
            cost_credits: 0,
            gateway_used: result.finalResult.gateway,
            fallback_attempted: result.fallbackUsed,
            original_gateway: result.attempts[0]?.gateway
          })
        }
      } catch (error) {
        console.error(`Exception sending SMS to ${phoneNumber}:`, error)
        totalFailed++
        smsLogs.push({
          campaign_id: campaignId,
          user_id: user.id,
          phone_number: phoneNumber,
          message: message,
          status: 'failed',
          error_message: error.message,
          cost_credits: 0
        })
      }
    }

    console.log(`SMS sending completed: ${totalSent} sent, ${totalFailed} failed`)

    // Insert SMS logs
    if (smsLogs.length > 0) {
      const { error: logsError } = await supabaseAdmin
        .from('sms_logs')
        .insert(smsLogs)
      
      if (logsError) {
        console.error('Error inserting SMS logs:', logsError)
      } else {
        console.log('SMS logs inserted successfully')
      }
    }

    // Deduct credits (only for sent messages)
    if (totalSent > 0) {
      const { error: creditsError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          credits: userCredits - totalSent,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (creditsError) {
        console.error('Error updating credits:', creditsError)
      } else {
        console.log(`Credits updated: ${userCredits} -> ${userCredits - totalSent}`)
      }
    }

    // Update campaign status
    const { error: campaignError } = await supabaseAdmin
      .from('sms_campaigns')
      .update({
        status: 'completed',
        total_sent: totalSent,
        total_failed: totalFailed,
        total_recipients: recipients.length,
        credits_used: totalSent,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (campaignError) {
      console.error('Error updating campaign:', campaignError)
    } else {
      console.log('Campaign status updated successfully')
    }

    const response = {
      success: true,
      totalSent,
      totalFailed,
      creditsUsed: totalSent,
      remainingCredits: userCredits - totalSent
    }

    console.log('Sending success response:', JSON.stringify(response, null, 2))

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in send-sms function:', error)
    const errorResponse = { error: error.message }
    console.log('Sending error response:', JSON.stringify(errorResponse, null, 2))
    
    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})