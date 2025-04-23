// src/components/calendar/AvailableSlotsCalendar.tsx

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
  currentMonth?: Date;
  themeColor?: string;
}

const AVAILABLE_TIMES = [
  '10:00', '11:00',                       // 오전
  '13:00', '14:00', '15:00', '16:00',     // 오후
  '17:00', '18:00', '19:00'               // 저녁
];

export default function AvailableSlotsCalendar({ 
    availableSlots = [],
    onDateSelect,
    selectedDate,
    datesWithAvailableSlots = [],
    onMonthChange,
    currentMonth: propCurrentMonth,
    themeColor = "#4A332D"
}: AvailableSlotsCalendarProps) {
    // 내부 상태는 prop이 제공되지 않을 경우에만 기본값 사용
    const [internalCurrentMonth, setInternalCurrentMonth] = useState(new Date());
    
    // 실제 사용할 월 - prop이 있으면 prop 사용, 없으면 내부 상태 사용
    const effectiveCurrentMonth = propCurrentMonth || internalCurrentMonth;
    
    // currentMonth prop이 변경되면 내부 상태도 업데이트
    useEffect(() => {
      if (propCurrentMonth) {
        setInternalCurrentMonth(propCurrentMonth);
      }
    }, [propCurrentMonth]);
    
    // 현재 보여지는 날짜들 계산
    const days = useMemo(() => {
      const start = startOfMonth(effectiveCurrentMonth);
      const startWeek = startOfWeek(start);
      const end = endOfMonth(effectiveCurrentMonth);
      const endWeek = endOfWeek(end);
   
      return eachDayOfInterval({ start: startWeek, end: endWeek });
    }, [effectiveCurrentMonth]);
   
    // 날짜가 과거인지 확인
    const isPastDate = (date: Date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date < today;
    };
   
    // 날짜에 예약 가능한 시간이 있는지 확인
    const hasAvailableSlot = (date: Date) => {
      // 과거 날짜는 항상 false 반환
      if (isPastDate(date)) {
        return false;
      }
      
      const dateStr = format(date, 'yyyy-MM-dd');
      return datesWithAvailableSlots.includes(dateStr);
    };
    
    // 날짜 클릭시 상위 컴포넌트에 전달
    const handleDateClick = (date: Date) => {
        // 과거 날짜 제외
        if (!isPastDate(date) && onDateSelect) {
          // 다른 달 날짜 클릭 시 그 달로 이동
          if (!isSameMonth(date, effectiveCurrentMonth)) {
            console.log('다른 달 날짜 선택:', format(date, 'yyyy-MM-dd'));
            setInternalCurrentMonth(date); // 내부 상태 업데이트
            
            // 상위 컴포넌트에 월 변경 알림
            if (onMonthChange) {
              onMonthChange(date);
            }
          }
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
   
    // 월 이동 핸들러 수정
    const handlePrevMonth = () => {
      const newMonth = subMonths(effectiveCurrentMonth, 1);
      setInternalCurrentMonth(newMonth);
      console.log("이전 달 버튼 클릭:", format(newMonth, 'yyyy-MM'));
      if (onMonthChange) {
        onMonthChange(newMonth);
      }
    };

    const handleNextMonth = () => {
      const newMonth = addMonths(effectiveCurrentMonth, 1);
      setInternalCurrentMonth(newMonth);
      console.log("다음 달 버튼 클릭:", format(newMonth, 'yyyy-MM'));
      if (onMonthChange) {
        onMonthChange(newMonth);
      }
    };

    return (
        <div className="space-y-6">
          {/* 월 네비게이션 */}
          <div className="flex justify-between items-center py-3">            
            <button 
              onClick={handlePrevMonth}
              className="p-3 hover:bg-[#F0E6DD] rounded-full text-[#4A332D] text-xl font-medium w-12 h-12 flex items-center justify-center"
              aria-label="이전 달"
            >
              &lt;
            </button>
            <h2 style={{ color: '#4A332D' }} className="text-xl font-semibold">
            {format(effectiveCurrentMonth, 'yyyy.M', { locale: ko })}
            </h2>
            <button 
              onClick={handleNextMonth}
              className="p-3 hover:bg-[#F0E6DD] rounded-full text-[#4A332D] text-xl font-medium w-12 h-12 flex items-center justify-center"
              aria-label="다음 달"
            >
              &gt;
            </button>
          </div>
       
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} style={{ color: '#4A332D' }} className="text-center py-3 font-medium text-lg">
                {day}
            </div>
            ))}
            
            {/* 날짜 그리드 */}
            {days.map(day => {
                const isCurrentMonth = isSameMonth(day, effectiveCurrentMonth);
                const isAvailable = hasAvailableSlot(day);
                // 오늘 날짜는 선택 가능하게 하기 위해 isPastDate 함수 조정
                const isPast = (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const checkDate = new Date(day);
                    checkDate.setHours(0, 0, 0, 0);
                    return checkDate < today; // 오늘은 과거로 취급하지 않음
                })();
                const isDisabled = isPast || !isAvailable || !isCurrentMonth;
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

                return (
                    <div
                      key={day.toString()}
                      onClick={() => !isDisabled && handleDateClick(day)}
                      className={cn(
                        "flex items-center justify-center aspect-square text-lg",
                        !isCurrentMonth && "opacity-40",
                        isDisabled ? "cursor-default" : "cursor-pointer hover:bg-[#F0E6DD] rounded-lg",
                        isSelected && "bg-[#FFE6E6] rounded-lg font-bold", // 선택된 날짜 배경색
                        "border-none" // 테두리 제거
                      )}
                    >
                    <div className="flex flex-col items-center justify-center w-full h-full py-2">
                    <span 
                        className={cn(
                        "text-lg",
                        isPast || !isCurrentMonth 
                            ? "text-gray-400 font-normal"
                            : "font-medium",
                        isDisabled && !isPast && isCurrentMonth 
                            ? "text-gray-500"
                            : isCurrentMonth && !isDisabled 
                            ? "text-[#4A332D]"
                            : ""
                        )}
                    >
                        {format(day, 'd')}
                    </span>
                    </div>
                </div>
                );
            })}
            </div>
      {/* 선택된 날짜의 가능한 시간 표시 */}
      {selectedDate && (
      <div className="mt-6">
        <div className="flex items-center mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2ZM12 20C7.6 20 4 16.4 4 12C4 7.6 7.6 4 12 4C16.4 4 20 7.6 20 12C20 16.4 16.4 20 12 20Z" fill="#4A332D"/>
            <path d="M12 12H18V14H10V6H12V12Z" fill="#4A332D"/>
          </svg>
          <h3 style={{ color: '#4A332D' }} className="ml-2 text-xl font-medium">
            {format(selectedDate, 'M월 d일', { locale: ko })} 예약 가능 시간
          </h3>
        </div>
          
        {/* 오전 시간 */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#4A332D" strokeWidth="2"/>
              <path d="M12 6V12L8 10" stroke="#4A332D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: '#4A332D' }} className="ml-2 font-medium">오전</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {availableTimesForSelectedDate.morning.map(slot => (
              <div
                key={slot.time}
                style={{ color: '#4A332D' }}
                className="px-4 py-2 border border-[#E0D0C5] rounded-lg bg-white" // 시간 버튼은 흰색 배경 유지
              >
                {slot.time}
              </div>
            ))}
            {availableTimesForSelectedDate.morning.length === 0 && (
              <div className="text-gray-500">예약 가능한 시간이 없습니다</div>
            )}
          </div>
        </div>
        
        {/* 오후 시간 */}
        <div>
          <div className="flex items-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="#4A332D" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="#4A332D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: '#4A332D' }} className="ml-2 font-medium">오후</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {availableTimesForSelectedDate.afternoon.map(slot => {
              const hour = parseInt(slot.time.split(':')[0]);
              const displayTime = hour > 12 ? `${hour - 12}:${slot.time.split(':')[1]}` : slot.time;
              
              return (
                <div
                  key={slot.time}
                  style={{ color: '#4A332D' }}
                  className="px-4 py-2 border border-[#E0D0C5] rounded-lg bg-white" // 시간 버튼은 흰색 배경 유지
                >
                  {displayTime}
                </div>
              );
            })}
            {availableTimesForSelectedDate.afternoon.length === 0 && (
              <div className="text-gray-500">예약 가능한 시간이 없습니다</div>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);
}