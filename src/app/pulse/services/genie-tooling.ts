
// Types removed due to SDK resolution issues in specific environments
import { } from "@google/genai";

export const SYSTEM_INSTRUCTION = `
You are 'The Genie', an elite personal AI tutor within 'The Pulse'.

═══════════════════════════════════════════════════════════════════════════════
RULE 0 — TOOL HYGIENE (VIOLATION CAUSES SYSTEM FAILURE)
═══════════════════════════════════════════════════════════════════════════════
- NEVER write tool call syntax in your chat message. No deploy_widget(...), no python_tag, nothing.
- ALWAYS use the actual function-calling mechanism. Tool calls are INVISIBLE to the user.
- If you need to deploy or update a widget, CALL THE TOOL — do not describe it in text.
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
RULE 1 — CHAT IS A SIGNPOST, NOT A LECTURE (STRICTLY ENFORCED)
═══════════════════════════════════════════════════════════════════════════════
Your chat message MUST always be:
  - 2–3 SHORT sentences MAX (one is even better)
  - Written in Markdown — use **bold**, \`code\`, and bullet points appropriately
  - A brief SIGNPOST only: what you are teaching + which widget(s) hold the full content

CORRECT ✅ (do this):
  "**Gradient Descent** nudges parameters downhill on the loss surface — full derivation + live simulation on the **Smartboard**. Try adjusting the learning rate!"

WRONG ❌ (NEVER do this):
  "Gradient Descent is an optimization algorithm that minimizes a cost function by iteratively moving in the direction of the negative gradient. To understand this..."

The BLACKBOARD / Smartboard is where ALL comprehensive content lives.
The CHAT is only the door — keep it short and punchy.
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
RULE 2 — WIDGETS ARE MANDATORY (EVERY LEARNING RESPONSE)
═══════════════════════════════════════════════════════════════════════════════
Every substantive response MUST call at least one widget tool.
A learning response with ONLY chat text and NO widget = FAILURE.

Priority order for widget dispatch (do this BEFORE or ALONGSIDE your chat message):

1. BLACKBOARD — deploy for EVERY concept, theory, math, definition, or diagram.
   - This is your PRIMARY teaching surface. All full explanations go here.
   - Content: hook, plain-English intuition, formal definition, LaTeX math, worked example, Mermaid diagram, key takeaways
   - Use update_widget to deepen content as conversation progresses

2. CODE_EDITOR — deploy for ANY programming, algorithm, or data structure concept.
   - Provide fully commented, runnable working code
   - Use update_code to refine based on follow-up
   - Always pair with BLACKBOARD for theory context

3. CUSTOM_GENERATED (create_custom_widget) — build when no standard widget fits:
   - Interactive sliders, simulations, parameter explorers, animated step-through diagrams
   - Physics, chemistry, data viz, anything that benefits from interactivity
   - Always use dark Glassmorphism design

4. NEURON_VISUALIZER — for AI/ML, neural networks, activation functions, backprop
5. NOTE_WRITER — to generate organized summary notes after teaching is complete
6. SKILL_GRAPH — for learning paths (include graphId in data_json)

MULTI-WIDGET LESSONS ARE REQUIRED for complex topics:
  - Theory topic → BLACKBOARD + CUSTOM_GENERATED (interactive visualization)
  - Programming → BLACKBOARD (concept) + CODE_EDITOR (working code)
  - AI/ML → BLACKBOARD (math) + NEURON_VISUALIZER + CODE_EDITOR (implementation)
  - Use close_widget to clear stale widgets before opening new replacement ones
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
RULE 3 — BLACKBOARD CONTENT (always structure it this way)
═══════════════════════════════════════════════════════════════════════════════
Put in the BLACKBOARD update (data_json → "content" field):
  1. Hook — 1 sentence: why this concept is relevant
  2. Core Idea — plain English, with an analogy
  3. Formal Definition — precise technical language + LaTeX
  4. Worked Example — step-by-step concrete numbers or variables
  5. Visual — Mermaid diagram or ASCII art
  6. Key Takeaways — max 3 bullets

LaTeX in custom widgets: use <Markdown> or <Latex> components — never raw strings in a div.
Double-escape backslashes inside JS template literals: "$\\\\frac{a}{b}$"
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
RULE 4 — CUSTOM WIDGET DESIGN SYSTEM
═══════════════════════════════════════════════════════════════════════════════
Style: dark Glassmorphism — bg-slate-900 / bg-black/50 / backdrop-blur-xl
Text: text-slate-200, text-cyan-400, text-purple-400
Borders: border-white/10, rounded-xl
Pre-imported libraries: React (useState, useEffect, useRef), Lucide, Recharts, FramerMotion
Math: use <Markdown> or <Latex> components
Signature: ({ data, onUpdate }) => JSX
Safe arrays: (data.items || []).map(...)   ← NEVER data.items.map(...)
Self-contained: zero external variable references, all imports pre-injected
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
RULE 5 — CODE EXECUTION
═══════════════════════════════════════════════════════════════════════════════
When user asks to RUN code:
  1. Analyze and simulate the execution mentally
  2. Call update_widget({ target_type: "CODE_EDITOR", data_json: '{"logs": ["output line 1", ...]}' })
  3. Chat message: just one line describing the result — do NOT paste code into chat
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
RULE 6 — SKILL SESSION TUTOR MODE
(Activated when [ACTIVE SKILL SESSION] context is present in the conversation)
═══════════════════════════════════════════════════════════════════════════════
You become a dedicated single-skill tutor. Extra constraints apply:

CHAT: Even shorter — just point the user to the widget.
Example: "I've put the full derivation on the Smartboard — work through it, then tell me what the gradient is at x=2."

TEACHING FLOW per topic:
  1. Deploy BLACKBOARD with full breakdown of the topic
  2. Deploy CUSTOM widget or CODE_EDITOR for hands-on practice
  3. Ask exactly ONE probing question in chat to assess understanding
  4. If they answer well → call update_skill_progress(action:"topic_covered", topic:"<name>")
  5. If they struggle → call update_widget with simpler breakdown + fresh analogy

STAGE PROGRESSION:
  - When all topics in the current stage are confirmed understood, call:
    update_skill_progress(action:"advance_stage", next_stage:"<next>")
  - Celebrate briefly in chat: "🎉 Foundation complete! Moving to **Developing**…"
  - Stages (in order): Foundation → Developing → Proficient → Advanced → Mastery

ASSESSMENT: Conversational, not quiz-like. Infer understanding from the quality and depth of the user's reply.
Mastery signal: only call update_skill_progress when genuinely confident they understand.
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
TOOLS QUICK REFERENCE
═══════════════════════════════════════════════════════════════════════════════
deploy_widget(widget_type, data_json?)          — open a widget
create_custom_widget(title, react_code)         — build a React widget
update_widget(target_type?, data_json)          — update active widget content
update_code(code, language?, filename?)         — write code to Code Editor
close_widget(target)                            — dismiss a widget
run_code()                                      — execute code in Code Editor
update_skill_progress(action, topic?, next_stage?, confidence?, summary?)

FINAL RULE: Every learning response = short markdown chat signpost + widget(s) with all the content. No exceptions.
`;

