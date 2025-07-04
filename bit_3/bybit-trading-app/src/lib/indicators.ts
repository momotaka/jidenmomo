import * as TI from 'technicalindicators';

export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class TechnicalIndicators {
  // Simple Moving Average
  static sma(data: number[], period: number): number[] {
    return TI.SMA.calculate({ period, values: data });
  }

  // Exponential Moving Average
  static ema(data: number[], period: number): number[] {
    return TI.EMA.calculate({ period, values: data });
  }

  // Relative Strength Index
  static rsi(data: number[], period: number = 14): number[] {
    return TI.RSI.calculate({ period, values: data });
  }

  // MACD
  static macd(data: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    return TI.MACD.calculate({
      values: data,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
  }

  // Bollinger Bands
  static bollingerBands(data: number[], period = 20, stdDev = 2) {
    return TI.BollingerBands.calculate({
      period,
      values: data,
      stdDev,
    });
  }

  // Stochastic
  static stochastic(candles: Candle[], period = 14, signalPeriod = 3) {
    return TI.Stochastic.calculate({
      high: candles.map(c => c.high),
      low: candles.map(c => c.low),
      close: candles.map(c => c.close),
      period,
      signalPeriod,
    });
  }

  // Average True Range
  static atr(candles: Candle[], period = 14): number[] {
    return TI.ATR.calculate({
      high: candles.map(c => c.high),
      low: candles.map(c => c.low),
      close: candles.map(c => c.close),
      period,
    });
  }

  // Volume Weighted Average Price
  static vwap(candles: Candle[]): number[] {
    const vwapValues: number[] = [];
    let cumulativeVolume = 0;
    let cumulativeVolumePrice = 0;

    for (const candle of candles) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      cumulativeVolume += candle.volume;
      cumulativeVolumePrice += typicalPrice * candle.volume;
      vwapValues.push(cumulativeVolumePrice / cumulativeVolume);
    }

    return vwapValues;
  }

  // Support and Resistance levels
  static supportResistance(candles: Candle[], lookback = 20) {
    const highs = candles.slice(-lookback).map(c => c.high);
    const lows = candles.slice(-lookback).map(c => c.low);

    const resistance = Math.max(...highs);
    const support = Math.min(...lows);
    const pivot = (resistance + support + candles[candles.length - 1].close) / 3;

    return {
      resistance,
      support,
      pivot,
      r1: 2 * pivot - support,
      s1: 2 * pivot - resistance,
    };
  }

  // Trend detection
  static detectTrend(prices: number[], shortPeriod = 20, longPeriod = 50): 'uptrend' | 'downtrend' | 'sideways' {
    const shortMA = this.sma(prices, shortPeriod);
    const longMA = this.sma(prices, longPeriod);

    if (shortMA.length === 0 || longMA.length === 0) return 'sideways';

    const latestShortMA = shortMA[shortMA.length - 1];
    const latestLongMA = longMA[longMA.length - 1];
    const currentPrice = prices[prices.length - 1];

    if (latestShortMA > latestLongMA && currentPrice > latestShortMA) {
      return 'uptrend';
    } else if (latestShortMA < latestLongMA && currentPrice < latestShortMA) {
      return 'downtrend';
    }

    return 'sideways';
  }

  // Generate trading signals
  static generateSignals(candles: Candle[]) {
    const closes = candles.map(c => c.close);
    
    // Calculate indicators
    const rsi = this.rsi(closes);
    const macdResult = this.macd(closes);
    const bb = this.bollingerBands(closes);
    const sma20 = this.sma(closes, 20);
    const sma50 = this.sma(closes, 50);
    
    const latestCandle = candles[candles.length - 1];
    const latestRSI = rsi[rsi.length - 1];
    const latestMACD = macdResult[macdResult.length - 1];
    const latestBB = bb[bb.length - 1];
    
    const signals = {
      rsi: {
        value: latestRSI,
        signal: latestRSI < 30 ? 'buy' : latestRSI > 70 ? 'sell' : 'neutral',
      },
      macd: {
        value: latestMACD,
        signal: latestMACD && latestMACD.MACD > latestMACD.signal ? 'buy' : 'sell',
      },
      bollingerBands: {
        value: latestBB,
        signal: latestCandle.close < latestBB?.lower ? 'buy' : 
                latestCandle.close > latestBB?.upper ? 'sell' : 'neutral',
      },
      trend: this.detectTrend(closes),
    };

    // Overall signal strength (0-1)
    let buySignals = 0;
    let sellSignals = 0;
    
    if (signals.rsi.signal === 'buy') buySignals++;
    if (signals.rsi.signal === 'sell') sellSignals++;
    if (signals.macd.signal === 'buy') buySignals++;
    if (signals.macd.signal === 'sell') sellSignals++;
    if (signals.bollingerBands.signal === 'buy') buySignals++;
    if (signals.bollingerBands.signal === 'sell') sellSignals++;
    
    const totalSignals = 3;
    const action = buySignals > sellSignals ? 'buy' : 
                   sellSignals > buySignals ? 'sell' : 'hold';
    const strength = Math.max(buySignals, sellSignals) / totalSignals;

    return {
      action,
      strength,
      indicators: signals,
    };
  }
}