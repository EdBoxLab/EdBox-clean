export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface Section {
  id: string;
  name: string;
  icon?: any; // Consider a more specific type if you have a set of icons
}
