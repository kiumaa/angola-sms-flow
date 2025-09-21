import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Phone normalization utilities
const ANGOLA_COUNTRY_CODE = '+244';

interface PhoneNormalizationResult {
  ok: boolean;
  e164: string;
  original: string;
  error?: string;
}

function normalizePhoneInternational(phone: string): PhoneNormalizationResult {
  const original = phone;
  console.log(`🔄 Normalizing phone: ${phone}`);
  
  // Clean input but preserve + for international format
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');
  console.log(`🧹 Cleaned phone: ${cleaned}`);

  // If already starts with +, validate international format
  if (cleaned.startsWith('+')) {
    if (/^\+[1-9][0-9]{6,14}$/.test(cleaned)) {
      console.log(`✅ Valid international format: ${cleaned}`);
      return { ok: true, e164: cleaned, original };
    } else {
      console.log(`❌ Invalid international format: ${cleaned}`);
      return { ok: false, e164: '', original, error: 'Formato internacional inválido' };
    }
  }

  // Angola specific patterns (priority for local users)
  if (/^9\d{8}$/.test(cleaned)) {
    const result = `${ANGOLA_COUNTRY_CODE}${cleaned}`;
    console.log(`✅ Normalized as Angola number: ${result}`);
    return { ok: true, e164: result, original };
  }

  if (/^2449\d{8}$/.test(cleaned)) {
    const result = `+${cleaned}`;
    console.log(`✅ Normalized as Angola number: ${result}`);
    return { ok: true, e164: result, original };
  }

  // International patterns for testing/admin use
  const internationalPatterns = [
    // Portugal: +351XXXXXXXXX
    { regex: /^351([0-9]{9})$/, format: (match: RegExpMatchArray) => `+351${match[1]}` },
    // Brazil: +55XXXXXXXXXXX 
    { regex: /^55([0-9]{10,11})$/, format: (match: RegExpMatchArray) => `+55${match[1]}` },
    // Mozambique: +258XXXXXXXXX
    { regex: /^258([0-9]{9})$/, format: (match: RegExpMatchArray) => `+258${match[1]}` },
    // Cape Verde: +238XXXXXXX
    { regex: /^238([0-9]{7})$/, format: (match: RegExpMatchArray) => `+238${match[1]}` },
  ];

  for (const pattern of internationalPatterns) {
    const match = cleaned.match(pattern.regex);
    if (match) {
      const result = pattern.format(match);
      console.log(`✅ Normalized as international number: ${result}`);
      return { ok: true, e164: result, original };
    }
  }

  console.log(`❌ Failed to normalize phone: ${phone}`);
  return {
    ok: false,
    e164: '',
    original,
    error: 'Formato inválido. Suporta Angola (+244), Portugal (+351), Brasil (+55), Moçambique (+258), Cabo Verde (+238)'
  };
}

// SMS segment calculation utilities
const GSM_7BIT_CHARS = new Set([
  '@', '£', '$', '¥', 'è', 'é', 'ù', 'ì', 'ò', 'Ç', '\n', 'Ø', 'ø', '\r', 'Å', 'å',
  'Δ', '_', 'Φ', 'Γ', 'Λ', 'Ω', 'Π', 'Ψ', 'Σ', 'Θ', 'Ξ', '\x1B', 'Æ', 'æ', 'ß', 'É',
  ' ', '!', '"', '#', '¤', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?',
  '¡', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O',
  'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'Ä', 'Ö', 'Ñ', 'Ü', '§',
  '¿', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
  'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ñ', 'ü', 'à'
]);

const GSM_EXTENDED_CHARS = new Set(['\\', '^', '{', '}', '[', ']', '~', '|', '€']);

function isGSM7Compatible(text: string): boolean {
  for (const char of text) {
    if (!GSM_7BIT_CHARS.has(char) && !GSM_EXTENDED_CHARS.has(char)) {
      return false;
    }
  }
  return true;
}

function countGSMCharacters(text: string): number {
  let count = 0;
  for (const char of text) {
    count += GSM_EXTENDED_CHARS.has(char) ? 2 : 1;
  }
  return count;
}

