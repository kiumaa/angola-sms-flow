import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SMS segment calculation utilities
function isGSM7Compatible(text: string): boolean {
  const GSM_7BIT_CHARS = `@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà`
  const GSM_EXTENDED_CHARS = `|^€{}[~]\\`
  
  for (const char of text) {
    if (!GSM_7BIT_CHARS.includes(char) && !GSM_EXTENDED_CHARS.includes(char)) {
      return false
    }
  }
  return true
}

function countGSM7Chars(text: string): number {
  const GSM_EXTENDED_CHARS = `|^€{}[~]\\`
  let count = 0
  for (const char of text) {
    if (GSM_EXTENDED_CHARS.includes(char)) {
      count += 2
    } else {
      count += 1
    }
  }
  return count
}

function calculateSegments(text: string): { encoding: string; segments: number } {
  if (!text) return { encoding: 'GSM7', segments: 0 }
  
  const isGSM7 = isGSM7Compatible(text)
  const encoding = isGSM7 ? 'GSM7' : 'UCS2'
  
  let effectiveLength: number
  let singleLimit: number
  let concatLimit: number

  if (encoding === 'GSM7') {
    effectiveLength = countGSM7Chars(text)
    singleLimit = 160
    concatLimit = 153
  } else {
    effectiveLength = text.length
    singleLimit = 70
    concatLimit = 67
  }

  let segments: number
  if (effectiveLength <= singleLimit) {
    segments = 1
  } else {
    segments = Math.ceil(effectiveLength / concatLimit)
  }

  return { encoding, segments }
}

function mergeTemplate(template: string, contact: any): string {
  if (!template) return ''
  
  let merged = template
  
  // Replace {{name}} with contact name or empty string
  merged = merged.replace(/\{\{name\}\}/g, contact.name || '')
  
  // Replace {{attributes.field}} with attribute values
  merged = merged.replace(/\{\{attributes\.([^}]+)\}\}/g, (match, field) => {
    return contact.attributes?.[field]?.toString() || ''
  })
  
  // Replace other contact fields
  merged = merged.replace(/\{\{([^}]+)\}\}/g, (match, field) => {
    if (field.startsWith('attributes.')) return match
    return contact[field]?.toString() || ''
  })
  
  return merged
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Campaign worker started')

    // Process queued campaigns
    await processQueuedCampaigns(supabase)

    // Send SMS for targets ready to send
    await processSendingTargets(supabase)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Campaign worker error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Campaign worker error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processQueuedCampaigns(supabase: any) {
  // Get campaigns that are queued and ready to process
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(10)

  for (const campaign of campaigns || []) {
    console.log(`Processing campaign ${campaign.id}`)
    
    try {
      // Create targets for this campaign
      await createCampaignTargets(supabase, campaign)
      
      // Update campaign status to sending
      await supabase
        .from('campaigns')
        .update({ status: 'sending' })
        .eq('id', campaign.id)

      console.log(`Campaign ${campaign.id} moved to sending status`)
      
    } catch (error) {
      console.error(`Error processing campaign ${campaign.id}:`, error)
      
      // Mark campaign as failed
      await supabase
        .from('campaigns')
        .update({ status: 'failed' })
        .eq('id', campaign.id)
    }
  }
}

async function createCampaignTargets(supabase: any, campaign: any) {
  // This is a simplified version - in a real implementation, you'd need to 
  // recreate the audience logic based on stored campaign data
  
  // For now, let's assume we have a simple way to get contacts
  // In practice, you'd store the audience criteria with the campaign
  
  console.log(`Creating targets for campaign ${campaign.id}`)
  
  // Get some contacts for demo (this would be replaced with proper audience logic)
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('account_id', campaign.account_id)
    .eq('is_blocked', false)
    .limit(100)

  if (!contacts || contacts.length === 0) {
    console.log('No contacts found for campaign')
    return
  }

  // Create targets
  const targets = []
  const seenPhones = new Set()

  for (const contact of contacts) {
    if (!contact.phone_e164 || seenPhones.has(contact.phone_e164)) {
      continue
    }
    
    seenPhones.add(contact.phone_e164)
    
    // Merge template with contact data
    const renderedMessage = mergeTemplate(campaign.message_template, contact)
    const segmentInfo = calculateSegments(renderedMessage)
    
    targets.push({
      campaign_id: campaign.id,
      account_id: campaign.account_id,
      contact_id: contact.id,
      phone_e164: contact.phone_e164,
      rendered_message: renderedMessage,
      segments: segmentInfo.segments,
      cost_credits: segmentInfo.segments,
      status: 'queued'
    })
  }

  if (targets.length === 0) {
    console.log('No valid targets to create')
    return
  }

  // Insert targets in batches
  const batchSize = 100
  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize)
    const { error } = await supabase
      .from('campaign_targets')
      .insert(batch)
    
    if (error) {
      console.error('Error inserting targets batch:', error)
      throw error
    }
  }

  // Update campaign total targets
  await supabase
    .from('campaigns')
    .update({ total_targets: targets.length })
    .eq('id', campaign.id)

  console.log(`Created ${targets.length} targets for campaign ${campaign.id}`)
}

