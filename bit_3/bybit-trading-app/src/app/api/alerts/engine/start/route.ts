import { NextResponse } from 'next/server';
import { AlertEngine } from '@/lib/alerts/alert-engine';

let alertEngine: AlertEngine | null = null;

export async function POST() {
  try {
    if (alertEngine) {
      return NextResponse.json(
        { error: 'Alert engine is already running' },
        { status: 400 }
      );
    }

    alertEngine = new AlertEngine();
    await alertEngine.start(5000); // 5秒ごとにチェック
    
    return NextResponse.json({ status: 'started' });
  } catch (error) {
    console.error('Failed to start alert engine:', error);
    return NextResponse.json(
      { error: 'Failed to start alert engine' },
      { status: 500 }
    );
  }
}

export { alertEngine };