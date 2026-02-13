# Google AI Studio Prompt: Immersive Course-Taking Experience

## Copy and paste this entire prompt into Google AI Studio

---

```
You are an expert full-stack developer specializing in building immersive AI-powered learning experiences. Your task is to create a working prototype for a new course-taking experience called "EdBox Immersive Workspace."

## PROJECT OVERVIEW

EdBox is an educational platform with an existing AI tutor called "Genie." Currently, the course-taking experience is not engaging enough. We want to build a fully immersive, full-screen workspace similar to EDZA AI, where learners can interact with Genie in a conversational, interactive environment.

## KEY REQUIREMENTS

### 1. FULL-SCREEN IMMERSIVE WORKSPACE
- Create a full-screen learning environment with NO navigation bars, headers, or distractions
- The entire viewport should be dedicated to the learning experience
- Include a collapsible sidebar for progress tracking (can be toggled)
- Use a clean, modern design with good contrast and readability

### 2. AI AVATAR COMPONENT
- Create a visual representation of "Genie" (the AI tutor)
- The avatar should be animated and responsive to the conversation
- Show different states: idle, thinking, speaking, happy, confused
- Use CSS animations (no heavy 3D libraries needed)
- Position the avatar prominently at the top or side of the workspace

### 3. CONVERSATION INTERFACE
- Build a chat-based interface for interacting with Genie
- Support streaming responses (text appears word-by-word or chunk-by-chunk)
- Display user messages and AI messages in a clear, conversational format
- Include typing indicators when Genie is "thinking"
- Support markdown rendering for code blocks, lists, and formatting

### 4. EMBEDDED INTERACTIVE ELEMENTS
- Allow quizzes to be embedded directly in the conversation flow
- Support multiple-choice questions with instant feedback
- Include code playgrounds for programming topics (with syntax highlighting)
- Support diagrams and visualizations (can use simple SVG or canvas)
- Make interactive elements feel natural within the conversation

### 5. INPUT AREA
- Provide a text input field for user messages
- Include quick action buttons (e.g., "Give me a quiz", "Explain differently", "I'm stuck")
- Support emoji reactions to AI responses
- Make the input area always accessible at the bottom

### 6. PROGRESS TRACKING
- Show current progress on the current topic/concept
- Display a progress bar that updates in real-time
- Show mastery indicators (e.g., "75% mastered")
- Include a skill tree or roadmap visualization in the sidebar

### 7. VOICE INTERACTION (Optional but Recommended)
- Add a microphone button for voice input
- Include a speaker button to enable text-to-speech for AI responses
- Show visual feedback when voice is active

## TECHNICAL STACK

Use the following technologies:
- **Framework**: Next.js 15+ with App Router
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React or Tabler Icons
- **Markdown**: react-markdown with syntax highlighting
- **State Management**: React hooks (useState, useEffect, useRef)
- **Streaming**: Server-Sent Events (SSE) or WebSocket

## COMPONENT STRUCTURE

Create the following component structure:

```
src/app/course/[courseId]/workspace/
├── page.tsx                    # Main workspace page
├── components/
│   ├── ImmersiveWorkspace.tsx  # Main container component
│   ├── AIAvatar.tsx            # AI avatar with animations
│   ├── ConversationArea.tsx    # Chat interface
│   ├── MessageBubble.tsx       # Individual message component
│   ├── InteractiveElement.tsx  # Quiz, code playground, etc.
│   ├── InputArea.tsx           # User input with quick actions
│   ├── ProgressSidebar.tsx     # Collapsible progress sidebar
│   └── SkillTree.tsx           # Skill tree visualization
└── hooks/
    ├── useStreamingChat.ts     # Hook for streaming chat
    └── useCourseProgress.ts    # Hook for progress tracking
```

## API ENDPOINTS TO CREATE

Create the following API routes:

```
src/app/api/course/[courseId]/workspace/
├── chat/route.ts               # Streaming chat endpoint
├── quiz/route.ts               # Generate quiz questions
├── diagram/route.ts            # Generate diagrams/visualizations
└── progress/route.ts           # Get/update progress
```

## DESIGN SPECIFICATIONS

### Color Scheme
- Primary: Deep blue/purple gradient (immersive, focused)
- Accent: Bright accent color for interactive elements
- Background: Dark mode preferred for immersion
- Text: High contrast for readability

### Typography
- Clean, modern sans-serif font
- Large, readable text for AI responses
- Monospace for code blocks

### Animations
- Smooth transitions for all state changes
- Avatar breathing animation when idle
- Typing animation for AI responses
- Subtle pulse for interactive elements

## MOCK DATA

For the prototype, use the following mock data:

```typescript
// Mock course data
const mockCourse = {
  id: "course-1",
  title: "Introduction to React",
  description: "Learn the fundamentals of React",
  nodes: [
    { id: "node-1", title: "What is React?", status: "completed", mastery: 100 },
    { id: "node-2", title: "Components", status: "in_progress", mastery: 65 },
    { id: "node-3", title: "Props and State", status: "not_started", mastery: 0 },
    { id: "node-4", title: "Hooks", status: "not_started", mastery: 0 },
  ]
};

