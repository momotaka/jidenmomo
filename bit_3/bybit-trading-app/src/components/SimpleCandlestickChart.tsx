'use client';

import { useEffect, useState } from 'react';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SimpleCandlestickChartProps {
  symbol: string;
  timeframe?: string;
}

export default function SimpleCandlestickChart({ symbol, timeframe = '5m' }: SimpleCandlestickChartProps) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/ohlcv/${symbol}?timeframe=${timeframe}&limit=50`);
        const data = await response.json();
        setCandles(data);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  if (loading) {
    return <div className="h-96 flex items-center justify-center">Loading chart...</div>;
  }

  if (candles.length === 0) {
    return <div className="h-96 flex items-center justify-center">No data available</div>;
  }

  // 価格の最高値と最安値を計算
  const prices = candles.flatMap(c => [c.high, c.low]);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  // チャートのサイズ
  const chartWidth = 800;
  const chartHeight = 400;
  const candleWidth = chartWidth / candles.length * 0.8;
  
  // 価格をY座標に変換
  const priceToY = (price: number) => {
    return chartHeight - ((price - minPrice + padding) / (priceRange + padding * 2) * chartHeight);
  };

  // インデックスをX座標に変換
  const indexToX = (index: number) => {
    return (index / candles.length) * chartWidth + candleWidth / 2;
  };

  return (
    <div className="relative">
      {/* ツールチップ */}
      {hoveredCandle && (
        <div className="absolute top-2 left-2 bg-gray-800 p-2 rounded text-sm border border-gray-600 z-10">
          <div>Time: {new Date(hoveredCandle.time).toLocaleString()}</div>
          <div className="text-green-400">O: ${hoveredCandle.open.toFixed(2)}</div>
          <div className="text-blue-400">H: ${hoveredCandle.high.toFixed(2)}</div>
          <div className="text-red-400">L: ${hoveredCandle.low.toFixed(2)}</div>
          <div className={hoveredCandle.close >= hoveredCandle.open ? 'text-green-400' : 'text-red-400'}>
            C: ${hoveredCandle.close.toFixed(2)}
          </div>
          <div className="text-gray-400">V: {hoveredCandle.volume.toFixed(2)}</div>
        </div>
      )}

      <svg width={chartWidth} height={chartHeight} className="bg-gray-900 rounded">
        {/* グリッドライン */}
        {[0, 1, 2, 3, 4].map(i => {
          const y = (i / 4) * chartHeight;
          const price = minPrice + padding + (priceRange + padding * 2) * (1 - i / 4);
          return (
            <g key={i}>
              <line
                x1={0}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="#374151"
                strokeDasharray="3,3"
              />
              <text
                x={chartWidth - 5}
                y={y - 5}
                fill="#9CA3AF"
                fontSize="12"
                textAnchor="end"
              >
                ${price.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* ローソク足 */}
        {candles.map((candle, index) => {
          const x = indexToX(index);
          const openY = priceToY(candle.open);
          const closeY = priceToY(candle.close);
          const highY = priceToY(candle.high);
          const lowY = priceToY(candle.low);
          const isGreen = candle.close >= candle.open;
          const color = isGreen ? '#10b981' : '#ef4444';
          
          return (
            <g
              key={index}
              onMouseEnter={() => setHoveredCandle(candle)}
              onMouseLeave={() => setHoveredCandle(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* 高値-安値の線（ヒゲ） */}
              <line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={color}
                strokeWidth={1}
              />
              
              {/* ローソク本体 */}
              <rect
                x={x - candleWidth / 2}
                y={Math.min(openY, closeY)}
                width={candleWidth}
                height={Math.abs(openY - closeY) || 1}
                fill={color}
                fillOpacity={isGreen ? 1 : 0.8}
              />
            </g>
          );
        })}

        {/* 最新価格ライン */}
        {candles.length > 0 && (
          <>
            <line
              x1={0}
              y1={priceToY(candles[candles.length - 1].close)}
              x2={chartWidth}
              y2={priceToY(candles[candles.length - 1].close)}
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="5,5"
            />
            <rect
              x={chartWidth - 80}
              y={priceToY(candles[candles.length - 1].close) - 10}
              width={75}
              height={20}
              fill="#3b82f6"
              rx={2}
            />
            <text
              x={chartWidth - 42}
              y={priceToY(candles[candles.length - 1].close) + 4}
              fill="white"
              fontSize="12"
              textAnchor="middle"
            >
              ${candles[candles.length - 1].close.toFixed(2)}
            </text>
          </>
        )}
      </svg>

      {/* 時間枠選択ボタン */}
      <div className="flex gap-2 mt-4">
        {['1m', '5m', '15m', '1h'].map(tf => (
          <button
            key={tf}
            className={`px-3 py-1 rounded text-sm ${
              timeframe === tf ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
            }`}
            onClick={() => window.location.search = `?timeframe=${tf}`}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
}