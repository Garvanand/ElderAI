-- Fix infinite recursion in profiles RLS policy
-- The issue: Policy queries profiles table while checking profiles table access

-- Drop the problematic policy
DROP POLICY IF EXISTS "Caregivers can view their elder's profile" ON public.profiles;

-- Create a fixed version using SECURITY DEFINER function to break recursion
CREATE OR REPLACE FUNCTION public.is_caregiver_for_elder(caregiver_user_id UUID, elder_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- This function runs with elevated privileges, bypassing RLS
  -- to check if a user is a caregiver for an elder
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = caregiver_user_id
    AND role = 'caregiver'
    AND elder_id = elder_user_id
  );
END;
$$;

-- Recreate the policy using the function (which bypasses RLS)
CREATE POLICY "Caregivers can view their elder's profile"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id  -- Users can always see their own profile
  OR public.is_caregiver_for_elder(auth.uid(), user_id)  -- Or if they're a caregiver for this elder
);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_caregiver_for_elder(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_caregiver_for_elder(UUID, UUID) TO anon;

