# EdBox - Comprehensive Documentation

## About EdBox

EdBox is an AI-powered adaptive learning platform that transforms how people learn by providing personalized, interactive educational experiences. Built with cutting-edge technology, EdBox combines artificial intelligence with proven pedagogical methods to create engaging learning journeys tailored to each individual learner.

---

## Founders

### Inioluwa Ayodeji - Chief Executive Officer (CEO)
The visionary leader driving EdBox's mission to democratize quality education through AI-powered personalization.

### Ajani AbdulMalik - Co-Founder
Technical innovator contributing to EdBox's robust architecture and feature development.

### Oyeleru Praise - Co-Founder
Strategic partner helping shape EdBox's educational philosophy and user experience.

---

## Core Features

### 1. AI-Powered Learning (Genie)
- **Personalized AI Tutor**: Genie is EdBox's intelligent assistant that adapts to each learner's pace, style, and goals
- **Interactive Conversations**: Natural language interactions for asking questions, getting explanations, and receiving guidance
- **Adaptive Responses**: Genie adjusts complexity based on learner comprehension
- **Context-Aware Help**: Understands the current lesson/course context to provide relevant assistance

### 2. Learning Paths
- **Custom Course Generation**: AI generates personalized learning paths based on user goals and skill level
- **Structured Curriculum**: Courses are organized into modules, lessons, and assessments
- **Progress Tracking**: Visual progress indicators show completion status
- **Skill-Based Progression**: Unlock new content as skills are mastered

### 3. Interactive Course System
- **Dynamic Content**: Lessons adapt based on learner performance
- **Multiple Content Types**: Text, code examples, interactive exercises, quizzes
- **Real-Time Feedback**: Immediate assessment and correction
- **Challenge Mode**: Test knowledge with adaptive challenges

### 4. Specialized Learning Engines

#### MathLab
- Interactive mathematics simulations
- Step-by-step problem solving
- Visual representations of concepts
- Practice problems with instant feedback

#### CodeStudio
- Live code editor with syntax highlighting
- Multiple programming language support
- Code execution and testing
- Project-based learning

#### PhysicsSim
- Physics simulations and visualizations
- Interactive experiments
- Concept demonstrations
- Real-world applications

#### ChemLab
- Virtual chemistry laboratory
- Molecular visualizations
- Chemical reaction simulations
- Safety-first virtual experiments

#### BioNexus
- Biology learning modules
- Interactive diagrams
- Life sciences exploration
- Anatomy and physiology content

#### LinguaLab
- Language learning tools
- Vocabulary builders
- Grammar exercises
- Pronunciation guides

#### HistoryMach
- Historical timeline exploration
- Interactive historical content
- Primary source analysis
- Contextual learning

#### WritingStudio
- Writing assistance and feedback
- Grammar and style checking
- Creative writing prompts
- Essay structure guidance

#### ArtStudio
- Creative arts education
- Design principles
- Visual art techniques
- Portfolio development

#### FinLab
- Financial literacy education
- Investment concepts
- Budgeting tools
- Economic principles

### 5. Study Tools

#### Notes
- Create and organize study notes
- Rich text formatting
- Attach to specific courses/lessons
- Search and filter notes

#### Study Kit
- AI-generated study materials
- Flashcards
- Summary sheets
- Practice questions

#### Flashcard Generator
- AI-powered flashcard creation
- Spaced repetition system
- Custom deck creation
- Progress tracking

#### Quiz Forge
- Custom quiz generation
- Multiple question types
- Instant grading
- Performance analytics

### 6. Gamification & Progress

#### Streak System
- Daily learning streaks
- Streak preservation rewards
- Longest streak tracking
- Visual streak calendar

#### XP (Experience Points)
- Earn XP for completing lessons
- Level progression system
- XP bonuses for achievements
- Leaderboard rankings

#### Certificates
- Course completion certificates
- Verifiable credentials
- Shareable achievements
- PDF generation

### 7. Social Features

