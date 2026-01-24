# Genie Brain Audit & Critique

## 1. Architecture Overview: How it Works
The current "Genie" architecture consists of three disconnected systems:
1.  **Course Creator (`study-kit/generate`)**: Generates static JSON/Markdown assets (notes, flashcards) using an LLM. These files are saved to `study_kit_content` and **never seen again** by the teaching AI.
2.  **The "Brain" (`stream/route.ts`)**: A stateless interaction loop. It decides what to do next based on:
    *   **Regex Keywords**: Simple string matching (e.g., if user says "confused", it detects confusion).
    *   **State Machine**: Hardcoded logic (e.g., "If turn < 2, force Roadmap"). 
    *   **LLM Generation**: Uses a mid-tier model (Llama/Gemini Flash) with a **sliding window of the last 3-5 messages**.
3.  **Session Manager**: A CRUD wrapper that saves the chat history and "learning goals" to Supabase.

## 2. Critical Constraints & Flaws
### ⚠️ The "Ghost Teacher" Problem (Major Hallucination Risk)
**Constraint**: Genie **DOES NOT READ** the course content.
*   When a user creates a course from a file or topic, the content is generated and stored.
*   However, when Genie "teaches" that course, it **does not retrieve** that generated content.
*   **Result**: Genie is teaching purely from its internal training data (LLM weights) based on the *Title* of the skill. If you upload a PDF about "Proprietary Company Protocol X", Genie will hallucinate a generic version of it because it never actually reads your PDF during the chat session. It only used the PDF to generate the static notes.

### ⚠️ Amnesiac Context
**Constraint**: Interactive session memory is limited to **~3-5 messages**.
*   The `analyzeUnderstanding` function only sees the last 3 messages.
*   The `makeSmartDecision` flow receives `conversationHistory.slice(-5)`.
*   **Result**: Genie has no idea what it taught you 5 minutes ago. It cannot reference previous quizzes, past mistakes, or build a complex narrative arc. It is perpetually stuck in the "now".

### ⚠️ Brittle "Intelligence"
**Constraint**: Reliance on Regex and strict If/Else logic.
*   The "Behavioral Pattern Detection" uses `msg.includes('confused')`.
*   **Result**: If a user says "I am not confused, I just disagree", the regex sees "confused" and triggers the "User is confused" logic. This is 2010-era chatbot logic, not Agentic AI.

## 3. Benchmarks

| Feature | Coursera (Industry Standard) | Gemini (SOTA AI) | **EdBox Genie (Current)** |
| :--- | :--- | :--- | :--- |
| **Content Authority** | ✅ **High**: Curated, verified content. | ✅ **High**: Can read 2M+ tokens of docs. | ❌ **Low**: Hallucinates based on titles; ignores course material. |
| **Context Window** | N/A (Linear video flow) | ✅ **Massive**: Remembers entire books. | ❌ **Tiny**: ~5 messages sliding window. |
| **Teaching Style** | Passive Video | Adaptive, Reasoning-heavy. | Semi-Adaptive but forgetful. |
| **User Experience** | Structured but boring. | Fluid, human-like. | **Gamified but Superficial**. |
| **Architecture** | LMS + SQL | Vector DB + Long Context LLM | Regex + Stateless API |

## 4. The "No Holds Barred" Critique
Your current architecture is a **"Facade"**. It looks like a premium AI tutor on the surface (beautiful UI, streaming text, gamification), but the brain is lobotomized.

1.  **You are wasting the "Study Kit"**: You generate all this great content (Notes, Mindmaps) and then throw it in a dark closet. Genie needs to have these notes injected into its system prompt so it teaches *the actual material*.
2.  **You are underutilizing the LLM**: You are using Gemini/Llama 70B but treating it like a text completions engine for regex matches. You should be trusting the LLM to manage the state and conversation flow, or at least giving it the full history.
3.  **Fake Streaming**: You are artificially delaying the stream (`getHumanDelay`). While this feels "human", it adds unnecessary latency. Real intelligence is fast; let it be fast.
4.  **Fragile State**: The `makeSmartDecision` function is a house of cards. One unpredicted user intent breaks the flow because it falls through the hardcoded `if/else` block.

## 5. Immediate Recommendations
1.  **Implement RAG (Retrieval Augmented Generation)**:
    *   When a course is created, chunk the content and store embeddings.
    *   In `stream/route.ts`, **retrieve** relevant chunks based on the user's question and inject them into the `systemPrompt`.
2.  **Unlock Context**:
    *   Stop slicing history to 5 messages. Modern models handle 128k+ tokens. Send the **entire conversation**.
    *   Summarize older parts if you hit limits, but don't just delete them.
3.  **Ditch Regex for AI Routing**:
    *   Use a lightweight LLM call to classify "User Intent" (e.g., `user_confused`, `requesting_quiz`) instead of `msg.includes('confused')`.
4.  **Connect the Brain to the Body**:
    *   Pass the `study_kit_content` (notes) into Genie's context.

**Verdict**: Technically impressive UI, but the "AI" implementation is currently a prototype-level illusion that will fail any real-world educational test due to lack of content grounding.
