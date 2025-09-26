import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    switch (path) {
      case 'compliance-score':
        return await getComplianceScore();
      
      case 'lgpd-requests':
        if (req.method === 'GET') {
          return await getLgpdRequests();
        } else if (req.method === 'POST') {
          const body = await req.json();
          return await createLgpdRequest(body, user.id);
        }
        break;
      
      case 'process-request':
        if (req.method === 'POST') {
          const body = await req.json();
          return await processLgpdRequest(body, user.id);
        }
        break;
      
      case 'user-data':
        if (req.method === 'GET') {
          const userId = url.searchParams.get('userId');
          return await getUserData(userId || user.id);
        }
        break;
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      }
    );
  } catch (error) {
    console.error('Erro na API de compliance:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function getComplianceScore() {
  const { data, error } = await supabase.rpc('calculate_compliance_score');
  
  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function getLgpdRequests() {
  const { data, error } = await supabase
    .from('lgpd_requests')
    .select(`
      id,
      user_id,
      request_type,
      status,
      reason,
      user_email,
      processed_by,
      processed_at,
      expires_at,
      created_at,
      updated_at,
      response_data
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function createLgpdRequest(body: any, userId: string) {
  const { requestType, reason, userEmail } = body;

  const { data, error } = await supabase
    .from('lgpd_requests')
    .insert({
      user_id: userId,
      request_type: requestType,
      reason: reason,
      user_email: userEmail,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify(data),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    }
  );
}

async function processLgpdRequest(body: any, adminId: string) {
  const { requestId, action, notes } = body;

  const { data, error } = await supabase.rpc('process_lgpd_request', {
    request_id: requestId,
    admin_id: adminId,
    action: action,
    response_notes: notes
  });

  if (error) {
    throw error;
  }

  return new Response(
    JSON.stringify({ success: true, data }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  );
}

async function getUserData(userId: string) {
  const userData: any = {};

  try {
    // Dados do perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, company_name, created_at, updated_at')
      .eq('user_id', userId)
      .single();
    userData.profile = profile;

    // Contactos (dados não sensíveis)
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, name, created_at, updated_at, tags')
      .eq('user_id', userId);
    userData.contacts = contacts;

    // Consentimentos
    const { data: consents } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId);
    userData.consents = consents;

    // Estatísticas de uso
    const { data: smsStats } = await supabase
      .from('sms_logs')
      .select('status, created_at::date')
      .eq('user_id', userId);
    userData.sms_statistics = smsStats;

    return new Response(
      JSON.stringify(userData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}