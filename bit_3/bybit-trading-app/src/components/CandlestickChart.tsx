'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// 動的インポートでSSRを無効化
const Chart = dynamic(
  () => import('./CandlestickChartContent').then(mod => mod.CandlestickChartContent),
  { ssr: false }
);

interface CandlestickChartProps {
  symbol: string;
  timeframe?: string;
}

export default function CandlestickChart({ symbol, timeframe = '5m' }: CandlestickChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/ohlcv/${symbol}?timeframe=${timeframe}&limit=100`);
        const ohlcv = await response.json();
        
        const chartData = ohlcv.map((candle: any) => ({
          date: new Date(candle.time),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));
        
        setData(chartData);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  if (loading) {
    return <div className="h-96 flex items-center justify-center">Loading chart...</div>;
  }

  if (data.length === 0) {
    return <div className="h-96 flex items-center justify-center">No data available</div>;
  }

  return <Chart data={data} />;
}