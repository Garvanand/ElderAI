/**
 * API Helper Functions
 * 
 * Type-safe functions for calling backend API endpoints.
 */

import type { MemoryType } from '@/src/types';
import type { Memory, Question, AnswerResponse, DailySummary } from '@/src/types';

const API_BASE_URL = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

/**
 * Get the current elder ID resolved by the backend for the authenticated user.
 * Falls back to the previous URL-based behaviour only if the backend endpoint is unavailable.
 */
export async function getElderContext(): Promise<{ elderId: string | null; role: "elder" | "caregiver" | null }> {
  try {
    const response = await fetch("/api/current-elder", { credentials: "include" })
    if (!response.ok) {
      return { elderId: null, role: null }
    }
    const data = (await response.json()) as { elderId: string | null; role: "elder" | "caregiver" | null }
    return data
  } catch {
    // Fallback to legacy URL-based approach as a last resort for dev
    if (typeof window === "undefined") {
      return { elderId: null, role: null }
    }
    const params = new URLSearchParams(window.location.search)
    const elderId = params.get("elderId")
    return { elderId: elderId || null, role: null }
  }
}

/**
 * Create a new memory
 */
export async function createMemory(
  elderId: string,
  type: MemoryType,
  text: string,
  imageUrl?: string | null
): Promise<Memory> {
  const response = await fetch(`${API_BASE_URL}/api/memories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      elderId,
      type,
      text,
      imageUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create memory' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Map database response to Memory type
  return {
    id: data.id,
    elder_id: data.elder_id,
    type: data.type,
    raw_text: data.raw_text,
    structured_json: (data.structured_json as Record<string, unknown>) || {},
    tags: data.tags || [],
    image_url: data.image_url || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

/**
 * Get memories for an elder
 */
export async function getMemories(
  elderId: string,
  filters?: {
    type?: MemoryType;
    tag?: string;
    limit?: number;
  }
): Promise<Memory[]> {
  const params = new URLSearchParams({
    elderId,
  });

  if (filters?.type) {
    params.append('type', filters.type);
  }

  if (filters?.tag) {
    params.append('tag', filters.tag);
  }

  if (filters?.limit) {
    params.append('limit', filters.limit.toString());
  }

  const response = await fetch(`${API_BASE_URL}/api/memories?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch memories' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Map database responses to Memory type
  return (data || []).map((m: any) => ({
    id: m.id,
    elder_id: m.elder_id,
    type: m.type,
    raw_text: m.raw_text,
    structured_json: (m.structured_json as Record<string, unknown>) || {},
    tags: m.tags || [],
    image_url: m.image_url || null,
    created_at: m.created_at,
    updated_at: m.updated_at,
  }));
}

/**
 * Answer a question using elder's memories
 */
export async function answerQuestion(
  elderId: string,
  question: string
): Promise<AnswerResponse> {
  const response = await fetch(`${API_BASE_URL}/api/questions/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      elderId,
      question,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to answer question' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Map matched memories to Memory type
  const matchedMemories: Memory[] = (data.matchedMemories || []).map((m: any) => ({
    id: m.id,
    elder_id: m.elder_id,
    type: m.type,
    raw_text: m.raw_text,
    structured_json: (m.structured_json as Record<string, unknown>) || {},
    tags: m.tags || [],
    created_at: m.created_at,
    updated_at: m.updated_at,
  }));

  return {
    answer: data.answer,
    matchedMemories,
  };
}

/**
 * Get questions for an elder
 */
export async function getQuestions(
  elderId: string,
  limit: number = 5
): Promise<Question[]> {
  const params = new URLSearchParams({
    elderId,
    limit: limit.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/api/questions?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch questions' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Map database responses to Question type
  return (data || []).map((q: any) => ({
    id: q.id,
    elder_id: q.elder_id,
    question_text: q.question_text,
    answer_text: q.answer_text,
    matched_memory_ids: (q.matched_memory_ids as string[]) || [],
    created_at: q.created_at,
  }));
}

/**
 * Upload a memory image to the storage bucket.
 * Returns the public URL of the uploaded image.
 */
export async function uploadMemoryImage(file: File, elderId: string): Promise<string> {
  const formData = new FormData();
  formData.append('elderId', elderId);
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/memory-images`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to upload image' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.url as string;
}

/**
 * Generate a daily summary for an elder
 */
export async function generateDailySummaryApi(
  elderId: string,
  date?: string
): Promise<{ summary: string; memoriesCount: number }> {
  const response = await fetch(`${API_BASE_URL}/api/summaries/daily`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ elderId, date }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate daily summary' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a daily summary for a specific date
 */
export async function getDailySummary(
  elderId: string,
  date: string
): Promise<DailySummary | null> {
  const params = new URLSearchParams({ elderId, date });
  const response = await fetch(`${API_BASE_URL}/api/summaries?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch daily summary' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  if (!data || data.length === 0) {
    return null;
  }
  return data[0] as DailySummary;
}

/**
 * Get recent summaries for an elder
 */
export async function getRecentSummaries(
  elderId: string,
  limit: number = 7
): Promise<DailySummary[]> {
  const params = new URLSearchParams({
    elderId,
    limit: limit.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/api/summaries?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch summaries' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return (data || []) as DailySummary[];
}

