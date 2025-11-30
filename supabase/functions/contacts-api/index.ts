import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ContactData {
  phone: string;
  name?: string;
  email?: string;
  attributes?: Record<string, any>;
  tags?: string[];
}

// Phone normalization function (copied from lib for edge function use)
function normalizePhoneAngola(input: string): { ok: boolean; e164?: string; reason?: string } {
  if (!input) return { ok: false, reason: 'empty_input' };
  
  const digitsOnly = input.replace(/\D/g, '');
  let normalized: string;

  if (digitsOnly.startsWith('244')) {
    if (digitsOnly.length === 12) {
      normalized = `+${digitsOnly}`;
    } else {
      return { ok: false, reason: 'invalid_length_with_country' };
    }
  } else if (digitsOnly.startsWith('00244')) {
    if (digitsOnly.length === 14) {
      normalized = `+${digitsOnly.substring(2)}`;
    } else {
      return { ok: false, reason: 'invalid_length_international' };
    }
  } else if (digitsOnly.length === 9 && digitsOnly.startsWith('9')) {
    normalized = `+244${digitsOnly}`;
  } else {
    return { ok: false, reason: 'invalid_format' };
  }

  if (normalized.length !== 13 || !normalized.startsWith('+2449')) {
    return { ok: false, reason: 'final_validation_failed' };
  }

  return { ok: true, e164: normalized };
}

async function getCurrentAccountId(authHeader: string): Promise<{ accountId: string | null; userId: string | null }> {
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  
  if (!user) return { accountId: null, userId: null };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
    
  return { accountId: profile?.id || null, userId: user.id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get('Authorization') || '';
    const { accountId, userId } = await getCurrentAccountId(authHeader);
    
    if (!accountId || !userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /contacts - List contacts with search and filters
    if (req.method === 'GET' && url.pathname === '/contacts-api') {
      const search = url.searchParams.get('search') || '';
      const tag = url.searchParams.get('tag') || '';
      const page = parseInt(url.searchParams.get('page') || '1');
      const size = Math.min(parseInt(url.searchParams.get('size') || '50'), 100);
      const offset = (page - 1) * size;

      let query = supabase
        .from('contacts')
        .select(`
          id, phone_e164, name, attributes, is_blocked, created_at, updated_at, phone, email
        `)
        .eq('account_id', accountId)
        .range(offset, offset + size - 1)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,phone_e164.ilike.%${search}%`);
      }

      if (tag) {
        query = query.eq('contact_tag_pivot.contact_tags.name', tag);
      }

      const { data: contacts, error } = await query;

      if (error) {
        console.error('Error fetching contacts:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get total count
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId);

      return new Response(JSON.stringify({ 
        contacts: contacts || [], 
        total: count || 0,
        page,
        size
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /contacts - Create contact
    if (req.method === 'POST' && url.pathname === '/contacts-api') {
      const body: ContactData = await req.json();
      
      // Normalize phone number
      const phoneResult = normalizePhoneAngola(body.phone);
      if (!phoneResult.ok) {
        return new Response(JSON.stringify({ 
          error: 'Invalid phone number',
          reason: phoneResult.reason 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Upsert contact with user_id
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .upsert({
          account_id: accountId,
          user_id: userId,
          phone: body.phone,
          phone_e164: phoneResult.e164,
          name: body.name,
          email: body.email || null,
          attributes: body.attributes || {}
        }, {
          onConflict: 'account_id,phone_e164',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (contactError) {
        console.error('Error creating contact:', contactError);
        return new Response(JSON.stringify({ error: contactError.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Handle tags if provided
      if (body.tags && body.tags.length > 0) {
        // Get or create tags
        const tagResults = await Promise.all(
          body.tags.map(async (tagName) => {
            const { data: existingTag } = await supabase
              .from('contact_tags')
              .select('id')
              .eq('account_id', accountId)
              .eq('name', tagName)
              .single();

            if (existingTag) {
              return existingTag.id;
            } else {
              const { data: newTag } = await supabase
                .from('contact_tags')
                .insert({ account_id: accountId, name: tagName })
                .select('id')
                .single();
              return newTag?.id;
            }
          })
        );

        // Add tag relationships
        const validTagIds = tagResults.filter(Boolean);
        if (validTagIds.length > 0) {
          await supabase
            .from('contact_tag_pivot')
            .upsert(
              validTagIds.map(tagId => ({
                contact_id: contact.id,
                tag_id: tagId
              })),
              { onConflict: 'contact_id,tag_id' }
            );
        }
      }

      return new Response(JSON.stringify({ contact }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // PUT /contacts/:id - Update contact
    if (req.method === 'PUT' && url.pathname.startsWith('/contacts-api/')) {
      const contactId = url.pathname.split('/').pop();
      const body: Partial<ContactData> = await req.json();

      let updateData: any = {};
      
      if (body.name !== undefined) updateData.name = body.name;
      if (body.attributes !== undefined) updateData.attributes = body.attributes;
      
      if (body.phone) {
        const phoneResult = normalizePhoneAngola(body.phone);
        if (!phoneResult.ok) {
          return new Response(JSON.stringify({ 
            error: 'Invalid phone number',
            reason: phoneResult.reason 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        updateData.phone_e164 = phoneResult.e164;
      }

      const { data: contact, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', contactId)
        .eq('account_id', accountId)
        .select()
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === 'PGRST116' ? 404 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ contact }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE /contacts/:id - Delete contact
    if (req.method === 'DELETE' && url.pathname.startsWith('/contacts-api/')) {
      const contactId = url.pathname.split('/').pop();

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)
        .eq('account_id', accountId);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === 'PGRST116' ? 404 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contact API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});