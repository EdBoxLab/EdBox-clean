
import React, { useEffect, useState, useRef, ReactNode, ErrorInfo } from 'react';
import * as LucideIcons from 'lucide-react';
import * as Recharts from 'recharts';
import * as FramerMotion from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { interactionTracker } from '../../services/interaction-tracker';

interface ErrorBoundaryProps {
  children?: ReactNode;
  onError: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple Error Boundary to catch runtime errors in the generated component
class WidgetErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly declare props to satisfy strict TypeScript environments
  public readonly props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console for debugging
    console.error("Widget Runtime Error:", error);
    this.props.onError(error);
  }

  render() {
    if (this.state.hasError) {
      return null; // The parent handles the error UI via the callback updating state
    }
    return this.props.children;
  }
}

interface DynamicWidgetProps {
  code: string;
  data?: any;
  onUpdate?: (newData: any) => void;
}

// Pre-configured Markdown component for ease of use in generated widgets
const Markdown = (props: any) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[rehypeKatex]}
    className="prose prose-invert prose-sm max-w-none"
    components={{
       p: ({node, ...p}) => <p className="mb-2 last:mb-0" {...p} />,
    }}
    {...props}
  />
);

// Specific LaTeX helper component to ensure math is rendered even if the AI forgets $ delimiters or uses them inconsistently
const Latex = ({ children, block = false, className = '' }: { children: string, block?: boolean, className?: string }) => {
    // If children is not a string, try to stringify or fallback
    const textContent = typeof children === 'string' ? children : String(children);
    
    // Auto-detect if it needs wrapping. If it doesn't have $, wrap it. 
    // This is a heuristic helper for the AI.
    const needsWrapping = !textContent.trim().startsWith('$');
    const content = needsWrapping 
        ? (block ? `$$${textContent}$$` : `$${textContent}$`) 
        : textContent;
        
    return (
        <span className={className}>
            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    p: ({node, ...props}) => <span {...props} /> // Force inline rendering for this helper
                }}
            >
                {content}
            </ReactMarkdown>
        </span>
    );
};

