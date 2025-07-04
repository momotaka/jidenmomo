import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    const rules = await prisma.alertRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(rules);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alert rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const rule = await prisma.alertRule.create({
      data: {
        name: body.name,
        description: body.description,
        symbol: body.symbol,
        type: body.type,
        condition: body.condition,
        actions: body.actions,
        enabled: body.enabled,
        priority: body.priority,
        cooldown: body.cooldown,
      },
    });
    
    return NextResponse.json(rule);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to create alert rule' },
      { status: 500 }
    );
  }
}