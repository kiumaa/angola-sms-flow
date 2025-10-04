import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthStatus {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  responseTime?: number;
  lastChecked: string;
}

interface Alert {
  level: 'info' | 'warning' | 'critical';
  category: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🏥 Starting system health check...');

    const checks: Record<string, HealthStatus> = {};
    const alerts: Alert[] = [];

    // ========================================================================
    // 1. DATABASE HEALTH CHECK
    // ========================================================================
    const dbCheckStart = Date.now();
    try {
      // Test basic connectivity
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Check for slow queries
      const { data: slowQueries } = await supabase.rpc('system_health_check');

      const dbResponseTime = Date.now() - dbCheckStart;

      if (dbResponseTime > 100) {
        alerts.push({
          level: 'warning',
          category: 'database',
          message: `Database response time is ${dbResponseTime}ms (threshold: 100ms)`,
          timestamp: new Date().toISOString(),
          metadata: { responseTime: dbResponseTime }
        });
      }

      checks.database = {
        status: dbResponseTime < 100 ? 'pass' : 'warn',
        message: `Database responsive. ${count || 0} profiles.`,
        responseTime: dbResponseTime,
        lastChecked: new Date().toISOString()
      };

      console.log(`✅ Database check: ${dbResponseTime}ms`);
    } catch (error) {
      checks.database = {
        status: 'fail',
        message: `Database error: ${error.message}`,
        lastChecked: new Date().toISOString()
      };

      alerts.push({
        level: 'critical',
        category: 'database',
        message: 'Database connection failed!',
        timestamp: new Date().toISOString(),
        metadata: { error: error.message }
      });

      console.error('❌ Database check failed:', error);
    }

    // ========================================================================
    // 2. SMS GATEWAYS HEALTH CHECK
    // ========================================================================
    try {
      const { data: gateways, error: gatewaysError } = await supabase
        .from('sms_configurations')
        .select('gateway_name, is_active, balance, last_balance_check')
        .eq('is_active', true);

      if (gatewaysError) throw gatewaysError;

      const activeGateways = gateways?.length || 0;
      
      if (activeGateways === 0) {
        alerts.push({
          level: 'critical',
          category: 'sms_gateway',
          message: 'No active SMS gateways configured!',
          timestamp: new Date().toISOString()
        });

        checks.sms_gateways = {
          status: 'fail',
          message: 'No active gateways',
          lastChecked: new Date().toISOString()
        };
      } else {
        // Check gateway balances
        gateways?.forEach((gateway) => {
          if (gateway.balance && gateway.balance < 1000) {
            alerts.push({
              level: 'warning',
              category: 'sms_gateway',
              message: `${gateway.gateway_name} balance is low: ${gateway.balance} credits`,
              timestamp: new Date().toISOString(),
              metadata: { gateway: gateway.gateway_name, balance: gateway.balance }
            });
          }
        });

        checks.sms_gateways = {
          status: 'pass',
          message: `${activeGateways} active gateway(s)`,
          lastChecked: new Date().toISOString()
        };
      }

      console.log(`✅ SMS gateways check: ${activeGateways} active`);
    } catch (error) {
      checks.sms_gateways = {
        status: 'fail',
        message: `Gateway check error: ${error.message}`,
        lastChecked: new Date().toISOString()
      };

      console.error('❌ SMS gateways check failed:', error);
    }

    // ========================================================================
    // 3. AUTHENTICATION SYSTEM CHECK
    // ========================================================================
    try {
      // Check recent OTP requests
      const { data: recentOTPs, error: otpError } = await supabase
        .from('otp_requests')
        .select('created_at, used')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
        .limit(100);

      if (otpError) throw otpError;

      const totalOTPs = recentOTPs?.length || 0;
      const usedOTPs = recentOTPs?.filter(o => o.used).length || 0;
      const successRate = totalOTPs > 0 ? (usedOTPs / totalOTPs) * 100 : 100;

      if (successRate < 80 && totalOTPs > 10) {
        alerts.push({
          level: 'warning',
          category: 'authentication',
          message: `Low OTP success rate: ${successRate.toFixed(1)}%`,
          timestamp: new Date().toISOString(),
          metadata: { successRate, totalOTPs, usedOTPs }
        });
      }

      checks.authentication = {
        status: successRate >= 80 ? 'pass' : 'warn',
        message: `OTP success rate: ${successRate.toFixed(1)}% (${usedOTPs}/${totalOTPs})`,
        lastChecked: new Date().toISOString()
      };

      console.log(`✅ Authentication check: ${successRate.toFixed(1)}% success rate`);
    } catch (error) {
      checks.authentication = {
        status: 'fail',
        message: `Auth check error: ${error.message}`,
        lastChecked: new Date().toISOString()
      };

      console.error('❌ Authentication check failed:', error);
    }

