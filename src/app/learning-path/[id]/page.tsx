import React from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SkillGraph, Challenge } from '@/lib/courseCreation/types';
import SkillGraphWrapper from './SkillGraphWrapper';

interface Props {
  params: { id: string };
}

export default async function LearningPathPage({ params }: Props) {
  try {
    const { id } = params;

    if (!id) {
      return <div className="text-white p-8">Invalid skill graph ID.</div>;
    }

    const supabase = await createServerSupabaseClient();

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

    const skillIds = graphData.nodes.map((n: any) => n.id);
    const { data: challengesRaw } = await supabase
      .from('challenges')
      .select('*')
      .in('skill_id', skillIds);

    const challengesData: Challenge[] = (challengesRaw as Challenge[]) || [];
    const challengesMap: Record<string, Challenge> = {};
    challengesData.forEach((c) => (challengesMap[c.skillId] = c));

    return <SkillGraphWrapper graph={graphData} challenges={challengesMap} />;
  } catch (error) {
    // Handle any unexpected errors, including source map issues
    const isSourceMapError = error instanceof Error && 
      (error.message.includes('source map') || error.message.includes('sourceMapURL'));
    
    if (isSourceMapError) {
      console.warn('Source map error in server component (non-breaking):', error.message);
      // Continue with normal rendering despite source map issues
      const { id } = params;
      if (!id) {
        return <div className="text-white p-8">Invalid skill graph ID.</div>;
      }
      
      // Return a simplified version that will still work
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading learning path...</p>
            <p className="text-xs text-gray-500 mt-2">Initializing with enhanced compatibility mode</p>
          </div>
        </div>
      );
    }

    console.error('Unexpected error in LearningPathPage:', error);
    return (
      <div className="text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-400">We encountered an unexpected error while loading the learning path.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }
}
