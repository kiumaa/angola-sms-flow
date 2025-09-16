import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🚀 BulkGate Balance Function - Enhanced v2.0');
  console.log(`📋 Request method: ${req.method}`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body - supports both formats
    const { apiKey: requestApiKey, applicationId, apiToken } = await req.json() as {
      apiKey?: string;
      applicationId?: string;
      apiToken?: string;
    };

    // Determine API key format
    let apiKey = requestApiKey || Deno.env.get('BULKGATE_API_KEY');
    
    if (applicationId && apiToken) {
      apiKey = `${applicationId}:${apiToken}`;
      console.log('🔑 Using split credentials format');
    }

    if (!apiKey) {
      console.error('❌ No API key provided');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'BulkGate API Key não configurada',
          details: 'Configure BULKGATE_API_KEY no formato applicationId:applicationToken ou Bearer token'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🔐 API key format: ${apiKey.substring(0, 8)}...`);

    // PRIORITY: Try v2 API first (Bearer token approach)
    let isV2Format = !apiKey.includes(':');
    if (isV2Format) {
      console.log('🎯 Attempting v2 API (Bearer token)...');
      
      const v2Response = await fetch('https://portal.bulkgate.com/api/2.0/credit/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SMS-AO-Platform/2.0'
        }
      });

      console.log(`📊 v2 API Status: ${v2Response.status}`);

      if (v2Response.ok) {
        const v2Data = await v2Response.json();
        console.log('✅ v2 API Success:', JSON.stringify(v2Data, null, 2));
        
        return new Response(
          JSON.stringify({ 
            success: true,
            balance: parseFloat(v2Data.balance || 0),
            currency: v2Data.currency || 'EUR',
            api_version: 'v2',
            provider: 'bulkgate',
            timestamp: new Date().toISOString()
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        const v2Error = await v2Response.text();
        console.log(`⚠️ v2 API failed: ${v2Response.status} - ${v2Error}`);
        // Continue to v1 fallback
      }
    }

    // FALLBACK: v1 API with applicationId:applicationToken format
    console.log('🔄 Falling back to v1 API...');
    
    const parts = apiKey.split(':');
    if (parts.length !== 2) {
      console.error('❌ Invalid credentials format for v1 fallback');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Formato de credenciais inválido',
          details: 'Use formato: applicationId:applicationToken'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const [applicationId, applicationToken] = parts;
    console.log(`🔑 v1 Credentials: ${applicationId}:${'*'.repeat(applicationToken.length)}`);

    const v1Response = await fetch('https://portal.bulkgate.com/api/1.0/info/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SMS-AO-Platform/1.0'
      },
      body: JSON.stringify({
        application_id: applicationId,
        application_token: applicationToken
      })
    });

    console.log(`📊 v1 API Status: ${v1Response.status}`);
    const v1Data = await v1Response.json();
    console.log('📋 v1 Response:', JSON.stringify(v1Data, null, 2));

    if (v1Response.ok && v1Data.data) {
      const userInfo = v1Data.data;
      console.log('✅ v1 API Success - Balance retrieved');
      
      return new Response(
        JSON.stringify({ 
          success: true,
          balance: parseFloat(userInfo.credit || 0),
          currency: userInfo.currency || 'EUR',
          user: {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email
          },
          api_version: 'v1',
          provider: 'bulkgate',
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      console.error('❌ v1 API Error:', v1Data);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: v1Data.error?.message || 'Erro na API do BulkGate',
          details: `Status: ${v1Response.status}`,
          api_version: 'v1'
        }),
        { 
          status: v1Response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('💥 BulkGate Balance Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});