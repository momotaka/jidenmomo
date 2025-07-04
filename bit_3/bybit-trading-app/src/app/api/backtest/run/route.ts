import { NextRequest, NextResponse } from 'next/server';
import { BacktestEngine } from '@/lib/backtest/backtest-engine';
import { MACrossoverStrategy } from '@/lib/strategies/ma-crossover-strategy';
import { RSIStrategy } from '@/lib/strategies/rsi-strategy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // ストラテジーの選択
    let strategy;
    switch (body.strategy) {
      case 'ma_crossover':
        strategy = new MACrossoverStrategy();
        break;
      case 'rsi':
        strategy = new RSIStrategy();
        break;
      default:
        strategy = new MACrossoverStrategy();
    }
    
    // バックテスト設定
    const config = {
      symbol: body.symbol,
      strategy,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      initialBalance: body.initialBalance,
      commission: body.commission,
      slippage: body.slippage,
      spreadPercentage: 0.001, // 0.1%
      leverage: body.leverage,
      marginCallLevel: 0.5,
      liquidationLevel: 0.2,
    };
    
    // バックテスト実行
    const engine = new BacktestEngine(config);
    const metrics = await engine.run();
    
    // レスポンス形式に変換
    const result = {
      metrics: {
        totalTrades: metrics.totalTrades,
        winningTrades: metrics.winningTrades,
        losingTrades: metrics.losingTrades,
        winRate: metrics.winRate,
        totalReturn: metrics.totalReturn,
        totalPnl: metrics.totalPnl,
        maxDrawdown: metrics.maxDrawdown,
        sharpeRatio: metrics.sharpeRatio,
        profitFactor: metrics.profitFactor,
        averageWin: metrics.averageWin,
        averageLoss: metrics.averageLoss,
      },
      equityCurve: metrics.equityCurve.map(point => ({
        date: point.date.toISOString().split('T')[0],
        balance: point.balance,
        drawdown: point.drawdown * 100,
      })),
      monthlyReturns: metrics.monthlyReturns,
      trades: [], // 簡略化のため省略
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Backtest error:', error);
    return NextResponse.json(
      { error: 'Failed to run backtest' },
      { status: 500 }
    );
  }
}