'use client';

import { useEffect, useState } from 'react';
import { Activity, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useTradingContext } from '@/context/TradingContext';

interface Signal {
  id: string;
  symbol: string;
  strategy: string;
  action: string;
  strength: number;
  indicators: any;
  timestamp: Date;
  executed: boolean;
}

export default function StrategyStatus() {
  const { isTradingEngineRunning, setIsTradingEngineRunning } = useTradingContext();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch('/api/signals/recent');
        if (response.ok) {
          const data = await response.json();
          setSignals(data);
        }
      } catch (error) {
        console.error('Failed to fetch signals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleEngine = async () => {
    try {
      const endpoint = isTradingEngineRunning ? '/api/engine/stop' : '/api/engine/start';
      const response = await fetch(endpoint, { method: 'POST' });
      if (response.ok) {
        setIsTradingEngineRunning(!isTradingEngineRunning);
      }
    } catch (error) {
      console.error('Failed to toggle engine:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading strategy status...</div>;
  }

  return (
    <div className="space-y-4">
      {/* エンジン制御 */}
      <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
        <div className="flex items-center gap-2">
          <Activity className={isTradingEngineRunning ? 'text-green-500' : 'text-gray-500'} />
          <span className="font-medium">
            Trading Engine: {isTradingEngineRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        <button
          onClick={toggleEngine}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            isTradingEngineRunning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isTradingEngineRunning ? 'Stop' : 'Start'} Engine
        </button>
      </div>

      {/* 最近のシグナル */}
      <div className="bg-gray-800 rounded p-4">
        <h3 className="font-medium mb-3">Recent Signals</h3>
        {signals.length === 0 ? (
          <p className="text-gray-500 text-sm">No signals yet</p>
        ) : (
          <div className="space-y-2">
            {signals.slice(0, 5).map((signal) => (
              <div
                key={signal.id}
                className="flex items-center justify-between p-2 bg-gray-700 rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  {signal.action === 'buy' ? (
                    <TrendingUp className="text-green-500" size={16} />
                  ) : signal.action === 'sell' ? (
                    <TrendingDown className="text-red-500" size={16} />
                  ) : (
                    <AlertCircle className="text-yellow-500" size={16} />
                  )}
                  <span className="font-medium">{signal.symbol}</span>
                  <span className="text-gray-400">{signal.strategy}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-400">Strength:</span>
                    <div className="w-16 h-2 bg-gray-600 rounded">
                      <div
                        className={`h-full rounded ${
                          signal.strength > 0.7 ? 'bg-green-500' : 
                          signal.strength > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${signal.strength * 100}%` }}
                      />
                    </div>
                  </div>
                  {signal.executed && (
                    <span className="text-xs bg-blue-600 px-2 py-1 rounded">Executed</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}