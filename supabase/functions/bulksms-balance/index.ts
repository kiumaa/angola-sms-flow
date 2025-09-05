import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

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
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let apiTokenId: string;
    let apiTokenSecret: string;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        console.log('Request body received:', body);
        
        if (body.tokenId && body.tokenSecret) {
          // Usar tokens do corpo da requisição (para teste)
          console.log('Using tokens from request body for testing');
          apiTokenId = body.tokenId;
          apiTokenSecret = body.tokenSecret;
        } else {
          // Buscar credenciais dos Supabase Secrets
          console.log('Using credentials from Supabase Secrets');
          apiTokenId = Deno.env.get('BULKSMS_TOKEN_ID') || '';
          apiTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET') || '';
        }
      } catch (e) {
        console.error('Error parsing request body:', e);
        // Usar credenciais dos Supabase Secrets como fallback
        apiTokenId = Deno.env.get('BULKSMS_TOKEN_ID') || '';
        apiTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET') || '';
      }
    } else {
      // Para GET, sempre usar Supabase Secrets
      console.log('Using credentials from Supabase Secrets');
      apiTokenId = Deno.env.get('BULKSMS_TOKEN_ID') || '';
      apiTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET') || '';
    }

    if (!apiTokenId || !apiTokenSecret) {
      console.error('❌ BulkSMS credenciais não encontradas');
      console.log('Available env vars:', Object.keys(Deno.env.toObject()).filter(key => key.includes('BULK')));
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'BulkSMS credenciais não configuradas',
          details: 'Configure BULKSMS_TOKEN_ID e BULKSMS_TOKEN_SECRET nos Supabase Secrets',
          available_secrets: Object.keys(Deno.env.toObject()).filter(key => key.includes('BULK'))
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching balance using Token ID: ${apiTokenId.substring(0, 8)}...`);
    
    // Create Basic Auth with Token ID:Token Secret format
    const authString = `${apiTokenId}:${apiTokenSecret}`;
    console.log('Auth string format:', `${apiTokenId.substring(0, 8)}:***`);

    // Consultar saldo via BulkSMS API v1 usando endpoint profile com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch('https://api.bulksms.com/v1/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(authString)}`,
        'Accept': 'application/json',
        'User-Agent': 'SMS-AO/1.0'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    console.log('BulkSMS profile response:', data);
    console.log('Response status:', response.status);

    if (response.ok && data.credits) {
      // Atualizar balance na tabela sms_configurations se for uma chamada do sistema
      if (req.method === 'GET') {
        try {
          await supabase
            .from('sms_configurations')
            .upsert({
              gateway_name: 'bulksms',
              balance: data.credits.balance || 0,
              last_balance_check: new Date().toISOString(),
              is_active: true,
              credentials_encrypted: true,
              api_token_secret_name: 'BULKSMS_TOKEN_SECRET',
              api_token_id_secret_name: 'BULKSMS_TOKEN_ID'
            });
        } catch (updateError) {
          console.error('Error updating balance in database:', updateError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          balance: data.credits.balance || 0,
          currency: 'USD',
          last_checked: new Date().toISOString(),
          quota: data.quota || null
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
          error: data.detail || data.title || 'Failed to fetch balance',
          details: `HTTP ${response.status}: ${response.statusText}`,
          api_response: data,
          suggestion: response.status === 401 ? 'Verifique as credenciais BulkSMS' : 'Verifique a conectividade com a API BulkSMS'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error in bulksms-balance function:', error);
    
    let errorMessage = error.message;
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout connecting to BulkSMS API';
    }
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: 'Check BulkSMS API credentials and network connectivity'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});