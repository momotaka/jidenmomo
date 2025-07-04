'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  symbol?: string;
  timestamp: Date;
}

export function useAlerts() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('Alert WebSocket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Alert WebSocket disconnected');
      setIsConnected(false);
    });

    // アラート受信
    socketInstance.on('alert', (alertData: any) => {
      const alert: Alert = {
        id: alertData.id || Date.now().toString(),
        title: alertData.title,
        message: alertData.message,
        severity: alertData.severity || 'info',
        symbol: alertData.symbol,
        timestamp: new Date(),
      };

      setAlerts(prev => [alert, ...prev].slice(0, 50)); // 最新50件を保持

      // ブラウザ通知
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(alert.title, {
          body: alert.message,
          icon: '/icon.png',
          tag: alert.id,
        });
      }

      // 音声通知（重要度が高い場合）
      if (alert.severity === 'critical' || alert.severity === 'error') {
        playAlertSound();
      }
    });

    setSocket(socketInstance);

    // 通知権限のリクエスト
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const playAlertSound = () => {
    // 簡単なビープ音を生成
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // 周波数
    gainNode.gain.value = 0.1; // 音量

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2); // 0.2秒間
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  return {
    alerts,
    isConnected,
    clearAlerts,
    dismissAlert,
  };
}