import { BaseStrategy, Signal, RiskParams } from './base-strategy';
import { Candle, TechnicalIndicators } from '@/lib/indicators';

export class RSIStrategy extends BaseStrategy {
  private period: number;
  private oversoldLevel: number;
  private overboughtLevel: number;

  constructor(
    period = 14,
    oversoldLevel = 30,
    overboughtLevel = 70,
    riskParams: RiskParams = {
      maxPositionSize: 0.1,
      maxDrawdown: 0.2,
      riskPerTrade: 0.02,
      leverage: 1,
    }
  ) {
    super('RSI Strategy', riskParams);
    this.period = period;
    this.oversoldLevel = oversoldLevel;
    this.overboughtLevel = overboughtLevel;
  }

  async analyze(candles: Candle[], currentPrice: number): Promise<Signal> {
    if (candles.length < this.period + 1) {
      return {
        action: 'hold',
        strength: 0,
        reason: 'Not enough data',
        indicators: {},
      };
    }

    const closes = candles.map(c => c.close);
    const rsiValues = TechnicalIndicators.rsi(closes, this.period);
    const currentRSI = rsiValues[rsiValues.length - 1];
    const prevRSI = rsiValues[rsiValues.length - 2];
    
    // Bollinger Bandsを追加の確認指標として使用
    const bb = TechnicalIndicators.bollingerBands(closes);
    const currentBB = bb[bb.length - 1];
    
    // ATRでボラティリティを測定
    const atr = TechnicalIndicators.atr(candles, 14);
    const currentATR = atr[atr.length - 1];
    
    // RSIダイバージェンスのチェック
    const checkDivergence = this.checkRSIDivergence(candles, rsiValues);
    
    // 売られすぎからの反転（買いシグナル）
    if (currentRSI < this.oversoldLevel) {
      const strength = (this.oversoldLevel - currentRSI) / this.oversoldLevel;
      const stopLoss = currentPrice - (2 * currentATR);
      const takeProfit = currentPrice + (3 * currentATR);
      
      // Bollinger Bandsの下限を下回っていればより強いシグナル
      const bbConfirmation = currentPrice < currentBB?.lower;
      
      return {
        action: 'buy',
        strength: bbConfirmation ? Math.min(strength * 1.2, 1) : strength,
        price: currentPrice,
        stopLoss,
        takeProfit,
        reason: `RSI oversold at ${currentRSI.toFixed(2)}${bbConfirmation ? ' and below BB lower band' : ''}${checkDivergence.bullish ? ' with bullish divergence' : ''}`,
        indicators: {
          rsi: currentRSI,
          prevRSI,
          bollingerBands: currentBB,
          divergence: checkDivergence,
        },
      };
    }
    
    // 買われすぎからの反転（売りシグナル）
    if (currentRSI > this.overboughtLevel) {
      const strength = (currentRSI - this.overboughtLevel) / (100 - this.overboughtLevel);
      const stopLoss = currentPrice + (2 * currentATR);
      const takeProfit = currentPrice - (3 * currentATR);
      
      // Bollinger Bandsの上限を上回っていればより強いシグナル
      const bbConfirmation = currentPrice > currentBB?.upper;
      
      return {
        action: 'sell',
        strength: bbConfirmation ? Math.min(strength * 1.2, 1) : strength,
        price: currentPrice,
        stopLoss,
        takeProfit,
        reason: `RSI overbought at ${currentRSI.toFixed(2)}${bbConfirmation ? ' and above BB upper band' : ''}${checkDivergence.bearish ? ' with bearish divergence' : ''}`,
        indicators: {
          rsi: currentRSI,
          prevRSI,
          bollingerBands: currentBB,
          divergence: checkDivergence,
        },
      };
    }
    
    // RSIが中立ゾーンに戻った場合のトレンドフォロー
    if (prevRSI < this.oversoldLevel && currentRSI > this.oversoldLevel) {
      return {
        action: 'buy',
        strength: 0.5,
        price: currentPrice,
        stopLoss: currentPrice - (1.5 * currentATR),
        takeProfit: currentPrice + (2 * currentATR),
        reason: `RSI crossed above oversold level (${this.oversoldLevel})`,
        indicators: { rsi: currentRSI, prevRSI },
      };
    }
    
    if (prevRSI > this.overboughtLevel && currentRSI < this.overboughtLevel) {
      return {
        action: 'sell',
        strength: 0.5,
        price: currentPrice,
        stopLoss: currentPrice + (1.5 * currentATR),
        takeProfit: currentPrice - (2 * currentATR),
        reason: `RSI crossed below overbought level (${this.overboughtLevel})`,
        indicators: { rsi: currentRSI, prevRSI },
      };
    }
    
    return {
      action: 'hold',
      strength: Math.abs(currentRSI - 50) / 50, // 50から離れるほど強い
      reason: `RSI at ${currentRSI.toFixed(2)} - neutral zone`,
      indicators: {
        rsi: currentRSI,
        trend: currentRSI > 50 ? 'bullish' : 'bearish',
      },
    };
  }

  private checkRSIDivergence(candles: Candle[], rsiValues: number[], lookback = 20) {
    if (candles.length < lookback || rsiValues.length < lookback) {
      return { bullish: false, bearish: false };
    }
    
    const recentCandles = candles.slice(-lookback);
    const recentRSI = rsiValues.slice(-lookback);
    
    // 価格の高値・安値を見つける
    let priceHighIndex = 0;
    let priceLowIndex = 0;
    
    for (let i = 1; i < recentCandles.length; i++) {
      if (recentCandles[i].high > recentCandles[priceHighIndex].high) {
        priceHighIndex = i;
      }
      if (recentCandles[i].low < recentCandles[priceLowIndex].low) {
        priceLowIndex = i;
      }
    }
    
    // RSIの高値・安値を見つける
    let rsiHighIndex = 0;
    let rsiLowIndex = 0;
    
    for (let i = 1; i < recentRSI.length; i++) {
      if (recentRSI[i] > recentRSI[rsiHighIndex]) {
        rsiHighIndex = i;
      }
      if (recentRSI[i] < recentRSI[rsiLowIndex]) {
        rsiLowIndex = i;
      }
    }
    
    // ダイバージェンスの検出
    const bullishDivergence = priceLowIndex > lookback / 2 && 
                             rsiLowIndex < priceLowIndex &&
                             recentRSI[recentRSI.length - 1] > recentRSI[rsiLowIndex];
    
    const bearishDivergence = priceHighIndex > lookback / 2 && 
                             rsiHighIndex < priceHighIndex &&
                             recentRSI[recentRSI.length - 1] < recentRSI[rsiHighIndex];
    
    return {
      bullish: bullishDivergence,
      bearish: bearishDivergence,
    };
  }
}