import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, elderId } = await req.json();
    
    if (!question || !elderId) {
      return new Response(
        JSON.stringify({ error: 'Question and elderId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Answering question for elder ${elderId}: "${question}"`);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch elder's memories
    const { data: memories, error: memoriesError } = await supabase
      .from('memories')
      .select('*')
      .eq('elder_id', elderId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (memoriesError) {
      console.error('Error fetching memories:', memoriesError);
      throw new Error('Failed to fetch memories');
    }

    // Build context from memories
    const memoryContext = memories?.map((m: any, i: number) => 
      `Memory ${i + 1} (${m.type}): ${m.raw_text}`
    ).join('\n\n') || 'No memories recorded yet.';

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a warm, patient, and caring memory assistant for elderly users. Your role is to help answer questions based on the memories that have been shared with you.

Guidelines:
- Be warm, friendly, and reassuring in your responses
- Use simple, clear language
- If you find relevant memories, reference them naturally in your answer
- If no relevant memories exist, gently explain that and offer to help record new memories
- Keep responses concise but complete
- Always be encouraging and positive

Here are the user's recorded memories:
${memoryContext}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI service unavailable');
    }

    const aiResponse = await response.json();
    const answer = aiResponse.choices?.[0]?.message?.content || 'I apologize, but I could not generate an answer at this time.';

    // Find matched memories based on keywords in the question
    const questionWords = question.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const matchedMemories = memories?.filter((m: any) => {
      const text = m.raw_text.toLowerCase();
      return questionWords.some((word: string) => text.includes(word));
    }) || [];

    // Store the question and answer
    const { error: insertError } = await supabase
      .from('questions')
      .insert({
        elder_id: elderId,
        question_text: question,
        answer_text: answer,
        matched_memory_ids: matchedMemories.map((m: any) => m.id)
      });

    if (insertError) {
      console.error('Error storing question:', insertError);
    }

    return new Response(
      JSON.stringify({ 
        answer,
        matchedMemories: matchedMemories.slice(0, 5)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in answer-question function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
