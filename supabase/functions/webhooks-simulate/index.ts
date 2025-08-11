import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow in development mode
  const isDev = Deno.env.get('ENVIRONMENT') === 'development';
  if (!isDev) {
    return new Response(
      JSON.stringify({ error: 'Simulation endpoint only available in development' }),
      { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a mock delivery report
    const mockDeliveryReport = {
      id: `mock_${Date.now()}`,
      status: {
        type: 'DELIVERED',
        description: 'Message delivered successfully'
      },
      batchId: `batch_${Date.now()}`,
      to: '+244923456789',
      completedAt: new Date().toISOString()
    };

    // Insert mock SMS log first
    const { data: smsLog, error: insertError } = await supabase
      .from('sms_logs')
      .insert({
        gateway: 'bulksms',
        sender: 'SMSAO',
        to: mockDeliveryReport.to,
        message: 'Mock delivery test message',
        batch_id: mockDeliveryReport.batchId,
        status: 'submitted',
        user_id: '00000000-0000-0000-0000-000000000000' // Mock user ID
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting mock SMS log:', insertError);
    }

    // Simulate processing the delivery report
    const { error: updateError } = await supabase
      .from('sms_logs')
      .update({
        status: 'delivered',
        delivered_at: mockDeliveryReport.completedAt,
        updated_at: new Date().toISOString()
      })
      .eq('batch_id', mockDeliveryReport.batchId);

    if (updateError) {
      console.error('Error updating SMS log:', updateError);
      throw updateError;
    }

    console.log('Mock delivery report processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Mock delivery report processed',
        mockData: mockDeliveryReport,
        smsLogUpdated: true
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Webhook simulation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});