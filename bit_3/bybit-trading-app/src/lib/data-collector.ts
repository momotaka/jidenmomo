import { prisma } from './database';
import { BybitClient } from './bybit-client';

export class DataCollector {
  private client: BybitClient;
  private symbols: string[];
  private intervals: { [key: string]: NodeJS.Timer } = {};

  constructor(symbols: string[]) {
    this.client = new BybitClient();
    this.symbols = symbols;
  }

  async start() {
    console.log('Starting data collection for:', this.symbols);
    
    for (const symbol of this.symbols) {
      // 初回データ取得
      await this.collectCandles(symbol);
      await this.collectCurrentData(symbol);
      
      // 定期的なデータ収集（1分ごと）
      this.intervals[symbol] = setInterval(async () => {
        await this.collectCandles(symbol);
        await this.collectCurrentData(symbol);
      }, 60000); // 1分ごと
    }
    
    // 残高情報の定期収集（5分ごと）
    await this.collectBalance();
    this.intervals['balance'] = setInterval(async () => {
      await this.collectBalance();
    }, 300000); // 5分ごと
  }

  stop() {
    Object.values(this.intervals).forEach(interval => clearInterval(interval));
    this.intervals = {};
    console.log('Data collection stopped');
  }

  private async collectCandles(symbol: string) {
    try {
      const timeframes = ['1m', '5m', '15m', '1h'];
      
      for (const timeframe of timeframes) {
        const ohlcv = await this.client.getOHLCV(symbol, timeframe, 100);
        
        for (const candle of ohlcv) {
          await prisma.candle.upsert({
            where: {
              symbol_timeframe_timestamp: {
                symbol,
                timeframe,
                timestamp: new Date(candle.time),
              },
            },
            update: {
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume,
            },
            create: {
              symbol,
              timeframe,
              timestamp: new Date(candle.time),
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume,
            },
          });
        }
      }
      
      console.log(`Collected candles for ${symbol}`);
    } catch (error) {
      console.error(`Error collecting candles for ${symbol}:`, error);
    }
  }

  private async collectCurrentData(symbol: string) {
    try {
      // 現在の価格情報
      const ticker = await this.client.getTicker(symbol);
      
      // 最新の1分足として保存
      await prisma.candle.create({
        data: {
          symbol,
          timeframe: 'current',
          timestamp: ticker.timestamp,
          open: ticker.last,
          high: ticker.last,
          low: ticker.last,
          close: ticker.last,
          volume: ticker.volume24h,
        },
      });
      
      // ポジション情報の更新
      const positions = await this.client.getPositions();
      for (const position of positions.filter(p => p.symbol === symbol)) {
        await prisma.position.upsert({
          where: { id: `${position.symbol}-${position.side}` },
          update: {
            currentPrice: position.markPrice,
            pnl: position.pnl,
            pnlPercent: position.pnlPercentage,
            updatedAt: new Date(),
          },
          create: {
            id: `${position.symbol}-${position.side}`,
            symbol: position.symbol,
            side: position.side,
            size: position.size,
            entryPrice: position.entryPrice,
            currentPrice: position.markPrice,
            pnl: position.pnl,
            pnlPercent: position.pnlPercentage,
            margin: position.margin,
            openTime: new Date(),
          },
        });
      }
    } catch (error) {
      console.error(`Error collecting current data for ${symbol}:`, error);
    }
  }

  private async collectBalance() {
    try {
      const balances = await this.client.getBalance();
      const timestamp = new Date();
      
      for (const balance of balances) {
        await prisma.balance.create({
          data: {
            coin: balance.coin,
            free: balance.free,
            used: balance.used,
            total: balance.total,
            timestamp,
          },
        });
      }
      
      console.log('Collected balance data');
    } catch (error) {
      console.error('Error collecting balance:', error);
    }
  }

  async getHistoricalData(symbol: string, timeframe: string, limit: number) {
    return await prisma.candle.findMany({
      where: { symbol, timeframe },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}