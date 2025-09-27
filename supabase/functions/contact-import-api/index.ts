import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Phone normalization function
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

async function processImportData(
  accountId: string, 
  data: any[], 
  columnMapping: Record<string, string>
): Promise<{ total: number; inserted: number; updated: number; duplicates: number; invalid: number; errors: string[] }> {
  
  const results = {
    total: data.length,
    inserted: 0,
    updated: 0,
    duplicates: 0,
    invalid: 0,
    errors: [] as string[]
  };

  const processedPhones = new Set<string>();
  const validContacts: any[] = [];

  // Process each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const phone = row[columnMapping.phone];
    const name = row[columnMapping.name];

    if (!phone || !name) {
      results.invalid++;
      results.errors.push(`Row ${i + 1}: Missing required fields (phone/name)`);
      continue;
    }

    // Normalize phone
    const phoneResult = normalizePhoneAngola(phone);
    if (!phoneResult.ok) {
      results.invalid++;
      results.errors.push(`Row ${i + 1}: Invalid phone number - ${phoneResult.reason}`);
      continue;
    }

    // Check for duplicates within the file
    if (processedPhones.has(phoneResult.e164!)) {
      results.duplicates++;
      continue;
    }
    processedPhones.add(phoneResult.e164!);

    // Build contact object
    const contact = {
      account_id: accountId,
      phone_e164: phoneResult.e164,
      name: name.trim(),
      attributes: {} as Record<string, any>
    };

    // Add additional attributes
    Object.entries(columnMapping).forEach(([field, column]) => {
      if (field.startsWith('attributes.') && row[column]) {
        const attrName = field.substring(11); // Remove 'attributes.' prefix
        contact.attributes[attrName] = row[column];
      }
    });

    validContacts.push(contact);
  }

  // Process contacts in chunks of 100
  const chunkSize = 100;
  for (let i = 0; i < validContacts.length; i += chunkSize) {
    const chunk = validContacts.slice(i, i + chunkSize);
    
    try {
      // Check for existing contacts in this chunk
      const phoneNumbers = chunk.map(c => c.phone_e164);
      const { data: existingContacts } = await supabase
        .from('contacts')
        .select('phone_e164')
        .eq('account_id', accountId)
        .in('phone_e164', phoneNumbers);

      const existingPhones = new Set(existingContacts?.map(c => c.phone_e164) || []);
      
      // Separate new vs existing
      const newContacts = chunk.filter(c => !existingPhones.has(c.phone_e164!));
      const existingContactsToUpdate = chunk.filter(c => existingPhones.has(c.phone_e164!));

      // Insert new contacts
      if (newContacts.length > 0) {
        const { error: insertError } = await supabase
          .from('contacts')
          .insert(newContacts);

        if (insertError) {
          results.errors.push(`Chunk ${i / chunkSize + 1}: Insert error - ${insertError.message}`);
        } else {
          results.inserted += newContacts.length;
        }
      }

      // Update existing contacts (upsert by phone_e164)
      for (const contact of existingContactsToUpdate) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update({
            name: contact.name,
            attributes: contact.attributes
          })
          .eq('account_id', accountId)
          .eq('phone_e164', contact.phone_e164);

        if (updateError) {
          results.errors.push(`Update error for ${contact.phone_e164}: ${updateError.message}`);
        } else {
          results.updated++;
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing error';
      results.errors.push(`Chunk ${i / chunkSize + 1}: Processing error - ${errorMessage}`);
    }
  }

  return results;
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

    // POST /contact-import-api/process - Process import data directly (for simple imports)
    if (req.method === 'POST' && url.pathname === '/contact-import-api/process') {
      const body = await req.json();
      const { data, columnMapping } = body;

      if (!data || !Array.isArray(data) || !columnMapping) {
        return new Response(JSON.stringify({ error: 'Invalid request data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (!columnMapping.phone || !columnMapping.name) {
        return new Response(JSON.stringify({ error: 'Phone and name mappings are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      console.log(`Processing import for account ${accountId}: ${data.length} rows`);
      
      const results = await processImportData(accountId, data, columnMapping);
      
      console.log(`Import completed:`, results);

      return new Response(JSON.stringify({ 
        success: true,
        results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /contact-import-api/jobs - List import jobs
    if (req.method === 'GET' && url.pathname === '/contact-import-api/jobs') {
      const { data: jobs, error } = await supabase
        .from('contact_import_jobs')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ jobs: jobs || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /contact-import-api/jobs/:id - Get specific import job
    if (req.method === 'GET' && url.pathname.startsWith('/contact-import-api/jobs/')) {
      const jobId = url.pathname.split('/').pop();

      const { data: job, error } = await supabase
        .from('contact_import_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('account_id', accountId)
        .single();

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: error.code === 'PGRST116' ? 404 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ job }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contact import API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});