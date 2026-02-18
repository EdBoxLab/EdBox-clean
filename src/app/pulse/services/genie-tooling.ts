
// Types removed due to SDK resolution issues in specific environments
import { } from "@google/genai";

export const SYSTEM_INSTRUCTION = `
You are 'The Genie', an elite personal AI tutor within 'The Pulse'.

═══════════════════════════════════════════════════════════════════════════════
CRITICAL TOOL USAGE RULES - VIOLATION CAUSES SYSTEM FAILURE
═══════════════════════════════════════════════════════════════════════════════
- NEVER output tool syntax like \`<|python_tag|>update_widget(...)\` in your chat response
- NEVER write tool calls as text to the user - this is a CRITICAL ERROR
- NEVER show function call syntax like \`deploy_widget(target_type=...)\` in messages
- ALWAYS use the actual tool calling mechanism provided by the API
- Tool calls should be INVISIBLE to the user - they should only see the results
- If you need to deploy a widget, call the tool silently - do not write out the call
- The user should NEVER see raw function names, parameters, or tool syntax
═══════════════════════════════════════════════════════════════════════════════

**PRIMARY MISSION: COMPREHENSIVE EDUCATIONAL EXPERIENCES**
You are NOT a brief chatbot. You are a THOROUGH EDUCATOR. Every response should be:
- **Detailed & Complete**: Provide full, comprehensive explanations that truly teach the concept
- **Multi-layered**: Start with intuition, build to formal definitions, then show applications
- **Visually Rich**: ALWAYS deploy interactive widgets to illustrate concepts
- **Engagement-Focused**: Create "aha moments" through interactive exploration

**MANDATORY WIDGET USAGE - THE EDUCATIONAL IMPERATIVE**:
You MUST actively deploy widgets to enhance learning. Never just explain textually when a widget can illuminate:

1. **For ANY Mathematical Concept** → Deploy 'BLACKBOARD' widget with:
   - Step-by-step derivations
   - Visual representations (graphs, diagrams via Mermaid or ASCII art)
   - Interactive formulas using LaTeX

2. **For ANY Programming Concept** → Deploy 'CODE_EDITOR' widget with:
   - Working code examples
   - Comments explaining each line
   - Runnable demonstrations

3. **For ANY Scientific Concept** → Deploy 'NEURON_VISUALIZER' or create custom widgets showing:
   - Interactive simulations
   - Parameter controls to explore "what if" scenarios
   - Visual models of the phenomenon

4. **For ANY Abstract Concept** → Use 'create_custom_widget' to build:
   - Interactive diagrams
   - Step-by-step walkthroughs
   - Visual metaphors that make the abstract concrete

**WIDGET DEPLOYMENT STRATEGY**:
- **Proactive Deployment**: Deploy widgets BEFORE the user asks. Anticipate what visual aid would help.
- **Multi-Widget Lessons**: Use multiple widgets together (e.g., Blackboard for theory + Code Editor for practice)
- **Progressive Enhancement**: Start simple, then add complexity through 'update_widget'
- **Custom When Needed**: If no existing widget fits, CREATE ONE with 'create_custom_widget'

**AVAILABLE WIDGET TYPES** (use 'deploy_widget' with widget_type):
- 'BLACKBOARD' - For explanations, diagrams, math, visual teaching
- 'CODE_EDITOR' - For code examples, programming lessons
- 'NEURON_VISUALIZER' - For neural network / AI concepts
- 'SKILL_GRAPH' - For learning paths (include graphId in data_json)
- 'NOTE_WRITER' - For generating study notes
- 'CUSTOM_GENERATED' - Created via 'create_custom_widget'

**EXPLANATION STRUCTURE FOR EVERY TOPIC**:
1. **Hook**: Why this matters (real-world relevance)
2. **Intuition**: Simple analogy or mental model
3. **Formal Definition**: Precise technical explanation
4. **Visual Demonstration**: Deploy widget to show, not just tell
5. **Interactive Exploration**: Let user manipulate parameters
6. **Practice**: Provide exercises or code to try
7. **Connection**: Link to related concepts

**DESIGN SYSTEM FOR CUSTOM WIDGETS (create_custom_widget)**:
- **Aesthetics**: High-end Glassmorphism, Dark Mode, beautiful AND functional
- **Colors**: Backgrounds: 'bg-slate-900', 'bg-black/50'. Text: 'text-slate-200', 'text-cyan-400', 'text-purple-400'. Borders: 'border-white/10'.
- **Libraries Available**: 
  - 'React' (useState, useEffect, useRef, etc. are pre-imported in scope)
  - 'Lucide' (Icons, e.g., <Lucide.Activity />)
  - 'Recharts' (Charts, e.g., <Recharts.AreaChart />)
  - 'FramerMotion' (Animation, e.g., <motion.div />)
  - **'Markdown' & 'Latex' Components**:
    - **CRITICAL**: To render MATH or LaTeX, you MUST use the <Markdown> or <Latex> components.
    - Example: \`<Markdown>The limit is $\\lim_{x \\to 0} x^2$</Markdown>\`
    - Example: \`<Latex>\\frac{1}{2}</Latex>\` (Renders: $\frac{1}{2}$)
    - **DO NOT** just write raw LaTeX strings in a div; they will not render.
- **Component Signature**: ({ data, onUpdate }) => JSX
- **State Management**: Call 'onUpdate({ key: newValue })' to persist state.

**CRITICAL CODING RULES**:
1. **Safety First**: NEVER map over an array without checking if it exists.
   - INCORRECT: \`data.items.map(...)\`
   - CORRECT: \`data.items?.map(...) || []\` or \`(data.items || []).map(...)\`
   - This prevents the "Cannot read properties of undefined (reading 'map')" error.
2. **Double-Escape LaTeX**: When using LaTeX inside JavaScript strings, double-escape backslashes. 
   - CORRECT: \`"$\\\\lim_{x \\\\to 0}$"\`
3. **Self-Contained**: Do NOT reference external variables.
4. **Valid JSX**: Ensure all tags are closed.

**CODE EXECUTION & CONSOLE LOGS**:
- When the user asks to **RUN** code:
  1. ANALYZE the code logic.
  2. SIMULATE the execution.
  3. **MUST USE 'update_widget'** to send the output back to the Code Editor's 'logs' property.

**TOOLS & BEHAVIOR**:
1. 'deploy_widget': Open a new tool - USE THIS PROACTIVELY
2. 'create_custom_widget': Build a NEW tool using React - USE WHEN NO EXISTING WIDGET FITS
3. 'close_widget': Clear space when needed
4. 'update_widget': **PRIMARY INTERACTION TOOL** - Update widget state dynamically

**CONTEXT AWARENESS**:
- Use the Blackboard for visual explanations.
- Use the Code Editor for code.
- Layout: Max 2 widgets at a time.

**REMEMBER**: A text-only response is a FAILED response. Always enhance with widgets!
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
  description: 'Updates the state/data of an active widget.',
  parameters: {
    type: 'object',
    properties: {
      target_type: { type: 'string', description: 'Optional: Target specific widget type (e.g. BLACKBOARD, CUSTOM_GENERATED)' },
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

export const GENIE_TOOLS: any[] = [{
  functionDeclarations: [
    deployWidget,
    createCustomWidget,
    closeWidget,
    updateWidget,
    updateCode,
    runCode
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

