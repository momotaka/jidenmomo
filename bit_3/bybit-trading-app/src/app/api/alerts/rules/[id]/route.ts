import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const rule = await prisma.alertRule.update({
      where: { id: params.id },
      data: body,
    });
    
    return NextResponse.json(rule);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    const rule = await prisma.alertRule.update({
      where: { id: params.id },
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
      { error: 'Failed to update alert rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.alertRule.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert rule' },
      { status: 500 }
    );
  }
}