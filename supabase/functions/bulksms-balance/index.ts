import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para buscar credenciais do banco de dados
async function getBulkSMSCredentials(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('sms_configurations')
      .select('api_token_id, api_token_secret')
      .eq('gateway_name', 'bulksms')
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Erro ao buscar credenciais do banco:', error);
      // Fallback para variáveis de ambiente
      return {
        tokenId: Deno.env.get('BULKSMS_TOKEN_ID'),
        tokenSecret: Deno.env.get('BULKSMS_TOKEN_SECRET')
      };
    }

    return {
      tokenId: data.api_token_id,
      tokenSecret: data.api_token_secret
    };
  } catch (error) {
    console.error('Erro ao conectar com banco para credenciais:', error);
    // Fallback para variáveis de ambiente
    return {
      tokenId: Deno.env.get('BULKSMS_TOKEN_ID'),
      tokenSecret: Deno.env.get('BULKSMS_TOKEN_SECRET')
    };
  }
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
        if (body.apiTokenId) {
          // Usar tokens do corpo da requisição (para teste)
          console.log('Using tokens from request body');
          apiTokenId = body.apiTokenId;
          apiTokenSecret = body.apiTokenSecret || '';
        } else {
          // Buscar credenciais do banco de dados
          console.log('Fetching credentials from database');
          const credentials = await getBulkSMSCredentials(supabase);
          apiTokenId = credentials.tokenId;
          apiTokenSecret = credentials.tokenSecret;
        }
      } catch (e) {
        console.error('Error parsing request body:', e);
        // Buscar credenciais do banco de dados como fallback
        const credentials = await getBulkSMSCredentials(supabase);
        apiTokenId = credentials.tokenId;
        apiTokenSecret = credentials.tokenSecret;
      }
    } else {
      // Para GET, sempre buscar do banco
      const credentials = await getBulkSMSCredentials(supabase);
      apiTokenId = credentials.tokenId;
      apiTokenSecret = credentials.tokenSecret;
    }

    if (!apiTokenId) {
      console.error('❌ BulkSMS Token ID não encontrado');
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'BulkSMS Token ID não configurado',
          details: 'Configure as credenciais BulkSMS no painel administrativo'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Fetching balance using Token ID: ${apiTokenId.substring(0, 8)}...`);
    
    // Create Basic Auth with Token ID:Token Secret format
    const authString = `${apiTokenId}:${apiTokenSecret || ''}`;
    console.log('Auth string format:', `${apiTokenId.substring(0, 8)}:${apiTokenSecret ? '***' : '(empty)'}`);

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
      return new Response(
        JSON.stringify({ 
          success: true,
          balance: data.credits.balance || 0,
          currency: 'USD',
          last_checked: new Date().toISOString()
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
          error: data.detail || data.error?.description || 'Failed to fetch balance',
          details: `HTTP ${response.status}: ${response.statusText}`,
          api_response: data
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