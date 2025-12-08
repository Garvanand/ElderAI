/**
 * AI Module for Memory Friend
 * 
 * This module contains AI-related functions that will be wired to real LLM calls.
 * Currently uses Lovable AI gateway with google/gemini-2.5-flash model.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Memory, AnswerResponse } from "@/types";

/**
 * Answer a question using the elder's memories as context
 */
export async function answerQuestion(
  question: string,
  elderId: string
): Promise<AnswerResponse> {
  const { data, error } = await supabase.functions.invoke('answer-question', {
    body: { question, elderId }
  });

  if (error) {
    console.error('Error answering question:', error);
    throw new Error(error.message || 'Failed to get answer');
  }

  return data as AnswerResponse;
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
  const { data, error } = await supabase.functions.invoke('extract-memory', {
    body: { rawText }
  });

  if (error) {
    console.error('Error extracting memory metadata:', error);
    // Fallback to basic extraction
    return {
      type: 'other',
      tags: [],
      structured: {}
    };
  }

  return data;
}

/**
 * Generate a daily summary from the day's memories and questions
 */
export async function generateDailySummary(
  elderId: string,
  date: string
): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-summary', {
    body: { elderId, date }
  });

  if (error) {
    console.error('Error generating summary:', error);
    throw new Error(error.message || 'Failed to generate summary');
  }

  return data.summary;
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
