/**
 * Widget Persistence Service
 * Saves/loads/updates Pulse widgets to Supabase + localStorage for session resumption.
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { PulseWindow, WindowType } from '../types';

const LOCAL_STORAGE_KEY = 'pulse_widget_bank';

interface SavedWidget {
    id: string;
    widget_type: string;
    widget_title: string;
    widget_data: any;
    created_at: string;
    updated_at: string;
}

// ============= LOCAL STORAGE =============

function getLocalWidgets(sessionId: string): SavedWidget[] {
    try {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${sessionId}`);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setLocalWidgets(sessionId: string, widgets: SavedWidget[]) {
    try {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_${sessionId}`, JSON.stringify(widgets));
    } catch (e) {
        console.warn('Failed to save widgets to localStorage:', e);
    }
}

// ============= SAVE =============

export async function saveWidget(
    userId: string,
    sessionId: string,
    window: PulseWindow
): Promise<void> {
    const widget: SavedWidget = {
        id: window.id,
        widget_type: window.type,
        widget_title: window.title,
        widget_data: window.data || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    // Save to localStorage immediately (fast, offline-resilient)
    const localWidgets = getLocalWidgets(sessionId);
    const existingIdx = localWidgets.findIndex(w => w.id === window.id);
    if (existingIdx >= 0) {
        localWidgets[existingIdx] = { ...localWidgets[existingIdx], ...widget, updated_at: new Date().toISOString() };
    } else {
        localWidgets.push(widget);
    }
    setLocalWidgets(sessionId, localWidgets);

    // Save to DB (async, non-blocking)
    try {
        const supabase = createSupabaseBrowserClient();
        await supabase.from('pulse_widget_bank').upsert({
            id: window.id,
            user_id: userId,
            session_id: sessionId,
            widget_type: window.type,
            widget_title: window.title,
            widget_data: window.data || {},
            updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    } catch (e) {
        console.warn('Failed to save widget to DB:', e);
    }
}

// ============= UPDATE =============

export async function updateSavedWidget(
    userId: string,
    sessionId: string,
    windowId: string,
    newData: any
): Promise<void> {
    // Update localStorage
    const localWidgets = getLocalWidgets(sessionId);
    const idx = localWidgets.findIndex(w => w.id === windowId);
    if (idx >= 0) {
        localWidgets[idx].widget_data = { ...localWidgets[idx].widget_data, ...newData };
        localWidgets[idx].updated_at = new Date().toISOString();
        setLocalWidgets(sessionId, localWidgets);
    }

    // Update DB
    try {
        const supabase = createSupabaseBrowserClient();
        await supabase.from('pulse_widget_bank')
            .update({
                widget_data: localWidgets[idx]?.widget_data || newData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', windowId)
            .eq('user_id', userId);
    } catch (e) {
        console.warn('Failed to update widget in DB:', e);
    }
}

// ============= LOAD =============

export async function loadSessionWidgets(
    userId: string,
    sessionId: string
): Promise<PulseWindow[]> {
    // Try DB first
    try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
            .from('pulse_widget_bank')
            .select('*')
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
            // Sync to localStorage
            const widgets: SavedWidget[] = data.map(d => ({
                id: d.id,
                widget_type: d.widget_type,
                widget_title: d.widget_title,
                widget_data: d.widget_data,
                created_at: d.created_at,
                updated_at: d.updated_at,
            }));
            setLocalWidgets(sessionId, widgets);

            return data.map((d, i) => ({
                id: d.id,
                type: d.widget_type as WindowType,
                title: d.widget_title || d.widget_type,
                data: d.widget_data || {},
                x: 100 + i * 40,
                y: 100 + i * 40,
                width: 600,
                height: 400,
                zIndex: 10 + i,
                isMinimized: false,
            }));
        }
    } catch (e) {
        console.warn('Failed to load widgets from DB, falling back to localStorage:', e);
    }

    // Fallback to localStorage
    const localWidgets = getLocalWidgets(sessionId);
    return localWidgets.map((w, i) => ({
        id: w.id,
        type: w.widget_type as WindowType,
        title: w.widget_title || w.widget_type,
        data: w.widget_data || {},
        x: 100 + i * 40,
        y: 100 + i * 40,
        width: 600,
        height: 400,
        zIndex: 10 + i,
        isMinimized: false,
    }));
}

// ============= DELETE =============

export async function removeWidget(
    userId: string,
    sessionId: string,
    windowId: string
): Promise<void> {
    // Remove from localStorage
    const localWidgets = getLocalWidgets(sessionId).filter(w => w.id !== windowId);
    setLocalWidgets(sessionId, localWidgets);

    // Remove from DB
    try {
        const supabase = createSupabaseBrowserClient();
        await supabase.from('pulse_widget_bank')
            .delete()
            .eq('id', windowId)
            .eq('user_id', userId);
    } catch (e) {
        console.warn('Failed to remove widget from DB:', e);
    }
}

// ============= SESSION PROGRESS =============

export interface SkillSessionProgress {
    id?: string;
    user_id: string;
    skill_id: string;
    graph_id: string;
    curriculum: any;
    current_stage: string;
    topics_covered: string[];
    mastery_signals: Record<string, any>;
    conversation_summary: string;
    status: 'in_progress' | 'completed' | 'paused';
}

export async function getSessionProgress(
    userId: string,
    skillId: string,
    graphId: string
): Promise<SkillSessionProgress | null> {
    try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await supabase
            .from('skill_session_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('skill_id', skillId)
            .eq('graph_id', graphId)
            .single();

        if (error || !data) return null;
        return data as SkillSessionProgress;
    } catch {
        return null;
    }
}

export async function upsertSessionProgress(
    progress: Partial<SkillSessionProgress> & { user_id: string; skill_id: string; graph_id: string }
): Promise<void> {
    try {
        const supabase = createSupabaseBrowserClient();

        // Fetch existing progress to merge topics_covered correctly
        const { data: existing } = await supabase
            .from('skill_session_progress')
            .select('topics_covered, mastery_signals, current_stage')
            .eq('user_id', progress.user_id)
            .eq('skill_id', progress.skill_id)
            .eq('graph_id', progress.graph_id)
            .single();

        // Merge topics_covered: append new topics, avoid duplicates
        const existingTopics: string[] = existing?.topics_covered || [];
        const newTopics: string[] = progress.topics_covered || [];
        const mergedTopics = Array.from(new Set([...existingTopics, ...newTopics]));
        const addedTopics = newTopics.filter(t => !existingTopics.includes(t));

        // Merge mastery_signals
        const existingSignals = existing?.mastery_signals || {};
        const mergedSignals = { ...existingSignals, ...(progress.mastery_signals || {}) };

        await supabase.from('skill_session_progress').upsert(
            {
                ...progress,
                topics_covered: mergedTopics,
                mastery_signals: mergedSignals,
                status: progress.status || 'in_progress',
                last_activity_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,skill_id,graph_id' }
        );

        // Fire-and-forget: Log events + award XP for each newly covered topic
        if (addedTopics.length > 0) {
            const xpGained = addedTopics.length * 10;

            // Log each topic as an event
            supabase.from('pulse_session_events').insert(
                addedTopics.map(topic => ({
                    user_id: progress.user_id,
                    skill_id: progress.skill_id,
                    graph_id: progress.graph_id,
                    event_type: 'topic_completed',
                    event_data: { topic, stage: progress.current_stage || existing?.current_stage || 'Foundation' },
                }))
            ).then();

            // Award XP via atomic DB function (no overwrite risk)
            supabase.rpc('increment_user_xp', {
                p_user_id: progress.user_id,
                p_graph_id: progress.graph_id,
                p_xp_delta: xpGained,
            }).then();
        }

        // Log stage advance event
        if (progress.current_stage && existing?.current_stage && progress.current_stage !== existing.current_stage) {
            supabase.from('pulse_session_events').insert({
                user_id: progress.user_id,
                skill_id: progress.skill_id,
                graph_id: progress.graph_id,
                event_type: 'stage_advanced',
                event_data: {
                    from_stage: existing.current_stage,
                    to_stage: progress.current_stage,
                },
            }).then();
        }

    } catch (e) {
        console.warn('Failed to upsert session progress:', e);
    }
}

