'use client';

import React, { useEffect, useState } from 'react';
import { PulseWindow } from '../../types';
import { SkillGraph, Challenge } from '@/lib/courseCreation/types';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const SkillGraphRenderer = dynamic(() => import('@/app/learning-path/[id]/SkillGraphRenderer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
    </div>
  ),
});

interface SkillGraphWidgetProps {
  window: PulseWindow;
}

const SkillGraphWidget: React.FC<SkillGraphWidgetProps> = ({ window: pulseWindow }) => {
  const [graph, setGraph] = useState<SkillGraph | null>(null);
  const [challenges, setChallenges] = useState<Record<string, Challenge>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const graphId = pulseWindow.data?.graphId || pulseWindow.metadata?.graphId;

  useEffect(() => {
    if (!graphId) {
      setError('No graph ID provided');
      setLoading(false);
      return;
    }

    fetchGraph();
  }, [graphId]);

  const fetchGraph = async () => {
    try {
      const supabase = createSupabaseBrowserClient();

      const { data: graphData, error: graphError } = await supabase
        .from('skill_graphs')
        .select('*')
        .eq('id', graphId)
        .single();

      if (graphError) throw graphError;

      setGraph(graphData as SkillGraph);

      const skillIds = graphData.nodes?.map((n: any) => n.id) || [];
      if (skillIds.length > 0) {
        const { data: challengesData } = await supabase
          .from('challenges')
          .select('*')
          .in('skill_id', skillIds);

        const challengesMap: Record<string, Challenge> = {};
        (challengesData || []).forEach((c: any) => {
          challengesMap[c.skill_id] = c;
        });
        setChallenges(challengesMap);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (error || !graph) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 p-4 text-center">
        <div>
          <p className="font-semibold mb-2">Unable to load learning path</p>
          <p className="text-sm text-slate-400">{error || 'Graph not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-slate-950">
      <SkillGraphRenderer graph={graph} challenges={challenges} />
    </div>
  );
};

export default SkillGraphWidget;
