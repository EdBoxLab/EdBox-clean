import React from 'react';
import { Card } from '../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Generate pseudo-random walk for stock data
const generateData = (points: number) => {
  let price = 150;
  const data = [];
  for (let i = 0; i < points; i++) {
    const change = (Math.random() - 0.48) * 5; // Slight upward drift
    price += change;
    data.push({
      date: `D${i + 1}`,
      price: parseFloat(price.toFixed(2)),
      ma: parseFloat((price - (Math.random() * 10)).toFixed(2)) // Fake moving average
    });
  }
  return data;
};

const data = generateData(50);

export const Investments: React.FC = () => {
  return (
    <div className="space-y-6">
        <header>
            <h2 className="text-3xl font-bold text-white">Investments & Portfolio</h2>
            <p className="text-slate-400">Market simulation and technical analysis tools.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
                <Card title="Market Index Simulation (SPX)">
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#64748b" />
                                <YAxis domain={['auto', 'auto']} stroke="#64748b" />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="price" stroke="#10b981" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                                <Area type="monotone" dataKey="ma" stroke="#f59e0b" fill="none" strokeDasharray="5 5" strokeWidth={1} name="50-day MA" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <Card title="Asset Allocation">
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">US Equities</span>
                                <span className="text-emerald-400">55%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '55%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">Intl. Bonds</span>
                                <span className="text-blue-400">25%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">Real Estate</span>
                                <span className="text-purple-400">15%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-300">Crypto</span>
                                <span className="text-yellow-400">5%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Risk Analysis">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase">Alpha</div>
                            <div className="text-xl font-bold text-emerald-400">+2.4%</div>
                        </div>
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase">Beta</div>
                            <div className="text-xl font-bold text-rose-400">1.15</div>
                        </div>
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase">Sharpe</div>
                            <div className="text-xl font-bold text-blue-400">1.8</div>
                        </div>
                        <div className="bg-slate-900 p-3 rounded-lg border border-slate-700">
                            <div className="text-xs text-slate-500 uppercase">Vol.</div>
                            <div className="text-xl font-bold text-yellow-400">14%</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    </div>
  );
};