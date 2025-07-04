'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TradingPair, Position, AccountBalance } from '@/types/trading';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAlerts } from '@/hooks/useAlerts';

interface TradingContextType {
  // 選択中の通貨ペア
  selectedPair: string;
  setSelectedPair: (pair: string) => void;
  
  // リアルタイム価格データ
  ticker: TradingPair | null;
  isConnected: boolean;
  
  // ポジション
  positions: Position[];
  refreshPositions: () => Promise<void>;
  
  // 残高
  balances: AccountBalance[];
  refreshBalances: () => Promise<void>;
  
  // アラート
  alerts: any[];
  
  // 自動取引状態
  isTradingEngineRunning: boolean;
  setIsTradingEngineRunning: (running: boolean) => void;
  
  // バックテスト結果
  backtestResults: any | null;
  setBacktestResults: (results: any) => void;
  
  // グローバル更新
  refreshAll: () => Promise<void>;
}

const TradingContext = createContext<TradingContextType | null>(null);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [positions, setPositions] = useState<Position[]>([]);
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [isTradingEngineRunning, setIsTradingEngineRunning] = useState(false);
  const [backtestResults, setBacktestResults] = useState(null);
  
  // WebSocketとアラートのフック
  const { ticker, isConnected } = useWebSocket(selectedPair);
  const { alerts } = useAlerts();
  
  // ポジション取得
  const refreshPositions = async () => {
    try {
      const response = await fetch('/api/positions');
      if (response.ok) {
        const data = await response.json();
        setPositions(data);
      }
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };
  
  // 残高取得
  const refreshBalances = async () => {
    try {
      const response = await fetch('/api/balance');
      if (response.ok) {
        const data = await response.json();
        setBalances(data);
      }
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    }
  };
  
  // 全データ更新
  const refreshAll = async () => {
    await Promise.all([
      refreshPositions(),
      refreshBalances(),
    ]);
  };
  
  // 初回ロードと定期更新
  useEffect(() => {
    refreshAll();
    
    const interval = setInterval(() => {
      refreshPositions();
      refreshBalances();
    }, 10000); // 10秒ごと
    
    return () => clearInterval(interval);
  }, []);
  
  // 通貨ペア変更時の処理
  useEffect(() => {
    // WebSocketが自動的に新しい通貨ペアに切り替わる
    console.log(`Switched to ${selectedPair}`);
  }, [selectedPair]);
  
  const value: TradingContextType = {
    selectedPair,
    setSelectedPair,
    ticker,
    isConnected,
    positions,
    refreshPositions,
    balances,
    refreshBalances,
    alerts,
    isTradingEngineRunning,
    setIsTradingEngineRunning,
    backtestResults,
    setBacktestResults,
    refreshAll,
  };
  
  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
}

export const useTradingContext = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTradingContext must be used within TradingProvider');
  }
  return context;
};