const DynamicWidget: React.FC<DynamicWidgetProps> = ({ code, data, onUpdate }) => {
  const [WidgetComponent, setWidgetComponent] = useState<React.FC<any> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const debounceRef = useRef<any>(null);

  // Wrapped update handler to log interactions
  const handleUpdate = (newData: any) => {
      if (onUpdate) onUpdate(newData);
      interactionTracker.log({
          type: 'click',
          widgetType: 'CUSTOM_GENERATED',
          details: `User interacted with custom widget. Keys: ${Object.keys(newData).join(', ')}`
      });
  };

  const getWrappedCode = (sourceCode: string) => {
    // 1. Remove imports (AI often includes them despite prompts)
    let cleaned = sourceCode
        .replace(/^\s*import\s+[\s\S]*?;\s*$/gm, '') 
        .replace(/^\s*import\s+.*$/gm, '')
        .replace(/^\s*import\s+[\s\S]*?from.*$/gm, '');

    // 2. Handle "export default" -> "return"
    if (cleaned.match(/^\s*export\s+default\s+/m)) {
        cleaned = cleaned.replace(/^\s*export\s+default\s+/m, 'return ');
    } else {
        // If no export default, assume it's an expression if it starts with ( or { or arrow function
        // Or if it's a block without return, we might fail, but let's try to prepend return 
        // if it doesn't look like a variable declaration.
        const trimmed = cleaned.trim();
        const isStatement = /^(const|let|var|function|class)\s/.test(trimmed);
        if (!isStatement && trimmed.length > 0) {
            cleaned = `return ${cleaned}`;
        }
    }
    
    // 3. Remove named exports
    cleaned = cleaned.replace(/^\s*export\s+/gm, '');

    return `
      (function() { 
        const { useState, useEffect, useRef, useMemo, useCallback } = React;
        const { motion, AnimatePresence } = FramerMotion;
        const { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } = Recharts;
        // Inject Markdown capabilities so the AI can use them in the widget
        const { ReactMarkdown, remarkGfm, remarkMath, rehypeKatex, Markdown, Latex } = MarkdownTools;
        
        try {
          ${cleaned}
        } catch (e) {
          throw e;
        }
      })()
    `;
  };

  useEffect(() => {
    if (!code) return;
    setIsCompiling(true);
    setError(null); // Clear previous errors on new code
    
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
        try {
          const babel = (window as any).Babel;
          if (!babel) throw new Error("Compiler not ready (Babel missing).");

          let transpiled = '';
          
          try {
              transpiled = babel.transform(getWrappedCode(code), {
                presets: ['react'],
                filename: 'dynamic_widget.js',
                compact: false,
                minified: false,
                sourceMaps: false,
                highlightCode: false,
                ast: false
              }).code;
          } catch (compileError: any) {
              // Auto-Fix: Retry if we encounter the common Unicode escape sequence error caused by unescaped \u
              if (compileError.message && compileError.message.includes("Unicode escape sequence")) {
                  console.warn("Attempting to auto-fix Unicode escape error in widget code...");
                  const fixedCode = code.replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u');
                  transpiled = babel.transform(getWrappedCode(fixedCode), {
                      presets: ['react'],
                      filename: 'dynamic_widget_fixed.js',
                      compact: false,
                      minified: false,
                      sourceMaps: false,
                  }).code;
              } else {
                  throw compileError;
              }
          }

          // Pass MarkdownTools into the function scope
          const createComponent = new Function('React', 'Lucide', 'Recharts', 'FramerMotion', 'MarkdownTools', `return ${transpiled}`);
          const GeneratedComponent = createComponent(React, LucideIcons, Recharts, FramerMotion, {
             ReactMarkdown,
             remarkGfm,
             remarkMath,
             rehypeKatex,
             Markdown,
             Latex
          });
          
          setWidgetComponent(() => GeneratedComponent);
          setError(null);
        } catch (err: any) {
          console.error("Dynamic Widget Compilation Error:", err);
          setError(err.message);
          setWidgetComponent(null);
        } finally {
            setIsCompiling(false);
        }
    }, 150);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [code]);

  // Handler for runtime errors caught by ErrorBoundary
  const handleRuntimeError = (err: Error) => {
    setError(`Runtime Error: ${err.message}`);
    setWidgetComponent(null); // Unmount the bad component
  };

  if (error) {
    return (
      <div className="flex flex-col h-full p-6 bg-red-950/30 border border-red-500/20 text-red-200 font-mono text-sm overflow-auto">
        <div className="flex items-center gap-2 mb-4 text-red-400">
           <LucideIcons.AlertCircle size={18} />
           <span className="font-bold uppercase tracking-wider">Widget Error</span>
        </div>
        <p className="bg-black/30 p-4 rounded-lg border border-red-500/10 whitespace-pre-wrap">{error}</p>
        <div className="mt-4 opacity-50">
            <div className="text-xs uppercase tracking-widest mb-1">Source Code</div>
            <pre className="text-xs whitespace-pre-wrap bg-black/50 p-2 rounded border border-white/5">{code}</pre>
        </div>
      </div>
    );
  }

  if (isCompiling || !WidgetComponent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-cyan-400 space-y-4">
        <div className="relative">
            <LucideIcons.Loader2 size={32} className="animate-spin" />
            <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full animate-pulse" />
        </div>
        <span className="text-xs font-mono tracking-widest uppercase opacity-70 animate-pulse">Compiling Interface...</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-slate-900 text-slate-200 relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <WidgetErrorBoundary onError={handleRuntimeError}>
           <WidgetComponent data={data || {}} onUpdate={handleUpdate} {...(data || {})} />
        </WidgetErrorBoundary>
    </div>
  );
};

export default DynamicWidget;
