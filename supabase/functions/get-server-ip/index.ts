import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Coletar todos os headers de rede disponíveis
    const headers = req.headers;
    
    // Extrair informações de IP e rede
    const networkInfo = {
      timestamp: new Date().toISOString(),
      ip_addresses: {
        x_forwarded_for: headers.get('x-forwarded-for') || null,
        x_real_ip: headers.get('x-real-ip') || null,
        cf_connecting_ip: headers.get('cf-connecting-ip') || null,
        x_client_ip: headers.get('x-client-ip') || null,
      },
      cloudflare: {
        cf_ray: headers.get('cf-ray') || null,
        cf_ipcountry: headers.get('cf-ipcountry') || null,
        cf_visitor: headers.get('cf-visitor') || null,
      },
      request_headers: {
        user_agent: headers.get('user-agent') || null,
        host: headers.get('host') || null,
        origin: headers.get('origin') || null,
      },
      connection_info: {
        // Deno específico
        remote_addr: (req as any).conn?.remoteAddr || null,
      }
    };

    // Determinar IP público mais provável
    const publicIP = 
      networkInfo.ip_addresses.cf_connecting_ip ||
      networkInfo.ip_addresses.x_real_ip ||
      (networkInfo.ip_addresses.x_forwarded_for?.split(',')[0]?.trim()) ||
      networkInfo.connection_info.remote_addr?.hostname ||
      'UNKNOWN';

    console.log('🌐 Server IP Detection:', {
      public_ip: publicIP,
      full_info: networkInfo
    });

    return new Response(
      JSON.stringify({
        success: true,
        public_ip: publicIP,
        network_info: networkInfo,
        instructions: {
          pt: 'Forneça este IP público para É-kwanza autorizar o acesso aos endpoints OAuth2 e MCX Express',
          en: 'Provide this public IP to É-kwanza to authorize access to OAuth2 and MCX Express endpoints'
        }
      }, null, 2),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  } catch (error) {
    console.error('❌ Error detecting server IP:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
