import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'POST') {
      // Create a new memory
      const { elderId, rawText, type, tags, structuredJson } = await req.json();
      
      if (!elderId || !rawText) {
        return new Response(
          JSON.stringify({ error: 'elderId and rawText are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Creating memory for elder ${elderId}`);

      const { data, error } = await supabase
        .from('memories')
        .insert({
          elder_id: elderId,
          raw_text: rawText,
          type: type || 'other',
          tags: tags || [],
          structured_json: structuredJson || {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating memory:', error);
        throw error;
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // List memories with optional filters
      const url = new URL(req.url);
      const elderId = url.searchParams.get('elderId');
      const type = url.searchParams.get('type');
      const tag = url.searchParams.get('tag');
      const limit = parseInt(url.searchParams.get('limit') || '50');

      if (!elderId) {
        return new Response(
          JSON.stringify({ error: 'elderId is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let query = supabase
        .from('memories')
        .select('*')
        .eq('elder_id', elderId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('type', type);
      }

      if (tag) {
        query = query.contains('tags', [tag]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching memories:', error);
        throw error;
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in memories function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
