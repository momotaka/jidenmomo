import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    const alerts = await prisma.alert.findMany({
      orderBy: { triggered: 'desc' },
      take: 50,
      include: {
        rule: true,
      },
    });
    
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}