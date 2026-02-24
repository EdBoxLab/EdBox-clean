import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Crown, CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import { SubscriptionTier, PLANS } from "@/lib/plans";
import Link from 'next/link';

export default async function SubscriptionPage() {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan_id, status, current_period_end')
        .eq('user_id', user.id)
        .single();

    const isPremium = subscription?.plan_id === 'premium';
    const planId = (subscription?.plan_id as SubscriptionTier) || 'free';
    const plan = PLANS[planId];
    const isActive = subscription?.status === 'active';

    const planName = isPremium ? 'Pro' : 'Free';
    const planDescription = isPremium
        ? 'Unlimited learning power, AI assistance, and advanced features.'
        : 'Essential learning tools to get you started on EdBox.';

    const featureList = [
        {
            name: 'Courses per month',
            description: 'AI generated course materials',
            included: true,
            value: plan.courses_per_month === 'unlimited' ? 'Unlimited' : plan.courses_per_month
        },
        {
            name: 'Study kits per month',
            description: 'Flashcards, quizzes and study tools',
            included: true,
            value: plan.study_kits_per_month === 'unlimited' ? 'Unlimited' : plan.study_kits_per_month
        },
        {
            name: 'Genie Messages',
            description: 'AI tutor conversations per day',
            included: true,
            value: plan.genie_messages_per_day === 'unlimited' ? 'Unlimited' : plan.genie_messages_per_day
        },
        {
            name: 'Study Circles',
            description: 'Collaborate with peers',
            included: true,
            value: plan.circles_per_month === 'unlimited' ? 'Unlimited' : plan.circles_per_month
        },
        {
            name: 'Ad-free Experience',
            description: 'No advertisements in your feed',
            included: !plan.ads_in_feed,
            value: !plan.ads_in_feed ? 'Included' : false
        },
        {
            name: 'Advanced Notes Details',
            description: 'Deep-dive AI analysis of your notes',
            included: plan.advanced_notes_details,
            value: plan.advanced_notes_details ? 'Included' : false
        },
        {
            name: 'Generate More Batches',
            description: 'Create extended study kit content',
            included: plan.can_generate_more_batches,
            value: plan.can_generate_more_batches ? 'Included' : false
        }
    ];

    return (
        <div className="flex-1 w-full min-h-screen bg-zinc-950 text-zinc-100 p-8 pt-20 lg:pt-8 custom-scrollbar">
            <div className="max-w-4xl mx-auto flex flex-col gap-12">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-semibold tracking-tight">Subscription</h1>
                    <p className="text-zinc-400">View and manage your EdBox learning plan.</p>
                </div>

                {/* Current Plan Card */}
                <div className="group relative w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 ease-out">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">

                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${isPremium ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-400'}`}>
                                <Crown size={32} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-medium tracking-tight">{planName} Plan</h2>
                                    {isActive ? (
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                                            {subscription?.status || 'Free'}
                                        </span>
                                    )}
                                </div>
                                <p className="text-zinc-400 text-sm">{planDescription}</p>
                            </div>
                        </div>

                        {isPremium && subscription?.current_period_end && (
                            <div className="flex flex-col gap-1 lg:items-end text-sm">
                                <span className="text-zinc-500">Next billing date</span>
                                <span className="text-zinc-200 font-medium">
                                    {new Date(subscription.current_period_end).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </span>
                                <Link href="/pricing" className="text-indigo-400 hover:text-indigo-300 transition-colors mt-1 font-medium text-xs uppercase tracking-wider">Manage Billing</Link>
                            </div>
                        )}
                    </div>

                    {!isPremium && (
                        <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center justify-between">
                            <span className="text-zinc-400 text-sm">You are currently on the free tier.</span>
                            <a
                                href="/pricing"
                                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 focus-visible:ring focus-visible:ring-indigo-500 focus-visible:outline-none"
                            >
                                Upgrade to Pro
                            </a>
                        </div>
                    )}
                </div>

                {/* Features Section */}
                <div className="flex flex-col gap-6">
                    <h3 className="text-xl font-medium tracking-tight">Plan Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {featureList.map((feature, idx) => (
                            <div
                                key={idx}
                                className="flex items-start gap-4 p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50"
                            >
                                {feature.included ? (
                                    <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                    <XCircle size={20} className="text-zinc-600 shrink-0 mt-0.5" />
                                )}

                                <div className="flex flex-col gap-1 w-full relative">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-medium ${feature.included ? 'text-zinc-200' : 'text-zinc-500'}`}>
                                            {feature.name}
                                        </span>
                                        {feature.value && (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                                                {feature.value}
                                            </span>
                                        )}
                                    </div>
                                    {feature.description && (
                                        <span className="text-xs text-zinc-500 mt-0.5">
                                            {feature.description}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Support Section */}
                <Link href="mailto:support@edbox.com" className="flex items-center justify-between p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors duration-200 group cursor-pointer transition-all">
                    <div className="flex flex-col gap-1">
                        <span className="text-zinc-200 font-medium tracking-tight">Need help with billing?</span>
                        <span className="text-zinc-500 text-sm">Contact our support team for assistance.</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 group-hover:scale-110 transition-all duration-300 ease-out">
                        <ChevronRight size={20} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                    </div>
                </Link>
            </div>
        </div>
    );
}
