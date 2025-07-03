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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, userId } = await req.json()

    if (!email || !userId) {
      return new Response(
        JSON.stringify({ error: 'Email and userId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Generate confirmation token
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update profile with confirmation token
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        email_confirm_token: token,
        email_confirm_expires_at: expiresAt.toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      throw updateError
    }

    // In a real implementation, you would send an email here
    // For now, we'll just return the token for testing
    const confirmationUrl = `https://angola-sms-flow.lovable.app/confirm-email?token=${token}`

    console.log(`Confirmation email would be sent to ${email}`)
    console.log(`Confirmation URL: ${confirmationUrl}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Confirmation email sent',
        // Remove this in production - only for testing
        confirmationUrl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending confirmation email:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})