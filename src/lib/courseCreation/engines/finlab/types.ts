export enum ModuleType {
  DASHBOARD = 'Dashboard',
  ACCOUNTING = 'Accounting',
  CORP_FINANCE = 'CorpFinance',
  INVESTMENTS = 'Investments',
  AI_TUTOR = 'AITutor'
}

export interface FinancialMetric {
  label: string;
  value: number;
  unit: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export interface CashFlow {
  year: number;
  amount: number;
}

export interface BalanceSheetItem {
  id: string;
  name: string;
  amount: number;
  category: 'asset' | 'liability' | 'equity';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isAudio?: boolean;
  audioData?: ArrayBuffer; // Raw PCM data if available
}

export interface StockPoint {
  date: string;
  price: number;
  volume: number;
}