# Complete Supabase Setup Guide for ElderAI

## Step 1: Run the Database Migration

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the Complete Setup Migration**
   - Open the file: `supabase/migrations/20251208000001_complete_setup.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)

3. **Verify Tables Created**
   - Go to **Table Editor** in Supabase dashboard
   - You should see these tables:
     - `profiles`
     - `memories`
     - `questions`
     - `daily_summaries`

## Step 2: Set Up Storage Bucket for Images

1. **Navigate to Storage**
   - Go to **Storage** in the left sidebar
   - Click **New bucket**

2. **Create `memory-images` Bucket**
   - **Name:** `memory-images`
   - **Public bucket:** ✅ Check this (or set up policies for authenticated users)
   - Click **Create bucket**

3. **Set Up Storage Policies** (if bucket is not public)
   
   Run this SQL in SQL Editor:

   ```sql
   -- Allow authenticated users to upload images
   CREATE POLICY "Authenticated users can upload images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'memory-images');

   -- Allow authenticated users to read images
   CREATE POLICY "Authenticated users can read images"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'memory-images');

   -- Allow public read access (if you want images publicly accessible)
   CREATE POLICY "Public can read images"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'memory-images');
   ```

## Step 3: Update Environment Variables

Create or update your `.env.local` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI Configuration (Optional - for enhanced AI features)
GEMINI_API_KEY=your-gemini-api-key-here

# Development Auth Bypass (set to "true" to bypass auth during development)
NEXT_PUBLIC_DEV_BYPASS_AUTH=false
```

### Where to Find Your Supabase Credentials:

1. **Go to Supabase Dashboard** → Your Project
2. **Settings** → **API**
3. Copy:
   - **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## Step 4: Test the Setup

### Test Authentication:

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Create a test user:**
   - Go to `http://localhost:8080/auth`
   - Sign up with an email and password
   - Check Supabase Dashboard → **Authentication** → **Users** to see the new user
   - Check **Table Editor** → **profiles** to see the profile was created

3. **Test Login:**
   - Sign out
   - Sign in with the same credentials
   - Should redirect to dashboard without errors

### Test Features:

1. **Memory Creation:**
   - Go to `/elder?elderId=your-user-id`
   - Add a memory
   - Check `memories` table in Supabase

2. **Question Answering:**
   - Ask a question
   - Should get an answer (or fallback message)

3. **Image Upload:**
   - Try uploading an image with a memory
   - Check Storage → `memory-images` bucket

## Step 5: Troubleshooting

### Issue: "infinite recursion detected in policy"
**Solution:** The migration includes the fix. If you still see this, make sure you ran the complete setup migration.

### Issue: "relation does not exist"
**Solution:** Make sure you ran the migration in the correct database. Check you're in the right Supabase project.

### Issue: "permission denied"
**Solution:** 
- Check RLS policies are enabled
- Verify your service role key is correct
- Make sure storage bucket policies are set up

### Issue: Images not uploading
**Solution:**
- Verify storage bucket `memory-images` exists
- Check bucket is public OR policies allow authenticated uploads
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

## Step 6: Production Checklist

Before deploying to production:

- [ ] Remove or set `NEXT_PUBLIC_DEV_BYPASS_AUTH=false`
- [ ] Verify all RLS policies are working
- [ ] Test authentication flow end-to-end
- [ ] Verify storage bucket policies are secure
- [ ] Set up proper CORS if needed
- [ ] Test all API endpoints
- [ ] Verify environment variables are set in production (Vercel/your hosting)

## What the Migration Includes

✅ All tables (profiles, memories, questions, daily_summaries)  
✅ Fixed RLS policies (no recursion issues)  
✅ Helper functions for caregiver checks  
✅ Triggers for auto-creating profiles on signup  
✅ Timestamp update triggers  
✅ Performance indexes  
✅ Image URL column in memories table  
✅ Proper permissions and grants  

## Need Help?

If you encounter issues:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Verify environment variables are correct
4. Ensure migration ran successfully (check Table Editor)

