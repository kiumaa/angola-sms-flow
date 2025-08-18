import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function getCurrentAccountId(authHeader: string): Promise<string | null> {
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
    
  return profile?.id || null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get('Authorization') || '';
    const accountId = await getCurrentAccountId(authHeader);
    
    if (!accountId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /contact-tags-api - List all tags
    if (req.method === 'GET' && url.pathname === '/contact-tags-api') {
      const { data: tags, error } = await supabase
        .from('contact_tags')
        .select('*')
        .eq('account_id', accountId)
        .order('name');

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ tags: tags || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /contact-tags-api - Create new tag
    if (req.method === 'POST' && url.pathname === '/contact-tags-api') {
      const body = await req.json();
      const { name, color = '#6B7280' } = body;

      if (!name) {
        return new Response(JSON.stringify({ error: 'Tag name is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: tag, error } = await supabase
        .from('contact_tags')
        .insert({
          account_id: accountId,
          name: name.trim(),
          color
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique violation
          return new Response(JSON.stringify({ error: 'Tag name already exists' }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ tag }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // DELETE /contact-tags-api/:id - Delete tag
    if (req.method === 'DELETE' && url.pathname.startsWith('/contact-tags-api/')) {
      const tagId = url.pathname.split('/').pop();

      const { error } = await supabase
        .from('contact_tags')
        .delete()
        .eq('id', tagId)
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

    // POST /contact-tags-api/assign/:contactId - Assign/replace tags for contact
    if (req.method === 'POST' && url.pathname.includes('/assign/')) {
      const contactId = url.pathname.split('/assign/')[1];
      const { tagIds } = await req.json();

      // Verify contact belongs to account
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('id', contactId)
        .eq('account_id', accountId)
        .single();

      if (!contact) {
        return new Response(JSON.stringify({ error: 'Contact not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Remove existing tag relationships
      await supabase
        .from('contact_tag_pivot')
        .delete()
        .eq('contact_id', contactId);

      // Add new tag relationships
      if (tagIds && tagIds.length > 0) {
        const relationships = tagIds.map((tagId: string) => ({
          contact_id: contactId,
          tag_id: tagId
        }));

        const { error } = await supabase
          .from('contact_tag_pivot')
          .insert(relationships);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
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
    console.error('Contact tags API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});