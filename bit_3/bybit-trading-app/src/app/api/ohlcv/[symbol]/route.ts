import { NextRequest, NextResponse } from 'next/server';
import { BybitClient } from '@/lib/bybit-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '1m';
    const limit = parseInt(searchParams.get('limit') || '100');

    const client = new BybitClient();
    const ohlcv = await client.getOHLCV(params.symbol, timeframe, limit);
    return NextResponse.json(ohlcv);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OHLCV data' },
      { status: 500 }
    );
  }
}