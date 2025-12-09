-- ============================================================================
-- ElderAI Complete Database Setup
-- Run this in your Supabase SQL Editor to set up the entire database
-- ============================================================================

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

-- Create enum for user roles
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('elder', 'caregiver');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create enum for memory types
DO $$ BEGIN
  CREATE TYPE public.memory_type AS ENUM ('story', 'person', 'event', 'medication', 'routine', 'preference', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'elder',
  elder_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  preferences JSONB DEFAULT '{}',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create memories table (with image_url column)
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  elder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type memory_type NOT NULL DEFAULT 'other',
  raw_text TEXT NOT NULL,
  structured_json JSONB DEFAULT NULL,
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  elder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  matched_memory_ids JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_summaries table
CREATE TABLE IF NOT EXISTS public.daily_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  elder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(elder_id, date)
);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE HELPER FUNCTIONS (to avoid RLS recursion)
-- ============================================================================

-- Function to check if user is caregiver for an elder (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_caregiver_for_elder(caregiver_user_id UUID, elder_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- This function runs with elevated privileges, bypassing RLS
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = caregiver_user_id
    AND role = 'caregiver'
    AND elder_id = elder_user_id
  );
END;
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'elder'),
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. CREATE RLS POLICIES
-- ============================================================================

-- Drop existing policies if they exist (for clean reinstall)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Caregivers can view their elder's profile" ON public.profiles;

DROP POLICY IF EXISTS "Elders can view their own memories" ON public.memories;
DROP POLICY IF EXISTS "Elders can insert their own memories" ON public.memories;
DROP POLICY IF EXISTS "Elders can update their own memories" ON public.memories;
DROP POLICY IF EXISTS "Elders can delete their own memories" ON public.memories;
DROP POLICY IF EXISTS "Caregivers can view their elder's memories" ON public.memories;
DROP POLICY IF EXISTS "Caregivers can manage their elder's memories" ON public.memories;

DROP POLICY IF EXISTS "Elders can view their own questions" ON public.questions;
DROP POLICY IF EXISTS "Elders can insert their own questions" ON public.questions;
DROP POLICY IF EXISTS "Caregivers can view their elder's questions" ON public.questions;

DROP POLICY IF EXISTS "Elders can view their own summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Caregivers can view their elder's summaries" ON public.daily_summaries;
DROP POLICY IF EXISTS "Caregivers can create summaries for their elder" ON public.daily_summaries;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fixed: Use function to avoid recursion
CREATE POLICY "Caregivers can view their elder's profile"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_caregiver_for_elder(auth.uid(), user_id)
);

-- Memories policies
CREATE POLICY "Elders can view their own memories"
ON public.memories FOR SELECT
USING (auth.uid() = elder_id);

CREATE POLICY "Elders can insert their own memories"
ON public.memories FOR INSERT
WITH CHECK (auth.uid() = elder_id);

CREATE POLICY "Elders can update their own memories"
ON public.memories FOR UPDATE
USING (auth.uid() = elder_id);

CREATE POLICY "Elders can delete their own memories"
ON public.memories FOR DELETE
USING (auth.uid() = elder_id);

CREATE POLICY "Caregivers can view their elder's memories"
ON public.memories FOR SELECT
USING (
  public.is_caregiver_for_elder(auth.uid(), elder_id)
);

CREATE POLICY "Caregivers can manage their elder's memories"
ON public.memories FOR ALL
USING (
  public.is_caregiver_for_elder(auth.uid(), elder_id)
);

-- Questions policies
CREATE POLICY "Elders can view their own questions"
ON public.questions FOR SELECT
USING (auth.uid() = elder_id);

CREATE POLICY "Elders can insert their own questions"
ON public.questions FOR INSERT
WITH CHECK (auth.uid() = elder_id);

CREATE POLICY "Caregivers can view their elder's questions"
ON public.questions FOR SELECT
USING (
  public.is_caregiver_for_elder(auth.uid(), elder_id)
);

-- Daily summaries policies
CREATE POLICY "Elders can view their own summaries"
ON public.daily_summaries FOR SELECT
USING (auth.uid() = elder_id);

CREATE POLICY "Caregivers can view their elder's summaries"
ON public.daily_summaries FOR SELECT
USING (
  public.is_caregiver_for_elder(auth.uid(), elder_id)
);

CREATE POLICY "Caregivers can create summaries for their elder"
ON public.daily_summaries FOR INSERT
WITH CHECK (
  public.is_caregiver_for_elder(auth.uid(), elder_id)
);

-- Allow service role to insert summaries (for API routes)
CREATE POLICY "Service role can insert summaries"
ON public.daily_summaries FOR INSERT
WITH CHECK (true);

-- ============================================================================
-- 6. CREATE TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_memories_updated_at ON public.memories;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON public.memories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.is_caregiver_for_elder(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_caregiver_for_elder(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO authenticated;
GRANT SELECT, INSERT ON public.questions TO authenticated;
GRANT SELECT, INSERT ON public.daily_summaries TO authenticated;

-- ============================================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_elder_id ON public.profiles(elder_id);
CREATE INDEX IF NOT EXISTS idx_memories_elder_id ON public.memories(elder_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON public.memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_elder_id ON public.questions(elder_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON public.questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_elder_id ON public.daily_summaries(elder_id);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON public.daily_summaries(date DESC);

-- ============================================================================
-- COMPLETE!
-- ============================================================================

