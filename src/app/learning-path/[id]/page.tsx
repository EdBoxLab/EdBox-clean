// src/app/learning-path/[id]/page.tsx
import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server'; // SSR client
import SkillGraphRenderer from './SkillGraphRenderer';
import { SkillGraph, Challenge } from '@/lib/courseCreation/types';

interface Props {
  params: { id: string };
}

export default async function LearningPathPage({ params }: Props) {
  const { id } = params;

  if (!id) {
    return <div className="text-white">Invalid skill graph ID.</div>;
  }

  // ⚡ Await the async Supabase client
  const supabase = await createServerSupabaseClient();

  // Fetch skill graph
  const { data: graphDataRaw, error: graphError } = await supabase
    .from('skill_graphs')
    .select('*')
    .eq('id', id)
    .single();

  if (graphError || !graphDataRaw) {
    console.error('Supabase error:', graphError);
    return <div className="text-white">Skill graph not found.</div>;
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <SkillGraphRenderer graph={graphData} challenges={challengesMap} />
    </div>
  );
}
