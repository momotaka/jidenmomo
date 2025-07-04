import { NextRequest, NextResponse } from 'next/server';
import { BybitClient } from '@/lib/bybit-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const client = new BybitClient();
    const ticker = await client.getTicker(params.symbol);
    return NextResponse.json(ticker);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker data' },
      { status: 500 }
    );
  }
}