'use client';

import { useEffect, useState } from 'react';
import { useTradingContext } from '@/context/TradingContext';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChartIcon, Activity } from 'lucide-react';

interface PerformanceMetrics {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  avgDailyReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
}

export default function PerformanceDashboard() {
  const { positions, balances, backtestResults } = useTradingContext();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<'1d' | '1w' | '1m' | 'all'>('1w');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, [timeframe]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      // 実際のAPIコールをここに実装
      // const response = await fetch(`/api/performance?timeframe=${timeframe}`);
      // const data = await response.json();
      
      // デモデータ
      setMetrics({
        totalTrades: 156,
        winRate: 0.65,
        totalPnl: 3456.78,
        avgDailyReturn: 0.023,
        sharpeRatio: 1.85,
        maxDrawdown: -0.12,
        profitFactor: 2.3,
        bestTrade: 567.89,
        worstTrade: -234.56,
      });
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // デモデータ
  const equityCurve = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    balance: 10000 + Math.random() * 2000 + i * 50,
  }));

  const tradeDistribution = [
    { name: 'Winning', value: 65, color: '#10B981' },
    { name: 'Losing', value: 35, color: '#EF4444' },
  ];

  const monthlyReturns = [
    { month: 'Jan', return: 5.2 },
    { month: 'Feb', return: -2.1 },
    { month: 'Mar', return: 8.3 },
    { month: 'Apr', return: 3.7 },
    { month: 'May', return: -1.2 },
    { month: 'Jun', return: 6.8 },
  ];

  if (loading || !metrics) {
    return <div className="text-center py-8">Loading performance data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="text-blue-500" />
          Performance Analytics
        </h2>
        <div className="flex gap-2">
          {(['1d', '1w', '1m', 'all'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded text-sm ${
                timeframe === tf ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {tf === '1d' ? '1 Day' : tf === '1w' ? '1 Week' : tf === '1m' ? '1 Month' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total P&L"
          value={`$${metrics.totalPnl.toFixed(2)}`}
          change={metrics.totalPnl > 0 ? '+' : ''}
          positive={metrics.totalPnl > 0}
          icon={<DollarSign />}
        />
        <MetricCard
          title="Win Rate"
          value={`${(metrics.winRate * 100).toFixed(1)}%`}
          positive={metrics.winRate > 0.5}
          icon={<TrendingUp />}
        />
        <MetricCard
          title="Sharpe Ratio"
          value={metrics.sharpeRatio.toFixed(2)}
          positive={metrics.sharpeRatio > 1}
          icon={<BarChart3 />}
        />
        <MetricCard
          title="Max Drawdown"
          value={`${(metrics.maxDrawdown * 100).toFixed(1)}%`}
          positive={false}
          icon={<TrendingDown />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equity Curve */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
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

        {/* Win/Loss Distribution */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Trade Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tradeDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {tradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-400">Total Trades: {metrics.totalTrades}</p>
          </div>
        </div>

        {/* Monthly Returns */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Monthly Returns</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
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

        {/* Additional Stats */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Trading Statistics</h3>
          <div className="space-y-3">
            <StatRow label="Profit Factor" value={metrics.profitFactor.toFixed(2)} />
            <StatRow label="Avg Daily Return" value={`${(metrics.avgDailyReturn * 100).toFixed(2)}%`} />
            <StatRow label="Best Trade" value={`$${metrics.bestTrade.toFixed(2)}`} positive />
            <StatRow label="Worst Trade" value={`$${metrics.worstTrade.toFixed(2)}`} positive={false} />
            <StatRow label="Current Positions" value={positions.length.toString()} />
            <StatRow label="Active Strategies" value={backtestResults ? '1' : '0'} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  change, 
  positive, 
  icon 
}: { 
  title: string;
  value: string;
  change?: string;
  positive: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{title}</span>
        <span className={`${positive ? 'text-green-500' : 'text-red-500'}`}>
          {icon}
        </span>
      </div>
      <div className={`text-2xl font-bold ${positive ? 'text-green-500' : 'text-red-500'}`}>
        {change}{value}
      </div>
    </div>
  );
}

function StatRow({ 
  label, 
  value, 
  positive 
}: { 
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <span className={`font-medium ${
        positive === undefined ? '' : positive ? 'text-green-500' : 'text-red-500'
      }`}>
        {value}
      </span>
    </div>
  );
}