'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Plus, Edit2, Trash2, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useTradingContext } from '@/context/TradingContext';

interface AlertRule {
  id: string;
  name: string;
  description?: string;
  symbol?: string;
  type: string;
  condition: any;
  actions: any;
  enabled: boolean;
  priority: string;
  cooldown: number;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  symbol?: string;
  triggered: Date;
  acknowledged: boolean;
}

export default function AlertManager() {
  const { selectedPair } = useTradingContext();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
    fetchAlerts();
    
    const interval = setInterval(() => {
      fetchAlerts();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/alerts/rules');
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Failed to fetch alert rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts/recent');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      await fetch(`/api/alerts/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });
      fetchRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) return;
    
    try {
      await fetch(`/api/alerts/rules/${ruleId}`, {
        method: 'DELETE',
      });
      fetchRules();
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <AlertTriangle className="text-red-500" size={16} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={16} />;
      default:
        return <Info className="text-blue-500" size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* アラートルール管理 */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Bell className="text-blue-500" />
            Alert Rules
          </h3>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            New Rule
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading rules...</div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No alert rules configured
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 bg-gray-700 rounded hover:bg-gray-650 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleRule(rule.id, !rule.enabled)}
                    className={`p-1 rounded ${
                      rule.enabled ? 'text-green-500' : 'text-gray-500'
                    }`}
                  >
                    {rule.enabled ? <Bell size={20} /> : <BellOff size={20} />}
                  </button>
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-gray-400">
                      {rule.symbol || 'All symbols'} • {rule.type} • 
                      <span className={`ml-1 ${getPriorityColor(rule.priority)}`}>
                        {rule.priority}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 最近のアラート */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-bold mb-4">Recent Alerts</h3>
        
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No alerts triggered yet
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded border ${
                  alert.acknowledged
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-gray-750 border-gray-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(alert.severity)}
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-gray-400">
                        {alert.symbol && `${alert.symbol} • `}
                        {new Date(alert.triggered).toLocaleString()}
                      </div>
                      <div className="text-sm mt-1">{alert.message}</div>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="p-1 text-gray-400 hover:text-green-500"
                      title="Acknowledge"
                    >
                      <CheckCircle size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* アラート作成フォーム */}
      {showCreateForm && (
        <AlertRuleForm
          rule={editingRule}
          onClose={() => {
            setShowCreateForm(false);
            setEditingRule(null);
          }}
          onSave={() => {
            fetchRules();
            setShowCreateForm(false);
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
}

// アラートルール作成/編集フォーム
function AlertRuleForm({ 
  rule, 
  onClose, 
  onSave 
}: { 
  rule?: AlertRule | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const { selectedPair } = useTradingContext();
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    symbol: rule?.symbol || selectedPair,
    type: rule?.type || 'price',
    field: '',
    operator: 'gt',
    value: '',
    priority: rule?.priority || 'medium',
    cooldown: rule?.cooldown || 300,
    enabled: rule?.enabled ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const condition = {
      field: formData.field,
      operator: formData.operator,
      value: parseFloat(formData.value),
    };
    
    const ruleData = {
      name: formData.name,
      description: formData.description,
      symbol: formData.symbol || null,
      type: formData.type,
      condition,
      actions: [{ type: 'browser' }], // デフォルトでブラウザ通知
      enabled: formData.enabled,
      priority: formData.priority,
      cooldown: formData.cooldown,
    };
    
    try {
      const url = rule ? `/api/alerts/rules/${rule.id}` : '/api/alerts/rules';
      const method = rule ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });
      
      onSave();
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const getFieldOptions = () => {
    switch (formData.type) {
      case 'price':
        return ['price', 'bid', 'ask', 'volume', 'change24h'];
      case 'technical':
        return ['rsi', 'sma20', 'sma50', 'ema20', 'ema50'];
      case 'risk':
        return ['var95', 'drawdown', 'leverage', 'position_pnl'];
      default:
        return [];
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">
          {rule ? 'Edit Alert Rule' : 'Create Alert Rule'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Symbol (optional)</label>
            <select
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">All symbols</option>
              <option value="BTC/USDT">BTC/USDT</option>
              <option value="ETH/USDT">ETH/USDT</option>
              <option value="SOL/USDT">SOL/USDT</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="price">Price</option>
              <option value="technical">Technical</option>
              <option value="risk">Risk</option>
            </select>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Field</label>
              <select
                value={formData.field}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select</option>
                {getFieldOptions().map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Operator</label>
              <select
                value={formData.operator}
                onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="gt">&gt;</option>
                <option value="lt">&lt;</option>
                <option value="gte">&gt;=</option>
                <option value="lte">&lt;=</option>
                <option value="eq">=</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Value</label>
              <input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                step="any"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Cooldown (sec)</label>
              <input
                type="number"
                value={formData.cooldown}
                onChange={(e) => setFormData({ ...formData, cooldown: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                min="60"
                step="60"
              />
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="enabled" className="text-sm">Enable this rule</label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {rule ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}