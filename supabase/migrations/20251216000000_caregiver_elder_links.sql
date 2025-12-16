-- Caregiver/Elder linking table for multi-elder support
-- Run AFTER the complete setup migration.

-- 1. Create join table between caregivers and elders
CREATE TABLE IF NOT EXISTS public.caregiver_elder_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  caregiver_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  elder_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (caregiver_user_id, elder_user_id)
);

-- 2. Enable RLS
ALTER TABLE public.caregiver_elder_links ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Caregivers can view links they are part of
CREATE POLICY "Caregivers can view their elder links"
ON public.caregiver_elder_links FOR SELECT
USING (auth.uid() = caregiver_user_id);

-- Caregivers can create links for themselves
CREATE POLICY "Caregivers can create elder links for themselves"
ON public.caregiver_elder_links FOR INSERT
WITH CHECK (auth.uid() = caregiver_user_id);

-- Caregivers can delete links for themselves
CREATE POLICY "Caregivers can delete their elder links"
ON public.caregiver_elder_links FOR DELETE
USING (auth.uid() = caregiver_user_id);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_caregiver_elder_links_caregiver
  ON public.caregiver_elder_links (caregiver_user_id);

CREATE INDEX IF NOT EXISTS idx_caregiver_elder_links_elder
  ON public.caregiver_elder_links (elder_user_id);


