'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, Activity, FileText, MessageSquare, TrendingUp, TrendingDown,
  Shield, Eye, UserCog, BarChart3, Sparkles, Clock, AlertCircle, Settings, Cog
} from 'lucide-react';
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
  };
  subscription: {
    plan: string;
    status: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'skill-config'>('dashboard');
  const [skillGraph, setSkillGraph] = useState<SkillGraph | null>(null);

  useEffect(() => {
    fetchStats();
    fetchUsers(currentPage);
    if (activeTab === 'skill-config') {
      fetchSkillGraph();
    }
  }, [currentPage, activeTab]);

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
      
      // Check for 403 - redirect if not authorized
      if (res.status === 403) {
        console.error('Not authorized - redirecting to home');
        router.push('/');
        return;
      }
      
      // Parse the response
      const data = await res.json();
      
      // Check if response was successful
      if (!res.ok) {
        console.error('API Error:', data);
        console.error('Status:', res.status);
        console.error('Error details:', data.details);
        console.error('Error code:', data.code);
        throw new Error(data.details || data.error || 'Failed to fetch users');
      }
      
      console.log('✅ Users fetched successfully:', data.users?.length || 0);
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setError(''); // Clear any previous errors
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message);
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
      console.error('Failed to generate analysis:', err);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const fetchSkillGraph = async () => {
    try {
      // This would typically fetch from your skill graph API
      // For now, using a mock skill graph
      const mockSkillGraph: SkillGraph = {
        nodes: [
          {
            id: 'javascript-basics',
            title: 'JavaScript Basics',
            description: 'Learn fundamental JavaScript concepts',
            prerequisites: [],
            engine: 'codestudio',
            difficulty: 'Easy'
          },
          {
            id: 'dom-manipulation',
            title: 'DOM Manipulation',
            description: 'Learn to interact with the DOM',
            prerequisites: ['javascript-basics'],
            engine: 'codestudio',
            difficulty: 'Medium'
          },
          {
            id: 'async-programming',
            title: 'Async Programming',
            description: 'Master promises and async/await',
            prerequisites: ['javascript-basics'],
            engine: 'codestudio',
            difficulty: 'Hard'
          }
        ],
        edges: [
          { from: 'javascript-basics', to: 'dom-manipulation' },
          { from: 'javascript-basics', to: 'async-programming' }
        ]
      };
      setSkillGraph(mockSkillGraph);
    } catch (err: any) {
      console.error('Failed to fetch skill graph:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 text-lg font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              setError('');
              setLoading(true);
              fetchStats();
              fetchUsers(currentPage);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Shield className="w-10 h-10 text-blue-500" />
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-2">Monitor platform health and user engagement</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Tab Navigation */}
            <div className="flex bg-gray-800/50 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('skill-config')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === 'skill-config' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                Skill Config
              </button>
            </div>

            {activeTab === 'dashboard' && (
              <button
                onClick={generateAnalysis}
                disabled={loadingAnalysis}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5" />
                {loadingAnalysis ? 'Generating...' : 'AI Analysis'}
              </button>
            )}
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-blue-500" />
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.users.total.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Total Users</div>
            <div className="flex items-center gap-2 mt-3 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500">+{stats?.users.newLast7Days} this week</span>
            </div>
          </motion.div>

          {/* Active Users */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-green-500" />
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.users.activeLast7Days.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Active Users (7d)</div>
            <div className="text-sm mt-3 text-gray-500">
              {stats?.users.total ? Math.round((stats.users.activeLast7Days / stats.users.total) * 100) : 0}% engagement rate
            </div>
          </motion.div>

          {/* Content Created */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 text-purple-500" />
              <span className="text-2xl">📝</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {((stats?.content.notes || 0) + (stats?.content.studyKits || 0)).toLocaleString()}
            </div>
            <div className="text-gray-400 text-sm">Content Items</div>
            <div className="text-sm mt-3 text-gray-500">
              Notes: {stats?.content.notes} • Kits: {stats?.content.studyKits}
            </div>
          </motion.div>

          {/* Messages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <MessageSquare className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl">💬</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.content.messages.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Total Messages</div>
            <div className="flex items-center gap-2 mt-3 text-sm text-yellow-500">
              <Clock className="w-4 h-4" />
              {stats?.activity.messagesLast24h} in last 24h
            </div>
          </motion.div>
        </div>

        {/* AI Analysis Section */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl p-6 border border-purple-500/30 mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
            </div>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        {/* Recent Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Recent Users</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">User ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Country</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Education</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Usage</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Plan</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm font-mono text-gray-300">
                      {user.id.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-600/50 text-gray-300'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-300">{user.country || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">{user.education || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-300">
                      <div className="flex gap-2">
                        <span title="Courses">📚 {user.usage.coursesCreated}</span>
                        <span title="Study Kits">📝 {user.usage.studyKitsCreated}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        user.subscription.plan === 'pro' 
                          ? 'bg-yellow-500/20 text-yellow-300' 
                          : 'bg-gray-600/50 text-gray-300'
                      }`}>
                        {user.subscription.plan}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </motion.div>
          </>
        )}

        {/* Skill Configuration Tab */}
        {activeTab === 'skill-config' && skillGraph && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
          >
            <SkillConfigurationAdmin 
              skillGraph={skillGraph}
              onConfigurationUpdate={(skillId, config) => {
                console.log(`Configuration updated for skill ${skillId}:`, config);
              }}
            />
          </motion.div>
        )}

        {activeTab === 'skill-config' && !skillGraph && (
          <div className="text-center py-12">
            <Cog className="w-16 h-16 text-gray-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">Loading skill configuration...</p>
          </div>
        )}
      </div>
    </div>
  );
}