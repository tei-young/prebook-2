// src/components/calendar/Calendar.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isSameMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export interface TimeSlot {
  date: string;
  time: string;
}

export interface BookedSlot {
  date: string;
  time: string;
  status: 'pending' | 'deposit_wait' | 'deposit_confirmed' | 'confirmed' | 'rejected';
  selected_slot?: TimeSlot;
}

interface CalendarProps {
  bookedSlots?: BookedSlot[];
  selectedSlots: TimeSlot[];
  onSelectSlot?: (slot: TimeSlot) => void;
  onRemoveSlot?: (slot: TimeSlot) => void;
  maxSelections?: number;
}

const AVAILABLE_TIMES = ['10:00', '13:00', '15:00', '17:00', '19:00'];

export default function Calendar({ 
 bookedSlots = [], 
 selectedSlots,
 onSelectSlot,
 onRemoveSlot,
 maxSelections = 3 
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
  return bookedSlots?.some(slot => {
    if (slot.status === 'deposit_wait' || slot.status === 'confirmed') {
      // selected_slot이 있는지 먼저 확인
      if (slot.selected_slot?.date) {
        return isSameDay(new Date(slot.selected_slot.date), date) && 
               slot.selected_slot.time === time;
      }
    }
    return false;
  }) || false;
};

 const handleDateClick = (date: Date) => {
   setSelectedDate(date);
 };

 const handleTimeClick = (time: string) => {
  if (!selectedDate || !onSelectSlot) return;

  const newSlot: TimeSlot = {
    date: format(selectedDate, 'yyyy-MM-dd'), // Date를 string으로 변환
    time,
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
               isPastDate(day) && "text-gray-300 bg-gray-50",
               !isPastDate(day) && !isDisabled && "cursor-pointer hover:bg-gray-50",
               isSelected && "bg-green-50 font-bold",
               "border rounded-lg"
             )}
           >
             <span>{format(day, 'd')}</span>
           </div>
         );
       })}
     </div>

     {selectedDate && (
       <div className="mt-6">
         <h3 className="text-lg font-medium mb-4">
           {format(selectedDate, 'M월 d일', { locale: ko })} 시술 시간 선택
         </h3>
         <div className="grid grid-cols-1 gap-2">
           {AVAILABLE_TIMES.map(time => {
             const isAvailable = isTimeSlotAvailable(selectedDate, time);
             const isSelected = selectedSlots.some(slot => 
               isSameDay(slot.date, selectedDate) && slot.time === time
             );
             
             return (
               <button
                 key={time}
                 onClick={() => isAvailable && !isSelected && handleTimeClick(time)}
                 className={cn(
                   "px-4 py-3 rounded text-lg w-full",
                   isSelected && "bg-green-500 text-white",
                   !isAvailable && !isSelected && "bg-gray-200 text-gray-400",
                   isAvailable && !isSelected && "bg-white hover:bg-green-50 border",
                   (!isAvailable || isSelected) && "cursor-not-allowed"
                 )}
                 disabled={!isAvailable || (selectedSlots.length >= maxSelections && !isSelected)}
               >
                 {time.split(':')[0]}시
               </button>
             );
           })}
         </div>
       </div>
     )}
   </div>
 );
}