    // ========================================================================
    // 4. RLS POLICIES CHECK
    // ========================================================================
    try {
      const { data: tables } = await supabase.rpc('pg_tables_with_rls');
      
      const criticalTables = ['profiles', 'contacts', 'transactions', 'credit_adjustments', 'sender_ids'];
      const missingRLS = criticalTables.filter(table => {
        return !tables?.some((t: any) => t.tablename === table && t.rowsecurity === true);
      });

      if (missingRLS.length > 0) {
        alerts.push({
          level: 'critical',
          category: 'security',
          message: `RLS not enabled on critical tables: ${missingRLS.join(', ')}`,
          timestamp: new Date().toISOString(),
          metadata: { missingRLS }
        });

        checks.rls_policies = {
          status: 'fail',
          message: `Missing RLS on ${missingRLS.length} table(s)`,
          lastChecked: new Date().toISOString()
        };
      } else {
        checks.rls_policies = {
          status: 'pass',
          message: 'All critical tables have RLS enabled',
          lastChecked: new Date().toISOString()
        };
      }

      console.log(`✅ RLS policies check: ${missingRLS.length === 0 ? 'All OK' : missingRLS.join(', ')}`);
    } catch (error) {
      // If RPC doesn't exist, do basic check
      checks.rls_policies = {
        status: 'warn',
        message: 'Unable to verify RLS policies automatically',
        lastChecked: new Date().toISOString()
      };

      console.warn('⚠️ RLS policies check skipped:', error.message);
    }

    // ========================================================================
    // 5. EDGE FUNCTIONS CHECK
    // ========================================================================
    try {
      // Test critical edge function
      const funcCheckStart = Date.now();
      const { data: funcTest, error: funcError } = await supabase.functions.invoke('gateway-status', {
        body: { check: 'health' }
      });

      const funcResponseTime = Date.now() - funcCheckStart;

      if (funcError) throw funcError;

      if (funcResponseTime > 2000) {
        alerts.push({
          level: 'warning',
          category: 'edge_functions',
          message: `Slow edge function response: ${funcResponseTime}ms`,
          timestamp: new Date().toISOString(),
          metadata: { responseTime: funcResponseTime }
        });
      }

      checks.edge_functions = {
        status: funcResponseTime < 2000 ? 'pass' : 'warn',
        message: `Edge functions responsive (${funcResponseTime}ms)`,
        responseTime: funcResponseTime,
        lastChecked: new Date().toISOString()
      };

      console.log(`✅ Edge functions check: ${funcResponseTime}ms`);
    } catch (error) {
      checks.edge_functions = {
        status: 'warn',
        message: 'Unable to test edge functions',
        lastChecked: new Date().toISOString()
      };

      console.warn('⚠️ Edge functions check skipped:', error.message);
    }

    // ========================================================================
    // OVERALL STATUS CALCULATION
    // ========================================================================
    const totalTime = Date.now() - startTime;
    const failedChecks = Object.values(checks).filter(c => c.status === 'fail').length;
    const warnChecks = Object.values(checks).filter(c => c.status === 'warn').length;

    const overallStatus = 
      failedChecks > 0 ? 'critical' :
      warnChecks > 1 ? 'degraded' :
      'healthy';

    // ========================================================================
    // COLLECT METRICS
    // ========================================================================
    const metrics = {
      total_checks: Object.keys(checks).length,
      passed_checks: Object.values(checks).filter(c => c.status === 'pass').length,
      warning_checks: warnChecks,
      failed_checks: failedChecks,
      total_alerts: alerts.length,
      health_check_duration_ms: totalTime
    };

    const result = {
      timestamp: new Date().toISOString(),
      status: overallStatus,
      checks,
      metrics,
      alerts
    };

    console.log(`🏥 Health check complete in ${totalTime}ms - Status: ${overallStatus}`);
    console.log(`   Passed: ${metrics.passed_checks}, Warnings: ${metrics.warning_checks}, Failed: ${metrics.failed_checks}`);

    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      status: overallStatus === 'critical' ? 503 : 200
    });

  } catch (error) {
    console.error('❌ Health check fatal error:', error);

    return new Response(JSON.stringify({
      timestamp: new Date().toISOString(),
      status: 'critical',
      error: error.message,
      checks: {},
      metrics: {
        total_checks: 0,
        passed_checks: 0,
        warning_checks: 0,
        failed_checks: 0,
        total_alerts: 1
      },
      alerts: [{
        level: 'critical',
        category: 'system',
        message: `Health check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      }]
    }, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 503
    });
  }
});
