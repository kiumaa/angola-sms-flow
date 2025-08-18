import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AudienceFilter {
  type: 'tags' | 'list' | 'manual';
  ids?: string[];
  phones?: string[];
}

interface CampaignRequest {
  name: string;
  message_template: string;
  audience: AudienceFilter;
  sender_id?: string;
  schedule_at?: string;
  timezone?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Get user's account_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, credits')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return new Response('Profile not found', { status: 404, headers: corsHeaders })
    }

    const account_id = profile.id
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const campaignId = pathParts[pathParts.length - 1]

    // Routes handling
    if (req.method === 'GET') {
      if (campaignId && campaignId !== 'campaigns-api') {
        // Get single campaign
        return await getCampaign(supabase, campaignId, account_id)
      } else {
        // List campaigns
        return await listCampaigns(supabase, account_id, url.searchParams)
      }
    }

    if (req.method === 'POST') {
      if (url.pathname.includes('/queue')) {
        // Queue campaign
        return await queueCampaign(supabase, campaignId, account_id)
      } else if (url.pathname.includes('/pause')) {
        // Pause campaign
        return await pauseCampaign(supabase, campaignId, account_id)
      } else if (url.pathname.includes('/resume')) {
        // Resume campaign
        return await resumeCampaign(supabase, campaignId, account_id)
      } else if (url.pathname.includes('/cancel')) {
        // Cancel campaign
        return await cancelCampaign(supabase, campaignId, account_id)
      } else if (url.pathname.includes('/retry-failed')) {
        // Retry failed targets
        return await retryFailedTargets(supabase, campaignId, account_id)
      } else {
        // Create campaign
        const body: CampaignRequest = await req.json()
        return await createCampaign(supabase, body, account_id, user.id)
      }
    }

    if (req.method === 'PUT') {
      // Update campaign
      const body = await req.json()
      return await updateCampaign(supabase, campaignId, body, account_id)
    }

    if (req.method === 'DELETE') {
      // Delete campaign
      return await deleteCampaign(supabase, campaignId, account_id)
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  } catch (error) {
    console.error('Campaign API Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function createCampaign(supabase: any, body: CampaignRequest, account_id: string, user_id: string) {
  // Create campaign in draft status first
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      account_id,
      created_by: user_id,
      name: body.name,
      message_template: body.message_template,
      sender_id: body.sender_id || 'SMSAO',
      schedule_at: body.schedule_at || null,
      timezone: body.timezone || 'Africa/Luanda',
      status: 'draft'
    })
    .select()
    .single()

  if (campaignError) {
    return new Response(JSON.stringify({ error: campaignError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Calculate audience preview
  const audiencePreview = await calculateAudiencePreview(supabase, body.audience, account_id)

  // Update campaign with preview data
  await supabase
    .from('campaigns')
    .update({
      total_targets: audiencePreview.total_targets,
      est_credits: audiencePreview.est_credits
    })
    .eq('id', campaign.id)

  return new Response(JSON.stringify({
    campaign: { ...campaign, total_targets: audiencePreview.total_targets, est_credits: audiencePreview.est_credits },
    preview: audiencePreview
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function calculateAudiencePreview(supabase: any, audience: AudienceFilter, account_id: string) {
  let contacts = []

  if (audience.type === 'tags') {
    // Get contacts by tags
    if (audience.ids?.length) {
      const { data } = await supabase
        .from('contacts')
        .select(`
          id, name, phone_e164, attributes,
          contact_tag_pivot!inner(tag_id)
        `)
        .eq('account_id', account_id)
        .eq('is_blocked', false)
        .in('contact_tag_pivot.tag_id', audience.ids)

      contacts = data || []
    }
  } else if (audience.type === 'list') {
    // Get contacts by list
    if (audience.ids?.length) {
      const { data } = await supabase
        .from('contacts')
        .select(`
          id, name, phone_e164, attributes,
          contact_list_members!inner(list_id)
        `)
        .eq('account_id', account_id)
        .eq('is_blocked', false)
        .in('contact_list_members.list_id', audience.ids)

      contacts = data || []
    }
  } else if (audience.type === 'manual' && audience.phones) {
    // Manual phone list
    const validPhones = audience.phones.filter(phone => 
      phone.startsWith('+2449') && phone.length === 13
    )

    // Try to match existing contacts first
    const { data } = await supabase
      .from('contacts')
      .select('id, name, phone_e164, attributes')
      .eq('account_id', account_id)
      .eq('is_blocked', false)
      .in('phone_e164', validPhones)

    contacts = data || []

    // Add phones that don't have contacts as ad-hoc entries
    const existingPhones = contacts.map(c => c.phone_e164)
    const newPhones = validPhones.filter(phone => !existingPhones.includes(phone))
    
    for (const phone of newPhones) {
      contacts.push({
        id: null,
        name: null,
        phone_e164: phone,
        attributes: {}
      })
    }
  }

  // Deduplicate by phone
  const uniqueContacts = contacts.reduce((acc, contact) => {
    if (!acc.some(c => c.phone_e164 === contact.phone_e164)) {
      acc.push(contact)
    }
    return acc
  }, [])

  // Estimate credits (simplified - 1 credit per contact for now)
  // In a real implementation, you'd merge templates and calculate segments
  const est_credits = uniqueContacts.length

  return {
    total_targets: uniqueContacts.length,
    est_credits,
    sample_contacts: uniqueContacts.slice(0, 3)
  }
}

async function queueCampaign(supabase: any, campaignId: string, account_id: string) {
  // Get campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .eq('account_id', account_id)
    .single()

  if (campaignError || !campaign) {
    return new Response(JSON.stringify({ error: 'Campaign not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (campaign.status !== 'draft') {
    return new Response(JSON.stringify({ error: 'Campaign must be in draft status' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Check user credits
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', account_id)
    .single()

  if (!profile || profile.credits < campaign.est_credits) {
    return new Response(JSON.stringify({ 
      error: 'Insufficient credits',
      required: campaign.est_credits,
      available: profile?.credits || 0
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Update status to queued
  const status = campaign.schedule_at ? 'scheduled' : 'queued'
  
  const { error: updateError } = await supabase
    .from('campaigns')
    .update({ status })
    .eq('id', campaignId)

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true, status }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function pauseCampaign(supabase: any, campaignId: string, account_id: string) {
  const { error } = await supabase
    .from('campaigns')
    .update({ status: 'paused' })
    .eq('id', campaignId)
    .eq('account_id', account_id)
    .in('status', ['queued', 'sending'])

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function resumeCampaign(supabase: any, campaignId: string, account_id: string) {
  const { error } = await supabase
    .from('campaigns')
    .update({ status: 'queued' })
    .eq('id', campaignId)
    .eq('account_id', account_id)
    .eq('status', 'paused')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function cancelCampaign(supabase: any, campaignId: string, account_id: string) {
  const { error } = await supabase
    .from('campaigns')
    .update({ status: 'canceled' })
    .eq('id', campaignId)
    .eq('account_id', account_id)
    .in('status', ['draft', 'queued', 'paused', 'scheduled'])

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Cancel queued targets
  await supabase
    .from('campaign_targets')
    .update({ status: 'canceled' })
    .eq('campaign_id', campaignId)
    .eq('status', 'queued')

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function retryFailedTargets(supabase: any, campaignId: string, account_id: string) {
  // Reset failed targets to queued
  const { error } = await supabase
    .from('campaign_targets')
    .update({ 
      status: 'queued',
      error_code: null,
      error_detail: null,
      tries: 0
    })
    .eq('campaign_id', campaignId)
    .eq('account_id', account_id)
    .eq('status', 'failed')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Update campaign status if needed
  await supabase
    .from('campaigns')
    .update({ status: 'queued' })
    .eq('id', campaignId)
    .eq('status', 'completed')

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function listCampaigns(supabase: any, account_id: string, searchParams: URLSearchParams) {
  let query = supabase
    .from('campaigns')
    .select(`
      id, name, status, created_at, updated_at, total_targets, est_credits,
      campaign_stats(queued, sending, sent, delivered, failed, credits_spent)
    `)
    .eq('account_id', account_id)
    .order('created_at', { ascending: false })

  // Apply filters
  const status = searchParams.get('status')
  if (status) {
    query = query.eq('status', status)
  }

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ data, page, limit }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getCampaign(supabase: any, campaignId: string, account_id: string) {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_stats(*)
    `)
    .eq('id', campaignId)
    .eq('account_id', account_id)
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function updateCampaign(supabase: any, campaignId: string, body: any, account_id: string) {
  const { error } = await supabase
    .from('campaigns')
    .update(body)
    .eq('id', campaignId)
    .eq('account_id', account_id)
    .eq('status', 'draft')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function deleteCampaign(supabase: any, campaignId: string, account_id: string) {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)
    .eq('account_id', account_id)
    .in('status', ['draft', 'canceled'])

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}