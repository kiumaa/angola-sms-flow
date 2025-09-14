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

        // Try v2 API first (Bearer token)
        let response = await fetch('https://portal.bulkgate.com/api/2.0/credit/balance', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const data = await response.json();
          console.log('BulkGate v2 API response:', data);
          status = 'online';
          balance = data.balance || 0;
        } else if (response.status === 401 || response.status === 404) {
          // Fallback to v1 API with split credentials
          console.log('BulkGate v2 failed, trying v1 fallback');
          const parts = apiKey.split(':');
          if (parts.length === 2) {
            response = await fetch('https://portal.bulkgate.com/api/1.0/info/user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                application_id: parts[0],
                application_token: parts[1]
              }),
              signal: AbortSignal.timeout(5000)
            });

            if (response.ok) {
              const data = await response.json();
              console.log('BulkGate v1 API response:', data);
              if (data.data) {
                status = 'online';
                balance = data.data.credit || 0;
              } else {
                throw new Error(`BulkGate API error: ${data.error?.message || 'Unknown error'}`);
              }
            } else {
              throw new Error(`BulkGate v1 API error: ${response.status}`);
            }
          } else {
            throw new Error(`BulkGate API error: ${response.status} - Invalid credential format`);
          }
        } else {
          throw new Error(`BulkGate API error: ${response.status}`);
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