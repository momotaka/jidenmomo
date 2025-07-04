import { NextResponse } from 'next/server';
import { engine } from '../start/route';

export async function POST() {
  try {
    if (!engine) {
      return NextResponse.json(
        { error: 'Engine is not running' },
        { status: 400 }
      );
    }

    engine.stop();
    
    return NextResponse.json({ status: 'stopped' });
  } catch (error) {
    console.error('Failed to stop engine:', error);
    return NextResponse.json(
      { error: 'Failed to stop engine' },
      { status: 500 }
    );
  }
}