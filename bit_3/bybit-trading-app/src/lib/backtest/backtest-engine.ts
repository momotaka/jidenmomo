import { prisma } from '@/lib/database';
import { BaseStrategy, Signal, OrderParams } from '@/lib/strategies/base-strategy';
import { Candle } from '@/lib/indicators';

export interface BacktestConfig {
  symbol: string;
  strategy: BaseStrategy;
  startDate: Date;
  endDate: Date;
  initialBalance: number;
  commission: number; // 手数料率 (0.001 = 0.1%)
  slippage: number; // スリッページ率
  spreadPercentage: number; // スプレッド率
  leverage: number;
  marginCallLevel: number; // マージンコールレベル（残高の％）
  liquidationLevel: number; // 強制清算レベル
}

export interface BacktestTrade {
  entryTime: Date;
  entryPrice: number;
  exitTime?: Date;
  exitPrice?: number;
  side: 'long' | 'short';
  size: number;
  commission: number;
  slippage: number;
  pnl?: number;
  pnlPercentage?: number;
  reason: string;
  signal: Signal;
}

export interface BacktestMetrics {
  // 基本統計
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  
  // 損益統計
  totalPnl: number;
  totalReturn: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  
  // リスク指標
  maxDrawdown: number;
  maxDrawdownDuration: number; // 日数
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  
  // 効率性指標
  profitFactor: number;
  expectancy: number;
  kellyPercentage: number;
  
  // 時系列データ
  equityCurve: { date: Date; balance: number; drawdown: number }[];
  monthlyReturns: { month: string; return: number }[];
  tradeDurations: number[]; // 各取引の保有時間（分）
}

export class BacktestEngine {
  private config: BacktestConfig;
  private candles: Candle[] = [];
  private trades: BacktestTrade[] = [];
  private currentPosition: BacktestTrade | null = null;
  private balance: number;
  private equity: number;
  private peakEquity: number;
  private equityCurve: { date: Date; balance: number; drawdown: number }[] = [];

  constructor(config: BacktestConfig) {
    this.config = config;
    this.balance = config.initialBalance;
    this.equity = config.initialBalance;
    this.peakEquity = config.initialBalance;
  }

