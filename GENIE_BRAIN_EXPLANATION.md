# Genie's Brain: Interactive Course Architecture

Genie's cognitive architecture is designed for "Ruthless Efficiency" and "Dopamine-Hitting Pedagogy". It operates through a set of specialized modules (The Brain) and API routes that handle the learning journey from initialization to mastery.

## 🧠 The Brain (Core Logic)

The core logic resides in `src/lib/genie/brain/`:

1.  **Reasoning (`reasoning.ts`)**:
    *   **The Decision Maker**: Uses `CognitiveReasoning.determineNextAction` to analyze user input against the current concept, mastery level, and conversation history.
    *   **Anti-Loop Logic**: Explicitly identifies vague or affirmative responses (e.g., "ok", "yes") and pivots to the next step (Quiz/Challenge) instead of repeating explanations.
    *   **Actions**: Decides between `explanation`, `quiz`, `challenge`, `roadmap`, `advance`, or `remediate`.

2.  **Session Manager (`session.ts`)**:
    *   **State Persistence**: Manages `interactive_course_sessions` and `learning_loop_iterations`.
    *   **Iterative Learning**: Every concept interaction is tracked as an iteration with specific steps (Explanation → Assessment → Challenge → Evaluation).
    *   **History**: Logs every response and thought process into `progress_state` for long-term context.

3.  **Mastery Tracker (`mastery.ts`)**:
    *   **Real-time Competency**: Updates `genie_user_mastery` and `user_competency` based on evaluation scores.
    *   **Adaptive Pathing**: `getEligibleNodes` determines the next logical concept based on prerequisite mastery.
    *   **XP Engine**: Increments global user XP and levels through `learner_states`.

4.  **Knowledge & Vector (`knowledge.ts`, `vector.ts`)**:
    *   **HKG (Hierarchical Knowledge Graph)**: Extracts structured concepts from raw course content.
    *   **RAG (Retrieval-Augmented Generation)**: Uses `genie_node_embeddings` to provide grounded, factual explanations.

## 🛣️ The Course Process (API Routes)

The interactive journey flows through these endpoints:

### 1. Initialization (`/api/genie/interactive-course/create`)
*   **Action**: Triggered when a user starts a course.
*   **Logic**: 
    *   Extracts the knowledge graph from course content.
    *   Indexes nodes into the Vector DB.
    *   Initializes the `interactive_course_sessions` entry.
    *   Sets the first node as `current_topic`.

### 2. Interaction Hub (`/api/genie/interactive-course`)
*   **Action**: Handles standard POST requests for non-streaming logic (metadata updates).
*   **Logic**:
    *   Evaluates user responses.
    *   Updates mastery scores.
    *   Handles transitions (advancing to next node or remediation).

### 3. The Live Stream (`/api/genie/interactive-course/stream`)
*   **Action**: The heart of Genie's communication.
*   **Logic**:
    *   Runs the `CognitiveReasoning` engine to decide the best pedagogical move.
    *   **Roadmap Delivery**: If at the start, immediately streams the `roadmap` component.
    *   **Adaptive Content**: Streams personalized explanations, quizzes, or challenges.
    *   **Human-like Feel**: Uses variable delays for a natural conversational flow.

## 📊 Database Schema Usage

*   `interactive_course_sessions`: Primary session state and retry management.
*   `learning_loop_iterations`: Granular tracking of the Explanation-Quiz-Challenge loop.
*   `genie_knowledge_nodes`: The source of truth for course content and structure.
*   `genie_user_mastery`: Per-node mastery status (`not_started`, `in_progress`, `mastered`).
*   `understanding_assessments`: Record of every quiz attempt for adaptive feedback.
*   `learner_states`: Global gamification data (XP, Levels).

---
**Craftsmanship Note**: Genie's brain is stateless in execution but deeply persistent in data, ensuring a "Master Architect" level of reliability and speed.
