# Fixing RLS Infinite Recursion Error

## Problem
The error `infinite recursion detected in policy for relation "profiles"` occurs because the RLS policy "Caregivers can view their elder's profile" queries the `profiles` table while checking access to the `profiles` table, creating a circular dependency.

## Solution
Run the migration file `supabase/migrations/20251208000000_fix_profiles_rls_recursion.sql` in your Supabase SQL editor.

### Steps to Fix:

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Run the Migration**
   - Copy the contents of `supabase/migrations/20251208000000_fix_profiles_rls_recursion.sql`
   - Paste into SQL Editor
   - Click "Run"

3. **Verify the Fix**
   - Try signing in again
   - The profile fetch should work without the recursion error

## What the Fix Does

1. **Drops the problematic policy** that causes recursion
2. **Creates a SECURITY DEFINER function** (`is_caregiver_for_elder`) that:
   - Runs with elevated privileges (bypasses RLS)
   - Checks if a user is a caregiver for an elder
   - Breaks the recursion cycle
3. **Recreates the policy** using the function instead of directly querying profiles

## Alternative Quick Fix (Development Only)

If you need a quick workaround for development, you can temporarily disable RLS on profiles:

```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING:** Only use this in development! It removes all security checks.

## Testing

After applying the fix:
1. Sign in with an existing user
2. Check browser console - should see no recursion errors
3. Profile should load successfully

