/**
 * AI Module for Memory Friend
 * 
 * This module contains AI-related functions using Gemini API directly.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Memory, AnswerResponse } from "@/types";


// Get Gemini API key from environment (works in both Vite and Next.js)
const getGeminiApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    // Client-side: check import.meta.env (Vite)
    return (import.meta.env?.VITE_GEMINI_API_KEY as string) || null;
  }
  // Server-side: check process.env
  return (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || null;
};


/**
 * Answer a question using the elder's memories as context
 */
export async function answerQuestion(
  question: string,
  elderId: string
): Promise<AnswerResponse> {
  // Fetch elder's memories
  const { data: memories, error: memError } = await supabase
    .from('memories')
    .select('*')
    .eq('elder_id', elderId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (memError) {
    console.error('Error fetching memories:', memError);
    throw new Error(memError.message || 'Failed to get answer');
  }

  const apiKey = getGeminiApiKey();
  
  if (apiKey && memories && memories.length > 0) {
    try {
      // Use Gemini API for intelligent answer
      return await answerQuestionWithGemini(question, memories as Memory[], apiKey);
    } catch (error: any) {
      // Check if it's a quota/rate limit error
      const isQuotaError = error?.message?.includes('quota') || 
                          error?.message?.includes('429') ||
                          error?.status === 429;
      
      if (isQuotaError) {
        console.warn('Gemini API quota exceeded, using keyword matching fallback');
      } else {
        console.warn('Gemini API failed, falling back to keyword matching:', error);
      }
      // Fall through to keyword matching
    }
  }

  // Fallback: keyword matching
  const result = matchMemoriesByKeyword(question, memories || []);
  const latest = result[0];

  if (!latest) {
    return {
      answer: "I don't have any memories that match your question yet. Try adding a memory about this topic.",
      matchedMemories: [],
    };
  }

  return {
    answer: `Last time you mentioned this was: ${latest.raw_text}`,
    matchedMemories: [latest],
  };
}

/**
 * Answer question using Gemini API
 */
async function answerQuestionWithGemini(
  question: string,
  memories: Memory[],
  apiKey: string
): Promise<AnswerResponse> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Build context from memories
  const memoryContext = memories.slice(0, 10).map((m, i) => 
    `Memory ${i + 1}: ${m.raw_text}`
  ).join('\n\n');

  const prompt = `You are a helpful memory assistant for an elderly person. Answer their question using their memories as context.

Question: "${question}"

Relevant Memories:
${memoryContext}

Instructions:
- Answer in a warm, simple, and clear way
- Use the memories to provide a helpful answer
- If the memories don't directly answer the question, say so gently
- Keep your answer to 2-3 sentences maximum
- Be conversational and friendly

Answer:`;

  // Try multiple model names in order
  const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  let lastError: any = null;
  
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim();

      // Find top 3 most relevant memories
      const matchedMemories = memories.slice(0, 3);

      return {
        answer,
        matchedMemories,
      };
    } catch (error: any) {
      // If it's a 404 (model not found), try next model
      if (error?.status === 404 || error?.message?.includes('404')) {
        lastError = error;
        continue;
      }
      // For other errors (quota, etc.), throw immediately
      throw error;
    }
  }
  
  // If all models failed with 404, throw the last error
  throw lastError || new Error('No available Gemini models');
}

/**
 * Extract structured data from raw memory text
 * This can identify names, dates, relationships, etc.
 */
export async function extractMemoryMetadata(rawText: string): Promise<{
  type: string;
  tags: string[];
  structured: Record<string, unknown>;
}> {
  const apiKey = getGeminiApiKey();
  
  if (apiKey) {
    try {
      return await extractMemoryMetadataWithGemini(rawText, apiKey);
    } catch (error: any) {
      // Check if it's a quota/rate limit error
      const isQuotaError = error?.message?.includes('quota') || 
                          error?.message?.includes('429') ||
                          error?.status === 429;
      
      if (isQuotaError) {
        console.warn('Gemini API quota exceeded, using fallback extraction');
      } else {
        console.warn('Gemini API failed for metadata extraction, falling back:', error);
      }
      // Fall through to fallback
    }
  }

  // Fallback to basic extraction
  return extractMemoryMetadataNaive(rawText);
}

/**
 * Extract metadata using Gemini API
 */
