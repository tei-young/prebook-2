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
        <div className="min-h-screen bg-[#FAF6F2] p-4"> {/* 배경색 변경 */}
          <div className="max-w-lg mx-auto">
            <Card className="shadow-md bg-white border-none"> {/* 카드 스타일 변경 */}
              <CardHeader className="pb-3 border-b border-[#E0D0C5]"> {/* 헤더 테두리 추가 */}
                <CardTitle className="text-center text-2xl text-[#4A332D] font-bold">Kimuu 예약 캘린더</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A332D]"></div> {/* 로딩 스피너 색상 변경 */}
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
                    
                    <div className="mt-8 text-center text-[#4A332D]"> {/* 텍스트 색상 변경 */}
                      <p className="text-lg mb-2 font-medium">예약을 원하시면 아래 연락처로 문의해주세요.</p>
                      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                        <a 
                          href="https://open.kakao.com/o/sXXXXXXX" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-[#FAE100] text-[#3C1E1E] rounded-full font-medium text-base flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3C7.03 3 3 6.13 3 10C3 12.41 4.43 14.52 6.65 15.73V19L10.09 17.28C10.69 17.42 11.33 17.5 12 17.5C16.97 17.5 21 14.37 21 10.5C21 6.63 16.97 3 12 3Z"/>
                          </svg>
                          카카오톡 문의
                        </a>
                        <a 
                          href="tel:010-XXXX-XXXX" 
                          className="px-6 py-3 bg-[#4A332D] text-white rounded-full font-medium text-base flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 15.5C18.75 15.5 17.55 15.3 16.43 14.93C16.08 14.82 15.69 14.9 15.41 15.17L13.21 17.37C10.38 15.93 8.06 13.62 6.62 10.79L8.82 8.58C9.1 8.31 9.18 7.92 9.07 7.57C8.7 6.45 8.5 5.25 8.5 4C8.5 3.45 8.05 3 7.5 3H4C3.45 3 3 3.45 3 4C3 13.39 10.61 21 20 21C20.55 21 21 20.55 21 20V16.5C21 15.95 20.55 15.5 20 15.5Z"/>
                          </svg>
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