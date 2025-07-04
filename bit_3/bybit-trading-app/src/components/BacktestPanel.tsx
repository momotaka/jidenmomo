'use client';

import { useState } from 'react';
import { Play, Square, Download, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTradingContext } from '@/context/TradingContext';

interface BacktestConfig {
  symbol: string;
  strategy: string;
  startDate: string;
  endDate: string;
  initialBalance: number;
  commission: number;
  slippage: number;
  leverage: number;
}

interface BacktestResult {
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalReturn: number;
    totalPnl: number;
    maxDrawdown: number;
    sharpeRatio: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
  };
  equityCurve: Array<{ date: string; balance: number; drawdown: number }>;
  monthlyReturns: Array<{ month: string; return: number }>;
  trades: Array<{
    entryTime: string;
    exitTime: string;
    side: string;
    pnl: number;
    pnlPercentage: number;
  }>;
}

export default function BacktestPanel() {
  const { selectedPair, setBacktestResults } = useTradingContext();
  const [config, setConfig] = useState<BacktestConfig>({
    symbol: selectedPair,
    strategy: 'ma_crossover',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    initialBalance: 10000,
    commission: 0.001,
    slippage: 0.0005,
    leverage: 1,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');

  const runBacktest = async () => {
    setIsRunning(true);
    try {
      const response = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setBacktestResults(data); // グローバルに保存
        setActiveTab('results');
      } else {
        alert('Backtest failed');
      }
    } catch (error) {
      console.error('Backtest error:', error);
      alert('Backtest error');
    } finally {
      setIsRunning(false);
    }
  };

  const exportResults = () => {
    if (!result) return;
    
    const csv = [
      ['Metric', 'Value'],
      ['Total Trades', result.metrics.totalTrades],
      ['Win Rate', `${(result.metrics.winRate * 100).toFixed(2)}%`],
      ['Total Return', `${result.metrics.totalReturn.toFixed(2)}%`],
      ['Max Drawdown', `${result.metrics.maxDrawdown.toFixed(2)}%`],
      ['Sharpe Ratio', result.metrics.sharpeRatio.toFixed(2)],
      ['Profit Factor', result.metrics.profitFactor.toFixed(2)],
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${config.strategy}_${new Date().toISOString()}.csv`;
    a.click();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="text-blue-500" />
          Backtest
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded ${
              activeTab === 'config' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded ${
              activeTab === 'results' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300'
            }`}
            disabled={!result}
          >
            Results
          </button>
        </div>
      </div>

      {activeTab === 'config' ? (
        <div className="space-y-6">
          {/* Configuration Form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Symbol</label>
              <select
                value={config.symbol}
                onChange={(e) => setConfig({ ...config, symbol: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="BTC/USDT">BTC/USDT</option>
                <option value="ETH/USDT">ETH/USDT</option>
                <option value="SOL/USDT">SOL/USDT</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Strategy</label>
              <select
                value={config.strategy}
                onChange={(e) => setConfig({ ...config, strategy: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="ma_crossover">MA Crossover</option>
                <option value="rsi">RSI Strategy</option>
                <option value="macd">MACD Strategy</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={config.endDate}
                onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Initial Balance</label>
              <input
                type="number"
                value={config.initialBalance}
                onChange={(e) => setConfig({ ...config, initialBalance: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Leverage</label>
              <input
                type="number"
                value={config.leverage}
                onChange={(e) => setConfig({ ...config, leverage: parseFloat(e.target.value) })}
                min="1"
                max="100"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Commission (%)</label>
              <input
                type="number"
                value={config.commission * 100}
                onChange={(e) => setConfig({ ...config, commission: parseFloat(e.target.value) / 100 })}
                step="0.01"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Slippage (%)</label>
              <input
                type="number"
                value={config.slippage * 100}
                onChange={(e) => setConfig({ ...config, slippage: parseFloat(e.target.value) / 100 })}
                step="0.01"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={runBacktest}
            disabled={isRunning}
            className={`w-full py-3 rounded font-medium flex items-center justify-center gap-2 ${
              isRunning 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Square size={20} />
                Running...
              </>
            ) : (
              <>
                <Play size={20} />
                Run Backtest
              </>
            )}
          </button>
        </div>
      ) : result ? (
        <div className="space-y-6">
          {/* Results */}
          <div className="flex justify-end">
            <button
              onClick={exportResults}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-2"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4">
            <MetricCard
              title="Total Return"
              value={`${result.metrics.totalReturn.toFixed(2)}%`}
              positive={result.metrics.totalReturn > 0}
            />
            <MetricCard
              title="Win Rate"
              value={`${(result.metrics.winRate * 100).toFixed(2)}%`}
              positive={result.metrics.winRate > 0.5}
            />
            <MetricCard
              title="Sharpe Ratio"
              value={result.metrics.sharpeRatio.toFixed(2)}
              positive={result.metrics.sharpeRatio > 1}
            />
            <MetricCard
              title="Max Drawdown"
              value={`${result.metrics.maxDrawdown.toFixed(2)}%`}
              positive={false}
            />
          </div>
          
          {/* Equity Curve */}
          <div className="bg-gray-700 rounded p-4">
            <h3 className="text-lg font-medium mb-4">Equity Curve</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={result.equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Drawdown Chart */}
          <div className="bg-gray-700 rounded p-4">
            <h3 className="text-lg font-medium mb-4">Drawdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={result.equityCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="drawdown"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          {/* Monthly Returns */}
          <div className="bg-gray-700 rounded p-4">
            <h3 className="text-lg font-medium mb-4">Monthly Returns</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={result.monthlyReturns}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="month" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                  }}
                />
                <Bar 
                  dataKey="return" 
                  fill={(entry: any) => entry.return >= 0 ? '#10B981' : '#EF4444'}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Trade Statistics */}
          <div className="bg-gray-700 rounded p-4">
            <h3 className="text-lg font-medium mb-4">Trade Statistics</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Total Trades</div>
                <div className="text-xl font-medium">{result.metrics.totalTrades}</div>
              </div>
              <div>
                <div className="text-gray-400">Winning Trades</div>
                <div className="text-xl font-medium text-green-500">{result.metrics.winningTrades}</div>
              </div>
              <div>
                <div className="text-gray-400">Losing Trades</div>
                <div className="text-xl font-medium text-red-500">{result.metrics.losingTrades}</div>
              </div>
              <div>
                <div className="text-gray-400">Average Win</div>
                <div className="text-xl font-medium">${result.metrics.averageWin.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400">Average Loss</div>
                <div className="text-xl font-medium">${Math.abs(result.metrics.averageLoss).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-400">Profit Factor</div>
                <div className="text-xl font-medium">{result.metrics.profitFactor.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          No backtest results yet. Configure and run a backtest to see results.
        </div>
      )}
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  positive 
}: { 
  title: string; 
  value: string; 
  positive: boolean;
}) {
  return (
    <div className="bg-gray-700 rounded p-4">
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className={`text-2xl font-bold flex items-center gap-2 ${
        positive ? 'text-green-500' : 'text-red-500'
      }`}>
        {positive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
        {value}
      </div>
    </div>
  );
}