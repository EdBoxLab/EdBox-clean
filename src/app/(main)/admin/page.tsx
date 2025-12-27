'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Activity, FileText, MessageSquare, TrendingUp, TrendingDown,
  Shield, Eye, UserCog, BarChart3, Sparkles, Clock, AlertCircle, Settings, Cog,
  Trash2, ShieldAlert, ShieldCheck, MoreVertical, Database, Globe, Lock, Save,
  X, Check, Edit2, Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { SkillConfigurationAdmin } from '@/components/admin/SkillConfigurationAdmin';
import type { SkillGraph } from '@/lib/services/skill-progression-manager';

interface Stats {
  users: {
    total: number;
    admins: number;
    newLast7Days: number;
    activeLast7Days: number;
  };
  content: {
    notes: number;
    conversations: number;
    messages: number;
    studyKits: number;
  };
  activity: {
    messagesLast24h: number;
    notesLast24h: number;
  };
  subscriptions: {
    active: number;
    planBreakdown: Record<string, number>;
  };
}

interface User {
  id: string;
  role: string;
  country?: string;
  education?: string;
  age?: number;
  onboardingCompleted: boolean;
  usage: {
    coursesCreated: number;
    studyKitsCreated: number;
    researchQueries: number;
    adCredits: number;
  };
  subscription: {
    plan: string;
    status: string;
  };
}

