'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import AvailableSlotsCalendar, { AvailableTimeSlot } from '@/components/calendar/AvailableSlotsCalendar';
import { getAvailableSlots, getAvailableSlotsForMonth } from '@/lib/supabaseApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AvailableSlotsPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const [datesWithAvailableSlots, setDatesWithAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 현재 월에 대한 예약 가능 날짜 로드
  useEffect(() => {
    const today = new Date();
    loadAvailableSlotsForMonth(today.getFullYear(), today.getMonth() + 1);
  }, []);

  // 월별 예약 가능 날짜 로드
  const loadAvailableSlotsForMonth = async (year: number, month: number) => {
    try {
      setLoading(true);
      const monthData = await getAvailableSlotsForMonth(year, month);
      
      // 예약 가능한 슬롯이 있는 날짜만 필터링
      const availableDates = monthData
        .filter(dateInfo => dateInfo.hasAvailableSlot)
        .map(dateInfo => dateInfo.date);
      
      setDatesWithAvailableSlots(availableDates);
    } catch (error) {
      console.error('월별 예약 가능 시간 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 특정 날짜에 대한 예약 가능 시간 로드
  const handleDateSelect = async (date: Date) => {
    try {
      setSelectedDate(date);
      setLoading(true);
      
      const dateStr = format(date, 'yyyy-MM-dd');
      const slotsForDate = await getAvailableSlots(dateStr);
      
      // 로그 추가하여 데이터 확인
      console.log('받아온 시간 슬롯:', slotsForDate);
      
      // 가능한 시간만 필터링
      const availableOnlySlots = slotsForDate.filter(slot => slot.available);
      
      setAvailableSlots(availableOnlySlots);
    } catch (error) {
      console.error('날짜별 예약 가능 시간 조회 오류:', error);
      // 오류 발생 시 빈 배열 설정
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl">예약 가능 시간</CardTitle>
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
                />
                
                <div className="mt-8 text-center text-gray-500">
                  <p>예약을 원하시면 아래 연락처로 문의해주세요.</p>
                  <div className="flex justify-center gap-4 mt-4">
                    <a 
                      href="https://open.kakao.com/o/sXXXXXXX" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-yellow-400 text-black rounded-md font-medium"
                    >
                      카카오톡 문의
                    </a>
                    <a 
                      href="tel:010-XXXX-XXXX" 
                      className="px-4 py-2 bg-blue-500 text-white rounded-md font-medium"
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