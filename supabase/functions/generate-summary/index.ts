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

  try {
    const { elderId, date } = await req.json();
    
    if (!elderId || !date) {
      return new Response(
        JSON.stringify({ error: 'elderId and date are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Generating summary for elder ${elderId} on ${date}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get memories and questions from the specified date
    const startOfDay = `${date}T00:00:00.000Z`;
    const endOfDay = `${date}T23:59:59.999Z`;

    const [memoriesRes, questionsRes] = await Promise.all([
      supabase
        .from('memories')
        .select('*')
        .eq('elder_id', elderId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay),
      supabase
        .from('questions')
        .select('*')
        .eq('elder_id', elderId)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
    ]);

    const memories = memoriesRes.data || [];
    const questions = questionsRes.data || [];

    if (memories.length === 0 && questions.length === 0) {
      return new Response(
        JSON.stringify({ summary: 'No activity recorded for this day.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const memoriesText = memories.map((m: any) => `- ${m.raw_text}`).join('\n');
    const questionsText = questions.map((q: any) => `Q: ${q.question_text}\nA: ${q.answer_text || 'No answer yet'}`).join('\n\n');

    const prompt = `Generate a warm, caring daily summary for an elderly user based on their activities today.

Memories recorded today:
${memoriesText || 'No new memories today.'}

Questions asked today:
${questionsText || 'No questions today.'}

Write a brief, encouraging summary (2-3 sentences) highlighting what was shared and any patterns or important information. Use a warm, friendly tone.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'You are a caring assistant creating daily summaries for elderly users. Keep summaries warm, brief, and encouraging.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('AI service unavailable');
    }

    const aiResponse = await response.json();
    const summary = aiResponse.choices?.[0]?.message?.content || 'Summary could not be generated.';

    // Store the summary
    const { error: insertError } = await supabase
      .from('daily_summaries')
      .upsert({
        elder_id: elderId,
        date: date,
        summary_text: summary
      }, {
        onConflict: 'elder_id,date'
      });

    if (insertError) {
      console.error('Error storing summary:', insertError);
    }

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-summary function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
