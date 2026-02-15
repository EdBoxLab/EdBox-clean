export interface InteractionEvent {
  timestamp: number;
  type: 'click' | 'type' | 'draw' | 'scroll' | 'select' | 'update' | 'command';
  widgetId?: string;
  widgetType?: string;
  details: string;
}

class InteractionTracker {
  private events: InteractionEvent[] = [];
  private maxHistory = 100;

  /**
   * Logs a user interaction.
   */
  log(event: Omit<InteractionEvent, 'timestamp'>) {
    const entry: InteractionEvent = { ...event, timestamp: Date.now() };
    this.events.push(entry);
    
    // Keep history manageable
    if (this.events.length > this.maxHistory) {
      this.events.shift();
    }
    
    // Optional: Dev logging
    // console.debug('[Tracker]', entry.type, entry.details);
  }

  /**
   * Returns a natural language summary of recent user actions for the AI.
   */
  getContextSummary(): string {
    if (this.events.length === 0) return "User has been idle.";

    // Grouping consecutive similar events to reduce noise
    // e.g. "Typed 'h'", "Typed 'he'", "Typed 'hel'" -> "Typed content in NoteWriter"
    
    const summary = this.events.slice(-20).map(e => {
        const time = new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return `[${time}] ${e.type.toUpperCase()} in ${e.widgetType || 'System'}: ${e.details}`;
    }).join('\n');

    return `RECENT USER INTERACTIONS:\n${summary}`;
  }

  /**
   * Clears history (e.g., on new session)
   */
  clear() {
      this.events = [];
  }
}

export const interactionTracker = new InteractionTracker();