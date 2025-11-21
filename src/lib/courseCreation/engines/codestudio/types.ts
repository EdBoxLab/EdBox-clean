export enum Language {
  JavaScript = 'javascript',
  Python = 'python',
  TypeScript = 'typescript',
  HTML = 'html',
  SQL = 'sql'
}

export enum VisualizationMode {
  None = 'none',
  Chart = 'chart',
  DOM = 'dom',
  Network = 'network'
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'error' | 'warn' | 'system';
  content: string;
}

export interface ChartDataPoint {
  name: string | number;
  value: number;
  [key: string]: any;
}

export interface SceneDefinition {
  id: string;
  name: string;
  description: string;
  language: Language;
  code: string;
  defaultViz: VisualizationMode;
}