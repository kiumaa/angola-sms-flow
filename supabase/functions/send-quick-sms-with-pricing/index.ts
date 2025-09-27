// Esta nova versão da send-quick-sms inclui sistema de multiplicadores por país
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalização internacional de telefones
interface PhoneNormalizationResult {
  ok: boolean;
  e164: string;
  country?: { code: string; name: string; };
  error?: string;
}

function normalizePhoneInternational(phone: string): PhoneNormalizationResult {
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Detectar país baseado no prefixo
  const countries = [
    { code: '+244', name: 'Angola', regex: /^(\+244|244|0)?([9][0-9]{8})$/ },
    { code: '+258', name: 'Moçambique', regex: /^(\+258|258)?([8][0-9]{8})$/ },
    { code: '+238', name: 'Cabo Verde', regex: /^(\+238|238)?([5-9][0-9]{6})$/ },
    { code: '+239', name: 'São Tomé e Príncipe', regex: /^(\+239|239)?([9][0-9]{6})$/ },
    { code: '+245', name: 'Guiné-Bissau', regex: /^(\+245|245)?([5-9][0-9]{6})$/ }
  ];
  
  for (const country of countries) {
    const match = cleaned.match(country.regex);
    if (match) {
      return {
        ok: true,
        e164: `${country.code}${match[2]}`,
        country: { code: country.code, name: country.name }
      };
    }
  }
  
  return { ok: false, e164: '', error: 'Número não reconhecido' };
}

