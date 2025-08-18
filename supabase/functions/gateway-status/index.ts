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
          status = 'online';
          
          const balanceResponse = await fetch('https://api.bulksms.com/v1/profile/balance', {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            balance = balanceData.balance;
          }
        } else {
          throw new Error(`BulkSMS API error: ${response.status}`);
        }
      } else {
        status = 'online';
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