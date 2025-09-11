import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== BulkGate Balance Function Started ===');
  console.log('Request method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body - BulkGate uses API key from body for testing
    const { apiKey: requestApiKey } = await req.json() as {
      apiKey?: string;
    };

    // Use API key from request body (for testing) or from environment
    const apiKey = requestApiKey || Deno.env.get('BULKGATE_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API Key não configurada' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Using API key from request body for testing');
    console.log('API Key format:', `${apiKey.substring(0, 8)}...`);

    // Test connection with BulkGate API
    console.log('Fetching balance using API Key:', `${apiKey.substring(0, 8)}...`);

    const response = await fetch('https://portal.bulkgate.com/api/1.0/info/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        application_id: apiKey,
        application_token: apiKey
      })
    });

    const data = await response.json();
    
    console.log('BulkGate API response status:', response.status);
    console.log('BulkGate user info response:', JSON.stringify(data, null, 2));

    if (response.ok && data.data) {
      const userInfo = data.data;
      console.log('Response status: 200');
      
      return new Response(
        JSON.stringify({ 
          success: true,
          balance: userInfo.credit || 0,
          currency: userInfo.currency || 'USD',
          user: {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.error('BulkGate API error:', data);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error?.message || 'Erro na API do BulkGate' 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Error checking BulkGate balance:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});