// Cálculo de segmentos SMS
function calculateSMSSegments(text: string): { encoding: string; segments: number; characters: number } {
  const gsmChars = /^[A-Za-z0-9@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~]|€]*$/;
  
  if (gsmChars.test(text)) {
    // GSM 7-bit
    if (text.length <= 160) return { encoding: 'GSM7', segments: 1, characters: text.length };
    return { encoding: 'GSM7', segments: Math.ceil(text.length / 153), characters: text.length };
  } else {
    // UCS-2 (Unicode)
    if (text.length <= 70) return { encoding: 'UCS2', segments: 1, characters: text.length };
    return { encoding: 'UCS2', segments: Math.ceil(text.length / 67), characters: text.length };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const body = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user profile
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

    // Extract request data
    const senderId = (body.sender_id || 'SMSAO').trim();
    const message = (body.message || '').trim();
    let rawRecipients: string[] = [];
    
    if (Array.isArray(body.recipients)) {
      rawRecipients = body.recipients;
    } else if (body.phoneNumber) {
      rawRecipients = [body.phoneNumber];
    }

    if (!message || rawRecipients.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing message or recipients' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Buscar multiplicadores por país
    const { data: countryPricing, error: pricingError } = await supabase
      .from('country_pricing')
      .select('country_code, credits_multiplier')
      .eq('is_active', true);

    if (pricingError) {
      console.error('Error fetching country pricing:', pricingError);
    }

    const pricingMap = new Map<string, number>();
    (countryPricing || []).forEach(p => {
      pricingMap.set(p.country_code, p.credits_multiplier);
    });

    // Processar números com multiplicadores
    const validNumbers: Array<{
      e164: string;
      countryCode: string;
      creditsMultiplier: number;
    }> = [];
    const invalidNumbers: string[] = [];

    for (const phone of rawRecipients) {
      const normalized = normalizePhoneInternational(phone);
      if (normalized.ok && normalized.e164) {
        const countryCode = normalized.country?.code || '+244';
        const multiplier = pricingMap.get(countryCode) || 1;
        
        validNumbers.push({
          e164: normalized.e164,
          countryCode,
          creditsMultiplier: multiplier
        });
      } else {
        invalidNumbers.push(phone);
      }
    }

    if (validNumbers.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid numbers found',
        invalid_numbers: invalidNumbers 
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Calcular créditos total com multiplicadores
    const segmentInfo = calculateSMSSegments(message);
    const totalCreditsNeeded = validNumbers.reduce((total, phoneData) => {
      return total + (segmentInfo.segments * phoneData.creditsMultiplier);
    }, 0);

    console.log(`Credits needed: ${totalCreditsNeeded}, Available: ${profile.credits}`);

    // Verificar créditos suficientes
    if (profile.credits < totalCreditsNeeded) {
      return new Response(JSON.stringify({
        error: 'INSUFFICIENT_CREDITS',
        message: 'Créditos insuficientes',
        required: totalCreditsNeeded,
        available: profile.credits
      }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Credenciais BulkSMS
    const bulkSmsTokenId = Deno.env.get('BULKSMS_TOKEN_ID');
    const bulkSmsTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET');

    if (!bulkSmsTokenId || !bulkSmsTokenSecret) {
      return new Response(JSON.stringify({ error: 'SMS gateway not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Debitar créditos antes do envio
    const { error: debitError } = await supabase.rpc('debit_user_credits', {
      _account_id: profile.id,
      _amount: totalCreditsNeeded,
      _reason: 'SMS Quick Send com multiplicadores'
    });

    if (debitError) {
      console.error('Error debiting credits:', debitError);
      return new Response(JSON.stringify({ error: 'Failed to debit credits' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar job
    const { data: job, error: jobError } = await supabase
      .from('quick_send_jobs')
      .insert({
        account_id: profile.id,
        created_by: user.id,
        message: message,
        sender_id: senderId,
        total_recipients: validNumbers.length,
        segments_avg: segmentInfo.segments,
        credits_estimated: totalCreditsNeeded,
        status: 'processing'
      })
      .select('id')
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      return new Response(JSON.stringify({ error: 'Failed to create job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Criar targets com informações de país
    const targets = validNumbers.map(phoneData => ({
      job_id: job.id,
      phone_e164: phoneData.e164,
      rendered_message: message,
      segments: segmentInfo.segments,
      status: 'queued',
      country_code: phoneData.countryCode,
      credits_multiplier: phoneData.creditsMultiplier
    }));

    const { error: targetsError } = await supabase
      .from('quick_send_targets')
      .insert(targets);

    if (targetsError) {
      console.error('Error creating targets:', targetsError);
      return new Response(JSON.stringify({ error: 'Failed to create targets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Enviar via BulkSMS
    let totalSent = 0;
    let totalFailed = 0;
    let actualCreditsSpent = 0;

    const batchSize = 100;
    for (let i = 0; i < validNumbers.length; i += batchSize) {
      const batch = validNumbers.slice(i, i + batchSize);
      
      const messages = batch.map(phoneData => ({
        to: phoneData.e164,
        body: message,
        from: senderId
      }));

      const authString = btoa(`${bulkSmsTokenId}:${bulkSmsTokenSecret}`);
      
      try {
        const response = await fetch('https://api.bulksms.com/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messages)
        });

        const bulkResponse = await response.json();
        
        if (Array.isArray(bulkResponse)) {
          for (let j = 0; j < bulkResponse.length; j++) {
            const smsResult = bulkResponse[j];
            const phoneData = batch[j];
            
            if (smsResult.status && smsResult.status.type === 'ACCEPTED') {
              totalSent++;
              const creditsUsed = segmentInfo.segments * phoneData.creditsMultiplier;
              actualCreditsSpent += creditsUsed;
              
              await supabase
                .from('quick_send_targets')
                .update({
                  status: 'sent',
                  sent_at: new Date().toISOString(),
                  bulksms_message_id: smsResult.id
                })
                .eq('job_id', job.id)
                .eq('phone_e164', phoneData.e164);
            } else {
              totalFailed++;
              
              await supabase
                .from('quick_send_targets')
                .update({
                  status: 'failed',
                  error_code: smsResult.status?.code || 'unknown',
                  error_detail: smsResult.status?.description || 'Falha no envio'
                })
                .eq('job_id', job.id)
                .eq('phone_e164', phoneData.e164);
            }
          }
        }
      } catch (error) {
        console.error('BulkSMS API error:', error);
        totalFailed += batch.length;
        
        // Marcar todos do batch como falhados
        for (const phoneData of batch) {
          await supabase
            .from('quick_send_targets')
            .update({
              status: 'failed',
              error_detail: 'API error: ' + (error instanceof Error ? error.message : 'Unknown error')
            })
            .eq('job_id', job.id)
            .eq('phone_e164', phoneData.e164);
        }
      }
    }

    // Atualizar job
    await supabase
      .from('quick_send_jobs')
      .update({
        status: 'completed',
        credits_spent: actualCreditsSpent,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    // Se houve falhas, reembolsar créditos proporcionais
    if (totalFailed > 0) {
      const failedCredits = totalCreditsNeeded - actualCreditsSpent;
      if (failedCredits > 0) {
        await supabase.rpc('add_user_credits', {
          user_id: user.id,
          credit_amount: failedCredits
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      job_id: job.id,
      total_sent: totalSent,
      total_failed: totalFailed,
      credits_spent: actualCreditsSpent,
      invalid_numbers: invalidNumbers,
      country_breakdown: validNumbers.reduce((acc, phoneData) => {
        const key = phoneData.countryCode;
        if (!acc[key]) {
          acc[key] = { count: 0, credits: 0, multiplier: phoneData.creditsMultiplier };
        }
        acc[key].count++;
        acc[key].credits += segmentInfo.segments * phoneData.creditsMultiplier;
        return acc;
      }, {} as Record<string, any>)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ 
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});