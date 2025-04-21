import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서버 측에서만 환경 변수에 접근
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// 서버 측에서만 관리자 권한 클라이언트 생성
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();
    
    // 필수 필드 검증
    if (!id || !status) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }
    
    // 관리자 권한으로 bookings 테이블 업데이트
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Supabase 업데이트 오류:', error);
      return NextResponse.json(
        { error: `예약 업데이트 중 오류: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}