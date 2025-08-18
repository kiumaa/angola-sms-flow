import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create client with anon key for user authentication
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(token)
    
    if (userError || !user) {
      throw new Error('Invalid authorization')
    }

    // Create admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get jobId from URL
    const url = new URL(req.url)
    const jobId = url.pathname.split('/').pop()

    if (!jobId) {
      throw new Error('Job ID is required')
    }

    // Get user profile to verify ownership
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error('User profile not found')
    }

    // Get job details with ownership check
    const { data: job, error: jobError } = await supabase
      .from('quick_send_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('account_id', profile.id)
      .single()

    if (jobError || !job) {
      throw new Error('Job not found or access denied')
    }

    // Get aggregated target statistics
    const { data: stats, error: statsError } = await supabase
      .from('quick_send_targets')
      .select('status')
      .eq('job_id', jobId)

    if (statsError) {
      throw new Error('Failed to get target statistics')
    }

    // Calculate stats
    const statusCounts = stats.reduce((acc, target) => {
      acc[target.status] = (acc[target.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Get recent targets with details (limit 50 for UI display)
    const { data: recentTargets, error: targetsError } = await supabase
      .from('quick_send_targets')
      .select('id, phone_e164, status, error_code, error_detail, sent_at, delivered_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (targetsError) {
      console.error('Error fetching recent targets:', targetsError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        job: {
          id: job.id,
          status: job.status,
          message: job.message,
          sender_id: job.sender_id,
          total_recipients: job.total_recipients,
          credits_estimated: job.credits_estimated,
          credits_spent: job.credits_spent,
          created_at: job.created_at,
          completed_at: job.completed_at
        },
        stats: {
          queued: statusCounts.queued || 0,
          sending: statusCounts.sending || 0,
          sent: statusCounts.sent || 0,
          delivered: statusCounts.delivered || 0,
          failed: statusCounts.failed || 0
        },
        recentTargets: recentTargets || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Quick send status error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})