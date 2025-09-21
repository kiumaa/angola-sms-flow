import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DiagnosticResult {
  test: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { test_phone, test_message = "Teste diagnóstico SMS", gateway = "bulksms" } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: DiagnosticResult[] = [];
    let overallStatus = 'success';

    // Test 1: Check user authentication
    const startAuth = Date.now();
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser(
        req.headers.get('Authorization')?.replace('Bearer ', '') || ''
      );
      
      if (authError || !user) {
        results.push({
          test: "User Authentication",
          status: 'error',
          message: "User not authenticated",
          details: authError,
          duration: Date.now() - startAuth
        });
        overallStatus = 'error';
      } else {
        results.push({
          test: "User Authentication",
          status: 'success',
          message: `User authenticated: ${user.email}`,
          duration: Date.now() - startAuth
        });
      }
    } catch (error) {
      results.push({
        test: "User Authentication",
        status: 'error',
        message: error.message,
        duration: Date.now() - startAuth
      });
      overallStatus = 'error';
    }

    // Test 2: Check user profile and credits
    const startProfile = Date.now();
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, credits, user_status')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (profileError || !profile) {
        results.push({
          test: "User Profile",
          status: 'error',
          message: "Profile not found",
          details: profileError,
          duration: Date.now() - startProfile
        });
        overallStatus = 'error';
      } else {
        results.push({
          test: "User Profile",
          status: profile.credits >= 1 ? 'success' : 'warning',
          message: `Profile found: ${profile.credits} credits, status: ${profile.user_status}`,
          details: profile,
          duration: Date.now() - startProfile
        });
        if (profile.credits < 1) overallStatus = 'warning';
      }
    } catch (error) {
      results.push({
        test: "User Profile",
        status: 'error',
        message: error.message,
        duration: Date.now() - startProfile
      });
      overallStatus = 'error';
    }

    // Test 3: Check SMS gateway credentials
    const startCreds = Date.now();
    try {
      const tokenId = Deno.env.get("BULKSMS_TOKEN_ID");
      const tokenSecret = Deno.env.get("BULKSMS_TOKEN_SECRET");
      const bulkgateKey = Deno.env.get("BULKGATE_API_KEY");
      
      const credsStatus = {
        bulksms: !!(tokenId && tokenSecret),
        bulkgate: !!bulkgateKey
      };

      results.push({
        test: "Gateway Credentials",
        status: credsStatus[gateway] ? 'success' : 'error',
        message: `${gateway.toUpperCase()} credentials: ${credsStatus[gateway] ? 'configured' : 'missing'}`,
        details: credsStatus,
        duration: Date.now() - startCreds
      });

      if (!credsStatus[gateway]) overallStatus = 'error';
    } catch (error) {
      results.push({
        test: "Gateway Credentials",
        status: 'error',
        message: error.message,
        duration: Date.now() - startCreds
      });
      overallStatus = 'error';
    }

    // Test 4: Test gateway connectivity
    const startConn = Date.now();
    try {
      let connResult;
      if (gateway === 'bulksms') {
        const tokenId = Deno.env.get("BULKSMS_TOKEN_ID");
        const tokenSecret = Deno.env.get("BULKSMS_TOKEN_SECRET");
        const authString = btoa(`${tokenId}:${tokenSecret}`);
        
        const response = await fetch('https://api.bulksms.com/v1/profile', {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const profileData = await response.json();
          connResult = {
            status: 'success',
            message: `BulkSMS connected. Balance: ${profileData.credits?.balance || 'unknown'}`,
            details: profileData
          };
        } else {
          const errorText = await response.text();
          connResult = {
            status: 'error',
            message: `BulkSMS connection failed: ${response.status} ${response.statusText}`,
            details: { status: response.status, error: errorText }
          };
          overallStatus = 'error';
        }
      } else {
        // BulkGate test
        const apiKey = Deno.env.get("BULKGATE_API_KEY");
        const [appId, appToken] = apiKey.split(':');
        
        const response = await fetch('https://portal.bulkgate.com/api/1.0/simple/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_id: parseInt(appId),
            application_token: appToken
          }),
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const data = await response.json();
          connResult = {
            status: 'success',
            message: `BulkGate connected. Balance: ${data.data?.credit || 'unknown'}`,
            details: data
          };
        } else {
          const errorText = await response.text();
          connResult = {
            status: 'error',
            message: `BulkGate connection failed: ${response.status} ${response.statusText}`,
            details: { status: response.status, error: errorText }
          };
          overallStatus = 'error';
        }
      }

      results.push({
        test: "Gateway Connectivity",
        ...connResult,
        duration: Date.now() - startConn
      });
    } catch (error) {
      results.push({
        test: "Gateway Connectivity",
        status: 'error',
        message: error.message,
        duration: Date.now() - startConn
      });
      overallStatus = 'error';
    }

    // Test 5: Test credit debit function (if phone provided)
    if (test_phone && overallStatus !== 'error') {
      const startDebit = Date.now();
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        // Test debit with 1 credit
        const { error: debitError } = await supabase.rpc('debit_user_credits', {
          _account_id: profile.id,
          _amount: 1,
          _reason: 'SMS diagnostic test',
          _meta: { test: true }
        });

        if (debitError) {
          results.push({
            test: "Credit Debit Test",
            status: 'error',
            message: `Failed to debit credits: ${debitError.message}`,
            details: debitError,
            duration: Date.now() - startDebit
          });
          overallStatus = 'error';
        } else {
          // Refund the credit
          await supabase.rpc('add_user_credits', {
            user_id: (await supabase.auth.getUser()).data.user?.id,
            credit_amount: 1
          });

          results.push({
            test: "Credit Debit Test",
            status: 'success',
            message: "Credit debit/refund successful",
            duration: Date.now() - startDebit
          });
        }
      } catch (error) {
        results.push({
          test: "Credit Debit Test",
          status: 'error',
          message: error.message,
          duration: Date.now() - startDebit
        });
        overallStatus = 'error';
      }
    }

    return new Response(JSON.stringify({
      overall_status: overallStatus,
      total_tests: results.length,
      results,
      timestamp: new Date().toISOString(),
      recommendations: generateRecommendations(results)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Diagnostic test error:', error);
    return new Response(JSON.stringify({
      error: 'DIAGNOSTIC_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateRecommendations(results: DiagnosticResult[]): string[] {
  const recommendations: string[] = [];
  
  results.forEach(result => {
    if (result.status === 'error') {
      switch (result.test) {
        case "User Authentication":
          recommendations.push("Verifique se está logado corretamente");
          break;
        case "User Profile":
          recommendations.push("Verifique se seu perfil está configurado e tem créditos");
          break;
        case "Gateway Credentials":
          recommendations.push("Configure as credenciais dos gateways SMS");
          break;
        case "Gateway Connectivity":
          recommendations.push("Verifique as credenciais e conectividade dos gateways");
          break;
        case "Credit Debit Test":
          recommendations.push("Problema na função de débito de créditos - contacte suporte");
          break;
      }
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push("Sistema funcionando corretamente");
  }
  
  return recommendations;
}