#### Study Circles
- Create or join study groups
- Collaborative learning spaces
- Group discussions
- Shared resources

#### Creator Profiles
- Follow content creators
- Creator content feeds
- Creator analytics
- Community building

#### Messaging/Inbox
- Direct messaging between users
- Study group conversations
- Notification system
- Contact management

#### Referrals
- Invite friends to EdBox
- Referral rewards
- Tracking referral success
- Community growth

### 8. For You Page (FYP)
- Personalized content recommendations
- AI-curated learning feed
- Trending topics
- Discovery of new subjects

### 9. Saved Content
- Bookmark courses and lessons
- Save for later functionality
- Organized saved collections
- Quick access to favorites

### 10. User Profile & Settings
- Profile customization
- Learning preferences
- Notification settings
- Account management
- Privacy controls

---

## Navigation Structure

### Main Navigation (Authenticated Users)

```
/ (Dashboard)
├── Welcome message with user greeting
├── Streak Card (Your Progress)
├── Recent courses carousel
├── Quick actions
└── Learning recommendations

/courses
├── My Learning Paths list
├── Course cards with progress
├── Create new course button
└── Course management (delete)

/courses/[courseId]
├── Course content viewer
├── Lesson navigation
├── Interactive exercises
├── Progress tracking
└── Genie AI assistant

/fyp (For You Page)
├── Personalized feed
├── Content recommendations
├── Trending topics
└── Discovery section

/saved
├── Saved courses
├── Bookmarked lessons
├── Saved feed items
└── Collections

/tools
├── /tools/notes - Note taking
├── /tools/study-kit - Study materials
└── Quick access to utilities

/socials
├── /socials/study-circles - Group learning
├── /socials/creator-profiles - Follow creators
├── /socials/inbox - Messages
└── /socials/referrals - Invite friends

/profile
├── User profile view
├── Achievement badges
├── Learning statistics
└── Public profile settings

/settings
├── Account settings
├── Notification preferences
├── Privacy settings
└── Theme preferences

/admin (Admin users only)
├── User management
├── Analytics dashboard
├── System settings
└── Content moderation
```

### Public Pages

```
/login - User authentication
/signup - New user registration
/about - About EdBox
/verify/[id] - Certificate verification
```

### Learning Engines (Standalone)

```
/mathlab - Mathematics simulations
/codestudio - Code editor environment
/physicssim - Physics simulations
/chemlab - Chemistry lab
/bionexus - Biology modules
/lingualab - Language learning
/historymach - History exploration
/writingstudio - Writing tools
/artstudio - Art education
/finlab - Financial literacy
```

### Utility Routes

```
/learning-path/[id] - Direct learning path access
/demo-course - Demo/sample course
/quiz-forge - Quiz generator
/flashcard-gen - Flashcard generator
/research-assistant - Research tools
/feed - Content feed
/creator - Creator dashboard
```

---

## API Endpoints

### Authentication & User
- `POST /api/auth/callback` - Auth callback handler

### Courses & Learning
- `GET/POST /api/courses` - Course management
- `GET/POST /api/course` - Individual course operations
- `POST /api/course/share` - Share course
- `POST /api/coursecreation` - Create new course
- `POST /api/coursecreation/extract` - Extract content for course
- `GET /api/coursecreation/templates` - Course templates

### Learning Paths
- `POST /api/learning-path/generate` - Generate learning path
- `GET /api/learning-path` - Get learning paths

### AI & Genie
- `POST /api/genie/respond` - Genie AI responses
- `POST /api/genie/interactive-course/create` - Create interactive course
- `POST /api/genie/interactive-course/stream` - Stream course content
- `POST /api/genie/interactive-course/evaluate` - Evaluate responses
- `POST /api/genie/interactive-course/assessment` - Run assessments
- `POST /api/genie/interactive-course/resume` - Resume course

### Progress & Gamification
- `GET/POST /api/progress` - Progress tracking
- `POST /api/progress/update` - Update progress
- `GET/POST /api/streaks` - Streak management
- `GET/POST /api/xp` - XP management
- `POST /api/xp/update` - Update XP

