/**
 * Widget Telemetry Service
 * 
 * Persists all widget interaction events to `pulse_session_events` in Supabase.
 * This is the foundation of the Skill Graph CV — every interaction is evidence.
 * 
 * Design principles:
 * - Fire-and-forget: NEVER await or block the UI
 * - Fail silently: telemetry errors must never surface to the user
 * - Context-aware: events are scoped to the active skill session
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export type WidgetEventType =
    | 'learning_signal'        // Genie-observed understanding quality
    | 'widget_opened'          // User opened a widget
    | 'widget_closed'          // User closed/minimized a widget (includes dwell time)
    | 'blackboard_read'        // User spent time reading Blackboard content
    | 'blackboard_drawn'       // User drew on the Blackboard canvas
    | 'code_typed'             // User typed in CodeEditor
    | 'code_executed'          // User ran code in CodeEditor
    | 'note_written'           // User typed in NoteWriter
    | 'note_previewed'         // User switched to preview mode in NoteWriter
    | 'neuron_manipulated'     // User adjusted weights/inputs in NeuronVisualizer
    | 'custom_widget_interaction' // User interacted with an AI-generated custom widget
    | 'study_kit_interacted'   // User interacted with a study kit card/quiz
    | 'skill_graph_navigated'  // User navigated through the skill graph
    | 'skill_session_started'  // User clicked "Start Learning with Genie"
    | 'skill_session_resumed'  // User resumed a previous skill session
    | 'genie_message_sent'     // User sent a message to Genie (engagement signal)
    | 'widget_dwell';          // Aggregate dwell time summary on close

export interface WidgetTelemetryEvent {
    event_type: WidgetEventType;
    skill_id?: string;
    graph_id?: string;
    widget_type?: string;
    event_data?: Record<string, any>;
}

interface ActiveSession {
    userId: string;
    skillId: string;
    graphId: string;
}

// Singleton to track the active skill session context
let activeSession: ActiveSession | null = null;

// Track widget open times for dwell calculation
const widgetOpenTimes: Map<string, number> = new Map();

// Track interaction counts per widget for the current session
const widgetInteractionCounts: Map<string, number> = new Map();

export const widgetTelemetry = {
    /**
     * Set the active skill session context.
     * All events fired after this will be tagged with these IDs.
     */
    setSession(userId: string, skillId: string, graphId: string) {
        activeSession = { userId, skillId, graphId };
        widgetOpenTimes.clear();
        widgetInteractionCounts.clear();
    },

    clearSession() {
        activeSession = null;
    },

    /**
     * Track when a widget is opened (for dwell calculation)
     */
    onWidgetOpened(windowId: string, widgetType: string) {
        widgetOpenTimes.set(windowId, Date.now());
        widgetInteractionCounts.set(windowId, 0);
        this.fire({ event_type: 'widget_opened', widget_type: widgetType });
    },

    /**
     * Track when a widget is closed/minimized.
     * Automatically computes dwell time and interaction count.
     */
    onWidgetClosed(windowId: string, widgetType: string) {
        const openTime = widgetOpenTimes.get(windowId);
        const interactions = widgetInteractionCounts.get(windowId) || 0;
        const dwellSeconds = openTime ? Math.round((Date.now() - openTime) / 1000) : 0;

        widgetOpenTimes.delete(windowId);
        widgetInteractionCounts.delete(windowId);

        if (dwellSeconds > 3) { // Only log if they were actually on it
            this.fire({
                event_type: 'widget_dwell',
                widget_type: widgetType,
                event_data: {
                    dwell_seconds: dwellSeconds,
                    interactions_count: interactions
                }
            });
        }
    },

    /**
     * Log an interaction on a specific widget (increments interaction count)
     */
    onWidgetInteraction(windowId: string, widgetType: string, eventType: WidgetEventType, data?: Record<string, any>) {
        // Increment interaction count for this widget
        const current = widgetInteractionCounts.get(windowId) || 0;
        widgetInteractionCounts.set(windowId, current + 1);

        this.fire({ event_type: eventType, widget_type: widgetType, event_data: data });
    },

    /**
     * Fire a learning signal from Genie (called from App.tsx handleToolCall)
     */
    onLearningSignal(args: {
        signal_type: string;
        topic: string;
        confidence: number;
        depth?: number;
        attempts?: number;
        widgets_used?: string;
        note?: string;
    }) {
        this.fire({
            event_type: 'learning_signal',
            event_data: args
        });
    },

    /**
     * Fire-and-forget event insert to Supabase
     */
    fire(event: WidgetTelemetryEvent) {
        if (!activeSession) return; // No active skill session, skip

        const { userId, skillId, graphId } = activeSession;
        const supabase = createSupabaseBrowserClient();

        void (async () => {
            try {
                await supabase.from('pulse_session_events').insert({
                    user_id: userId,
                    skill_id: event.skill_id || skillId,
                    graph_id: event.graph_id || graphId,
                    event_type: event.event_type,
                    event_data: {
                        widget_type: event.widget_type,
                        ...event.event_data
                    }
                });
            } catch { /* silently fail — NEVER block UI */ }
        })();
    }
};
