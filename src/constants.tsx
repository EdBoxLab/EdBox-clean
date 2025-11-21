
import React from 'react';
import type { Section } from './app/ide/types';

// SVG Icons (Heroicons)
const FolderIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0A2.25 2.25 0 013.75 7.5h16.5a2.25 2.25 0 012.25 2.25m-18.75 0h18.75v.006c.01.01.017.022.024.034l.02.036a.75.75 0 01-.718.97l-17.21-.002a.75.75 0 01-.718-.97l.02-.036a.243.243 Svg 0 01.024-.034V9.776z" />
    </svg>
);

const CodeBracketIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
);

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
);

const SourceControlIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
    </svg>
);

const PuzzlePieceIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.75a4.5 4.5 0 0 1-4.5 4.5H6.75a4.5 4.5 0 0 1-4.5-4.5m14.25 0a4.5 4.5 0 0 0-4.5 4.5v3.75a4.5 4.5 0 0 0 4.5 4.5h3.75a4.5 4.5 0 0 0 4.5-4.5v-3.75a4.5 4.5 0 0 0-4.5-4.5h-3.75Zm-14.25 0h3.75a4.5 4.5 0 0 1 4.5 4.5v3.75a4.5 4.5 0 0 1-4.5 4.5h-3.75a4.5 4.5 0 0 1-4.5-4.5v-3.75a4.5 4.5 0 0 1 4.5-4.5Z" /></svg>
);

const UserGroupIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m-7.5-2.962A3.75 3.75 0 0 1 9 10.5V9A3.75 3.75 0 0 1 12.75 5.25a3.75 3.75 0 0 1 3.75 3.75v1.5m-7.5 4.5a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h1.5a3 3 0 0 1 3 3v1.5a3 3 0 0 1-3 3H9Zm-9 4.5h10.5a1.5 1.5 0 0 0 1.5-1.5V18a1.5 1.5 0 0 0-1.5-1.5H1.5A1.5 1.5 0 0 0 0 18v1.5a1.5 1.5 0 0 0 1.5 1.5ZM12.75 10.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>
);

// Wrapper components with correct prop types for Section interface
const FolderIconComponent: React.ComponentType<{ size?: number | string; stroke?: number | string; className?: string }> = (props) => FolderIcon(props as React.SVGProps<SVGSVGElement>);
const CodeBracketIconComponent: React.ComponentType<{ size?: number | string; stroke?: number | string; className?: string }> = (props) => CodeBracketIcon(props as React.SVGProps<SVGSVGElement>);
const SourceControlIconComponent: React.ComponentType<{ size?: number | string; stroke?: number | string; className?: string }> = (props) => SourceControlIcon(props as React.SVGProps<SVGSVGElement>);
const PuzzlePieceIconComponent: React.ComponentType<{ size?: number | string; stroke?: number | string; className?: string }> = (props) => PuzzlePieceIcon(props as React.SVGProps<SVGSVGElement>);
const UserGroupIconComponent: React.ComponentType<{ size?: number | string; stroke?: number | string; className?: string }> = (props) => UserGroupIcon(props as React.SVGProps<SVGSVGElement>);
const SparklesIconComponent: React.ComponentType<{ size?: number | string; stroke?: number | string; className?: string }> = (props) => SparklesIcon(props as React.SVGProps<SVGSVGElement>);

export const SECTIONS: Section[] = [
    { id: 'projects', name: 'Projects', icon: FolderIconComponent },
    { id: 'editor', name: 'Editor', icon: CodeBracketIconComponent },
    { id: 'source-control', name: 'Source Control', icon: SourceControlIconComponent },
    { id: 'extensions', name: 'Extensions', icon: PuzzlePieceIconComponent },
    { id: 'collaboration', name: 'Collaboration Hub', icon: UserGroupIconComponent },
    { id: 'ai-assistant', name: 'Genie AI Assistant', icon: SparklesIconComponent },
];


// Documentation context for Genie AI
export const IDE_COMPONENTS = [
    { name: 'Multi-Project Workspace', description: 'A unified view that aggregates all subject-specific engines (Physics, Chemistry, etc.) into a single, manageable workspace.' },
    { name: 'Interactive Canvas', description: 'A core, extensible component for visualizing and interacting with engine outputs, from physics simulations to art canvases.' },
    { name: 'Genie AI Assistant', description: 'Gemini-powered contextual help, code generation, debugging, and content creation, deeply integrated into the developer workflow.' },
    { name: 'Collaboration Hub', description: 'Features for real-time co-editing, educator dashboards for monitoring student progress, and instant student preview modes.' },
    { name: 'Plugin & Module System', description: 'An API-driven system that allows new engines and tools to be added seamlessly, ensuring the IDE is future-proof and extensible.' },
    { name: 'Cross-Platform Core', description: 'Built with web technologies (Electron/Tauri for desktop) to ensure a consistent experience across Web, Desktop, and Mobile.' },
];

export const CONNECTION_COMPONENTS = [
    { name: 'Unified GraphQL API', description: 'A single, federated GraphQL endpoint provides a consistent way for the frontend IDE and Genie to interact with all backend engines.' },
    { name: 'Modular Monorepo', description: 'Each engine is a separate package within a monorepo, facilitating code sharing, dependency management, and independent deployment.' },
    { name: 'Realtime Fabric', description: 'A WebSocket/WebRTC layer that enables instantaneous data flow between users, engines, and the Genie orchestration layer.' },
    { name: 'Adaptive Orchestration Layer', description: 'Genie can monitor events across all engines via the realtime fabric, providing context-aware prompts and feedback consistently.' },
    { name: 'Secure Sandbox', description: 'Engines run in isolated environments (e.g., WebAssembly, sandboxed iframes) to ensure security and prevent interference.' },
    { name: 'Scalable Cloud Infrastructure', description: 'Designed for cloud-native deployment (e.g., Kubernetes on GCP/AWS) to handle dynamic scaling and global distribution.' },
];

export const TECH_STACK = [
  { name: 'VS Code Extensions API', description: 'Build the IDE on a proven, extensible foundation.', category: 'IDE & Monorepo' },
  { name: 'Nx / Turborepo', description: 'Manage the multi-engine system as a monorepo.', category: 'IDE & Monorepo' },
  { name: 'React + TypeScript', description: 'The core of the IDE\'s UI.', category: 'Frontend & Visualization' },
  { name: 'WebGL / Three.js / R3F', description: 'Power the interactive canvases.', category: 'Frontend & Visualization' },
  { name: 'GraphQL Federation', description: 'A unified API layer.', category: 'API & Backend' },
  { name: 'Node.js / NestJS', description: 'The backend framework for GraphQL services.', category: 'API & Backend' },
  { name: 'WebSockets / WebRTC', description: 'The realtime fabric for low-latency communication.', category: 'Realtime & Collaboration' },
  { name: 'Y.js / Liveblocks', description: 'Conflict-free Replicated Data Types (CRDTs) for co-editing.', category: 'Realtime & Collaboration' }
];
