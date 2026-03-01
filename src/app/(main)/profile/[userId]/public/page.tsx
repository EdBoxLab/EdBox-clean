import { createClient } from '@supabase/supabase-js';
import SkillRadarChart from '@/components/profile/SkillRadarChart';
import ActivityHeatmap from '@/components/profile/ActivityHeatmap';
import SkillDomainCard from '@/components/profile/SkillDomainCard';
import { Brain, BookOpen, Trophy, Zap } from 'lucide-react';
import { Metadata } from 'next';

interface Props {
    params: { userId: string };
}

// Server-side anon client for public data
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getPublicKnowledgeGraph(userId: string) {
    // Read from the persisted knowledge_graphs table (public read via RLS)
    const [
        { data: profile },
        { data: xpData },
        { data: knowledgeGraph },
        { data: progressRecords }
    ] = await Promise.all([
        supabase.from('profiles').select('full_name, avatar_url, bio, learning_goal').eq('user_id', userId).single(),
        supabase.from('user_xp').select('total_xp, level').eq('user_id', userId).single(),
        supabase.from('knowledge_graphs').select('*').eq('user_id', userId).single(),
        supabase.from('skill_session_progress').select('topics_covered').eq('user_id', userId)
    ]);

    const topicsMastered = (progressRecords || []).reduce((s: number, p: any) => s + (p.topics_covered?.length || 0), 0);

    return {
        profile,
        xp: xpData,
        domains: knowledgeGraph?.domains || [],
        radarLabels: knowledgeGraph?.radar_labels || [],
        radarValues: knowledgeGraph?.radar_values || [],
        activityTimeline: knowledgeGraph?.activity_timeline || [],
        totalEvidencePoints: knowledgeGraph?.total_evidence_points || 0,
        overallCVScore: knowledgeGraph?.overall_cv_score || 0,
        topicsMastered,
    };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('user_id', params.userId).single();
    const name = profile?.full_name || 'A Learner';
    return {
        title: `${name}'s Knowledge Graph — EdBox`,
        description: `View ${name}'s verified knowledge graph and learning evidence, powered by EdBox Genie.`,
        openGraph: {
            title: `${name}'s Knowledge Graph — EdBox`,
            description: `Verified skills and learning evidence from interactive learning sessions.`,
        }
    };
}

export default async function PublicProfilePage({ params }: Props) {
    const data = await getPublicKnowledgeGraph(params.userId);

    const displayName = data.profile?.full_name || 'Learner';
    const avatar = data.profile?.avatar_url;

    return (
        <div className="min-h-screen bg-[#09090b] p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-800 rounded-2xl border border-slate-700 flex items-center justify-center overflow-hidden">
                            {avatar ? (
                                avatar.length <= 2
                                    ? <span className="text-3xl">{avatar}</span>
                                    : <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <Brain className="w-7 h-7 text-slate-500" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">{displayName}</h1>
                            {data.profile?.learning_goal && (
                                <p className="text-blue-400 text-xs mt-0.5">🎯 {data.profile.learning_goal}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-slate-600 uppercase tracking-wider">CV Score</div>
                        <div className="text-2xl font-bold text-white">{data.overallCVScore}<span className="text-slate-500 text-sm font-normal">%</span></div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Level', value: `${data.xp?.level || 1}`, icon: Zap, color: 'text-amber-400' },
                        { label: 'Topics Mastered', value: data.topicsMastered, icon: BookOpen, color: 'text-blue-400' },
                        { label: 'Evidence Points', value: data.totalEvidencePoints, icon: Trophy, color: 'text-emerald-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-[#0F172A] border border-slate-800 rounded-xl p-4 text-center">
                            <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                            <div className="text-lg font-bold text-white">{value}</div>
                            <div className="text-[10px] text-slate-600">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Knowledge Graph */}
                <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-800">
                        <h2 className="text-sm font-semibold text-white">Knowledge Graph · Verified by Genie</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{data.totalEvidencePoints} verified interactions across {data.domains.length} domains</p>
                    </div>

                    {data.domains.length > 0 ? (
                        <div className="p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="flex flex-col items-center">
                                    <SkillRadarChart labels={data.radarLabels} values={data.radarValues} size={260} />
                                </div>
                                <div>
                                    <ActivityHeatmap data={data.activityTimeline} />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {data.domains.map((domain: any) => (
                                    <SkillDomainCard key={domain.graphId} name={domain.name} domainScore={domain.domainScore} skills={domain.skills} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
                            No public skill data available yet
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-slate-700">
                    <span>Built on </span>
                    <a href="/" className="text-blue-500 hover:text-blue-400">EdBox</a>
                    <span> · Knowledge Graph powered by EdBox AI sessions</span>
                </div>
            </div>
        </div>
    );
}
