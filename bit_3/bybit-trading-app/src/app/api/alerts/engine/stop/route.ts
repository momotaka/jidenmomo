import { NextResponse } from 'next/server';
import { alertEngine } from '../start/route';

export async function POST() {
  try {
    if (!alertEngine) {
      return NextResponse.json(
        { error: 'Alert engine is not running' },
        { status: 400 }
      );
    }

    alertEngine.stop();
    
    return NextResponse.json({ status: 'stopped' });
  } catch (error) {
    console.error('Failed to stop alert engine:', error);
    return NextResponse.json(
      { error: 'Failed to stop alert engine' },
      { status: 500 }
    );
  }
}