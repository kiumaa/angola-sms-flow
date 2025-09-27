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

  try {
    const { requestId, action, notes } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    
    // Verificar se é admin
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Processar a solicitação LGPD
    const { data, error } = await supabase.rpc('process_lgpd_request', {
      request_id: requestId,
      admin_id: user.id,
      action: action,
      response_notes: notes
    });

    if (error) {
      console.error('Erro ao processar solicitação LGPD:', error);
      throw error;
    }

    // Se a ação for de exportação de dados, gerar os dados
    if (action === 'approve' || action === 'complete') {
      const { data: request } = await supabase
        .from('lgpd_requests')
        .select('*, user_id, request_type')
        .eq('id', requestId)
        .single();

      if (request && request.request_type === 'data_export') {
        // Buscar todos os dados do usuário
        const userData = await collectUserData(request.user_id);
        
        // Atualizar a solicitação com os dados exportados
        await supabase
          .from('lgpd_requests')
          .update({
            response_data: {
              ...request.response_data,
              exported_data: userData
            }
          })
          .eq('id', requestId);
      }
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erro na edge function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function collectUserData(userId: string) {
  const userData: any = {};

  try {
    // Dados do perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    userData.profile = profile;

    // Contactos
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId);
    userData.contacts = contacts;

    // Campanhas
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('created_by', userId);
    userData.campaigns = campaigns;

    // Transações
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, amount_kwanza, credits_purchased, status, payment_method, created_at')
      .eq('user_id', userId);
    userData.transactions = transactions;

    // Logs de SMS (sem dados sensíveis)
    const { data: smsLogs } = await supabase
      .from('sms_logs')
      .select('id, status, cost_credits, created_at, gateway_used')
      .eq('user_id', userId);
    userData.sms_logs = smsLogs;

    // Consentimentos
    const { data: consents } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId);
    userData.consents = consents;

    return userData;
  } catch (error) {
    console.error('Erro ao coletar dados do usuário:', error);
    return userData;
  }
}