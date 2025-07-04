import { Candle } from '@/lib/indicators';
import { Order } from '@/types/trading';

export interface Signal {
  action: 'buy' | 'sell' | 'hold';
  strength: number; // 0-1
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  reason: string;
  indicators: any;
}

export interface OrderParams {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface RiskParams {
  maxPositionSize: number;
  maxDrawdown: number;
  riskPerTrade: number; // 取引ごとのリスク（残高の％）
  leverage: number;
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export abstract class BaseStrategy {
  protected name: string;
  protected riskParams: RiskParams;

  constructor(name: string, riskParams: RiskParams) {
    this.name = name;
    this.riskParams = riskParams;
  }

  abstract analyze(candles: Candle[], currentPrice: number): Promise<Signal>;

  calculatePositionSize(
    signal: Signal,
    balance: number,
    currentPrice: number
  ): number {
    // Kelly Criterion を簡略化したポジションサイジング
    const riskAmount = balance * this.riskParams.riskPerTrade;
    
    if (signal.stopLoss) {
      const stopDistance = Math.abs(currentPrice - signal.stopLoss);
      const stopPercentage = stopDistance / currentPrice;
      const positionSize = riskAmount / stopPercentage;
      
      // 最大ポジションサイズの制限
      return Math.min(positionSize, balance * this.riskParams.maxPositionSize);
    }
    
    // ストップロスがない場合は固定サイズ
    return balance * this.riskParams.riskPerTrade;
  }

  evaluateRisk(order: OrderParams, balance: number): boolean {
    // リスク評価
    const positionValue = order.amount * (order.price || 0);
    const maxAllowedPosition = balance * this.riskParams.maxPositionSize;
    
    if (positionValue > maxAllowedPosition) {
      console.log(`Position too large: ${positionValue} > ${maxAllowedPosition}`);
      return false;
    }
    
    // その他のリスクチェック
    return true;
  }

  getName(): string {
    return this.name;
  }
}