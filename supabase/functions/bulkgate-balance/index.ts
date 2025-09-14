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
    const { apiKey: requestApiKey, applicationId, apiToken } = await req.json() as {
      apiKey?: string;
      applicationId?: string;
      apiToken?: string;
    };

    // Use API key from request body (for testing) or from environment
    let apiKey = requestApiKey || Deno.env.get('BULKGATE_API_KEY');
    let appId = applicationId;
    let appToken = apiToken;

    // If we have separate credentials, use them
    if (appId && appToken) {
      apiKey = `${appId}:${appToken}`;
    }

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

    console.log('Using API key format:', `${apiKey.substring(0, 8)}...`);

    // Try v2 API first (Bearer token)
    let response = await fetch('https://portal.bulkgate.com/api/2.0/credit/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('BulkGate v2 API response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('BulkGate v2 balance response:', JSON.stringify(data, null, 2));
      
      return new Response(
        JSON.stringify({ 
          success: true,
          balance: data.balance || 0,
          currency: data.currency || 'USD',
          api_version: 'v2'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else if (response.status === 401 || response.status === 404) {
      // Fallback to v1 API
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
          })
        });

        console.log('BulkGate v1 API response status:', response.status);
        const data = await response.json();
        console.log('BulkGate v1 user info response:', JSON.stringify(data, null, 2));

        if (response.ok && data.data) {
          const userInfo = data.data;
          
          return new Response(
            JSON.stringify({ 
              success: true,
              balance: userInfo.credit || 0,
              currency: userInfo.currency || 'USD',
              user: {
                id: userInfo.id,
                name: userInfo.name,
                email: userInfo.email
              },
              api_version: 'v1'
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } else {
          console.error('BulkGate v1 API error:', data);
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: data.error?.message || 'Erro na API do BulkGate v1' 
            }),
            { 
              status: response.status, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Formato de credenciais inválido. Use applicationId:apiToken' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      const errorData = await response.text();
      console.error('BulkGate v2 API error:', errorData);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro na API do BulkGate v2: ${response.status}` 
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