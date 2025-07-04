export interface TradingPair {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  timestamp: Date;
  volume24h: number;
  change24h: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: number;
  price?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'failed';
  timestamp: Date;
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercentage: number;
  margin: number;
}

export interface AccountBalance {
  coin: string;
  free: number;
  used: number;
  total: number;
}