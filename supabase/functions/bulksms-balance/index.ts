import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API token from request body or environment
    let apiToken = Deno.env.get('BULKSMS_TOKEN_ID');
    
    if (req.method === 'POST') {
      const body = await req.json();
      if (body.apiToken) {
        apiToken = body.apiToken;
      }
    }
    
    if (!apiToken) {
      console.error('BulkSMS API Token not found');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'API Token not configured' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching balance using API Token: ${apiToken.substring(0, 8)}...`);

    // Consultar saldo via BulkSMS API v1 usando endpoint correto
    const response = await fetch('https://api.bulksms.com/v1/account/credits', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(apiToken + ':')}`
      }
    });

    const data = await response.json();
    console.log('BulkSMS credits response:', data);

    if (response.ok && data.balance !== undefined) {
      return new Response(
        JSON.stringify({ 
          success: true,
          balance: data.balance || 0,
          currency: 'USD'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.error('Error fetching balance:', data);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: data.detail || data.error?.description || 'Failed to fetch balance'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error in bulksms-balance function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});