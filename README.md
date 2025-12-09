# ElderAI - Memory Companion App

A compassionate, AI-powered memory support application designed to help elderly users record memories, ask questions, and stay connected with caregivers. Built with TypeScript, Next.js 14, React 19, and Supabase.

**Architectural Demo:** [https://prj-4tof01oj-frontend.vercel.app/](https://prj-4tof01oj-frontend.vercel.app/)

## 🌟 Features

### For Elderly Users
- **Memory Recording**
  - Text-based memory entry with voice input support (Speech Recognition API)
  - Image uploads for visual memories
  - Memory categorization (story, person, event, medication, routine, preference, other)
  - Automatic tag extraction using AI

- **Question Answering**
  - Natural language questions about recorded memories
  - AI-powered answers using Gemini API or keyword matching fallback
  - Text-to-speech playback of answers (Speech Synthesis API)
  - Repeat answer functionality

- **Daily Summaries**
  - AI-generated daily summaries of memories and activities
  - Simple, easy-to-read format optimized for elderly users
  - Automatic generation or on-demand creation

- **Accessibility Features**
  - Large, clear buttons and text
  - Voice input for hands-free memory recording
  - Text-to-speech for answers
  - Simple, intuitive interface

### For Caregivers
- **Caregiver Dashboard**
  - View all memories in a timeline
  - Filter by type, tags, or date
  - View recent questions and answers
  - Generate daily summaries
  - Monitor elder's activity and wellbeing

## 🏗️ Architecture

### Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Next.js 14 (App Router)
- **UI Components:** Radix UI, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Supabase (PostgreSQL)
- **AI/ML:** Google Gemini API (with fallback to naive implementations)
- **Storage:** Supabase Storage for images
- **State Management:** React Query (TanStack Query)
- **Routing:** React Router (Vite app) + Next.js App Router

### Project Structure
```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── memories/      # Memory CRUD operations
│   │   ├── questions/     # Question answering
│   │   ├── summaries/    # Daily summary generation
│   │   └── memory-images/ # Image upload handling
│   ├── caregiver/         # Caregiver dashboard page
│   └── page.tsx           # Main demo page
├── src/                   # Vite React app
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts (Auth)
│   ├── integrations/     # Supabase client
│   └── lib/              # Utilities and helpers
├── components/           # Shared components (memory-friend)
├── lib/                  # Shared utilities
│   ├── ai.ts            # AI functions (Gemini integration)
│   ├── api.ts           # API helper functions
│   └── db.ts            # Database client
└── supabase/            # Supabase configuration
    ├── functions/       # Edge functions
    └── migrations/      # Database migrations
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase account and project
- Google Gemini API key (optional, for enhanced AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Elder AI"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # AI Configuration (Optional)
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Set up Supabase**
   
   - Create a new Supabase project
   - Run the migration in `supabase/migrations/20251208032611_5169f29e-edce-4631-876a-570d35be312c.sql`
   - Create a storage bucket named `memory-images` with public access
   - Configure Row Level Security (RLS) policies as needed

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
npm run preview
```

## 📡 API Endpoints

### Memories
- `POST /api/memories` - Create a new memory
- `GET /api/memories?elderId=xxx&type=xxx&tag=xxx` - Get memories with filters

### Questions
- `POST /api/questions/answer` - Answer a question using AI
- `GET /api/questions?elderId=xxx&limit=5` - Get recent questions

### Summaries
- `POST /api/summaries/daily` - Generate daily summary
- `GET /api/summaries?elderId=xxx&date=yyyy-mm-dd&limit=7` - Get summaries

### Images
- `POST /api/memory-images` - Upload memory image to Supabase Storage

## 🧠 AI Features

### Memory Extraction
- Extracts structured data (objects, locations, people) from memory text
- Automatic tag generation
- Falls back to keyword matching if Gemini API is unavailable

### Question Answering
- Uses Gemini API to find top 3 most relevant memories
- Generates warm, friendly answers in simple language
- Falls back to keyword matching for basic functionality

### Daily Summaries
- Generates 3-5 sentence summaries in simple language
- Highlights important moments from the day
- Optimized for elderly users' comprehension

## 🗄️ Database Schema

### Tables
- `profiles` - User profiles with role (elder/caregiver)
- `memories` - Memory entries with text, type, tags, and image_url
- `questions` - Questions asked and AI-generated answers
- `daily_summaries` - Daily summary entries

See `supabase/migrations/` for full schema details.

## 🎨 Design Principles

- **Accessibility First:** Large buttons, clear text, voice support
- **Clean Architecture:** Small, well-named functions, type-safe APIs
- **Error Handling:** Graceful fallbacks, clear error messages
- **Testability:** Isolated AI functions, mockable dependencies

## 🔧 Development

### Code Style
- TypeScript strict mode
- ESLint for code quality
- Small, focused functions
- Clear error handling
- Type-safe API responses

### Key Files
- `lib/ai.ts` - AI functions (isolated for easy mocking)
- `lib/api.ts` - Type-safe API helpers
- `lib/db.ts` - Server-side Supabase client
- `components/memory-friend/` - Main feature components

## 🚢 Deployment

The app is configured for deployment on Vercel:
- Frontend: Vite build output
- API Routes: Next.js App Router
- Environment variables: Set in Vercel dashboard

## 📝 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. For questions or issues, please contact the project maintainer.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- AI powered by [Google Gemini](https://ai.google.dev)

---

**Made with ❤️ for elderly users and their caregivers by GARV ANAND**

