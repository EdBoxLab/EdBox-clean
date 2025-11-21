export enum ToolType {
  SOLVER = 'SOLVER',
  GRAPH = 'GRAPH',
  GEOMETRY = 'GEOMETRY',
  STATISTICS = 'STATISTICS',
  SETTINGS = 'SETTINGS'
}

export interface Point {
  x: number;
  y: number;
}

export interface GeometryElement {
  type: 'circle' | 'line' | 'point' | 'polygon' | 'text';
  params: number[]; // [cx, cy, r] or [x1, y1, x2, y2] etc.
  label?: string;
  color?: string;
}

export interface MathSolution {
  originalProblem: string;
  summary: string;
  steps: string[];
  plotData?: Point[];
  plotType?: 'line' | 'scatter' | 'bar';
  geometryElements?: GeometryElement[];
  relatedTopics?: string[];
  axisConfig?: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    xLabel: string;
    yLabel: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AppState {
  currentTool: ToolType;
  isSidebarCollapsed: boolean;
  isLoading: boolean;
}