import { prisma } from './database';
import { BybitClient } from './bybit-client';
import { DataCollector } from './data-collector';
import { BaseStrategy } from './strategies/base-strategy';
import { MACrossoverStrategy } from './strategies/ma-crossover-strategy';
import { RSIStrategy } from './strategies/rsi-strategy';
import { Candle } from './indicators';

export interface TradingConfig {
  symbols: string[];
  strategies: BaseStrategy[];
  checkInterval: number; // milliseconds
  paperTrading: boolean;
  maxConcurrentPositions: number;
}

export class TradingEngine {
  private client: BybitClient;
  private dataCollector: DataCollector;
  private config: TradingConfig;
  private isRunning: boolean = false;
  private checkInterval?: NodeJS.Timer;

  constructor(config: TradingConfig) {
    this.config = config;
    this.client = new BybitClient();
    this.dataCollector = new DataCollector(config.symbols);
  }

  async start() {
    if (this.isRunning) {
      console.log('Trading engine is already running');
      return;
    }

    console.log('Starting trading engine...');
    this.isRunning = true;

    // データ収集を開始
    await this.dataCollector.start();

    // 初回チェック
    await this.checkStrategies();

    // 定期的なストラテジーチェック
    this.checkInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.checkStrategies();
      }
    }, this.config.checkInterval);

    console.log('Trading engine started');
  }

  stop() {
    console.log('Stopping trading engine...');
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.dataCollector.stop();
    console.log('Trading engine stopped');
  }

  private async checkStrategies() {
    for (const symbol of this.config.symbols) {
      try {
        // 現在の価格を取得
        const ticker = await this.client.getTicker(symbol);
        const currentPrice = ticker.last;

        // 履歴データを取得
        const candles = await this.getCandles(symbol, '5m', 100);
        
        if (candles.length < 50) {
          console.log(`Not enough data for ${symbol}`);
          continue;
        }

        // 現在のポジションをチェック
        const positions = await this.client.getPositions();
        const currentPosition = positions.find(p => p.symbol === symbol);

        // 各ストラテジーでシグナルを生成
        for (const strategy of this.config.strategies) {
          const signal = await strategy.analyze(candles, currentPrice);
          
          // シグナルをデータベースに保存
          await prisma.signal.create({
            data: {
              symbol,
              strategy: strategy.getName(),
              action: signal.action,
              strength: signal.strength,
              indicators: signal.indicators,
              timestamp: new Date(),
            },
          });

          // 強いシグナルの場合のみ実行
          if (signal.strength >= 0.7 && signal.action !== 'hold') {
            await this.executeSignal(symbol, signal, strategy, currentPrice, currentPosition);
          }
        }
      } catch (error) {
        console.error(`Error checking strategies for ${symbol}:`, error);
      }
    }
  }

  private async getCandles(symbol: string, timeframe: string, limit: number): Promise<Candle[]> {
    const dbCandles = await prisma.candle.findMany({
      where: { symbol, timeframe },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return dbCandles.reverse().map(c => ({
      timestamp: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));
  }

  private async executeSignal(
    symbol: string,
    signal: any,
    strategy: BaseStrategy,
    currentPrice: number,
    currentPosition: any
  ) {
    try {
      // ポジションの制限チェック
      const positions = await this.client.getPositions();
      if (positions.length >= this.config.maxConcurrentPositions && !currentPosition) {
        console.log('Max concurrent positions reached');
        return;
      }

      // 既存ポジションがある場合の処理
      if (currentPosition) {
        // 反対のシグナルの場合はポジションをクローズ
        if ((currentPosition.side === 'long' && signal.action === 'sell') ||
            (currentPosition.side === 'short' && signal.action === 'buy')) {
          console.log(`Closing position for ${symbol}`);
          // ポジションクローズの実装
          return;
        }
      }

      // 残高を取得
      const balances = await this.client.getBalance();
      const usdtBalance = balances.find(b => b.coin === 'USDT');
      
      if (!usdtBalance || usdtBalance.free < 10) {
        console.log('Insufficient balance');
        return;
      }

      // ポジションサイズを計算
      const positionSize = strategy.calculatePositionSize(
        signal,
        usdtBalance.free,
        currentPrice
      );

      // 注文パラメータ
      const orderParams = {
        symbol,
        side: signal.action as 'buy' | 'sell',
        type: 'market' as const,
        amount: positionSize / currentPrice, // BTCなどの数量に変換
        price: undefined,
        stopLoss: signal.stopLoss,
        takeProfit: signal.takeProfit,
      };

      // リスク評価
      if (!strategy.evaluateRisk(orderParams, usdtBalance.free)) {
        console.log('Risk evaluation failed');
        return;
      }

      // ペーパートレーディングモード
      if (this.config.paperTrading) {
        console.log('Paper trade:', orderParams);
        await prisma.trade.create({
          data: {
            orderId: `paper-${Date.now()}`,
            symbol,
            side: orderParams.side,
            type: orderParams.type,
            amount: orderParams.amount,
            price: currentPrice,
            executedPrice: currentPrice,
            status: 'filled',
            strategy: strategy.getName(),
            timestamp: new Date(),
          },
        });
      } else {
        // 実際の注文を実行
        const order = await this.client.createOrder(
          symbol,
          orderParams.side,
          orderParams.type,
          orderParams.amount,
          orderParams.price
        );

        // 注文情報を保存
        await prisma.trade.create({
          data: {
            orderId: order.id,
            symbol: order.symbol,
            side: order.side,
            type: order.type,
            amount: order.amount,
            price: order.price,
            executedPrice: order.price,
            status: order.status,
            strategy: strategy.getName(),
            timestamp: order.timestamp,
          },
        });

        console.log(`Order executed: ${order.id}`);
      }
    } catch (error) {
      console.error('Error executing signal:', error);
    }
  }

  // パフォーマンス分析
  async getPerformanceMetrics(strategy?: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trades = await prisma.trade.findMany({
      where: {
        timestamp: { gte: startDate },
        ...(strategy && { strategy }),
      },
      orderBy: { timestamp: 'asc' },
    });

    const positions = await prisma.position.findMany({
      where: {
        openTime: { gte: startDate },
        closedPrice: { not: null },
      },
    });

    let totalProfit = 0;
    let totalLoss = 0;
    let winningTrades = 0;
    let losingTrades = 0;

    positions.forEach(position => {
      const pnl = position.realizedPnl || 0;
      if (pnl > 0) {
        totalProfit += pnl;
        winningTrades++;
      } else {
        totalLoss += Math.abs(pnl);
        losingTrades++;
      }
    });

    const totalTrades = winningTrades + losingTrades;
    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalProfit,
      totalLoss,
      profitFactor,
      netProfit: totalProfit - totalLoss,
    };
  }
}