import React from 'react';
import { Card } from '../../../../../components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

const mockData = [
  { name: 'Mon', value: 4000, profit: 2400 },
  { name: 'Tue', value: 3000, profit: 1398 },
  { name: 'Wed', value: 2000, profit: 9800 },
  { name: 'Thu', value: 2780, profit: 3908 },
  { name: 'Fri', value: 1890, profit: 4800 },
  { name: 'Sat', value: 2390, profit: 3800 },
  { name: 'Sun', value: 3490, profit: 4300 },
];

const StatCard = ({ label, value, sub, trend, icon: Icon }: any) => (
  <Card className="flex flex-col justify-between h-full">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-400 text-sm mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2 text-sm">
      <span className={trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}>
        {sub}
      </span>
      <span className="text-slate-500">vs last month</span>
    </div>
  </Card>
);

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-white">Dashboard</h2>
        <p className="text-slate-400">Real-time financial overview and market analysis.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Assets" value="$1.2M" sub="+12.5%" trend="up" icon={DollarSign} />
        <StatCard label="Net Profit" value="$84.3k" sub="+4.2%" trend="up" icon={TrendingUp} />
        <StatCard label="Op. Expenses" value="$32.1k" sub="-2.4%" trend="down" icon={Activity} />
        <StatCard label="Market Risk" value="High" sub="+1.2 Beta" trend="down" icon={TrendingDown} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Revenue vs Expenses" className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} />
              <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} activeDot={{r: 6}} />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Capital Allocation" className="h-96">
           <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
              <Bar dataKey="profit" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};