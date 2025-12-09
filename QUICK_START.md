# Quick Start Guide - Setting Up New Supabase Database

## 🚀 Step-by-Step Setup

### 1. Run Database Migration (5 minutes)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project (or create a new one)

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

3. **Run Complete Setup**
   - Open file: `supabase/migrations/20251208000001_complete_setup.sql`
   - Copy **ALL** the contents
   - Paste into SQL Editor
   - Click **Run** (or press Ctrl+Enter / Cmd+Enter)
   - ✅ You should see "Success. No rows returned"

4. **Verify Tables Created**
   - Go to **Table Editor** in left sidebar
   - You should see 4 tables:
     - ✅ `profiles`
     - ✅ `memories` 
     - ✅ `questions`
     - ✅ `daily_summaries`

### 2. Set Up Storage Bucket (2 minutes)

1. **Go to Storage**
   - Click **Storage** in left sidebar
   - Click **New bucket**

2. **Create Bucket**
   - **Name:** `memory-images`
   - **Public bucket:** ✅ Check this box
   - Click **Create bucket**

   **OR** if you want it private, create bucket and run this SQL:

   ```sql
   -- Allow authenticated users to upload/read images
   CREATE POLICY "Authenticated users can upload images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'memory-images');

   CREATE POLICY "Authenticated users can read images"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'memory-images');
   ```

### 3. Get Your Credentials (1 minute)

1. **Go to Settings → API**
   - In Supabase Dashboard, click **Settings** (gear icon)
   - Click **API** in the sidebar

2. **Copy These Values:**
   - **Project URL** → Use for `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public** key → Use for `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **service_role** key → Use for `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **KEEP SECRET!**

### 4. Update Environment Variables (2 minutes)

1. **Create `.env.local` file** in project root (if it doesn't exist)

2. **Add your credentials:**

   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # Optional: For enhanced AI features
   GEMINI_API_KEY=your-gemini-api-key-here
   
   # Optional: Development auth bypass
   NEXT_PUBLIC_DEV_BYPASS_AUTH=false
   ```

3. **Save the file**

### 5. Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### 6. Test Everything

1. **Test Sign Up:**
   - Go to `http://localhost:8080/auth`
   - Sign up with email/password
   - ✅ Should create user in Supabase → Authentication → Users
   - ✅ Should create profile in Table Editor → profiles

2. **Test Login:**
   - Sign out
   - Sign in with same credentials
   - ✅ Should redirect to dashboard
   - ✅ No "infinite recursion" errors in console

3. **Test Memory Creation:**
   - Go to `/elder?elderId=your-user-id`
   - Add a memory
   - ✅ Should appear in Table Editor → memories

4. **Test Image Upload:**
   - Add memory with image
   - ✅ Image should appear in Storage → memory-images

## ✅ Verification Checklist

- [ ] Migration ran successfully (no errors)
- [ ] All 4 tables exist in Table Editor
- [ ] Storage bucket `memory-images` created
- [ ] Environment variables set in `.env.local`
- [ ] Dev server restarted
- [ ] Can sign up new user
- [ ] Can sign in
- [ ] Can create memory
- [ ] Can upload image
- [ ] No console errors

## 🐛 Common Issues

### "infinite recursion detected"
**Fix:** Make sure you ran the complete setup migration (`20251208000001_complete_setup.sql`)

### "relation does not exist"
**Fix:** Migration didn't run. Check SQL Editor for errors and run again.

### "permission denied"
**Fix:** 
- Check RLS is enabled (should be automatic)
- Verify service role key is correct
- Check storage bucket policies

### Images not uploading
**Fix:**
- Verify bucket exists: `memory-images`
- Check bucket is public OR policies allow authenticated uploads
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly

### Can't sign in / stuck on homepage
**Fix:**
- Check browser console for errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct
- Try setting `NEXT_PUBLIC_DEV_BYPASS_AUTH=true` temporarily to test routes

## 📝 Next Steps

Once everything works:
1. Test all features (memories, questions, summaries)
2. Create test users (elder and caregiver)
3. Test caregiver dashboard
4. Remove `NEXT_PUBLIC_DEV_BYPASS_AUTH` or set to `false` for production

## 🆘 Need Help?

Check:
- `SUPABASE_SETUP.md` - Detailed setup guide
- Supabase Dashboard → Logs - See server-side errors
- Browser Console - See client-side errors
- Network tab - Check API requests/responses

