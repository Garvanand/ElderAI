# Environment Variables Update

## Add This to Your `.env.local` File

Add the Gemini API key for client-side access:

```env
# Add this line for client-side Gemini access (Vite)
VITE_GEMINI_API_KEY=AIzaSyCMe2lJHZ0pL7JTohtyEDtTIIB-341yjOI
```

Your complete `.env.local` should now have:

```env
# Supabase (Client-side - Vite)
VITE_SUPABASE_URL=https://nwnexkbndpngmqfqnogh.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_bWW_DOr7oE9cO3sUcpf4ng_BrsGDqr7

# Supabase (Server-side - Next.js)
SUPABASE_URL=https://nwnexkbndpngmqfqnogh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Gemini API (Client-side - Vite)
VITE_GEMINI_API_KEY=AIzaSyCMe2lJHZ0pL7JTohtyEDtTIIB-341yjOI

# Gemini API (Server-side - Next.js)
GEMINI_API_KEY=AIzaSyCMe2lJHZ0pL7JTohtyEDtTIIB-341yjOI

# Development
NEXT_PUBLIC_DEV_BYPASS_AUTH=false
```

## What Changed

- ✅ Removed Supabase Edge Function calls (they don't exist)
- ✅ Added direct Gemini API integration
- ✅ Functions now work client-side with Gemini
- ✅ Fallback to keyword matching if Gemini fails

## Restart Required

After adding `VITE_GEMINI_API_KEY`, restart your dev server:

```bash
npm run dev
```


