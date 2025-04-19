'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
 format, startOfMonth, endOfMonth, eachDayOfInterval, 
 isSameDay, addMonths, subMonths, startOfWeek, 
 endOfWeek, isSameMonth
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// 예약 가능한 시간 슬롯 타입
export interface AvailableTimeSlot {
  date: string;
  time: string;
  available: boolean;
}

interface AvailableSlotsCalendarProps {
  availableSlots: AvailableTimeSlot[];
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date | null;
  datesWithAvailableSlots?: string[]; // 예약 가능한 슬롯이 있는 날짜 목록
  onMonthChange?: (month: Date) => void; // 월 변경 이벤트
}

const AVAILABLE_TIMES = [
 '10:00', '11:00',                         // 오전
 '13:00', '14:00', '15:00', '16:00',      // 오후
 '17:00', '18:00', '19:00'                // 저녁
];

export default function AvailableSlotsCalendar({ 
    availableSlots = [],
    onDateSelect,
    selectedDate,
    datesWithAvailableSlots = [],
    onMonthChange
   }: AvailableSlotsCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    
    // 현재 보여지는 날짜들 계산
    const days = useMemo(() => {
      const start = startOfMonth(currentMonth);
      const startWeek = startOfWeek(start);
      const end = endOfMonth(currentMonth);
      const endWeek = endOfWeek(end);
   
      return eachDayOfInterval({ start: startWeek, end: endWeek });
    }, [currentMonth]);
   
    // 날짜가 과거인지 확인
    const isPastDate = (date: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date < today;
    };
   
    // 날짜에 예약 가능한 시간이 있는지 확인
    const hasAvailableSlot = (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return datesWithAvailableSlots.includes(dateStr);
    };
    
    // 날짜 클릭시 상위 컴포넌트에 전달
    const handleDateClick = (date: Date) => {
      // 현재 이후 날짜이고 현재 달에 속하는 날짜면 클릭 가능
      const isCurrentMonth = isSameMonth(date, currentMonth);
      if (!isPastDate(date) && isCurrentMonth && onDateSelect) {
        onDateSelect(date);
      }
    };
   
    // 시간대 그룹화 함수
    const groupTimesByPeriod = (times: AvailableTimeSlot[]) => {
      // 가용 슬롯만 필터링
      const availableOnly = times.filter(slot => slot.available);
      
      // 오전/오후 구분
      const morning = availableOnly.filter(slot => {
        const hour = parseInt(slot.time.split(':')[0]);
        return hour < 12;
      });
   
      const afternoon = availableOnly.filter(slot => {
        const hour = parseInt(slot.time.split(':')[0]);
        return hour >= 12;
      });
   
      // 시간순 정렬
      const sortByTime = (a: AvailableTimeSlot, b: AvailableTimeSlot) => {
        return a.time.localeCompare(b.time);
      };
   
      return { 
        morning: morning.sort(sortByTime), 
        afternoon: afternoon.sort(sortByTime) 
      };
    };
   
    // 선택된 날짜의 가능한 시간 슬롯 필터링
    const availableTimesForSelectedDate = useMemo(() => {
      if (!selectedDate) return { morning: [], afternoon: [] };
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const slotsForDate = availableSlots.filter(slot => slot.date === dateStr);
      
      return groupTimesByPeriod(slotsForDate);
    }, [selectedDate, availableSlots]);
   
    return (
      <div className="space-y-6">
        {/* 월 네비게이션 */}
        <div className="flex justify-between items-center p-4 border-b">
          <button 
            onClick={() => {
              const newMonth = subMonths(currentMonth, 1);
              setCurrentMonth(newMonth);
              // 월 변경 시 onMonthChange props가 있으면 호출
              if (onMonthChange) {
                onMonthChange(newMonth);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded"
          >
            &lt;
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, 'yyyy.M', { locale: ko })}
          </h2>
          <button 
            onClick={() => {
              const newMonth = addMonths(currentMonth, 1);
              setCurrentMonth(newMonth);
              // 월 변경 시 onMonthChange props가 있으면 호출
              if (onMonthChange) {
                onMonthChange(newMonth);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded"
          >
            &gt;
          </button>
        </div>
   
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="text-center py-2 font-medium text-gray-900">{day}</div>
          ))}
          
          {/* 날짜 그리드 */}
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isAvailable = hasAvailableSlot(day);
            const isDisabled = isPastDate(day) || !isAvailable || !isCurrentMonth;
            const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
   
            return (
              <div
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                className={cn(
                  "p-4 text-center",
                  !isCurrentMonth && "text-gray-400",
                  isPastDate(day) && "text-gray-400 bg-gray-50",
                  !isPastDate(day) && isCurrentMonth && "cursor-pointer hover:bg-gray-50 text-gray-900",
                  isSelected && "bg-green-50 font-bold",
                  isAvailable && !isPastDate(day) && isCurrentMonth && "bg-green-50 text-gray-900",
                  "border rounded-lg"
                )}
              >
                <span>{format(day, 'd')}</span>
                {isAvailable && !isPastDate(day) && isCurrentMonth && (
                  <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-1"></div>
                )}
              </div>
            );
          })}
        </div>
   
        {/* 선택된 날짜의 가능한 시간 표시 */}
        {selectedDate && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {format(selectedDate, 'M월 d일', { locale: ko })} 예약 가능 시간
            </h3>
            <div className="space-y-4">
              {/* 오전 시간대 */}
              {availableTimesForSelectedDate.morning.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">오전</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimesForSelectedDate.morning.map(slot => (
                      <div
                        key={slot.time}
                        className="px-4 py-3 rounded text-lg bg-green-50 border border-green-300 text-green-800 text-center"
                      >
                        {slot.time}
                      </div>
                    ))}
                  </div>
                </div>
              )}
   
              {/* 오후 시간대 */}
              {availableTimesForSelectedDate.afternoon.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 text-gray-900">오후</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimesForSelectedDate.afternoon.map(slot => {
                      const hour = parseInt(slot.time.split(':')[0]);
                      const displayTime = hour > 12 ? `${hour - 12}:${slot.time.split(':')[1]}` : slot.time;
                      
                      return (
                        <div
                          key={slot.time}
                          className="px-4 py-3 rounded text-lg bg-green-50 border border-green-300 text-green-800 text-center"
                        >
                          {displayTime}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
   
              {/* 예약 가능한 시간이 없는 경우 */}
              {availableTimesForSelectedDate.morning.length === 0 && 
               availableTimesForSelectedDate.afternoon.length === 0 && (
                <div className="text-center py-4 text-gray-800">
                  예약 가능한 시간이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
   }