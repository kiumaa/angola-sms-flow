import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // GET /branding-api - Get current brand settings
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('brand_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return new Response(
        JSON.stringify({ data: data || {} }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // PUT /branding-api - Update brand settings
    if (req.method === 'PUT') {
      const body = await req.json();
      
      // Validate required fields
      const validFields = [
        'site_title', 'site_tagline',
        'light_primary', 'light_secondary', 'light_bg', 'light_text',
        'dark_primary', 'dark_secondary', 'dark_bg', 'dark_text',
        'font_family', 'font_scale',
        'logo_light_url', 'logo_dark_url', 'favicon_url', 'og_image_url',
        'seo_title', 'seo_description', 'seo_canonical', 'seo_twitter',
        'custom_css'
      ];

      const updateData: any = {};
      for (const field of validFields) {
        if (body[field] !== undefined) {
          updateData[field] = body[field];
        }
      }

      // Check if any brand settings exist
      const { data: existing } = await supabase
        .from('brand_settings')
        .select('id')
        .single();

      let result;
      if (existing) {
        // Update existing
        result = await supabase
          .from('brand_settings')
          .update(updateData)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Insert new
        result = await supabase
          .from('brand_settings')
          .insert(updateData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      // Broadcast update via realtime
      await supabase
        .channel('branding')
        .send({
          type: 'broadcast',
          event: 'updated',
          payload: result.data
        });

      return new Response(
        JSON.stringify({ data: result.data, message: 'Settings updated successfully' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // POST /branding-api/upload - Upload branding files
    if (req.method === 'POST' && path === 'upload') {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const fileType = formData.get('type') as string; // logo_light, logo_dark, favicon, og_image
      
      if (!file) {
        return new Response(
          JSON.stringify({ error: 'No file provided' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      // Validate file type and size
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      const maxSizes = {
        logo_light: 2 * 1024 * 1024, // 2MB
        logo_dark: 2 * 1024 * 1024,  // 2MB
        favicon: 256 * 1024,         // 256KB
        og_image: 2 * 1024 * 1024    // 2MB
      };

      if (!allowedTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid file type. Only PNG, JPG, and SVG are allowed.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }

      if (file.size > maxSizes[fileType as keyof typeof maxSizes]) {
        return new Response(
          JSON.stringify({ error: 'File too large' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 413,
          }
        );
      }

      // Generate file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${fileType}_${Date.now()}.${fileExt}`;
      const filePath = `branding/${fileType}s/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      return new Response(
        JSON.stringify({ 
          data: { 
            url: publicUrl, 
            path: filePath,
            type: fileType 
          } 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    );

  } catch (error) {
    console.error('Branding API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})