'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import AvailableSlotsCalendar, { AvailableTimeSlot } from '@/components/calendar/AvailableSlotsCalendar';
import { getAvailableSlots, getAvailableSlotsForMonth } from '@/lib/supabaseApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AvailableSlotsPage() {
    // 월 상태를 상위 컴포넌트로 끌어올림
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
    const [datesWithAvailableSlots, setDatesWithAvailableSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
  
    // 컴포넌트 마운트 시 현재 월 데이터 로드
    useEffect(() => {
      const today = new Date();
      loadAvailableSlotsForMonth(today.getFullYear(), today.getMonth() + 1);
    }, []);
  
    // 월별 예약 가능 날짜 로드 함수
    const loadAvailableSlotsForMonth = async (year: number, month: number) => {
      try {
        setLoading(true);
        console.log(`로딩 ${year}년 ${month}월 데이터...`);
        
        const monthData = await getAvailableSlotsForMonth(year, month);
        
        // 예약 가능한 슬롯이 있는 날짜만 필터링
        const availableDates = monthData
          .filter((dateInfo: { hasAvailableSlot: boolean; date: string }) => dateInfo.hasAvailableSlot)
          .map((dateInfo: { date: string }) => dateInfo.date);
        
        console.log(`${year}년 ${month}월 가용 날짜:`, availableDates);
        setDatesWithAvailableSlots(availableDates);
        
        // 선택된 날짜가 있으면 해당 날짜 데이터도 로드
        if (selectedDate) {
          handleDateSelect(selectedDate);
        }
      } catch (error) {
        console.error('월별 예약 가능 시간 조회 오류:', error);
      } finally {
        setLoading(false);
      }
    };
  
    // 월 변경 핸들러 - 컴포넌트 상태와 API 데이터 모두 업데이트
    const handleMonthChange = (newMonth: Date) => {
      console.log('월 변경 호출됨:', format(newMonth, 'yyyy-MM'));
      
      // 컴포넌트 상태 업데이트
      setCurrentMonth(newMonth);
      
      // 새로운 월 데이터 로드
      loadAvailableSlotsForMonth(newMonth.getFullYear(), newMonth.getMonth() + 1);
      
      // 날짜 선택 초기화 (선택적)
      setSelectedDate(null);
      setAvailableSlots([]);
    };
  
    // 특정 날짜에 대한 예약 가능 시간 로드
    const handleDateSelect = async (date: Date) => {
      try {
        setSelectedDate(date);
        setLoading(true);
        
        const dateStr = format(date, 'yyyy-MM-dd');
        console.log('날짜 선택:', dateStr);
        
        const slotsForDate = await getAvailableSlots(dateStr);
        console.log('선택 날짜 가용 슬롯:', slotsForDate);
        
        // 가능한 시간만 필터링
        const availableOnlySlots = slotsForDate.filter(slot => slot.available);
        
        // 빈 배열이 아닌 실제 데이터 설정
        setAvailableSlots(availableOnlySlots.length > 0 ? availableOnlySlots : slotsForDate);
      } catch (error) {
        console.error('날짜별 예약 가능 시간 조회 오류:', error);
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    return (
        <div className="min-h-screen bg-[#FAF6F2] py-6 px-3"> 
            <div className="max-w-sm mx-auto"> 
                <div className="pb-4"> 
                <div className="text-center pb-6">
                    <h1 className="brand-title text-4xl mb-1" style={{ color: '#4A332D' }}> 
                    Kimuu
                    </h1>
                    <h2 className="brand-title text-lg font-medium" style={{ color: '#4A332D' }}>
                    예약 현황
                    </h2>
                </div>
                <div className="p-0">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A332D]"></div>
                  </div>
                ) : (
                  <>
                    <AvailableSlotsCalendar 
                      availableSlots={availableSlots}
                      onDateSelect={handleDateSelect}
                      selectedDate={selectedDate}
                      datesWithAvailableSlots={datesWithAvailableSlots}
                      onMonthChange={handleMonthChange}
                      currentMonth={currentMonth}
                      themeColor="#4A332D"
                    />
                    
                    <div className="mt-8 text-center pb-2"> 
                        <p style={{ color: '#4A332D' }} className="text-base mb-4 font-medium">
                            예약을 원하시면 아래 연락처로 문의해주세요.
                        </p>
                        <div className="flex flex-col gap-3">
                    <a 
                      href="https://open.kakao.com/o/sXXXXXXX" 
                      className="px-8 py-4 bg-[#FAE100] text-[#3C1E1E] rounded-full font-bold text-lg"
                    >
                      카카오톡 문의
                    </a>
                    <a 
                      href="tel:010-XXXX-XXXX" 
                      className="px-8 py-4 bg-[#4A332D] text-white rounded-full font-bold text-lg"
                    >
                      전화 문의
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}