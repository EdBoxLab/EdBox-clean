import React from 'react';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg flex items-center border border-slate-200 dark:border-transparent">
        <div className="p-3 rounded-full bg-indigo-600/20 text-indigo-500 dark:text-indigo-400 mr-4">{icon}</div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const ActivityItem: React.FC<{ user: string; action: string; time: string; avatar: string }> = ({ user, action, time, avatar }) => (
    <div className="flex items-center space-x-4 py-3">
        <img className="w-10 h-10 rounded-full" src={avatar} alt={user} />
        <div className="flex-1">
            <p className="text-slate-700 dark:text-slate-300"><span className="font-semibold text-slate-900 dark:text-white">{user}</span> {action}</p>
            <p className="text-xs text-slate-500">{time}</p>
        </div>
    </div>
);

export const CollaborationView: React.FC = () => {
    return (
        <div className="animate-fade-in p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Collaboration Hub</h2>
                <p className="mt-2 text-lg text-slate-500 dark:text-slate-400">
                    Real-time co-editing, educator dashboards, and student preview modes.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Active Users" value="12" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                <StatCard title="Projects Shared" value="4" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>} />
                <StatCard title="Pending Reviews" value="3" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Educator Dashboard */}
                <div className="lg:col-span-2 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Educator Dashboard: Student Progress</h3>
                    <div className="space-y-4">
                        {/* Progress Item */}
                        <div className="flex items-center">
                            <span className="text-slate-700 dark:text-slate-300 w-32">Alice Smith</span>
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                                <div className="bg-green-500 h-4 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <span className="text-sm text-slate-500 dark:text-slate-400 ml-4">85%</span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-slate-700 dark:text-slate-300 w-32">Bob Johnson</span>
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                                <div className="bg-yellow-500 h-4 rounded-full" style={{ width: '50%' }}></div>
                            </div>
                            <span className="text-sm text-slate-500 dark:text-slate-400 ml-4">50%</span>
                        </div>
                         <div className="flex items-center">
                            <span className="text-slate-700 dark:text-slate-300 w-32">Charlie Brown</span>
                            <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                                <div className="bg-blue-500 h-4 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                            <span className="text-sm text-slate-500 dark:text-slate-400 ml-4">100%</span>
                        </div>
                    </div>
                </div>

                {/* Live Activity Feed */}
                <div className="bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Live Activity</h3>
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        <ActivityItem user="Alice Smith" action="pushed a commit to Physics Engine" time="2 minutes ago" avatar="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" />
                        <ActivityItem user="You" action="resolved a merge conflict in Coding Studio" time="15 minutes ago" avatar="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
                        <ActivityItem user="Bob Johnson" action="requested a review on Chemistry Lab" time="1 hour ago" avatar="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80" />
                    </div>
                </div>
            </div>
        </div>
    );
};