// Mock conversation
const mockConversation = [
  {
    role: "ai",
    content: "Welcome to the React workspace! I'm Genie, your AI tutor. Let's explore React Components together. What would you like to know?",
    timestamp: new Date().toISOString()
  },
  {
    role: "user",
    content: "What is a React component?",
    timestamp: new Date().toISOString()
  },
  {
    role: "ai",
    content: "Great question! A React component is a reusable piece of UI that can accept inputs (called props) and return JSX to describe what should appear on the screen.\n\nThink of it like a LEGO brick - you can build complex structures by combining simple, reusable pieces.\n\nHere's a simple example:\n\n```jsx\nfunction Welcome() {\n  return <h1>Hello, World!</h1>;\n}\n```\n\nThis component renders a heading that says 'Hello, World!'. You can use it anywhere in your app.",
    timestamp: new Date().toISOString()
  }
];

// Mock quiz
const mockQuiz = {
  question: "What does a React component return?",
  options: [
    "HTML",
    "JSX",
    "CSS",
    "JavaScript object"
  ],
  correctAnswer: 1,
  explanation: "React components return JSX, which is a syntax extension for JavaScript that looks similar to HTML."
};
```

## IMPLEMENTATION STEPS

### Step 1: Set up the project structure
- Create the workspace directory structure
- Set up the main page component
- Configure Tailwind CSS for dark mode

### Step 2: Build the ImmersiveWorkspace component
- Create the full-screen container
- Add the collapsible sidebar
- Set up the main content area

### Step 3: Build the AIAvatar component
- Create a simple 2D avatar using CSS/SVG
- Add animations for different states (idle, thinking, speaking)
- Make it responsive to conversation state

### Step 4: Build the ConversationArea component
- Create the chat interface
- Implement message bubbles for user and AI
- Add markdown rendering with syntax highlighting
- Add typing indicators

### Step 5: Build the InputArea component
- Create the text input field
- Add quick action buttons
- Add emoji reaction buttons
- Style for accessibility

### Step 6: Build the InteractiveElement component
- Create a quiz component with multiple choice
- Add instant feedback for correct/incorrect answers
- Create a code playground component
- Add diagram visualization support

### Step 7: Build the ProgressSidebar component
- Create the collapsible sidebar
- Add progress bars for each topic
- Add skill tree visualization
- Add mastery indicators

### Step 8: Create the streaming chat API
- Set up SSE endpoint for streaming responses
- Implement mock streaming for prototype
- Handle different message types (text, quiz, diagram)

### Step 9: Connect everything
- Wire up the components
- Implement state management
- Add error handling
- Test the full flow

## STREAMING RESPONSE FORMAT

The API should stream responses in the following format:

```
data: {"type":"content","content":"Hello"}
data: {"type":"content","content":" there!"}
data: {"type":"quiz","quizData":{"question":"...","options":[...],"correctAnswer":1,"explanation":"..."}}
data: {"type":"done"}
```

## ACCESSIBILITY REQUIREMENTS

- Full keyboard navigation support
- ARIA labels for all interactive elements
- Screen reader announcements for new messages
- High contrast colors
- Focus indicators

## PERFORMANCE REQUIREMENTS

- Lazy load interactive elements
- Use virtual scrolling for long conversations
- Optimize avatar animations
- Cache API responses

## DELIVERABLES

Please provide:
1. Complete, working Next.js code for all components
2. API route implementations with streaming support
3. Tailwind CSS styling for all components
4. Mock data for testing
5. Instructions for running the prototype
6. Any additional configuration needed

## NOTES

- This is a prototype, so mock data is acceptable
- Focus on the UI/UX and interaction patterns
- The AI responses can be pre-written for the prototype
- Prioritize the immersive, full-screen experience
- Make the avatar feel alive and responsive
- Ensure the conversation flow feels natural

Please build this prototype with clean, well-documented code that can be easily integrated into the existing EdBox codebase.
```

---

## How to Use This Prompt

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new project
3. Copy the entire prompt above (including the code blocks)
4. Paste it into the prompt area
5. Click "Generate" to get the prototype code

## Expected Output

The AI should generate:
- Complete Next.js component code
- API route implementations
- Tailwind CSS styling
- Mock data and examples
- Setup instructions

## Customization Options

You can modify the prompt to:
- Change the color scheme
- Add more interactive element types
- Include specific course content
- Add more avatar animations
- Enhance the progress tracking
- Add voice interaction features