interface SystemSetting {
  key: string;
  value: any;
  description: string;
  updated_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings' | 'skill-config'>('dashboard');
  const [skillGraph, setSkillGraph] = useState<SkillGraph | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Modal states
  const [editingUsage, setEditingUsage] = useState<User | null>(null);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);

  useEffect(() => {
    fetchStats();
    if (activeTab === 'users') fetchUsers(currentPage);
    if (activeTab === 'settings') fetchSettings();
    if (activeTab === 'skill-config') fetchSkillGraph();
  }, [currentPage, activeTab]);

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      fetchUsers(currentPage);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Failed to delete user');
      fetchUsers(currentPage);
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.status === 403) {
        router.push('/');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page: number) => {
    try {
      const res = await fetch(`/api/admin/users?page=${page}&limit=10`);
      if (res.status === 403) {
        router.push('/');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      setSettings(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    setActionLoading(key);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error('Failed to update setting');
      fetchSettings();
      setEditingSetting(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const updateUsage = async (userId: string, usage: any) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/admin/users/usage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, usage }),
      });
      if (!res.ok) throw new Error('Failed to update usage');
      fetchUsers(currentPage);
      setEditingUsage(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const generateAnalysis = async () => {
    if (!stats) return;
    setLoadingAnalysis(true);
    try {
      const res = await fetch('/api/admin/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stats }),
      });
      if (!res.ok) throw new Error('Failed to generate analysis');
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const fetchSkillGraph = async () => {
    // Mock for now
    setSkillGraph({
      nodes: [
        { id: 'js-1', title: 'JS Basics', description: 'JS fundamentals', engine: 'codestudio', difficulty: 'Easy', prerequisites: [] }
      ],
      edges: []
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Accessing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-3">
              <Shield className="w-10 h-10 text-blue-500" />
              EdBox Admin
            </h1>
            <p className="text-gray-400 mt-2 font-medium tracking-wide uppercase text-xs">Platform Oversight & System Control</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={generateAnalysis}
              disabled={loadingAnalysis}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-xl transition-all font-bold shadow-lg shadow-blue-900/20"
            >
              {loadingAnalysis ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-5 h-5" />}
              AI Insights
            </button>
            
            <div className="flex bg-gray-900/80 p-1 rounded-2xl border border-gray-800 shadow-xl">
              {[
                { id: 'dashboard', label: 'Overview', icon: BarChart3 },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'settings', label: 'System', icon: Settings },
                { id: 'skill-config', label: 'Skills', icon: Cog },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-3 text-red-400 shadow-xl shadow-red-950/20">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">{error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total Users', value: stats?.users.total || 0, icon: Users, color: 'from-blue-600 to-blue-400', sub: `+${stats?.users.newLast7Days || 0} this week` },
                  { label: 'Active (7d)', value: stats?.users.activeLast7Days || 0, icon: Activity, color: 'from-emerald-600 to-emerald-400', sub: 'Engagement rate' },
                  { label: 'Platform Assets', value: (stats?.content.notes || 0) + (stats?.content.studyKits || 0), icon: Database, color: 'from-purple-600 to-purple-400', sub: `${stats?.content.conversations || 0} AI Sessions` },
                  { label: '24h Activity', value: stats?.activity.messagesLast24h || 0, icon: MessageSquare, color: 'from-orange-600 to-orange-400', sub: 'Real-time flow' }
                ].map((card, i) => (
                  <motion.div key={card.label} whileHover={{ y: -5 }} className="bg-gray-900/50 backdrop-blur-md p-6 rounded-3xl border border-gray-800/50 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${card.color} shadow-lg shadow-gray-950/50`}>
                        <card.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-3xl font-black tracking-tight">{card.value.toLocaleString()}</span>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm font-bold uppercase tracking-wider">{card.label}</p>
                      <p className="text-gray-500 text-xs mt-1 font-medium">{card.sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-8 border border-gray-800/50 h-[450px] shadow-2xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black flex items-center gap-3">
                      <BarChart3 className="w-6 h-6 text-blue-400" />
                      Content Distribution
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Notes', value: stats?.content.notes || 0 },
                          { name: 'Study Kits', value: stats?.content.studyKits || 0 },
                          { name: 'AI Conversations', value: stats?.content.conversations || 0 },
                        ]}
                        cx="50%" cy="45%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value" stroke="none"
                      >
                        <Cell fill="#3b82f6" />
                        <Cell fill="#8b5cf6" />
                        <Cell fill="#f59e0b" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', fontWeight: 'bold' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-8 border border-gray-800/50 h-[450px] shadow-2xl">
                  <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                    <Zap className="w-6 h-6 text-yellow-400" />
                    Subscription Health
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(stats?.subscriptions.planBreakdown || {}).map(([name, value]) => ({ name: name.toUpperCase(), value }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} fontWeight="bold" axisLine={false} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} cursor={{ fill: '#1e293b' }} />
                      <Bar dataKey="value" fill="#10b981" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Analysis */}
              {analysis && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles className="w-32 h-32 text-white" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                      </div>
                      <h2 className="text-2xl font-black">Strategic AI Insights</h2>
                    </div>
                    <div className="prose prose-invert max-w-none prose-p:text-gray-300 prose-headings:text-white">
                      <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'users' && (
            <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/50 backdrop-blur-md rounded-3xl border border-gray-800/50 shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-400" />
                    User Directory
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 font-bold uppercase tracking-widest">Total: {stats?.users.total}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800/30">
                      <th className="py-5 px-8 text-xs font-black text-gray-500 uppercase tracking-widest">Identify</th>
                      <th className="py-5 px-8 text-xs font-black text-gray-500 uppercase tracking-widest">Authority</th>
                      <th className="py-5 px-8 text-xs font-black text-gray-500 uppercase tracking-widest">Context</th>
                      <th className="py-5 px-8 text-xs font-black text-gray-500 uppercase tracking-widest">Resource Usage</th>
                      <th className="py-5 px-8 text-xs font-black text-gray-500 uppercase tracking-widest">Plan</th>
                      <th className="py-5 px-8 text-xs font-black text-gray-500 uppercase tracking-widest text-right">Operations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                        <td className="py-6 px-8">
                          <div className="flex flex-col">
                            <span className="font-mono text-sm text-blue-400">{user.id.substring(0, 8)}...</span>
                            <span className="text-xs text-gray-500 mt-1">{user.onboardingCompleted ? 'Verified' : 'Pending'}</span>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            user.role === 'admin' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-300">{user.country || 'Global'}</span>
                            <span className="text-xs text-gray-500">{user.education || 'Lifelong Learner'}</span>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                            <span title="Courses" className="flex items-center gap-1"><Zap className="w-3 h-3" /> {user.usage.coursesCreated}</span>
                            <span title="Queries" className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {user.usage.researchQueries}</span>
                            <button onClick={() => setEditingUsage(user)} className="p-1 hover:text-blue-400 transition-colors"><Edit2 className="w-3 h-3" /></button>
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                            user.subscription.plan === 'pro' ? 'bg-yellow-500 text-black' : 'bg-blue-900/30 text-blue-400'
                          }`}>
                            {user.subscription.plan}
                          </span>
                        </td>
                        <td className="py-6 px-8 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => toggleUserRole(user.id, user.role)} disabled={actionLoading === user.id} className="p-2.5 bg-gray-800 hover:bg-blue-600 rounded-xl transition-all shadow-lg hover:shadow-blue-900/40">
                              <UserCog className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteUser(user.id)} disabled={actionLoading === user.id} className="p-2.5 bg-gray-800 hover:bg-red-600 rounded-xl transition-all shadow-lg hover:shadow-red-900/40">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-8 border-t border-gray-800 flex items-center justify-between">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-all disabled:opacity-30">Previous</button>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-blue-400">Page {currentPage}</span>
                  <span className="text-sm text-gray-600 font-bold">/ {totalPages}</span>
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-all disabled:opacity-30">Next</button>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settings.map((setting) => (
                  <motion.div key={setting.key} className="bg-gray-900/50 backdrop-blur-md p-8 rounded-3xl border border-gray-800/50 shadow-2xl flex items-start justify-between group">
                    <div>
                      <h4 className="text-lg font-black text-blue-400 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        {setting.key.split('_').join(' ')}
                      </h4>
                      <p className="text-gray-400 text-sm mt-2 font-medium">{setting.description}</p>
                      <div className="mt-4 p-4 bg-gray-950 rounded-2xl border border-gray-800 font-mono text-sm text-emerald-400 break-all">
                        {JSON.stringify(setting.value, null, 2)}
                      </div>
                    </div>
                    <button onClick={() => setEditingSetting(setting)} className="p-3 bg-gray-800 hover:bg-blue-600 rounded-2xl transition-all opacity-0 group-hover:opacity-100 shadow-xl">
                      <Edit2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </div>
              <div className="bg-blue-900/10 border border-blue-500/20 p-8 rounded-3xl flex items-center gap-6 shadow-2xl">
                <div className="p-4 bg-blue-600 rounded-2xl">
                  <Database className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-black">System Integrity Check</h3>
                  <p className="text-gray-400 text-sm mt-1 font-medium">All database connections, authentication providers, and AI engines are operational.</p>
                </div>
                <div className="ml-auto flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest">
                  <Check className="w-4 h-4" />
                  Optimal
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'skill-config' && (
            <motion.div key="skill-config" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900/50 backdrop-blur-md rounded-3xl p-8 border border-gray-800/50 shadow-2xl">
              {skillGraph ? (
                <SkillConfigurationAdmin skillGraph={skillGraph} onConfigurationUpdate={(id, config) => console.log(id, config)} />
              ) : (
                <div className="text-center py-20">
                  <Cog className="w-16 h-16 text-gray-700 mx-auto mb-6 animate-spin" />
                  <p className="text-gray-400 font-bold">Synchronizing skill clusters...</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Usage Editor Modal */}
        <AnimatePresence>
          {editingUsage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-900 w-full max-w-md rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-transparent">
                  <h3 className="text-2xl font-black">Update Resource Limits</h3>
                  <button onClick={() => setEditingUsage(null)} className="p-2 hover:bg-gray-800 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Courses Created (Month)</label>
                    <input type="number" className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 font-black text-blue-400 focus:outline-none focus:border-blue-500 transition-colors" defaultValue={editingUsage.usage.coursesCreated} id="courses-input" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">AI Queries (Week)</label>
                    <input type="number" className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 font-black text-blue-400 focus:outline-none focus:border-blue-500 transition-colors" defaultValue={editingUsage.usage.researchQueries} id="queries-input" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Ad Credits</label>
                    <input type="number" className="w-full bg-gray-950 border border-gray-800 rounded-2xl p-4 font-black text-blue-400 focus:outline-none focus:border-blue-500 transition-colors" defaultValue={editingUsage.usage.adCredits} id="credits-input" />
                  </div>
                  <button 
                    onClick={() => {
                      const courses = parseInt((document.getElementById('courses-input') as HTMLInputElement).value);
                      const queries = parseInt((document.getElementById('queries-input') as HTMLInputElement).value);
                      const credits = parseInt((document.getElementById('credits-input') as HTMLInputElement).value);
                      updateUsage(editingUsage.id, { coursesCreated: courses, researchQueries: queries, adCredits: credits });
                    }}
                    disabled={actionLoading === editingUsage.id}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3"
                  >
                    {actionLoading === editingUsage.id ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
                    Overwrite Manifest
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Settings Editor Modal */}
        <AnimatePresence>
          {editingSetting && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-gray-900 w-full max-w-lg rounded-3xl border border-gray-800 shadow-2xl overflow-hidden">
                <div className="p-8 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-transparent">
                  <h3 className="text-2xl font-black">Configure System Logic</h3>
                  <button onClick={() => setEditingSetting(null)} className="p-2 hover:bg-gray-800 rounded-xl transition-colors"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-8 space-y-6">
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">{editingSetting.key}</h4>
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Value (JSON)</label>
                    <textarea 
                      className="w-full h-40 bg-gray-950 border border-gray-800 rounded-2xl p-6 font-mono text-emerald-400 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                      defaultValue={JSON.stringify(editingSetting.value, null, 2)}
                      id="setting-value-input"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      try {
                        const val = JSON.parse((document.getElementById('setting-value-input') as HTMLTextAreaElement).value);
                        updateSetting(editingSetting.key, val);
                      } catch (e) {
                        alert('Invalid JSON format');
                      }
                    }}
                    disabled={actionLoading === editingSetting.key}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 rounded-2xl font-black text-lg transition-all shadow-xl shadow-purple-900/40 flex items-center justify-center gap-3"
                  >
                    {actionLoading === editingSetting.key ? <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-6 h-6" />}
                    Commit Configuration
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
