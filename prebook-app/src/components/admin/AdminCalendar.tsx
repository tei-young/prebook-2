// src/components/admin/AdminCalendar.tsx

import React, { useState, useMemo } from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, addMonths, subMonths, startOfWeek, 
  endOfWeek, isSameMonth
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AdminCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

export default function AdminCalendar({ onDateSelect, selectedDate }: AdminCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const startWeek = startOfWeek(start);
    const end = endOfMonth(currentMonth);
    const endWeek = endOfWeek(end);

    return eachDayOfInterval({ start: startWeek, end: endWeek });
  }, [currentMonth]);

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
        <h2 className="text-xl font-bold text-gray-900">
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
          <div key={day} className="text-center py-2 font-bold text-gray-900">{day}</div>
        ))}
        
        {days.map(day => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDisabled = isPastDate(day) || !isCurrentMonth;
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

          return (
            <div
              key={day.toString()}
              onClick={() => !isDisabled && onDateSelect(day)}
              className={cn(
                "p-4 flex items-center justify-center",
                !isCurrentMonth && "text-gray-300",
                isPastDate(day) && "text-gray-300 bg-gray-50", 
                !isPastDate(day) && !isDisabled && "cursor-pointer hover:bg-gray-50 text-gray-900 font-bold",
                isSelected && "bg-green-50 font-bold text-gray-900",
                "border rounded-lg"
              )}
            >
              <span className="inline-flex items-center justify-center">{format(day, 'd')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}