### Study Tools
- `GET/POST /api/notes` - Notes management
- `GET/PUT/DELETE /api/notes/[id]` - Individual note operations
- `POST /api/study-kit/generate` - Generate study kit
- `GET /api/study-kit/list` - List study kits
- `POST /api/flashcard-gen` - Generate flashcards
- `POST /api/quiz-forge` - Generate quizzes

### Social Features
- `GET/POST /api/study-circles` - Study circles
- `GET/POST /api/study-circles/[circleId]` - Circle operations
- `POST /api/study-circles/join` - Join circle
- `GET/POST /api/study-circles/[circleId]/messages` - Circle messages
- `GET/POST /api/messages` - Direct messages
- `GET /api/messages/contacts` - Message contacts
- `GET /api/creators` - List creators
- `GET /api/creators/[id]` - Creator profile
- `POST /api/creators/[id]/follow` - Follow creator

### Feed & Content
- `GET /api/feed` - Get feed content
- `POST /api/feed/generate` - Generate feed
- `POST /api/feed/save` - Save feed item

### Certificates
- `POST /api/certificate/generate` - Generate certificate
- `GET /api/certificate/[id]` - Get certificate

### Analytics
- `POST /api/analytics` - Track analytics
- `POST /api/analytics/share` - Share analytics
- `GET /api/analytics/share-count` - Share counts

### Admin
- `GET /api/admin/stats` - Admin statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/analysis` - System analysis
- `GET/POST /api/admin/settings` - Admin settings

### Skill System
- `GET/POST /api/skill-graph` - Skill graph management
- `POST /api/skill-graph/generate` - Generate skill graph
- `GET /api/skill-progression` - Get progression
- `POST /api/skill-progression/setup` - Setup progression
- `POST /api/skill-progression/challenge` - Create challenge
- `POST /api/competency/track` - Track competency

---

## Technology Stack

### Frontend
- **Next.js 14+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Animations
- **Lucide Icons** - Icon library

### Backend
- **Next.js API Routes** - Serverless functions
- **Supabase** - Database & Authentication
- **PostgreSQL** - Database (via Supabase)

### AI/ML
- **Google Gemini** - Primary AI model
- **Groq** - Fast inference
- **Custom prompts** - Tailored educational responses

### Infrastructure
- **Vercel** - Hosting & deployment
- **Supabase** - Backend services
- **PostHog** - Analytics

---

## Database Schema (Key Tables)

### Users & Auth
- `profiles` - User profiles
- `user_preferences` - Learning preferences

### Courses & Content
- `courses` - Course metadata
- `learning_paths` - Generated learning paths
- `lessons` - Individual lessons
- `course_progress` - User progress per course

### Gamification
- `streaks` - User streaks
- `xp_logs` - XP transactions
- `certificates` - Earned certificates
- `achievements` - User achievements

### Social
- `study_circles` - Study groups
- `circle_members` - Group memberships
- `circle_messages` - Group messages
- `messages` - Direct messages
- `follows` - Creator follows

### Content
- `notes` - User notes
- `saved_items` - Bookmarked content
- `feed_items` - Feed content

---

## Key Components

### StreakCard
Displays user's current streak, weekly progress, XP level, and progress bar.

### CourseCard
Shows course thumbnail, title, progress, and quick actions.

### Genie Chat Interface
AI assistant chat component with message history and input.

### Interactive Lesson Viewer
Renders lesson content with code blocks, exercises, and assessments.

### Study Circle Chat
Real-time group messaging interface.

### Navigation Sidebar
Main app navigation with icons and labels.

---

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI APIs
GEMINI_API_KEY=
GROQ_API_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Contact & Support

For support or inquiries, contact the EdBox team through the platform or reach out to the founders directly.

**EdBox** - Empowering learners through AI-driven personalized education.

---

*This documentation is maintained by the EdBox development team and should be referenced for understanding the platform's capabilities, structure, and implementation details.*
