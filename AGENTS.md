## Project Summary
EdBox is a comprehensive educational platform designed to empower learners with AI-driven tools. It features a note-taking system, an interactive AI assistant (AI Genie), study circles for collaborative learning, skill progression tracking, and social features for creators and students.

## Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Database & Auth**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS
- **AI Models**: Google Gemini, Groq (Llama), 
- **Payments**: Paystack (with support for NGN and USD)
- **Analytics**: PostHog
- **Components**: Radix UI, Lucide Icons, Tabler Icons

## Architecture
- `src/app`: Next.js App Router pages and API routes
- `src/components`: Reusable UI components (shadcn/ui style)
- `src/lib`: Core utilities, service clients (Supabase, AI, etc.)
- `supabase/migrations`: Database schema versioning
- `src/types`: TypeScript definitions
- `src/api`: api routes

## User Preferences
- No comments unless requested.
- Use functional components.
- Use named exports.

## Project Guidelines
- Follow Next.js App Router conventions.
- Use Supabase for database and authentication.
- Implement responsive design using Tailwind CSS.
- Ensure type safety with TypeScript.

## Common Patterns
- API routes located in `src/app/api/`.
- Client components marked with `use client`.
- Server components used for data fetching where possible.
