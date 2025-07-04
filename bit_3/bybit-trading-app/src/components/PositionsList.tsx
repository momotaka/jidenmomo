'use client';

import { useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTradingContext } from '@/context/TradingContext';

export default function PositionsList() {
  const { positions, refreshPositions } = useTradingContext();
  
  useEffect(() => {
    // 初回ロード
    refreshPositions();
  }, []);

  // loading ステートを削除

  if (positions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No open positions
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-2 px-2">Symbol</th>
            <th className="text-left py-2 px-2">Side</th>
            <th className="text-right py-2 px-2">Size</th>
            <th className="text-right py-2 px-2">Entry</th>
            <th className="text-right py-2 px-2">Mark</th>
            <th className="text-right py-2 px-2">PnL</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position) => (
            <tr key={position.symbol} className="border-b border-gray-800">
              <td className="py-2 px-2 font-medium">{position.symbol}</td>
              <td className="py-2 px-2">
                <span className={`inline-flex items-center gap-1 ${
                  position.side === 'long' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {position.side === 'long' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {position.side}
                </span>
              </td>
              <td className="text-right py-2 px-2">{position.size}</td>
              <td className="text-right py-2 px-2">${position.entryPrice.toFixed(2)}</td>
              <td className="text-right py-2 px-2">${position.markPrice.toFixed(2)}</td>
              <td className={`text-right py-2 px-2 font-medium ${
                position.pnl >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                ${position.pnl.toFixed(2)}
                <span className="text-xs ml-1">
                  ({position.pnlPercentage >= 0 ? '+' : ''}{position.pnlPercentage.toFixed(2)}%)
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}