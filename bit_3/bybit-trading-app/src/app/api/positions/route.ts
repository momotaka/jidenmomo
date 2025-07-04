import { NextResponse } from 'next/server';
import { BybitClient } from '@/lib/bybit-client';

export async function GET() {
  try {
    const client = new BybitClient();
    const positions = await client.getPositions();
    return NextResponse.json(positions);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}