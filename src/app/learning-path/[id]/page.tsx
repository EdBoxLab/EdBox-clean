import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SkillGraph, Challenge } from '@/lib/courseCreation/types';
import SkillGraphWrapper from './SkillGraphWrapper';
import { NavigationTracker } from '@/components/NavigationTracker';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function LearningPathPage({ params }: Props) {
  const { id } = await params;

  if (!id) {
    return <div className="text-white p-8">Invalid skill graph ID.</div>;
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return (
        <div className="text-white p-8">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400">Please log in to view your learning paths.</p>
        </div>
      );
    }

    // Fetch skill graph for this specific user
    const { data: graphDataRaw, error: graphError } = await supabase
      .from('skill_graphs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (graphError || !graphDataRaw) {
      console.error('Supabase error:', graphError);
      return (
        <div className="text-white p-8">
          <h1 className="text-2xl font-bold mb-4">Learning Path Not Found</h1>
          <p className="text-gray-400">
            {graphError?.code === 'PGRST116'
              ? 'This learning path does not exist or you do not have access to it.'
              : `Error: ${graphError?.message || 'Unknown error'}`
            }
          </p>
          <p className="text-gray-500 mt-2">ID: {id}</p>
          <div className="mt-4">
            <a
              href="/learning-path"
              className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
            >
              Browse Learning Paths
            </a>
          </div>
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

    return (
      <NavigationTracker title="Learning Path">
        <SkillGraphWrapper graph={graphData} challenges={challengesMap} />
      </NavigationTracker>
    );
  } catch (error) {
    console.error('Unexpected error in LearningPathPage:', error);
    return (
      <div className="text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-400">
          We encountered an unexpected error while loading the learning path.
        </p>
      </div>
    );
  }
}
