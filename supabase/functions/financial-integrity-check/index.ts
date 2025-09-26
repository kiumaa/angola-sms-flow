import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar usuário autenticado e admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabaseClient.auth.getUser(token)

    if (!user) {
      throw new Error('Não autenticado')
    }

    // Verificar se é admin
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      throw new Error('Acesso negado - apenas admins')
    }

    const { action } = await req.json()

    if (action === 'check') {
      // Verificar integridade financeira
      const { data: profiles, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('user_id, credits, created_at')

      if (profilesError) throw profilesError

      const { data: adjustments, error: adjustmentsError } = await supabaseClient
        .from('credit_adjustments')
        .select('user_id, delta, is_free_credit')

      if (adjustmentsError) throw adjustmentsError

      // Calcular métricas
      let untrackedCredits = 0
      let inconsistentBalances = 0
      const profilesWithIssues = []

      for (const profile of profiles) {
        const userAdjustments = adjustments.filter(a => a.user_id === profile.user_id)
        const totalAdjustments = userAdjustments.reduce((sum, adj) => sum + adj.delta, 0)
        const hasFreeCredit = userAdjustments.some(a => a.is_free_credit)

        if (profile.credits > 0 && !hasFreeCredit) {
          untrackedCredits++
          profilesWithIssues.push({
            user_id: profile.user_id,
            credits: profile.credits,
            issue: 'untracked_free_credits'
          })
        }

        if (profile.credits !== totalAdjustments) {
          inconsistentBalances++
          profilesWithIssues.push({
            user_id: profile.user_id,
            profile_credits: profile.credits,
            adjustment_total: totalAdjustments,
            issue: 'inconsistent_balance'
          })
        }
      }

      const result = {
        timestamp: new Date().toISOString(),
        status: untrackedCredits === 0 && inconsistentBalances === 0 ? 'healthy' : 
                untrackedCredits > 0 || inconsistentBalances > 5 ? 'critical' : 'warning',
        metrics: {
          total_profiles: profiles.length,
          untracked_credits: untrackedCredits,
          inconsistent_balances: inconsistentBalances
        },
        profiles_with_issues: profilesWithIssues,
        recommendations: untrackedCredits > 0 ? ['run_credit_migration'] :
                        inconsistentBalances > 0 ? ['audit_credit_balances'] : ['system_healthy']
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'migrate') {
      // Migrar créditos não rastreados
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('user_id, credits, created_at')
        .gt('credits', 0)

      const { data: existingAdjustments } = await supabaseClient
        .from('credit_adjustments')
        .select('user_id')
        .eq('is_free_credit', true)

      const existingUserIds = new Set(existingAdjustments?.map(a => a.user_id) || [])
      
      let migratedCount = 0
      for (const profile of profiles || []) {
        if (!existingUserIds.has(profile.user_id)) {
          const { error } = await supabaseClient
            .from('credit_adjustments')
            .insert({
              user_id: profile.user_id,
              admin_id: user.id, // Admin atual fazendo a migração
              delta: profile.credits,
              previous_balance: 0,
              new_balance: profile.credits,
              adjustment_type: 'data_migration',
              reason: 'Migração de dados - créditos iniciais não registrados',
              is_free_credit: true,
              created_at: profile.created_at
            })

          if (!error) {
            migratedCount++
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        migrated_count: migratedCount 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Ação não suportada')

  } catch (error) {
    console.error('Erro:', error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})