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
    console.log('=== BulkSMS Balance Function Started ===');
    console.log('Request method:', req.method);
    
    // Get API token from request body or environment
    let apiToken = Deno.env.get('BULKSMS_TOKEN_ID');
    console.log('Environment token found:', !!apiToken);
    
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        console.log('Request body received:', body);
        if (body.apiToken) {
          apiToken = body.apiToken;
          console.log('Using token from request body');
        }
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    }
    
    if (!apiToken) {
      console.error('No API Token available');
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

    // Consultar saldo via BulkSMS API v1 usando endpoint profile
    const response = await fetch('https://api.bulksms.com/v1/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(apiToken + ':')}`
      }
    });

    const data = await response.json();
    console.log('BulkSMS profile response:', data);
    console.log('Response status:', response.status);

    if (response.ok && data.credits) {
      return new Response(
        JSON.stringify({ 
          success: true,
          balance: data.credits.balance || 0,
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