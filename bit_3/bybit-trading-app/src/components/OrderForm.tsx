'use client';

import { useState } from 'react';
import { Order } from '@/types/trading';
import { useTradingContext } from '@/context/TradingContext';

interface OrderFormProps {
  symbol: string;
  currentPrice: number;
  onOrderPlaced: (order: Order) => void;
}

export default function OrderForm({ symbol, currentPrice, onOrderPlaced }: OrderFormProps) {
  const { refreshAll } = useTradingContext();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          side,
          type: orderType,
          amount: parseFloat(amount),
          price: orderType === 'limit' ? parseFloat(price) : undefined,
        }),
      });

      if (response.ok) {
        const order = await response.json();
        onOrderPlaced(order);
        setAmount('');
        setPrice('');
        // グローバルデータを更新
        await refreshAll();
      } else {
        const error = await response.json();
        alert(`Order failed: ${error.error}`);
      }
    } catch (error) {
      alert('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSide('buy')}
          className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
            side === 'buy'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setSide('sell')}
          className={`flex-1 py-2 px-4 rounded font-medium transition-colors ${
            side === 'sell'
              ? 'bg-red-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Sell
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOrderType('market')}
          className={`flex-1 py-2 px-4 rounded text-sm transition-colors ${
            orderType === 'market'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => setOrderType('limit')}
          className={`flex-1 py-2 px-4 rounded text-sm transition-colors ${
            orderType === 'limit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Limit
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
          placeholder="0.001"
          step="0.001"
          required
        />
      </div>

      {orderType === 'limit' && (
        <div>
          <label className="block text-sm font-medium mb-1">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
            placeholder={currentPrice.toFixed(2)}
            step="0.01"
            required
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-3 px-4 rounded font-medium transition-colors ${
          loading
            ? 'bg-gray-600 cursor-not-allowed'
            : side === 'buy'
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white'
        }`}
      >
        {loading ? 'Placing Order...' : `${side.toUpperCase()} ${symbol}`}
      </button>
    </form>
  );
}