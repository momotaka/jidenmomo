import { NextResponse } from 'next/server';
import { BybitClient } from '@/lib/bybit-client';

export async function GET() {
  try {
    const client = new BybitClient();
    const balance = await client.getBalance();
    return NextResponse.json(balance);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}