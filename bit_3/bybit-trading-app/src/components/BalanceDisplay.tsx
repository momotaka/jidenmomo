'use client';

import { useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { useTradingContext } from '@/context/TradingContext';

export default function BalanceDisplay() {
  const { balances, refreshBalances } = useTradingContext();
  
  useEffect(() => {
    // 初回ロード
    refreshBalances();
  }, []);

  // loading ステートを削除

  return (
    <div className="space-y-2">
      {balances.map((balance) => (
        <div key={balance.coin} className="flex items-center justify-between p-3 bg-gray-800 rounded">
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-gray-400" />
            <span className="font-medium">{balance.coin}</span>
          </div>
          <div className="text-right">
            <div className="font-medium">{balance.free.toFixed(4)}</div>
            <div className="text-xs text-gray-500">
              Total: {balance.total.toFixed(4)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}