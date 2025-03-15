// src/app/api/timeblock/route.ts
import { NextResponse } from 'next/server';
import { timeblockAutomation } from '@/lib/automation/timeblock';

export async function POST(request: Request) {
  console.log('타임블록 API 호출됨');
  try {
    const body = await request.json();
    console.log('요청 데이터:', body);
    
    const { customerName, date, time, isRetouching } = body;
    console.log('파싱된 데이터:', { customerName, date, time, isRetouching });
    
    // 자동화 실행
    console.log('타임블록 자동화 시작');
    await timeblockAutomation.addEvent({
      customerName,
      date,
      time,
      isRetouching
    });
    console.log('타임블록 자동화 완료');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('타임블록 API 오류:', error);
    // NextResponse 객체를 반환하여 에러 응답 형식화
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message
      },
      { status: 500 }
    );
  }
}