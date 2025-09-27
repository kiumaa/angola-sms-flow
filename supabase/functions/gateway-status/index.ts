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

        console.log(`🔐 BulkGate API Key format: ${apiKey.substring(0, 6)}... (length: ${apiKey.length})`);
        console.log(`🔍 Contains colon: ${apiKey.includes(':')}`);
        
        // Check if it's applicationId:applicationToken format
        if (apiKey.includes(':')) {
          const [applicationId, applicationToken] = apiKey.split(':');
          console.log(`📋 ApplicationId: ${applicationId}`);
          console.log(`🔑 ApplicationToken: ${applicationToken.substring(0, 6)}... (${applicationToken.length} chars)`);
          
          console.log('🎯 Attempting v2 API (applicationId:applicationToken format)...');
          
          try {
            const v2RequestBody = {
              application_id: parseInt(applicationId),
              application_token: applicationToken
            };
            console.log('📤 v2 Request body:', JSON.stringify(v2RequestBody, null, 2));
            
            const v2Response = await fetch('https://portal.bulkgate.com/api/2.0/advanced/info', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'User-Agent': 'SMS-AO-Gateway-Monitor/1.0'
              },
              body: JSON.stringify(v2RequestBody),
              signal: AbortSignal.timeout(15000)
            });
            
            console.log(`📊 v2 API Status: ${v2Response.status}`);
            console.log(`📊 v2 Response Headers:`, Object.fromEntries(v2Response.headers.entries()));
            
            const v2ResponseText = await v2Response.text();
            console.log(`📊 v2 Raw Response: ${v2ResponseText}`);
            
            if (v2Response.ok) {
              try {
                const v2Data = JSON.parse(v2ResponseText);
                console.log('✅ v2 API Success:', v2Data);
                status = 'online';
                balance = v2Data.data?.credit || null;
              } catch (parseError) {
                const parseErrorMessage = parseError instanceof Error ? parseError.message : 'Parse error';
                console.error('❌ v2 JSON Parse Error:', parseErrorMessage);
              }
            } else {
              console.log(`🔄 v2 API failed (${v2Response.status}), falling back to v1`);
            }
          } catch (v2Error) {
            const v2ErrorMessage = v2Error instanceof Error ? v2Error.message : 'V2 API error';
            console.error('❌ v2 API Error:', v2ErrorMessage);
          }
          
          // Reset status and try v1 API if v2 failed
          if (status === 'offline') {
            console.log('🔄 Attempting v1 API fallback...');
            
            try {
              const v1RequestBody = {
                application_id: applicationId,
                application_token: applicationToken
              };
              console.log('📤 v1 Request body:', JSON.stringify(v1RequestBody, null, 2));
              
              const v1Response = await fetch('https://portal.bulkgate.com/api/1.0/advanced/info', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache',
                  'User-Agent': 'SMS-AO-Gateway-Monitor/1.0'
                },
                body: JSON.stringify(v1RequestBody),
                signal: AbortSignal.timeout(15000)
              });
              
              console.log(`📊 v1 API Status: ${v1Response.status}`);
              console.log(`📊 v1 Response Headers:`, Object.fromEntries(v1Response.headers.entries()));
              
              const v1ResponseText = await v1Response.text();
              console.log(`📊 v1 Raw Response: ${v1ResponseText}`);
              
              if (v1Response.ok) {
                try {
                  const v1Data = JSON.parse(v1ResponseText);
                  console.log('✅ v1 API Success:', v1Data);
                  status = 'online';
                  balance = v1Data.data?.credit || null;
                } catch (parseError) {
                  const parseErrorMessage = parseError instanceof Error ? parseError.message : 'Parse error';
                  console.error('❌ v1 JSON Parse Error:', parseErrorMessage);
                  throw new Error(`BulkGate v1 response parse error: ${parseErrorMessage}`);
                }
              } else {
                console.log(`❌ v1 API Error: ${v1Response.status} - ${v1ResponseText}`);
                
                // Try to parse error response
                try {
                  const errorData = JSON.parse(v1ResponseText);
                  const errorMessage = errorData.error?.[0] || 'Unknown error';
                  throw new Error(`BulkGate v1 API error: ${v1Response.status} - ${errorMessage}`);
                } catch (parseError) {
                  throw new Error(`BulkGate v1 API error: ${v1Response.status} - ${v1ResponseText}`);
                }
              }
            } catch (v1Error) {
              const v1ErrorMessage = v1Error instanceof Error ? v1Error.message : 'V1 connection error';
              console.error('❌ v1 API Connection Error:', v1ErrorMessage);
              throw new Error(`BulkGate v1 connection error: ${v1ErrorMessage}`);
            }
          }
        } else {
          // Credentials without colon are not supported for BulkGate Advanced API
          console.log('❌ Invalid BulkGate API key format (missing ":"). Expected applicationId:applicationToken');
          throw new Error('Formato inválido da chave BulkGate. Use applicationId:applicationToken');
        }
      } else {
        throw new Error(`Unknown gateway: ${gateway_name}`);
      }
    } catch (error) {
      console.error(`Gateway ${gateway_name} check failed:`, error);
      status = 'error';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      status: 'error'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});