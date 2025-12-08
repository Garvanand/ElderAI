export type UserRole = 'elder' | 'caregiver';

export type MemoryType = 'story' | 'person' | 'event' | 'medication' | 'routine' | 'preference' | 'other';

export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  elder_id: string | null;
  preferences: Record<string, unknown>;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  elder_id: string;
  type: MemoryType;
  raw_text: string;
  structured_json: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  elder_id: string;
  question_text: string;
  answer_text: string | null;
  matched_memory_ids: string[];
  created_at: string;
}

export interface DailySummary {
  id: string;
  elder_id: string;
  date: string;
  summary_text: string;
  created_at: string;
}

export interface AnswerResponse {
  answer: string;
  matchedMemories: Memory[];
}
