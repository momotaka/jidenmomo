'use client';

import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { TradingPair } from '@/types/trading';

export function useWebSocket(symbol: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [ticker, setTicker] = useState<TradingPair | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      socketInstance.emit('subscribe', symbol);
    });

    socketInstance.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('ticker', (data: TradingPair) => {
      setTicker(data);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.emit('unsubscribe');
      socketInstance.disconnect();
    };
  }, [symbol]);

  return { socket, ticker, isConnected };
}