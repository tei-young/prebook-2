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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto">
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-center text-2xl text-gray-900 font-bold">예약 가능 시간</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <>
                <AvailableSlotsCalendar 
                  availableSlots={availableSlots}
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                  datesWithAvailableSlots={datesWithAvailableSlots}
                  onMonthChange={handleMonthChange}
                  currentMonth={currentMonth} // 월 상태 전달
                />
                
                <div className="mt-8 text-center text-gray-800">
                  <p className="text-lg mb-2 font-medium">예약을 원하시면 아래 연락처로 문의해주세요.</p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                    <a 
                      href="https://open.kakao.com/o/sXXXXXXX" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-6 py-3 bg-yellow-400 text-black rounded-full font-medium text-lg"
                    >
                      카카오톡 문의
                    </a>
                    <a 
                      href="tel:010-XXXX-XXXX" 
                      className="px-6 py-3 bg-blue-500 text-white rounded-full font-medium text-lg"
                    >
                      전화 문의
                    </a>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}