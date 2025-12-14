import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import LearningPathView from './components/LearningPathView';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  
  const { data: skillGraph } = await supabase
    .from('skill_graphs')
    .select('goal')
    .eq('id', id)
    .single();

  return {
    title: skillGraph?.goal ? `${skillGraph.goal} - EdBox` : 'Learning Path - EdBox',
    description: 'Your personalized learning journey',
  };
}

export default async function LearningPathPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth/login');
  }

  // Fetch skill graph
  const { data: skillGraph, error: graphError } = await supabase
    .from('skill_graphs')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (graphError || !skillGraph) {
    notFound();
  }

  // Fetch learner state
  const { data: learnerState, error: stateError } = await supabase
    .from('learner_states')
    .select('*')
    .eq('skill_graph_id', id)
    .eq('user_id', user.id)
    .single();

  if (stateError || !learnerState) {
    notFound();
  }

  return (
    <LearningPathView 
      skillGraph={skillGraph}
      learnerState={learnerState}
      userId={user.id}
    />
  );
}