async function processSendingTargets(supabase: any) {
  // Get targets ready to send with rate limiting and priority
  const { data: targets } = await supabase
    .from('campaign_targets')
    .select(`
      *,
      campaigns!inner(status, account_id, sender_id, created_at)
    `)
    .eq('status', 'queued')
    .eq('campaigns.status', 'sending')
    .lt('tries', 3) // Max 3 attempts per target
    .order('queued_at', { ascending: true })
    .limit(100) // Increased batch size

  if (!targets || targets.length === 0) {
    console.log('No targets ready for sending')
    return
  }

  console.log(`Processing ${targets.length} targets for sending`)

  // Group targets by account to implement per-account rate limiting
  const targetsByAccount = targets.reduce((acc: Record<string, any[]>, target: any) => {
    const accountId = target.campaigns.account_id
    if (!acc[accountId]) acc[accountId] = []
    acc[accountId].push(target)
    return acc
  }, {} as Record<string, any[]>)

  // Process each account's targets with rate limiting
  for (const [accountId, accountTargets] of Object.entries(targetsByAccount)) {
    await processAccountTargets(supabase, accountId, accountTargets as any[])
  }
}

async function processAccountTargets(supabase: any, accountId: string, targets: any[]) {
  console.log(`Processing ${targets.length} targets for account ${accountId}`)
  
  // Rate limit: 5 SMS per second per account
  const rateLimit = 5
  const delayMs = 1000 / rateLimit

  for (const target of targets) {
    try {
      await sendSMS(supabase, target)
      // Respect rate limit
      await new Promise(resolve => setTimeout(resolve, delayMs))
    } catch (error) {
      console.error(`Error processing target ${target.id}:`, error)
      // Continue with next target
    }
  }
}

async function sendSMS(supabase: any, target: any) {
  try {
    console.log(`Sending SMS to ${target.phone_e164} for campaign ${target.campaign_id}`)

    // Mark as sending
    await supabase
      .from('campaign_targets')
      .update({ 
        status: 'sending',
        last_attempt_at: new Date().toISOString(),
        tries: target.tries + 1
      })
      .eq('id', target.id)

    // Check and debit credits first
    const debitSuccess = await supabase.rpc('debit_user_credits', {
      _account_id: target.account_id,
      _amount: target.cost_credits,
      _reason: `Campaign ${target.campaign_id} - ${target.phone_e164}`,
      _meta: { campaign_id: target.campaign_id, target_id: target.id }
    })

    if (!debitSuccess) {
      // Insufficient credits
      await supabase
        .from('campaign_targets')
        .update({ 
          status: 'failed',
          error_code: 'INSUFFICIENT_CREDITS',
          error_detail: 'Not enough credits to send SMS'
        })
        .eq('id', target.id)
      
      console.log(`Insufficient credits for target ${target.id}`)
      return
    }

    // Send SMS via BulkSMS
    const bulkSMSResponse = await sendViaBulkSMS(
      target.phone_e164,
      target.rendered_message,
      target.campaigns.sender_id || 'SMSAO'
    )

    if (bulkSMSResponse.success) {
      // Success
      await supabase
        .from('campaign_targets')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString(),
          bulksms_message_id: bulkSMSResponse.message_id
        })
        .eq('id', target.id)
        
      console.log(`SMS sent successfully to ${target.phone_e164}`)
    } else {
      // Failed to send
      await supabase
        .from('campaign_targets')
        .update({ 
          status: 'failed',
          error_code: bulkSMSResponse.error_code || 'SEND_FAILED',
          error_detail: bulkSMSResponse.error || 'Failed to send SMS'
        })
        .eq('id', target.id)
        
      console.log(`Failed to send SMS to ${target.phone_e164}: ${bulkSMSResponse.error}`)
    }

  } catch (error) {
    console.error(`Error sending SMS to ${target.phone_e164}:`, error)
    
    // Update target with error
    const errorMessage = error instanceof Error ? error.message : 'System error';
    await supabase
      .from('campaign_targets')
      .update({ 
        status: 'failed',
        error_code: 'SYSTEM_ERROR',
        error_detail: errorMessage
      })
      .eq('id', target.id)
  }

  // Update campaign stats
  await supabase.rpc('update_campaign_stats', { _campaign_id: target.campaign_id })
}

async function sendViaBulkSMS(phone: string, message: string, senderId: string) {
  try {
    const tokenId = Deno.env.get('BULKSMS_TOKEN_ID')
    const tokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET')
    
    if (!tokenId || !tokenSecret) {
      throw new Error('BulkSMS credentials not configured')
    }

    const auth = btoa(`${tokenId}:${tokenSecret}`)
    
    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([{
        to: phone,
        body: message,
        from: senderId
      }])
    })

    const responseData = await response.json()
    
    if (response.ok && responseData.length > 0) {
      return {
        success: true,
        message_id: responseData[0].id
      }
    } else {
      return {
        success: false,
        error_code: responseData.status?.type || 'UNKNOWN_ERROR',
        error: responseData.detail || 'Unknown error occurred'
      }
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error';
    return {
      success: false,
      error_code: 'NETWORK_ERROR',
      error: errorMessage
    }
  }
}