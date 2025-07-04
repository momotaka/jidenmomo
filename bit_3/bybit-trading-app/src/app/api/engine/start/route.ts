import { NextResponse } from 'next/server';
import { TradingEngine } from '@/lib/trading-engine';
import { MACrossoverStrategy } from '@/lib/strategies/ma-crossover-strategy';
import { RSIStrategy } from '@/lib/strategies/rsi-strategy';

// グローバルインスタンスを保持
let engine: TradingEngine | null = null;

export async function POST() {
  try {
    if (engine) {
      return NextResponse.json(
        { error: 'Engine is already running' },
        { status: 400 }
      );
    }

    // 戦略の設定
    const strategies = [
      new MACrossoverStrategy(20, 50),
      new RSIStrategy(14, 30, 70),
    ];

    // エンジンの設定
    engine = new TradingEngine({
      symbols: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
      strategies,
      checkInterval: 60000, // 1分ごと
      paperTrading: true, // ペーパートレーディングモード
      maxConcurrentPositions: 3,
    });

    await engine.start();
    
    return NextResponse.json({ status: 'started' });
  } catch (error) {
    console.error('Failed to start engine:', error);
    return NextResponse.json(
      { error: 'Failed to start engine' },
      { status: 500 }
    );
  }
}

// エンジンインスタンスをエクスポート（停止用）
export { engine };