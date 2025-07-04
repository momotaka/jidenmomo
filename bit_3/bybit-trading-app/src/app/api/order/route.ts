import { NextRequest, NextResponse } from 'next/server';
import { BybitClient } from '@/lib/bybit-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, side, type, amount, price } = body;

    if (!symbol || !side || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const client = new BybitClient();
    const order = await client.createOrder(symbol, side, type, amount, price);
    return NextResponse.json(order);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}