async function extractMemoryMetadataWithGemini(
  rawText: string,
  apiKey: string
): Promise<{
  type: string;
  tags: string[];
  structured: Record<string, unknown>;
}> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);

  const prompt = `Analyze this memory text and extract structured information:

"${rawText}"

Extract:
1. Type: one of: story, person, event, medication, routine, preference, other
2. Objects mentioned (keys, wallet, glasses, medications, etc.)
3. Locations mentioned (places, addresses, rooms, etc.)
4. People mentioned (names, relationships, etc.)
5. Tags: relevant keywords (3-5 tags)

Return ONLY valid JSON:
{
  "type": "story|person|event|medication|routine|preference|other",
  "objects": ["object1", "object2"],
  "locations": ["location1", "location2"],
  "people": ["person1", "person2"],
  "tags": ["tag1", "tag2", "tag3"]
}

Return only the JSON, no additional text.`;

  // Try multiple model names in order
  const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  let lastError: any = null;
  
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Parse JSON response (handle markdown code blocks if present)
      let jsonText = responseText;
      if (responseText.startsWith('```')) {
        jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }

      const parsed = JSON.parse(jsonText);

      return {
        type: parsed.type || 'other',
        tags: parsed.tags || [],
        structured: {
          objects: parsed.objects || [],
          locations: parsed.locations || [],
          people: parsed.people || [],
        },
      };
    } catch (error: any) {
      // If it's a 404 (model not found), try next model
      if (error?.status === 404 || error?.message?.includes('404')) {
        lastError = error;
        continue;
      }
      // For other errors (quota, etc.), throw immediately
      throw error;
    }
  }
  
  // If all models failed with 404, throw the last error
  throw lastError || new Error('No available Gemini models');
}

/**
 * Naive metadata extraction (fallback)
 */
function extractMemoryMetadataNaive(rawText: string): {
  type: string;
  tags: string[];
  structured: Record<string, unknown>;
} {
  const lowerText = rawText.toLowerCase();
  const tags: string[] = [];
  
  // Check for common keywords
  const keywords = {
    medication: ['medication', 'medicine', 'pill', 'prescription', 'doctor'],
    person: ['met', 'saw', 'visited', 'friend', 'family', 'grandson', 'granddaughter'],
    event: ['birthday', 'wedding', 'anniversary', 'holiday', 'celebration'],
    routine: ['morning', 'evening', 'breakfast', 'dinner', 'exercise', 'walk'],
    preference: ['like', 'prefer', 'favorite', 'love', 'dislike'],
  };

  let detectedType = 'other';
  for (const [type, words] of Object.entries(keywords)) {
    if (words.some(word => lowerText.includes(word))) {
      detectedType = type;
      break;
    }
  }

  // Simple tag extraction
  const commonTags = ['keys', 'wallet', 'glasses', 'phone', 'medication'];
  commonTags.forEach(tag => {
    if (lowerText.includes(tag)) {
      tags.push(tag);
    }
  });

  return {
    type: detectedType,
    tags,
    structured: {},
  };
}

/**
 * Generate a daily summary from the day's memories and questions
 */
export async function generateDailySummary(
  elderId: string,
  date: string
): Promise<string> {
  // Fetch memories for the date
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const { data: memories, error: memError } = await supabase
    .from('memories')
    .select('*')
    .eq('elder_id', elderId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (memError) {
    console.error('Error fetching memories:', memError);
    throw new Error('Failed to fetch memories');
  }

  if (!memories || memories.length === 0) {
    return "No memories recorded for today.";
  }

  const apiKey = getGeminiApiKey();
  
  if (apiKey) {
    try {
      return await generateSummaryWithGemini(memories as Memory[], apiKey);
    } catch (error: any) {
      // Check if it's a quota/rate limit error
      const isQuotaError = error?.message?.includes('quota') || 
                          error?.message?.includes('429') ||
                          error?.status === 429;
      
      if (isQuotaError) {
        console.warn('Gemini API quota exceeded, using simple summary fallback');
      } else {
        console.warn('Gemini API failed for summary, falling back:', error);
      }
      // Fall through to fallback
    }
  }

  // Fallback: simple concatenation
  return memories.map((m, i) => `${i + 1}. ${m.raw_text}`).join('\n\n');
}

/**
 * Generate summary using Gemini API
 */
async function generateSummaryWithGemini(
  memories: Memory[],
  apiKey: string
): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);

  const memoryText = memories.map(m => m.raw_text).join('\n\n');

  const prompt = `Create a warm, simple daily summary for an elderly person based on their memories from today.

Memories:
${memoryText}

Instructions:
- Write 3-5 sentences in simple, clear language
- Be warm and encouraging
- Highlight the most important moments
- Use simple words and short sentences
- Make it feel like a friendly conversation

Summary:`;

  // Try multiple model names in order
  const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  let lastError: any = null;
  
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error: any) {
      // If it's a 404 (model not found), try next model
      if (error?.status === 404 || error?.message?.includes('404')) {
        lastError = error;
        continue;
      }
      // For other errors (quota, etc.), throw immediately
      throw error;
    }
  }
  
  // If all models failed with 404, throw the last error
  throw lastError || new Error('No available Gemini models');
}

/**
 * Keyword-based memory matching (fallback when AI is unavailable)
 */
export function matchMemoriesByKeyword(
  question: string,
  memories: Memory[]
): Memory[] {
  const keywords = question
    .toLowerCase()
    .replace(/[?.,!]/g, '')
    .split(' ')
    .filter(word => word.length > 3);

  return memories.filter(memory => {
    const text = memory.raw_text.toLowerCase();
    const tags = memory.tags.map(t => t.toLowerCase());
    
    return keywords.some(keyword => 
      text.includes(keyword) || tags.some(tag => tag.includes(keyword))
    );
  });
}
