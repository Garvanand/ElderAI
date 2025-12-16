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

-- 5. Helper function to link caregiver to elder by elder email
CREATE OR REPLACE FUNCTION public.link_caregiver_to_elder_by_email(
  caregiver_uid UUID,
  elder_email TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  elder_uid UUID;
  caregiver_profile_role public.user_role;
BEGIN
  -- Ensure caller is a caregiver
  SELECT role INTO caregiver_profile_role
  FROM public.profiles
  WHERE user_id = caregiver_uid;

  IF caregiver_profile_role IS NULL OR caregiver_profile_role <> 'caregiver' THEN
    RAISE EXCEPTION 'Only caregivers can link elders';
  END IF;

  -- Look up elder user by email in auth.users
  SELECT id INTO elder_uid
  FROM auth.users
  WHERE email = elder_email;

  IF elder_uid IS NULL THEN
    RAISE EXCEPTION 'No elder found with that email';
  END IF;

  -- Insert link if it does not already exist
  INSERT INTO public.caregiver_elder_links (caregiver_user_id, elder_user_id)
  VALUES (caregiver_uid, elder_uid)
  ON CONFLICT (caregiver_user_id, elder_user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_caregiver_to_elder_by_email(UUID, TEXT) TO authenticated;