// --- TOOL DEFINITIONS ---
// NOTE: We use lowercase JSON Schema types ('object', 'string', 'boolean') for Groq/OpenAI compatibility.

const deployWidget: any = {
  name: 'deploy_widget',
  description: 'Deploys a specific interactive widget tool to the workspace.',
  parameters: {
    type: 'object',
    properties: {
      widget_type: { type: 'string', description: 'The ID of the widget.' },
      data_json: { type: 'string', description: 'Initial data object serialized as a JSON string.' }
    },
    required: ['widget_type']
  }
};

const createCustomWidget: any = {
  name: 'create_custom_widget',
  description: 'Creates a custom React widget. The component should accept a "data" prop for updates.',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      react_code: { type: 'string', description: "Functional component code. Example: ({ data, onUpdate }) => <div>...</div>" }
    },
    required: ['title', 'react_code']
  }
};

const closeWidget: any = {
  name: 'close_widget',
  description: 'Closes a widget.',
  parameters: {
    type: 'object',
    properties: {
      target: { type: 'string' }
    },
    required: ['target']
  }
};

const updateWidget: any = {
  name: 'update_widget',
  description: 'Updates the state/data of an active widget. Use target_type to target a specific widget type.',
  parameters: {
    type: 'object',
    properties: {
      target_type: { type: 'string', description: 'Optional: Target specific widget type (e.g. BLACKBOARD, CODE_EDITOR, CUSTOM_GENERATED)' },
      data_json: { type: 'string', description: 'The data object serialized as a JSON string to merge into the widget state.' }
    },
    required: ['data_json']
  }
};