function calculateSMSSegments(text: string): { encoding: string; segments: number; characters: number } {
  if (!text || text.length === 0) {
    return { encoding: 'GSM7', segments: 0, characters: 0 };
  }

  const isUnicode = !isGSM7Compatible(text);
  const characters = isUnicode ? text.length : countGSMCharacters(text);

  if (isUnicode) {
    const singleLimit = 70;
    const multiLimit = 67;
    const segments = characters <= singleLimit ? 1 : Math.ceil(characters / multiLimit);
    return { encoding: 'UCS2', segments, characters };
  } else {
    const singleLimit = 160;
    const multiLimit = 153;
    const segments = characters <= singleLimit ? 1 : Math.ceil(characters / multiLimit);
    return { encoding: 'GSM7', segments, characters };
  }
}

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): { allowed: boolean; error?: string } {
  const now = Date.now();
  const windowMs = 5 * 1000; // 5 seconds
  const maxRequests = 1;
  
  const existing = rateLimitMap.get(userId);
  
  if (!existing || now >= existing.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (existing.count >= maxRequests) {
    return { 
      allowed: false, 
      error: `Rate limit exceeded. Try again in ${Math.ceil((existing.resetTime - now) / 1000)} seconds.`
    };
  }
  
  existing.count++;
  rateLimitMap.set(userId, existing);
  return { allowed: true };
}

interface SendQuickBody {
  sender_id?: string;
  recipients?: string[];
  message: string;
  estimate?: { segments: number; credits: number };
  // Alternative parameters for backward compatibility
  phoneNumber?: string;
  isTest?: boolean;
  user_id?: string;
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
    return new Response(JSON.stringify({ 
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed' 
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    console.log('=== Quick SMS Function Started ===');
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body early to validate
    let body: SendQuickBody;
    try {
      body = await req.json();
      console.log('Request body parsed:', body);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return new Response(JSON.stringify({
        error: 'INVALID_PAYLOAD',
        message: 'Invalid JSON payload'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate basic payload structure
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({
        error: 'INVALID_PAYLOAD',
        message: 'Request body must be a valid JSON object'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'UNAUTHORIZED',
        message: 'Authorization header required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({
        error: 'UNAUTHORIZED',
        message: 'Invalid or expired token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('User authenticated:', user.id);

    // Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: 'RATE_LIMIT_EXCEEDED',
        message: rateLimit.error || 'Too many requests'
      }), {
        status: 429,
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
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({
        error: 'USER_NOT_FOUND',
        message: 'User profile not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('User profile found:', profile);

    // Extract and validate input - support multiple parameter formats
    const senderId = (body.sender_id || 'SMSAO').trim();
    const message = (body.message || '').trim();
    
    // Support both recipients array and single phoneNumber for compatibility
    let rawRecipients: string[] = [];
    if (Array.isArray(body.recipients)) {
      rawRecipients = body.recipients;
    } else if (body.phoneNumber && typeof body.phoneNumber === 'string') {
      rawRecipients = [body.phoneNumber];
    } else if (body.recipients && typeof body.recipients === 'string') {
      rawRecipients = [body.recipients];
    }

    // Validate required fields
    if (!message) {
      return new Response(JSON.stringify({
        error: 'INVALID_PAYLOAD',
        message: 'Mensagem é obrigatória'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (rawRecipients.length === 0) {
      return new Response(JSON.stringify({
        error: 'INVALID_PAYLOAD',
        message: 'Lista de destinatários não pode estar vazia'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Normalize and validate phone numbers
    const validRecipients = new Set<string>();
    const invalidNumbers: string[] = [];

    for (const rawPhone of rawRecipients) {
      if (typeof rawPhone === 'string') {
        const normalized = normalizePhoneInternational(rawPhone);
        if (normalized.ok) {
          validRecipients.add(normalized.e164);
          console.log(`✅ ${rawPhone} → ${normalized.e164}`);
        } else {
          invalidNumbers.push(rawPhone);
          console.log(`❌ ${rawPhone} → ${normalized.error}`);
        }
      } else {
        invalidNumbers.push(String(rawPhone));
      }
    }

    const recipients = Array.from(validRecipients);

    if (recipients.length === 0) {
      return new Response(JSON.stringify({
        error: 'INVALID_NUMBERS',
        message: 'Nenhum número válido encontrado',
        invalid_numbers: invalidNumbers
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Valid recipients: ${recipients.length}, Invalid: ${invalidNumbers.length}`);

    // Recalculate segments and credits on backend
    const segmentInfo = calculateSMSSegments(message);
    const totalCreditsRequired = segmentInfo.segments * recipients.length;

    console.log(`Segment info:`, segmentInfo);
    console.log(`Total credits required: ${totalCreditsRequired}, Available: ${profile.credits}`);

    // Check if user has enough credits
    if (profile.credits < totalCreditsRequired) {
      return new Response(JSON.stringify({
        error: 'INSUFFICIENT_CREDITS',
        message: 'Créditos insuficientes',
        required: totalCreditsRequired,
        available: profile.credits,
        recipients: recipients.length,
        segments: segmentInfo.segments
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get BulkSMS credentials
    const bulkSmsTokenId = Deno.env.get('BULKSMS_TOKEN_ID');
    const bulkSmsTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET');

    console.log(`🔑 BulkSMS Token ID: ${bulkSmsTokenId ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🔑 BulkSMS Token Secret: ${bulkSmsTokenSecret ? '✅ Configured' : '❌ Missing'}`);

    if (!bulkSmsTokenId || !bulkSmsTokenSecret) {
      console.error('❌ BulkSMS credentials not configured in Supabase Vault');
      return new Response(JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'SMS gateway not configured',
        details: 'Please configure BULKSMS_TOKEN_ID and BULKSMS_TOKEN_SECRET in Supabase Vault'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing Quick SMS: ${recipients.length} recipients, ${segmentInfo.segments} segments each, ${totalCreditsRequired} total credits`);

    // Create a quick send job record
    const { data: job, error: jobError } = await supabase
      .from('quick_send_jobs')
      .insert({
        account_id: profile.id,
        created_by: user.id,
        message: message,
        sender_id: senderId,
        total_recipients: recipients.length,
        segments_avg: segmentInfo.segments,
        credits_estimated: totalCreditsRequired,
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return new Response(JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Failed to create send job'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Quick send job created:', job.id);

    // Debit credits BEFORE sending (atomic transaction)
    console.log(`🏦 Attempting to debit ${totalCreditsRequired} credits from account ${profile.id}`);
    console.log(`💰 User has ${profile.credits} credits available`);
    
    const { error: debitError } = await supabase.rpc('debit_user_credits', {
      _account_id: profile.id,
      _amount: totalCreditsRequired,
      _reason: `Quick SMS send (${recipients.length} recipients, ${segmentInfo.segments} segments each)`,
      _meta: { job_id: job.id }
    });

    if (debitError) {
      console.error('❌ Error debiting credits:', debitError);
      console.error('❌ Full error details:', JSON.stringify(debitError, null, 2));
      
      // Mark job as failed
      await supabase
        .from('quick_send_jobs')
        .update({ status: 'failed' })
        .eq('id', job.id);

      return new Response(JSON.stringify({
        error: 'CREDIT_DEBIT_FAILED',
        message: 'Failed to reserve credits for sending',
        details: debitError.message,
        debug: {
          user_id: user.id,
          profile_id: profile.id,
          credits_available: profile.credits,
          credits_required: totalCreditsRequired,
          error_code: debitError.code,
          error_hint: debitError.hint
        }
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Credits debited successfully');

    // Prepare authentication header for BulkSMS
    const credentials = btoa(`${bulkSmsTokenId}:${bulkSmsTokenSecret || ''}`);
    const bulkSmsAuthHeader = `Basic ${credentials}`;

    // Send messages in batches of 100
    const batches = chunk(recipients, 100);
    const results: any[] = [];
    let totalSent = 0;
    let actualCreditCost = 0;
    let totalFailed = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} recipients`);

      // Prepare BulkSMS payload
      const messages: BulkSMSMessage[] = batch.map(recipient => ({
        to: recipient,
        body: message,
        from: senderId
      }));

      try {
        console.log(`📤 Sending batch to BulkSMS: ${batch.length} messages`);
        const startTime = Date.now();
        
        const response = await fetch(BULKSMS_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': bulkSmsAuthHeader,
          },
          body: JSON.stringify(messages)
        });

        const responseTime = Date.now() - startTime;
        console.log(`📊 BulkSMS API response: ${response.status} ${response.statusText} (${responseTime}ms)`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`❌ BulkSMS API error (${response.status}):`, errorData);
          
          // Log failed batch
          for (const recipient of batch) {
            totalFailed++;
            await supabase.from('quick_send_targets').insert({
              job_id: job.id,
              phone_e164: recipient,
              rendered_message: message,
              segments: segmentInfo.segments,
              status: 'failed',
              error_code: `HTTP_${response.status}`,
              error_detail: errorData.detail?.message || `HTTP ${response.status}`
            });
          }

          // If this is a critical API error, abort
          if (response.status >= 400 && response.status < 500) {
            throw new Error(`BulkSMS API error: ${errorData.detail?.message || response.statusText}`);
          }
          
          continue; // Continue with next batch for server errors
        }

        const responseData = await response.json();
        console.log(`✅ BulkSMS batch response: ${Array.isArray(responseData) ? responseData.length : 'not array'} messages processed`);

        // Process successful responses
        if (Array.isArray(responseData)) {
          for (const smsResponse of responseData as BulkSMSResponse[]) {
            const isSuccess = smsResponse.status?.type === 'ACCEPTED';
            if (isSuccess) {
              totalSent++;
              actualCreditCost += smsResponse.creditCost || segmentInfo.segments;
            } else {
              totalFailed++;
            }

            // Log each SMS attempt
            await supabase.from('quick_send_targets').insert({
              job_id: job.id,
              phone_e164: smsResponse.to,
              rendered_message: smsResponse.body,
              segments: smsResponse.numberOfParts || segmentInfo.segments,
              status: isSuccess ? 'sent' : 'failed',
              bulksms_message_id: smsResponse.id,
              error_code: !isSuccess ? smsResponse.status?.type : null,
              error_detail: !isSuccess ? `${smsResponse.status?.type}: ${smsResponse.status?.subtype}` : null,
              sent_at: isSuccess ? new Date().toISOString() : null
            });
          }
          results.push(responseData);
        }

      } catch (error: any) {
        console.error('Error sending batch to BulkSMS:', error);
        
        // Log network/system failures
        for (const recipient of batch) {
          totalFailed++;
          await supabase.from('quick_send_targets').insert({
            job_id: job.id,
            phone_e164: recipient,
            rendered_message: message,
            segments: segmentInfo.segments,
            status: 'failed',
            error_code: 'NETWORK_ERROR',
            error_detail: `Network error: ${error.message}`
          });
        }

        // If no messages were sent at all, return error
        if (totalSent === 0) {
          // Refund the debited credits
          await supabase.rpc('add_user_credits', {
            user_id: user.id,
            credit_amount: totalCreditsRequired
          });

          // Mark job as failed
          await supabase
            .from('quick_send_jobs')
            .update({ 
              status: 'failed',
              completed_at: new Date().toISOString()
            })
            .eq('id', job.id);

          return new Response(JSON.stringify({
            error: 'BULKSMS_FAILURE',
            message: 'Failed to send SMS via gateway',
            details: error.message
          }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Update job with final results
    await supabase
      .from('quick_send_jobs')
      .update({
        status: totalSent > 0 ? 'completed' : 'failed',
        credits_spent: actualCreditCost,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    // If we over-debited credits (rare case where actual cost < estimated), refund the difference
    const creditDifference = totalCreditsRequired - actualCreditCost;
    if (creditDifference > 0) {
      console.log(`Refunding ${creditDifference} credits (over-debited)`);
      await supabase.rpc('add_user_credits', {
        user_id: user.id,
        credit_amount: creditDifference
      });
    }

    console.log(`🎉 Quick SMS completed: ${totalSent} sent, ${totalFailed} failed, ${actualCreditCost} credits used`);

    return new Response(JSON.stringify({
      success: true,
      sent: totalSent,
      failed: totalFailed,
      total_recipients: recipients.length,
      credits_debited: actualCreditCost,
      segments: segmentInfo.segments,
      encoding: segmentInfo.encoding,
      job_id: job.id,
      invalid_numbers: invalidNumbers.length > 0 ? invalidNumbers : undefined
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in send-quick-sms function:', error);
    return new Response(JSON.stringify({
      error: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});