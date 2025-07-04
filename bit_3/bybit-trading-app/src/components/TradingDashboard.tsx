'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/types/trading';
import SimpleCandlestickChart from './SimpleCandlestickChart';
import OrderForm from './OrderForm';
import PositionsList from './PositionsList';
import BalanceDisplay from './BalanceDisplay';
import StrategyStatus from './StrategyStatus';
import AlertManager from './AlertManager';
import BacktestPanel from './BacktestPanel';
import PerformanceDashboard from './PerformanceDashboard';
import { Activity, TrendingUp, TrendingDown, Wifi, WifiOff, BarChart3, LineChart } from 'lucide-react';
import { useTradingContext } from '@/context/TradingContext';

const TRADING_PAIRS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'];

export default function TradingDashboard() {
  const { 
    selectedPair, 
    setSelectedPair, 
    ticker, 
    isConnected,
    refreshAll 
  } = useTradingContext();
  const [loading, setLoading] = useState(true);
  const [showBacktest, setShowBacktest] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);

  useEffect(() => {
    if (ticker) {
      setLoading(false);
    }
  }, [ticker]);

  const handleOrderPlaced = async (order: Order) => {
    alert(`Order placed successfully! ID: ${order.id}`);
    // グローバルデータを更新
    await refreshAll();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="text-blue-500" />
            Bybit Trading Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowPerformance(!showPerformance)}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                showPerformance ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <LineChart size={20} />
              Performance
            </button>
            <button
              onClick={() => setShowBacktest(!showBacktest)}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                showBacktest ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <BarChart3 size={20} />
              Backtest
            </button>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="text-green-500" size={20} />
                  <span className="text-sm text-green-500">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="text-red-500" size={20} />
                  <span className="text-sm text-red-500">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main trading area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pair selector */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex gap-2 mb-4">
                {TRADING_PAIRS.map((pair) => (
                  <button
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className={`px-4 py-2 rounded transition-colors ${
                      selectedPair === pair
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>

              {/* Price display */}
              {ticker && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-400">Last Price</div>
                    <div className="text-2xl font-bold">${ticker.last.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">24h Change</div>
                    <div className={`text-xl font-medium flex items-center gap-1 ${
                      ticker.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {ticker.change24h >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      {ticker.change24h.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">24h Volume</div>
                    <div className="text-xl">${ticker.volume24h.toLocaleString()}</div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <SimpleCandlestickChart symbol={selectedPair} />
            </div>

            {/* Positions */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">Open Positions</h2>
              <PositionsList />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order form */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">Place Order</h2>
              {ticker && (
                <OrderForm
                  symbol={selectedPair}
                  currentPrice={ticker.last}
                  onOrderPlaced={handleOrderPlaced}
                />
              )}
            </div>

            {/* Balance */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">Account Balance</h2>
              <BalanceDisplay />
            </div>

            {/* Strategy Status */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">Auto Trading</h2>
              <StrategyStatus />
            </div>
          </div>
        </div>

        {/* Alert Manager - Full Width */}
        <div className="mt-6">
          <AlertManager />
        </div>

        {/* Performance Dashboard */}
        {showPerformance && (
          <div className="mt-6">
            <PerformanceDashboard />
          </div>
        )}

        {/* Backtest Panel */}
        {showBacktest && (
          <div className="mt-6">
            <BacktestPanel />
          </div>
        )}
      </div>
    </div>
  );
}