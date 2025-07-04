import ccxt from 'ccxt';
import { TradingPair, Order, Position, AccountBalance } from '@/types/trading';

export class BybitClient {
  private exchange: ccxt.bybit;
  
  constructor() {
    this.exchange = new ccxt.bybit({
      apiKey: process.env.BYBIT_API_KEY,
      secret: process.env.BYBIT_API_SECRET,
      enableRateLimit: true,
      options: {
        defaultType: 'future', // USDT perpetual futures
      }
    });
    
    if (process.env.BYBIT_TESTNET === 'true') {
      this.exchange.urls.api = {
        public: 'https://api-testnet.bybit.com',
        private: 'https://api-testnet.bybit.com',
      };
    }
  }

  async getTicker(symbol: string): Promise<TradingPair> {
    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      return {
        symbol: ticker.symbol,
        bid: ticker.bid || 0,
        ask: ticker.ask || 0,
        last: ticker.last || 0,
        timestamp: new Date(ticker.timestamp),
        volume24h: ticker.quoteVolume || 0,
        change24h: ticker.percentage || 0,
      };
    } catch (error) {
      console.error('Error fetching ticker:', error);
      throw error;
    }
  }

  async getBalance(): Promise<AccountBalance[]> {
    try {
      const balance = await this.exchange.fetchBalance();
      return Object.entries(balance.total)
        .filter(([_, amount]) => amount > 0)
        .map(([coin, total]) => ({
          coin,
          free: balance.free[coin] || 0,
          used: balance.used[coin] || 0,
          total: total as number,
        }));
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw error;
    }
  }

  async createOrder(
    symbol: string,
    side: 'buy' | 'sell',
    type: 'market' | 'limit',
    amount: number,
    price?: number
  ): Promise<Order> {
    try {
      const order = await this.exchange.createOrder(
        symbol,
        type,
        side,
        amount,
        price
      );
      
      return {
        id: order.id,
        symbol: order.symbol,
        side: side,
        type: type,
        amount: order.amount,
        price: order.price,
        status: order.status === 'closed' ? 'filled' : 'pending',
        timestamp: new Date(order.timestamp),
      };
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const positions = await this.exchange.fetchPositions();
      return positions
        .filter((p: any) => p.contracts > 0)
        .map((p: any) => ({
          symbol: p.symbol,
          side: p.side as 'long' | 'short',
          size: p.contracts,
          entryPrice: p.entryPrice || 0,
          markPrice: p.markPrice || 0,
          pnl: p.unrealizedPnl || 0,
          pnlPercentage: p.percentage || 0,
          margin: p.initialMargin || 0,
        }));
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  async getOHLCV(symbol: string, timeframe = '1m', limit = 100) {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
      return ohlcv.map(candle => ({
        time: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
      }));
    } catch (error) {
      console.error('Error fetching OHLCV:', error);
      throw error;
    }
  }
}