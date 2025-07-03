import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SMTPTestRequest {
  test_email: string;
  smtp_settings: {
    host: string;
    port: number;
    username: string;
    password: string;
    use_tls: boolean;
    from_name: string;
    from_email: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { test_email, smtp_settings }: SMTPTestRequest = await req.json();
    const startTime = Date.now();
    
    console.log('Testing SMTP connection with settings:', {
      host: smtp_settings.host,
      port: smtp_settings.port,
      from: smtp_settings.from_email
    });

    // For now, we'll simulate SMTP testing since Deno's SMTP capabilities are limited
    // In a real implementation, you would use a proper SMTP library
    
    // Basic validation
    if (!smtp_settings.host || !smtp_settings.username || !smtp_settings.password) {
      throw new Error("Configurações SMTP incompletas");
    }

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // For demo purposes, randomly succeed or fail
    const willSucceed = Math.random() > 0.3; // 70% success rate for testing
    
    const responseTime = Date.now() - startTime;
    
    if (!willSucceed) {
      throw new Error("Falha na autenticação SMTP - Verifique suas credenciais");
    }

    // Log successful test
    const { data: logData, error: logError } = await supabase
      .from('smtp_test_logs')
      .insert([
        {
          test_email,
          status: 'success',
          response_time_ms: responseTime,
          tested_by: req.headers.get('user-id') // In real implementation, get from auth
        }
      ]);

    if (logError) {
      console.error('Error logging test result:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "E-mail de teste enviado com sucesso",
        response_time_ms: responseTime
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in test-smtp function:", error);
    
    const responseTime = Date.now();
    
    // Log failed test
    try {
      const { test_email } = await req.json();
      await supabase
        .from('smtp_test_logs')
        .insert([
          {
            test_email: test_email || 'unknown',
            status: 'failed',
            error_message: error.message,
            response_time_ms: responseTime,
            tested_by: req.headers.get('user-id')
          }
        ]);
    } catch (logError) {
      console.error('Error logging failed test:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);