  async loadHistoricalData(): Promise<void> {
    const candleData = await prisma.candle.findMany({
      where: {
        symbol: this.config.symbol,
        timeframe: '5m',
        timestamp: {
          gte: this.config.startDate,
          lte: this.config.endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    this.candles = candleData.map(c => ({
      timestamp: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));

    if (this.candles.length === 0) {
      throw new Error('No historical data found for the specified period');
    }
  }

  async run(): Promise<BacktestMetrics> {
    await this.loadHistoricalData();
    
    // ウォームアップ期間（最初の100本は指標計算用）
    const warmupPeriod = 100;
    
    for (let i = warmupPeriod; i < this.candles.length; i++) {
      const currentCandle = this.candles[i];
      const historicalCandles = this.candles.slice(0, i + 1);
      
      // マージンコール・強制清算チェック
      if (this.checkMarginCall(currentCandle.close)) {
        continue;
      }
      
      // 既存ポジションの管理
      if (this.currentPosition) {
        this.updatePosition(currentCandle);
      }
      
      // 新規シグナルの生成
      const signal = await this.config.strategy.analyze(
        historicalCandles,
        currentCandle.close
      );
      
      // シグナルに基づいた取引実行
      if (signal.strength >= 0.7) {
        this.executeSignal(signal, currentCandle);
      }
      
      // エクイティカーブの記録
      this.recordEquity(currentCandle.timestamp);
    }
    
    // 未決済ポジションのクローズ
    if (this.currentPosition) {
      this.closePosition(
        this.candles[this.candles.length - 1],
        'Backtest end'
      );
    }
    
    return this.calculateMetrics();
  }

  private executeSignal(signal: Signal, candle: Candle): void {
    // 既存ポジションと反対のシグナルの場合、まずクローズ
    if (this.currentPosition) {
      if ((this.currentPosition.side === 'long' && signal.action === 'sell') ||
          (this.currentPosition.side === 'short' && signal.action === 'buy')) {
        this.closePosition(candle, 'Signal reversal');
      } else {
        return; // 同じ方向のシグナルは無視
      }
    }
    
    if (signal.action === 'hold') return;
    
    // ポジションサイズの計算
    const positionSize = this.config.strategy.calculatePositionSize(
      signal,
      this.balance,
      candle.close
    );
    
    // リスク評価
    const orderParams: OrderParams = {
      symbol: this.config.symbol,
      side: signal.action as 'buy' | 'sell',
      type: 'market',
      amount: positionSize / candle.close,
      price: candle.close,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
    };
    
    if (!this.config.strategy.evaluateRisk(orderParams, this.balance)) {
      return;
    }
    
    // スリッページとスプレッドの計算
    const spread = candle.close * this.config.spreadPercentage;
    const slippage = candle.close * this.config.slippage;
    const entryPrice = signal.action === 'buy' 
      ? candle.close + spread/2 + slippage
      : candle.close - spread/2 - slippage;
    
    // 手数料の計算
    const commission = positionSize * this.config.commission;
    
    // 残高が不足している場合はスキップ
    if (this.balance < positionSize + commission) {
      return;
    }
    
    // ポジションのオープン
    this.currentPosition = {
      entryTime: candle.timestamp,
      entryPrice,
      side: signal.action === 'buy' ? 'long' : 'short',
      size: positionSize,
      commission,
      slippage,
      reason: signal.reason,
      signal,
    };
    
    this.balance -= commission;
  }

  private updatePosition(candle: Candle): void {
    if (!this.currentPosition) return;
    
    const { signal } = this.currentPosition;
    
    // ストップロスチェック
    if (signal.stopLoss) {
      if ((this.currentPosition.side === 'long' && candle.low <= signal.stopLoss) ||
          (this.currentPosition.side === 'short' && candle.high >= signal.stopLoss)) {
        this.closePosition(candle, 'Stop loss hit', signal.stopLoss);
        return;
      }
    }
    
    // テイクプロフィットチェック
    if (signal.takeProfit) {
      if ((this.currentPosition.side === 'long' && candle.high >= signal.takeProfit) ||
          (this.currentPosition.side === 'short' && candle.low <= signal.takeProfit)) {
        this.closePosition(candle, 'Take profit hit', signal.takeProfit);
        return;
      }
    }
  }

  private closePosition(candle: Candle, reason: string, exitPrice?: number): void {
    if (!this.currentPosition) return;
    
    // 出口価格の計算（スリッページとスプレッドを考慮）
    const spread = candle.close * this.config.spreadPercentage;
    const slippage = candle.close * this.config.slippage;
    
    if (!exitPrice) {
      exitPrice = this.currentPosition.side === 'long'
        ? candle.close - spread/2 - slippage
        : candle.close + spread/2 + slippage;
    }
    
    // PnLの計算
    const priceDiff = this.currentPosition.side === 'long'
      ? exitPrice - this.currentPosition.entryPrice
      : this.currentPosition.entryPrice - exitPrice;
    
    const pnl = (priceDiff / this.currentPosition.entryPrice) * this.currentPosition.size;
    const commission = this.currentPosition.size * this.config.commission;
    const netPnl = pnl - commission;
    
    // ポジションの記録
    this.currentPosition.exitTime = candle.timestamp;
    this.currentPosition.exitPrice = exitPrice;
    this.currentPosition.pnl = netPnl;
    this.currentPosition.pnlPercentage = (netPnl / this.currentPosition.size) * 100;
    
    this.trades.push({ ...this.currentPosition });
    this.balance += this.currentPosition.size + netPnl;
    this.currentPosition = null;
  }

  private checkMarginCall(currentPrice: number): boolean {
    if (!this.currentPosition) return false;
    
    // 未実現損益の計算
    const unrealizedPnl = this.calculateUnrealizedPnl(currentPrice);
    const currentEquity = this.balance + unrealizedPnl;
    
    // マージンコールレベルチェック
    if (currentEquity < this.config.initialBalance * this.config.marginCallLevel) {
      this.closePosition(
        this.candles.find(c => c.close === currentPrice)!,
        'Margin call'
      );
      return true;
    }
    
    // 強制清算レベルチェック
    if (currentEquity < this.config.initialBalance * this.config.liquidationLevel) {
      this.closePosition(
        this.candles.find(c => c.close === currentPrice)!,
        'Liquidation'
      );
      return true;
    }
    
    return false;
  }

  private calculateUnrealizedPnl(currentPrice: number): number {
    if (!this.currentPosition) return 0;
    
    const priceDiff = this.currentPosition.side === 'long'
      ? currentPrice - this.currentPosition.entryPrice
      : this.currentPosition.entryPrice - currentPrice;
    
    return (priceDiff / this.currentPosition.entryPrice) * this.currentPosition.size;
  }

  private recordEquity(timestamp: Date): void {
    const unrealizedPnl = this.currentPosition 
      ? this.calculateUnrealizedPnl(this.candles.find(c => c.timestamp === timestamp)!.close)
      : 0;
    
    this.equity = this.balance + unrealizedPnl;
    this.peakEquity = Math.max(this.peakEquity, this.equity);
    const drawdown = (this.peakEquity - this.equity) / this.peakEquity;
    
    this.equityCurve.push({
      date: timestamp,
      balance: this.equity,
      drawdown,
    });
  }

  private calculateMetrics(): BacktestMetrics {
    const winningTrades = this.trades.filter(t => t.pnl! > 0);
    const losingTrades = this.trades.filter(t => t.pnl! <= 0);
    
    // 基本統計
    const totalTrades = this.trades.length;
    const winRate = totalTrades > 0 ? winningTrades.length / totalTrades : 0;
    
    // 損益統計
    const totalPnl = this.trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalReturn = ((this.equity - this.config.initialBalance) / this.config.initialBalance) * 100;
    const averageWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.pnl!, 0) / winningTrades.length
      : 0;
    const averageLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + t.pnl!, 0) / losingTrades.length
      : 0;
    
    // リスク指標
    const maxDrawdown = Math.max(...this.equityCurve.map(e => e.drawdown));
    const returns = this.calculateReturns();
    const sharpeRatio = this.calculateSharpeRatio(returns);
    const sortinoRatio = this.calculateSortinoRatio(returns);
    
    // 効率性指標
    const profitFactor = averageLoss !== 0 
      ? Math.abs(winningTrades.reduce((sum, t) => sum + t.pnl!, 0) / losingTrades.reduce((sum, t) => sum + t.pnl!, 0))
      : 0;
    const expectancy = totalTrades > 0 ? totalPnl / totalTrades : 0;
    
    // Kelly基準
    const kellyPercentage = winRate > 0 && averageLoss !== 0
      ? (winRate * averageWin - (1 - winRate) * Math.abs(averageLoss)) / averageWin
      : 0;
    
    // 月次リターン
    const monthlyReturns = this.calculateMonthlyReturns();
    
    // 取引時間
    const tradeDurations = this.trades
      .filter(t => t.exitTime)
      .map(t => (t.exitTime!.getTime() - t.entryTime.getTime()) / 60000); // 分単位
    
    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      totalPnl,
      totalReturn,
      averageWin,
      averageLoss,
      largestWin: Math.max(...winningTrades.map(t => t.pnl!), 0),
      largestLoss: Math.min(...losingTrades.map(t => t.pnl!), 0),
      maxDrawdown: maxDrawdown * 100,
      maxDrawdownDuration: this.calculateMaxDrawdownDuration(),
      sharpeRatio,
      sortinoRatio,
      calmarRatio: totalReturn / (maxDrawdown * 100),
      profitFactor,
      expectancy,
      kellyPercentage,
      equityCurve: this.equityCurve,
      monthlyReturns,
      tradeDurations,
    };
  }

  private calculateReturns(): number[] {
    const returns: number[] = [];
    for (let i = 1; i < this.equityCurve.length; i++) {
      const dailyReturn = (this.equityCurve[i].balance - this.equityCurve[i-1].balance) / this.equityCurve[i-1].balance;
      returns.push(dailyReturn);
    }
    return returns;
  }

  private calculateSharpeRatio(returns: number[], riskFreeRate = 0): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    
    return stdDev > 0 ? (avgReturn - riskFreeRate) / stdDev * Math.sqrt(252) : 0; // 年率換算
  }

  private calculateSortinoRatio(returns: number[], riskFreeRate = 0): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const downside = returns.filter(r => r < 0);
    
    if (downside.length === 0) return 0;
    
    const downsideDev = Math.sqrt(
      downside.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downside.length
    );
    
    return downsideDev > 0 ? (avgReturn - riskFreeRate) / downsideDev * Math.sqrt(252) : 0;
  }

  private calculateMaxDrawdownDuration(): number {
    let maxDuration = 0;
    let currentDuration = 0;
    let inDrawdown = false;
    
    for (let i = 1; i < this.equityCurve.length; i++) {
      if (this.equityCurve[i].drawdown > 0) {
        if (!inDrawdown) {
          inDrawdown = true;
          currentDuration = 1;
        } else {
          currentDuration++;
        }
        maxDuration = Math.max(maxDuration, currentDuration);
      } else {
        inDrawdown = false;
        currentDuration = 0;
      }
    }
    
    return maxDuration;
  }

  private calculateMonthlyReturns(): { month: string; return: number }[] {
    const monthlyData: { [key: string]: { start: number; end: number } } = {};
    
    this.equityCurve.forEach(point => {
      const monthKey = `${point.date.getFullYear()}-${(point.date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { start: point.balance, end: point.balance };
      }
      monthlyData[monthKey].end = point.balance;
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      return: ((data.end - data.start) / data.start) * 100,
    }));
  }
}