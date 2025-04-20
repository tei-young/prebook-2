'use client';

import React, { useState, useMemo } from 'react';
import { 
 format, startOfMonth, endOfMonth, eachDayOfInterval, 
 isSameDay, addMonths, subMonths, startOfWeek, 
 endOfWeek, isSameMonth, isSameHour 
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface TimeSlot {
 date: string;
 time: string;
 serviceType?: string;
}

export interface ServiceInfo {
 name: string;
 duration: 1 | 2;
}

export enum serviceTypes {
 natural = 'natural',
 combo = 'combo',
 shadow = 'shadow',
 retouch = 'retouch',
 brownline = 'brownline',
 removal = 'removal',
 recommend = 'recommend'
}

export const SERVICE_MAP: Record<keyof typeof serviceTypes, ServiceInfo> = {
  natural: { name: '자연눈썹', duration: 2 },
  combo: { name: '콤보눈썹', duration: 2 },
  shadow: { name: '섀도우눈썹', duration: 2 },
  retouch: { name: '리터치', duration: 1 },
  brownline: { name: '브라운아이라인', duration: 1 },
  removal: { name: '잔흔제거', duration: 1 },
  recommend: { name: '키뮤원장 추천시술', duration: 2 }  // 추가
};

export interface BookedSlot {
 date: string;
 time: string;
 status: 'pending' | 'deposit_wait' | 'deposit_confirmed' | 'confirmed' | 'rejected';
 selected_slot?: TimeSlot;
 serviceType: string;
}

interface CalendarProps {
 bookedSlots?: BookedSlot[];
 selectedSlots: TimeSlot[];
 onSelectSlot?: (slot: TimeSlot) => void;
 onRemoveSlot?: (slot: TimeSlot) => void;
 maxSelections?: number;
 serviceType?: string;
 hideTimeSelection?: boolean;
}

const AVAILABLE_TIMES = [
 '10:00', '11:00',                         // 오전
 '13:00', '14:00', '15:00', '16:00',      // 오후
 '17:00', '18:00', '19:00'                // 저녁
];

export default function Calendar({ 
 bookedSlots = [], 
 selectedSlots,
 onSelectSlot,
 onRemoveSlot,
 maxSelections = 3,
 serviceType,
 hideTimeSelection = false 
}: CalendarProps) {
 const [currentMonth, setCurrentMonth] = useState(new Date());
 const [selectedDate, setSelectedDate] = useState<Date | null>(null);

 const days = useMemo(() => {
   const start = startOfMonth(currentMonth);
   const startWeek = startOfWeek(start);
   const end = endOfMonth(currentMonth);
   const endWeek = endOfWeek(end);

   return eachDayOfInterval({ start: startWeek, end: endWeek });
 }, [currentMonth]);

 const isTimeSlotAvailable = (date: Date, time: string) => {
  if (!bookedSlots || !serviceType) return true;

  // 선택된 시간의 Date 객체 생성
  const targetDateTime = new Date(`${format(date, 'yyyy-MM-dd')}T${time}`);
  
  // 현재 선택한 시술의 소요시간 (1시간 또는 2시간)
  const selectedServiceDuration = SERVICE_MAP[serviceType as keyof typeof serviceTypes]?.duration || 1;
  
  // 각 예약된 슬롯 확인
  return !bookedSlots.some(slot => {
    // deposit_wait나 confirmed 상태의 예약만 체크
    if (
      (slot.status === 'deposit_wait' || slot.status === 'confirmed') && 
      slot.selected_slot?.date
    ) {
      const bookedDateTime = new Date(`${slot.selected_slot.date}T${slot.selected_slot.time}`);
      const bookedService = slot.serviceType;
      const bookedDuration = SERVICE_MAP[bookedService as keyof typeof serviceTypes]?.duration || 1;

      // 두 가지 충돌 상황 검사:
      
      // 1. 기존 예약시간과 새 예약시간이 겹치는 경우
      // 예약된 시간부터 시술 소요시간 동안의 시간대 체크
      for (let i = 0; i < bookedDuration; i++) {
        const checkBookedTime = new Date(bookedDateTime);
        checkBookedTime.setHours(checkBookedTime.getHours() + i);
        
        // 새로 선택하는 시술이 기존 예약과 겹치는지 확인
        for (let j = 0; j < selectedServiceDuration; j++) {
          const checkTargetTime = new Date(targetDateTime);
          checkTargetTime.setHours(checkTargetTime.getHours() + j);
          
          if (isSameDay(checkBookedTime, checkTargetTime) && 
              checkBookedTime.getHours() === checkTargetTime.getHours()) {
            return true; // 겹치면 사용 불가
          }
        }
      }
    }
    return false;
  });
};

 const handleDateClick = (date: Date) => {
   setSelectedDate(date);
 };

 const handleTimeClick = (time: string) => {
   if (!selectedDate || !onSelectSlot || !serviceType) return;

   const newSlot: TimeSlot = {
     date: format(selectedDate, 'yyyy-MM-dd'),
     time,
     serviceType
   };

   onSelectSlot(newSlot);
 };

 const isPastDate = (date: Date) => {
   const today = new Date();
   return date < today;
 };

 return (
   <div className="space-y-6">
     <div className="flex justify-between items-center p-4 border-b">
       <button 
         onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
         className="p-2 hover:bg-gray-100 rounded"
       >
         &lt;
       </button>
       <h2 className="text-xl font-semibold">
         {format(currentMonth, 'yyyy.M', { locale: ko })}
       </h2>
       <button 
         onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
         className="p-2 hover:bg-gray-100 rounded"
       >
         &gt;
       </button>
     </div>

     <div className="grid grid-cols-7 gap-1">
       {['일', '월', '화', '수', '목', '금', '토'].map(day => (
         <div key={day} className="text-center py-2 font-medium">{day}</div>
       ))}
       
       {days.map(day => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const hasAvailableSlot = AVAILABLE_TIMES.some(time => 
            isTimeSlotAvailable(day, time)
          );
          const isDisabled = isPastDate(day) || !hasAvailableSlot || !isCurrentMonth;
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

          return (
            <div
              key={day.toString()}
              onClick={() => !isDisabled && handleDateClick(day)}
              className={cn(
                "p-4 text-center",
                !isCurrentMonth && "text-gray-300",
                isPastDate(day) && "text-gray-300 bg-gray-50", // 지난 날짜 스타일
                !isPastDate(day) && !isDisabled && "cursor-pointer hover:bg-gray-50 text-gray-900 font-medium", // 활성화된 날짜 스타일 강화
                isSelected && "bg-green-50 font-bold text-gray-900", // 선택된 날짜 스타일 강화
                "border rounded-lg"
              )}
            >
              <span>{format(day, 'd')}</span>
            </div>
          );
        })}
     </div>

     {selectedDate && (hideTimeSelection === true ? null : (
       <div className="mt-6">
         <h3 className="text-lg font-medium mb-4">
           {format(selectedDate, 'M월 d일', { locale: ko })} 시술 시간 선택
         </h3>
         <div className="space-y-4">
          {/* 오전 시간대 */}
          <div>
            <h4 className="font-medium mb-2">오전</h4>
            <div className="grid grid-cols-4 gap-2">  {/* grid-cols-2에서 grid-cols-4로 변경 */}
            {AVAILABLE_TIMES.filter(time => parseInt(time) < 12).map(time => {
              const isAvailable = isTimeSlotAvailable(selectedDate, time);
              const isSelected = selectedSlots.some(slot => 
                isSameDay(new Date(slot.date), selectedDate) && slot.time === time
              );
              
              return (
                <button
                  key={time}
                  onClick={() => isAvailable && !isSelected && handleTimeClick(time)}
                  className={cn(
                    "px-4 py-3 rounded text-lg",
                    isSelected && "bg-green-500 text-white font-medium", // 선택된 시간 스타일
                    !isAvailable && !isSelected && "bg-gray-200 text-gray-400", // 불가능한 시간 스타일
                    isAvailable && !isSelected && "bg-white hover:bg-green-50 border text-gray-900 font-medium", // 가능한 시간 스타일 강화
                    (!isAvailable || isSelected) && "cursor-not-allowed"
                  )}
                  disabled={!isAvailable || (selectedSlots.length >= maxSelections && !isSelected)}
                >
                  {time}
                </button>
              );
            })}
            </div>
          </div>

           {/* 오후 시간대 */}
           <div>
             <h4 className="font-medium mb-2">오후</h4>
             <div className="grid grid-cols-4 gap-2">
             {AVAILABLE_TIMES.filter(time => parseInt(time) >= 12).map(time => {
                const isAvailable = isTimeSlotAvailable(selectedDate, time);
                const isSelected = selectedSlots.some(slot => 
                  isSameDay(new Date(slot.date), selectedDate) && slot.time === time
                );
                
                return (
                  <button
                    key={time}
                    onClick={() => isAvailable && !isSelected && handleTimeClick(time)}
                    className={cn(
                      "px-4 py-3 rounded text-lg",
                      isSelected && "bg-green-500 text-white font-medium",
                      !isAvailable && !isSelected && "bg-gray-200 text-gray-400",
                      isAvailable && !isSelected && "bg-white hover:bg-green-50 border text-gray-900 font-medium", // 가능한 시간 스타일 강화
                      (!isAvailable || isSelected) && "cursor-not-allowed"
                    )}
                    disabled={!isAvailable || (selectedSlots.length >= maxSelections && !isSelected)}
                  >
                    {parseInt(time) > 12 ? `${parseInt(time) - 12}:${time.split(':')[1]}` : time}
                  </button>
                );
              })}
             </div>
           </div>
         </div>
       </div>
     ))}
   </div>
 );
}