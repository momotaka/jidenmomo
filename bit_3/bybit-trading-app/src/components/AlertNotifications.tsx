'use client';

import { useAlerts } from '@/hooks/useAlerts';
import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function AlertNotifications() {
  const { alerts, dismissAlert } = useAlerts();
  const [visibleAlerts, setVisibleAlerts] = useState<string[]>([]);

  useEffect(() => {
    // 新しいアラートを表示
    alerts.forEach(alert => {
      if (!visibleAlerts.includes(alert.id)) {
        setVisibleAlerts(prev => [...prev, alert.id]);
        
        // 10秒後に自動的に非表示
        setTimeout(() => {
          setVisibleAlerts(prev => prev.filter(id => id !== alert.id));
        }, 10000);
      }
    });
  }, [alerts]);

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      default:
        return <Info className="text-blue-500" size={20} />;
    }
  };

  const getAlertStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'border-red-500 bg-red-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-900/20';
      default:
        return 'border-blue-500 bg-blue-900/20';
    }
  };

  const displayedAlerts = alerts.filter(alert => visibleAlerts.includes(alert.id));

  if (displayedAlerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {displayedAlerts.map(alert => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border backdrop-blur-sm shadow-lg transition-all duration-300 ${getAlertStyles(alert.severity)}`}
          style={{
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <div className="flex items-start gap-3">
            {getAlertIcon(alert.severity)}
            <div className="flex-1">
              <h4 className="font-medium text-white">{alert.title}</h4>
              <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
              {alert.symbol && (
                <p className="text-xs text-gray-400 mt-1">{alert.symbol}</p>
              )}
            </div>
            <button
              onClick={() => {
                setVisibleAlerts(prev => prev.filter(id => id !== alert.id));
                dismissAlert(alert.id);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}