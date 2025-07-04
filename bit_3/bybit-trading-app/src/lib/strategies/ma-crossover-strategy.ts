import { BaseStrategy, Signal, RiskParams } from './base-strategy';
import { Candle, TechnicalIndicators } from '@/lib/indicators';

export class MACrossoverStrategy extends BaseStrategy {
  private shortPeriod: number;
  private longPeriod: number;

  constructor(
    shortPeriod = 20,
    longPeriod = 50,
    riskParams: RiskParams = {
      maxPositionSize: 0.1,
      maxDrawdown: 0.2,
      riskPerTrade: 0.02,
      leverage: 1,
    }
  ) {
    super('MA Crossover Strategy', riskParams);
    this.shortPeriod = shortPeriod;
    this.longPeriod = longPeriod;
  }

  async analyze(candles: Candle[], currentPrice: number): Promise<Signal> {
    if (candles.length < this.longPeriod + 1) {
      return {
        action: 'hold',
        strength: 0,
        reason: 'Not enough data',
        indicators: {},
      };
    }

    const closes = candles.map(c => c.close);
    const shortMA = TechnicalIndicators.sma(closes, this.shortPeriod);
    const longMA = TechnicalIndicators.sma(closes, this.longPeriod);
    
    // 最新の値を取得
    const currentShortMA = shortMA[shortMA.length - 1];
    const currentLongMA = longMA[longMA.length - 1];
    const prevShortMA = shortMA[shortMA.length - 2];
    const prevLongMA = longMA[longMA.length - 2];
    
    // RSIとATRを追加の確認指標として使用
    const rsi = TechnicalIndicators.rsi(closes);
    const atr = TechnicalIndicators.atr(candles, 14);
    const currentRSI = rsi[rsi.length - 1];
    const currentATR = atr[atr.length - 1];
    
    // ゴールデンクロス（買いシグナル）
    if (prevShortMA <= prevLongMA && currentShortMA > currentLongMA) {
      const stopLoss = currentPrice - (2 * currentATR);
      const takeProfit = currentPrice + (3 * currentATR);
      
      return {
        action: 'buy',
        strength: currentRSI < 70 ? 0.8 : 0.5, // RSIが70以下なら強い買いシグナル
        price: currentPrice,
        stopLoss,
        takeProfit,
        reason: `Golden cross detected. Short MA (${currentShortMA.toFixed(2)}) crossed above Long MA (${currentLongMA.toFixed(2)})`,
        indicators: {
          shortMA: currentShortMA,
          longMA: currentLongMA,
          rsi: currentRSI,
          atr: currentATR,
        },
      };
    }
    
    // デッドクロス（売りシグナル）
    if (prevShortMA >= prevLongMA && currentShortMA < currentLongMA) {
      const stopLoss = currentPrice + (2 * currentATR);
      const takeProfit = currentPrice - (3 * currentATR);
      
      return {
        action: 'sell',
        strength: currentRSI > 30 ? 0.8 : 0.5, // RSIが30以上なら強い売りシグナル
        price: currentPrice,
        stopLoss,
        takeProfit,
        reason: `Death cross detected. Short MA (${currentShortMA.toFixed(2)}) crossed below Long MA (${currentLongMA.toFixed(2)})`,
        indicators: {
          shortMA: currentShortMA,
          longMA: currentLongMA,
          rsi: currentRSI,
          atr: currentATR,
        },
      };
    }
    
    // トレンドの強さを評価
    const trend = TechnicalIndicators.detectTrend(closes, this.shortPeriod, this.longPeriod);
    const maDistance = Math.abs(currentShortMA - currentLongMA) / currentPrice;
    
    return {
      action: 'hold',
      strength: maDistance, // MAの乖離率を強度として使用
      reason: `No crossover. Trend: ${trend}`,
      indicators: {
        shortMA: currentShortMA,
        longMA: currentLongMA,
        rsi: currentRSI,
        trend,
      },
    };
  }
}