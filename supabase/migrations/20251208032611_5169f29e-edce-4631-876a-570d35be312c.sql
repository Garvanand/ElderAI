-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('elder', 'caregiver');

-- Create enum for memory types
CREATE TYPE public.memory_type AS ENUM ('story', 'person', 'event', 'medication', 'routine', 'preference', 'other');

-- Create profiles table
CREATE TABLE public.profiles (
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

-- Create memories table
CREATE TABLE public.memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  elder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type memory_type NOT NULL DEFAULT 'other',
  raw_text TEXT NOT NULL,
  structured_json JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  elder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  matched_memory_ids JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_summaries table
CREATE TABLE public.daily_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  elder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  summary_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(elder_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_summaries ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Caregivers can view their elder's profile"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'caregiver'
    AND p.elder_id = profiles.user_id
  )
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
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'caregiver'
    AND p.elder_id = memories.elder_id
  )
);

CREATE POLICY "Caregivers can manage their elder's memories"
ON public.memories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'caregiver'
    AND p.elder_id = memories.elder_id
  )
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
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'caregiver'
    AND p.elder_id = questions.elder_id
  )
);

-- Daily summaries policies
CREATE POLICY "Elders can view their own summaries"
ON public.daily_summaries FOR SELECT
USING (auth.uid() = elder_id);

CREATE POLICY "Caregivers can view their elder's summaries"
ON public.daily_summaries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'caregiver'
    AND p.elder_id = daily_summaries.elder_id
  )
);

CREATE POLICY "Caregivers can create summaries for their elder"
ON public.daily_summaries FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND p.role = 'caregiver'
    AND p.elder_id = daily_summaries.elder_id
  )
);

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
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON public.memories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
