// src/app/learning-path/[id]/page.tsx
import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import SkillGraphRenderer from './SkillGraphRenderer';
import { SkillGraph, Challenge } from '@/lib/courseCreation/types';

interface Props {
  params: Promise<{ id: string }>; // params is now a Promise
}

export default async function LearningPathPage({ params }: Props) {
  // Await params first
  const { id } = await params;

  if (!id) {
    return <div className="text-white p-8">Invalid skill graph ID.</div>;
  }

  // Await the async Supabase client
  const supabase = await createServerSupabaseClient();

  // Fetch skill graph
  const { data: graphDataRaw, error: graphError } = await supabase
    .from('skill_graphs')
    .select('*')
    .eq('id', id)
    .single();

  if (graphError || !graphDataRaw) {
    console.error('Supabase error:', graphError);
    return (
      <div className="text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Skill graph not found</h1>
        <p className="text-gray-400">Error: {graphError?.message || 'Unknown error'}</p>
        <p className="text-gray-500 mt-2">ID: {id}</p>
      </div>
    );
  }

  const graphData: SkillGraph = graphDataRaw as SkillGraph;

  // Fetch challenges for the nodes
  const skillIds = graphData.nodes.map((n: any) => n.id);
  const { data: challengesRaw } = await supabase
    .from('challenges')
    .select('*')
    .in('skill_id', skillIds);

  const challengesData: Challenge[] = (challengesRaw as Challenge[]) || [];
  const challengesMap: Record<string, Challenge> = {};
  challengesData.forEach((c) => (challengesMap[c.skillId] = c));

  return <SkillGraphRenderer graph={graphData} challenges={challengesMap} />;
}