import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calculator, RefreshCcw } from 'lucide-react';

export const CorporateFinance: React.FC = () => {
  const [initialInvestment, setInitialInvestment] = useState<number>(100000);
  const [discountRate, setDiscountRate] = useState<number>(10);
  const [cashFlows, setCashFlows] = useState<string>('20000, 30000, 40000, 40000, 50000');

  const calculateMetrics = () => {
    const flows = cashFlows.split(',').map(s => parseFloat(s.trim()) || 0);
    const rate = discountRate / 100;
    
    let npv = -initialInvestment;
    const data = [
        { year: 0, amount: -initialInvestment, pv: -initialInvestment }
    ];

    flows.forEach((flow, index) => {
      const pv = flow / Math.pow(1 + rate, index + 1);
      npv += pv;
      data.push({ year: index + 1, amount: flow, pv: parseFloat(pv.toFixed(2)) });
    });

    return { npv, data };
  };

  const { npv, data } = calculateMetrics();

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-white">Corporate Finance</h2>
        <p className="text-slate-400">Capital Budgeting: NPV & DCF Analysis</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Parameters" className="h-fit">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Initial Investment ($)</label>
              <input 
                type="number" 
                value={initialInvestment}
                onChange={(e) => setInitialInvestment(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Discount Rate (%)</label>
              <input 
                type="number" 
                value={discountRate}
                onChange={(e) => setDiscountRate(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Annual Cash Flows (Comma sep.)</label>
              <textarea 
                value={cashFlows}
                onChange={(e) => setCashFlows(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white h-24 font-mono text-sm"
                placeholder="e.g. 10000, 15000, 20000"
              />
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <Card className="bg-slate-800/50 border-slate-700">
                <div className="text-sm text-slate-400">Net Present Value (NPV)</div>
                <div className={`text-3xl font-bold font-mono mt-1 ${npv >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${npv.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                    {npv >= 0 ? "Project is financially viable." : "Project may destroy value."}
                </div>
             </Card>
             <Card className="bg-slate-800/50 border-slate-700">
                <div className="text-sm text-slate-400">Total Cash Flows</div>
                <div className="text-3xl font-bold font-mono mt-1 text-blue-400">
                    {data.length - 1} Years
                </div>
                <div className="text-xs text-slate-500 mt-2">
                    Analysis Horizon
                </div>
             </Card>
          </div>

          <Card title="Present Value of Cash Flows" className="h-96">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="year" stroke="#94a3b8" label={{ value: 'Year', position: 'insideBottomRight', offset: -10, fill: '#64748b' }} />
                    <YAxis stroke="#94a3b8" tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Present Value']}
                    />
                    <Bar dataKey="pv" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.pv >= 0 ? '#10b981' : '#f43f5e'} />
                        ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
};