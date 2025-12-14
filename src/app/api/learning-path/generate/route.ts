'use server';

import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { generateSkillGraph } from './ai/generateSkillGraph';
import { LearningContext } from './types/enums';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { randomUUID } from 'crypto';

/**
 * Types
 */
interface SkillNode {
  id: string;
  name: string;
  prereqs: string[];
}

interface ProjectNode {
  id: string;
  name: string;
  skills: string[];
  estimatedMinutes?: number;
  xpReward?: number;
  engine?: string;
}

interface SkillGraphData {
  skillPaths: SkillNode[];
  miniProjects: ProjectNode[];
  capstoneProject: ProjectNode;
}

/**
 * Template helpers
 */
function getTemplates(domain: string): string[] {
  const templatesDir = path.join(process.cwd(), 'src/app/api/coursecreation/templates');
  if (!fs.existsSync(templatesDir)) return [];
  return fs
    .readdirSync(templatesDir)
    .filter((f) => f.endsWith('.md') && f.toLowerCase().includes(domain.toLowerCase()))
    .map((f) => path.join(templatesDir, f));
}

function selectBestTemplate(domain: string): string | undefined {
  const matches = getTemplates(domain);
  if (matches.length === 0) return undefined;
  return matches.reduce((best, current) => {
    const bestLength = fs.readFileSync(best, 'utf-8').length;
    const currentLength = fs.readFileSync(current, 'utf-8').length;
    return currentLength > bestLength ? current : best;
  }, matches[0]);
}

/**
 * Validation & normalization
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validateAlternateSchema(payload: any): boolean {
  return (
    isObject(payload) &&
    Array.isArray(payload.skills) &&
    Array.isArray(payload.projects) &&
    payload.skills.every(
      (s: any) =>
        isObject(s) &&
        typeof s.id === 'string' &&
        typeof s.name === 'string' &&
        Array.isArray(s.prereqs)
    ) &&
    payload.projects.every(
      (p: any) =>
        isObject(p) &&
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        Array.isArray(p.skills)
    )
  );
}

function validateExpectedSchema(payload: any): boolean {
  return (
    isObject(payload) &&
    Array.isArray(payload.skillPaths) &&
    Array.isArray(payload.miniProjects) &&
    isObject(payload.capstoneProject) &&
    payload.skillPaths.every(
      (s: any) =>
        isObject(s) &&
        typeof s.id === 'string' &&
        typeof s.name === 'string' &&
        Array.isArray(s.prereqs)
    ) &&
    payload.miniProjects.every(
      (p: any) =>
        isObject(p) &&
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        Array.isArray(p.skills)
    ) &&
    typeof (payload.capstoneProject as any).id === 'string' &&
    typeof (payload.capstoneProject as any).name === 'string' &&
    Array.isArray((payload.capstoneProject as any).skills)
  );
}

function normalizeSkillGraph(raw: any): SkillGraphData {
  if (validateExpectedSchema(raw)) {
    return raw as SkillGraphData;
  }

  if (validateAlternateSchema(raw)) {
    const skillPaths: SkillNode[] = (raw.skills as any[]).map((s) => ({
      id: String(s.id),
      name: String(s.name),
      prereqs: Array.isArray(s.prereqs) ? (s.prereqs as string[]) : [],
    }));

    const miniProjects: ProjectNode[] = (raw.projects as any[]).map((p) => ({
      id: String(p.id),
      name: String(p.name),
      skills: Array.isArray(p.skills) ? (p.skills as string[]) : [],
    }));

    const capstoneProject: ProjectNode =
      miniProjects.length > 0
        ? miniProjects[miniProjects.length - 1]
        : {
            id: 'CAP-001',
            name: 'Integrated Capstone Project',
            skills: Array.from(
              new Set(
                skillPaths
                  .map((s) => s.id)
                  .concat(skillPaths.reduce<string[]>((acc, s) => acc.concat(s.prereqs), []))
              )
            ),
          };

    return { skillPaths, miniProjects, capstoneProject };
  }

  throw new Error('Failed to obtain valid skill graph from AI. Details: Extracted JSON failed validation.');
}

/**
 * POST handler
 */
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const body: {
      goal: string;
      context: LearningContext;
      templatePath?: string;
      user_id?: string;
      timeAvailable?: string;
      uploadedFile?: { name: string; content: string } | null;
    } = await req.json();

    const { goal, context } = body;

    // Prefer authenticated user from Supabase, fallback to provided user_id
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    const effectiveUserId = !userError && user?.id ? user.id : body.user_id ?? '';

    if (!goal || !context || !effectiveUserId) {
      return NextResponse.json(
        { success: false, error: 'Missing goal, context, or user_id' },
        { status: 400 }
      );
    }

    // Choose template (optional)
    const chosenTemplatePath = body.templatePath || selectBestTemplate(String(context));

    // --- FIX: pass 3 arguments to generateSkillGraph ---
    const rawSkillGraph = await generateSkillGraph(goal, String(context), chosenTemplatePath);

    // Normalize to expected schema
    const skillGraphData: SkillGraphData = normalizeSkillGraph(rawSkillGraph);

    // Compute total hours (1 hour per skill node)
    const totalHours = (skillGraphData.skillPaths ?? []).length;

    // Build nodes
    const nodes: any[] = [
      ...skillGraphData.skillPaths.map((s) => ({ 
        id: s.id, 
        name: s.name, 
        type: 'skill',
        estimatedMinutes: s.estimatedMinutes || 0,
        xpReward: s.xpReward || 0,
        engine: s.engine
      })),
      ...skillGraphData.miniProjects.map((p) => ({ 
        id: p.id, 
        name: p.name, 
        type: 'miniProject',
        estimatedMinutes: p.estimatedMinutes || 0,
        xpReward: p.xpReward || 0,
        engine: p.engine
      })),
      { 
        id: skillGraphData.capstoneProject.id, 
        name: skillGraphData.capstoneProject.name, 
        type: 'capstone',
        estimatedMinutes: skillGraphData.capstoneProject.estimatedMinutes || 0,
        xpReward: skillGraphData.capstoneProject.xpReward || 0,
        engine: skillGraphData.capstoneProject.engine
      },
    ];

    // Build edges
    const edges: any[] = [
      ...skillGraphData.skillPaths.flatMap((s) => (s.prereqs || []).map((pr) => ({ from: pr, to: s.id }))),
      ...skillGraphData.miniProjects.flatMap((p) => (p.skills || []).map((sId) => ({ from: sId, to: p.id }))),
      ...(skillGraphData.capstoneProject.skills || []).map((sId) => ({
        from: sId,
        to: skillGraphData.capstoneProject.id,
      })),
    ];

    // Persist graph
    const savedId = randomUUID();

    const { error: insertError } = await supabase.from('skill_graphs').insert([
      {
        id: savedId,
        user_id: effectiveUserId,
        goal,
        nodes,
        edges,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error('❌ Supabase insert error:', insertError);
      return NextResponse.json({ success: false, error: 'Failed to save learning path' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      skillGraph: {
        id: savedId,
        skillPaths: skillGraphData.skillPaths,
        miniProjects: skillGraphData.miniProjects,
        capstoneProject: skillGraphData.capstoneProject,
      },
      totalHours,
      templateUsed: chosenTemplatePath ?? 'none',
    });
  } catch (err: any) {
    const msg = typeof err?.message === 'string' ? err.message : 'Unknown error';
    console.error('Learning path generation failed:', msg);
    return NextResponse.json({ success: false, error: 'Failed to generate learning path' }, { status: 500 });
  }
}
