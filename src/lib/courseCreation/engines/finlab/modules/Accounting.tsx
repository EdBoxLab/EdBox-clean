import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../../../components/ui/card';
import { BalanceSheetItem } from '../types';
import { Plus, Trash2, RefreshCw } from 'lucide-react';

const initialItems: BalanceSheetItem[] = [
  { id: '1', name: 'Cash & Equivalents', amount: 50000, category: 'asset' },
  { id: '2', name: 'Inventory', amount: 25000, category: 'asset' },
  { id: '3', name: 'Accounts Payable', amount: 15000, category: 'liability' },
  { id: '4', name: 'Long-term Debt', amount: 100000, category: 'liability' },
  { id: '5', name: 'Common Stock', amount: 20000, category: 'equity' },
];

export const Accounting: React.FC = () => {
  const [items, setItems] = useState<BalanceSheetItem[]>(initialItems);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<'asset' | 'liability' | 'equity'>('asset');

  const addItem = () => {
    if (!newItemName || !newItemAmount) return;
    const newItem: BalanceSheetItem = {
      id: Date.now().toString(),
      name: newItemName,
      amount: parseFloat(newItemAmount),
      category: newItemCategory,
    };
    setItems([...items, newItem]);
    setNewItemName('');
    setNewItemAmount('');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const getTotal = (category: string) => 
    items.filter(i => i.category === category).reduce((sum, i) => sum + i.amount, 0);

  const totalAssets = getTotal('asset');
  const totalLiabilities = getTotal('liability');
  const totalEquity = getTotal('equity');

  // Ratios
  const currentRatio = (totalAssets / (totalLiabilities || 1)).toFixed(2);
  const debtToEquity = (totalLiabilities / (totalEquity || 1)).toFixed(2);
  const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 1;

  return (
    <div className="space-y-6">
       <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Accounting Lab</h2>
          <p className="text-slate-400">Balance Sheet Construction & Analysis</p>
        </div>
        <div className={`px-4 py-2 rounded-full font-mono font-bold ${isBalanced ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {isBalanced ? "BALANCED" : "UNBALANCED"}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <Card title="General Ledger Entry" className="lg:col-span-1 h-fit">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Account Name</label>
              <input 
                type="text" 
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="e.g. Equipment"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Amount ($)</label>
              <input 
                type="number" 
                value={newItemAmount}
                onChange={(e) => setNewItemAmount(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Category</label>
              <div className="grid grid-cols-3 gap-2">
                {(['asset', 'liability', 'equity'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewItemCategory(cat)}
                    className={`p-2 rounded-lg capitalize text-sm font-medium transition-colors ${
                      newItemCategory === cat 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <button 
              onClick={addItem}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Plus size={18} /> Add Entry
            </button>
          </div>
        </Card>

        {/* Visualization & List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Card className="bg-gradient-to-br from-slate-800 to-slate-800/50">
                <div className="text-sm text-emerald-400 font-medium mb-1">Total Assets</div>
                <div className="text-2xl font-mono font-bold text-white">${totalAssets.toLocaleString()}</div>
             </Card>
             <Card className="bg-gradient-to-br from-slate-800 to-slate-800/50">
                <div className="text-sm text-rose-400 font-medium mb-1">Total Liabilities</div>
                <div className="text-2xl font-mono font-bold text-white">${totalLiabilities.toLocaleString()}</div>
             </Card>
             <Card className="bg-gradient-to-br from-slate-800 to-slate-800/50">
                <div className="text-sm text-blue-400 font-medium mb-1">Total Equity</div>
                <div className="text-2xl font-mono font-bold text-white">${totalEquity.toLocaleString()}</div>
             </Card>
          </div>

          <Card title="Balance Sheet Breakdown">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="p-3 font-medium">Account</th>
                    <th className="p-3 font-medium">Category</th>
                    <th className="p-3 font-medium text-right">Amount</th>
                    <th className="p-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 text-slate-200">{item.name}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.category === 'asset' ? 'bg-emerald-500/10 text-emerald-400' :
                          item.category === 'liability' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-blue-500/10 text-blue-400'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-200">${item.amount.toLocaleString()}</td>
                      <td className="p-3">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Ratio Analysis" className="border-emerald-500/20">
             <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-slate-400 mb-2">Current Ratio</h4>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${Number(currentRatio) > 1.5 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {currentRatio}
                    </span>
                    <span className="text-xs text-slate-500">Target: {'>'} 1.5</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Indicates the company's ability to pay short-term obligations.
                  </p>
                </div>
                <div>
                  <h4 className="text-slate-400 mb-2">Debt to Equity</h4>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold ${Number(debtToEquity) < 2 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {debtToEquity}
                    </span>
                    <span className="text-xs text-slate-500">Target: {'<'} 2.0</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                     Measure of financial leverage and solvency.
                  </p>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};