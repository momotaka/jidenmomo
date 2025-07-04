import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    const signals = await prisma.signal.findMany({
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
    
    return NextResponse.json(signals);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signals' },
      { status: 500 }
    );
  }
}