import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 서버 측에서만 환경 변수에 접근
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// 서버 측에서만 관리자 권한 클라이언트 생성
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const booking = await request.json();
    
    // 필수 필드 검증
    if (!booking.date || !booking.time || !booking.service_type || !booking.status) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다' },
        { status: 400 }
      );
    }
    
    // 관리자 권한으로 예약 생성
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert([{
        date: booking.date,
        time: booking.time,
        service_type: booking.service_type,
        customer_name: booking.customer_name || null,
        customer_phone: booking.customer_phone || null,
        status: booking.status,
        notes: booking.notes || null
      }])
      .select();
    
    if (error) {
      console.error('Supabase 예약 생성 오류:', error);
      return NextResponse.json(
        { error: `예약 생성 중 오류: ${error.message}` },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: '예약 데이터가 생성되지 않았습니다' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('예약 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}