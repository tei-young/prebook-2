import { NextResponse } from 'next/server';
import { timeblockAutomation } from '@/lib/automation/timeblock';

export async function POST(request: Request) {
  try {
    const { customerName, date, time, isRetouching } = await request.json();
    
    await timeblockAutomation.addEvent({
      customerName,
      date,
      time,
      isRetouching
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('타임블록 자동화 오류:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}