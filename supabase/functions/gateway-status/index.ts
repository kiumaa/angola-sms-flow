import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { gateway_name, test_mode } = await req.json();

    console.log(`Checking gateway status for: ${gateway_name}`);

    let status = 'offline';
    let balance = null;
    let errorMessage = null;
    const startTime = Date.now();

    try {
      if (gateway_name === 'bulksms') {
        const tokenId = Deno.env.get("BULKSMS_TOKEN_ID");
        const tokenSecret = Deno.env.get("BULKSMS_TOKEN_SECRET");
        
        if (!tokenId || !tokenSecret) {
          throw new Error("BulkSMS credentials not configured");
        }

        const authString = btoa(`${tokenId}:${tokenSecret}`);
        const response = await fetch('https://api.bulksms.com/v1/profile', {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const profileData = await response.json();
          status = 'online';
          
          // O endpoint profile já contém o balance no campo credits
          if (profileData.credits && profileData.credits.balance !== undefined) {
            balance = profileData.credits.balance;
          }
        } else {
          const errorData = await response.json();
          throw new Error(`BulkSMS API error: ${response.status} - ${errorData.detail || errorData.title || 'Unknown error'}`);
        }
      } else if (gateway_name === 'bulkgate') {
        const apiKey = Deno.env.get("BULKGATE_API_KEY");
        
        if (!apiKey) {
          throw new Error("BulkGate API key not configured");
        }

        console.log(`🔐 BulkGate API Key format: ${apiKey.substring(0, 8)}... (length: ${apiKey.length})`);

        // Reset status for fresh attempt
        status = 'offline';
        
        // PRIORITY: Try v2 API first if token format allows
        let isV2Format = apiKey.includes(':');
        let v2Success = false;
        
        if (isV2Format) {
          console.log('🎯 Attempting v2 API (applicationId:applicationToken format)...');
          
          // Extract applicationId and applicationToken from apiKey format
          const [applicationId, applicationToken] = apiKey.split(':');
          
          if (!applicationId || !applicationToken) {
            console.error('❌ Invalid v2 credential format. Expected: applicationId:applicationToken');
            throw new Error('Invalid BulkGate v2 credential format');
          }
          
          try {
            const response = await fetch('https://portal.bulkgate.com/api/2.0/application/info', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'SMS-AO-Platform/2.0'
              },
              body: JSON.stringify({
                application_id: applicationId,
                application_token: applicationToken
              }),
              signal: AbortSignal.timeout(15000)
            });

            console.log(`📊 v2 API Status: ${response.status}`);

            if (response.ok) {
              const data = await response.json();
              console.log('✅ BulkGate v2 API success:', data);
              status = 'online';
              balance = parseFloat(data.balance || 0);
              v2Success = true;
            } else {
              const errorText = await response.text();
              console.log(`🔄 v2 API failed (${response.status}), will try v1: ${errorText}`);
              // Reset status for v1 attempt
              status = 'offline';
            }
          } catch (error) {
            console.log(`🔄 v2 API error, will try v1: ${error.message}`);
            // Reset status for v1 attempt
            status = 'offline';
          }
        }
        
        // FALLBACK: Try v1 API only if v2 failed and we have proper format
        if (!v2Success && isV2Format) {
          console.log('🔄 Trying v1 API as fallback...');
          
          const parts = apiKey.split(':');
          if (parts.length !== 2) {
            throw new Error('Formato de credenciais inválido. Use: applicationId:applicationToken');
          }

          const [v1ApplicationId, v1ApplicationToken] = parts;
          console.log(`🔑 v1 Credentials: ${v1ApplicationId}:${'*'.repeat(v1ApplicationToken.length)}`);

          try {
            const response = await fetch('https://portal.bulkgate.com/api/1.0/info/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'SMS-AO-Platform/1.0'
              },
              body: JSON.stringify({
                application_id: v1ApplicationId,
                application_token: v1ApplicationToken
              }),
              signal: AbortSignal.timeout(15000)
            });

            console.log(`📊 v1 API Status: ${response.status}`);

            if (response.ok) {
              const data = await response.json();
              console.log('📋 v1 Response:', JSON.stringify(data, null, 2));
              
              if (data.data) {
                console.log('✅ BulkGate v1 API success');
                status = 'online';
                balance = parseFloat(data.data.credit || 0);
              } else {
                throw new Error(data.error?.message || 'Resposta inválida da API BulkGate v1');
              }
            } else {
              const errorData = await response.text();
              console.error(`❌ v1 API Error: ${response.status} - ${errorData}`);
              throw new Error(`BulkGate API error: Both v2 and v1 failed - Credenciais inválidas ou expiradas`);
            }
          } catch (error) {
            console.error(`❌ v1 API failed: ${error.message}`);
            throw new Error(`BulkGate API error: Both v2 and v1 failed - ${error.message}`);
          }
        } else if (!isV2Format) {
          throw new Error('Formato de chave API inválido. Use: applicationId:applicationToken');
        }
      } else {
        throw new Error(`Unknown gateway: ${gateway_name}`);
      }
    } catch (error) {
      console.error(`Gateway ${gateway_name} check failed:`, error);
      status = 'error';
      errorMessage = error.message;
    }

    const responseTime = Date.now() - startTime;

    return new Response(JSON.stringify({
      gateway: gateway_name,
      status,
      response_time: responseTime,
      balance,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'error'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});