
// Types removed due to SDK resolution issues in specific environments
import { } from "@google/genai";

export const SYSTEM_INSTRUCTION = `
You are 'The Genie', an elite personal AI tutor within 'The Pulse'.

**CORE CAPABILITY: DEEP WIDGET INTERACTION**
You are not just a chatbot. You can DIRECTLY MANIPULATE ANY tool in the workspace.
- **Universal Control**: Use 'update_widget' to send data to ANY active widget.
- **Custom Widgets**: If you need a tool that doesn't exist, CREATE IT using 'create_custom_widget'.
- **Blackboard**: You can WRITE explanations or key terms on it.
- **Code Editor**: You can WRITE code, comments, or fixes directly into it. Supports MULTIPLE FILES.
- **Note Writer**: You can DRAFT notes or summaries for the user.

**DESIGN SYSTEM FOR CUSTOM WIDGETS (create_custom_widget)**:
- **Aesthetics**: High-end Glassmorphism, Dark Mode, Futuristic Sci-Fi UI.
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
1. 'deploy_widget': Open a new tool.
2. 'create_custom_widget': Build a NEW tool using React.
3. 'close_widget': Clear space.
4. 'update_widget': **PRIMARY INTERACTION TOOL**. Update widget state.

**CONTEXT AWARENESS**:
- Use the Blackboard for visual explanations.
- Use the Code Editor for code.
- Layout: Max 2 widgets.
`;

// --- TOOL DEFINITIONS ---
// NOTE: We use string literals ('OBJECT', 'STRING', etc.) instead of Type.OBJECT to avoid runtime enum issues.

const deployWidget: any = {
  name: 'deploy_widget',
  description: 'Deploys a specific interactive widget tool to the workspace.',
  parameters: {
    type: 'OBJECT',
    properties: {
      widget_type: { type: 'STRING', description: 'The ID of the widget.' },
      data_json: { type: 'STRING', description: 'Initial data object serialized as a JSON string.' }
    },
    required: ['widget_type']
  }
};

const createCustomWidget: any = {
  name: 'create_custom_widget',
  description: 'Creates a custom React widget. The component should accept a "data" prop for updates.',
  parameters: {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      react_code: { type: 'STRING', description: "Functional component code. Example: ({ data, onUpdate }) => <div>...</div>" }
    },
    required: ['title', 'react_code']
  }
};

const closeWidget: any = {
  name: 'close_widget',
  description: 'Closes a widget.',
  parameters: {
    type: 'OBJECT',
    properties: {
      target: { type: 'STRING' }
    },
    required: ['target']
  }
};

const updateWidget: any = {
  name: 'update_widget',
  description: 'Updates the state/data of an active widget.',
  parameters: {
    type: 'OBJECT',
    properties: {
      target_type: { type: 'STRING', description: 'Optional: Target specific widget type (e.g. BLACKBOARD, CUSTOM_GENERATED)' },
      data_json: { type: 'STRING', description: 'The data object serialized as a JSON string to merge into the widget state.' }
    },
    required: ['data_json']
  }
};

const updateCode: any = {
  name: 'update_code',
  description: 'Writes code into the active Code Editor. Can target specific files or language.',
  parameters: {
    type: 'OBJECT',
    properties: {
      code: { type: 'STRING' },
      filename: { type: 'STRING', description: 'Optional: Name of file to update/create (e.g. style.css)' },
      language: { type: 'STRING', description: 'Optional: Language ID (e.g. python, css)' }
    },
    required: ['code']
  }
};

const runCode: any = {
  name: 'run_code',
  description: 'Executes the code currently in the active code editor.',
  parameters: {
    type: 'OBJECT',
    properties: {
      confirm: { type: 'BOOLEAN', description: 'Always set to true to confirm execution.' }
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
