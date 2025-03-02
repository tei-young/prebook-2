import { NextResponse } from 'next/server';
import { TimeblockAutomation } from '@/lib/automation/timeblock';

export async function POST(request: Request) {
  try {
    const { customerName, date, time, isRetouching } = await request.json();
    
    const timeblock = new TimeblockAutomation(
      process.env.TIMEBLOCK_USERNAME,
      process.env.TIMEBLOCK_PASSWORD
    );
    
    await timeblock.login();
    
    await timeblock.addEvent({
      customerName,
      date,
      time,
      isRetouching
    });
    
    await timeblock.close();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}