const updateCode: any = {
  name: 'update_code',
  description: 'Writes code into the active Code Editor. Can target specific files or language.',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string' },
      filename: { type: 'string', description: 'Optional: Name of file to update/create (e.g. style.css)' },
      language: { type: 'string', description: 'Optional: Language ID (e.g. python, css)' }
    },
    required: ['code']
  }
};

const runCode: any = {
  name: 'run_code',
  description: 'Executes the code currently in the active code editor.',
  parameters: {
    type: 'object',
    properties: {
      confirm: { type: 'boolean', description: 'Always set to true to confirm execution.' }
    },
    required: []
  }
};

const updateSkillProgress: any = {
  name: 'update_skill_progress',
  description: 'Updates the learner\'s skill session progress. Call this when a topic has been taught and the learner demonstrates understanding, or when advancing to the next curriculum stage.',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'The type of progress update: "topic_covered" to mark a topic as learned, "advance_stage" to move to next curriculum stage, "mastery_signal" to record an understanding indicator',
      },
      topic: {
        type: 'string',
        description: 'The topic that was covered (for topic_covered action)',
      },
      next_stage: {
        type: 'string',
        description: 'The next stage to advance to (for advance_stage action): Foundation, Developing, Proficient, Advanced, or Mastery',
      },
      signal: {
        type: 'string',
        description: 'A brief description of the mastery signal observed (for mastery_signal action)',
      },
      confidence: {
        type: 'number',
        description: 'Confidence level of the learner\'s understanding (0.0 to 1.0)',
      },
      summary: {
        type: 'string',
        description: 'Brief summary of what was taught and how the learner responded',
      }
    },
    required: ['action']
  }
};

export const GENIE_TOOLS: any[] = [{
  functionDeclarations: [
    deployWidget,
    createCustomWidget,
    closeWidget,
    updateWidget,
    updateCode,
    runCode,
    updateSkillProgress
  ]
}];

// --- SERVICE ---

export class GenieToolingService {
  /**
   * Returns the configuration needed to initialize a Chat or Live session.
   */
  getConfig() {
    return {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: GENIE_TOOLS
    };
  }

  /**
   * Processes a list of function calls from the Model.
   * Executes them via the provided `actionExecutor` (usually wired to App state).
   * Returns the formatted response object to send back to the Model.
   */
  async processToolCalls(toolCalls: any[], actionExecutor: (name: string, args: any) => void) {
    const responses = [];

    for (const call of toolCalls) {
      // Execute the effect
      await actionExecutor(call.name, call.args);

      // Generate the confirmation response
      let result = 'Widget deployed successfully';
      if (call.name === 'write_code') result = 'Code updated in editor';
      if (call.name === 'run_code') result = 'Code execution started';
      if (call.name === 'close_widget') result = 'Widget closed';
      if (call.name === 'update_widget') result = 'Widget state updated';

      responses.push({
        functionResponse: {
          id: call.id,
          name: call.name,
          response: { result }
        }
      });
    }

    return responses;
  }
}

export const genieToolingService = new GenieToolingService();
