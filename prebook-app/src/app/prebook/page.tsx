'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import Calendar from '@/components/calendar/Calendar';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TimeSlot {
 date: Date;
 time: string;
 status: 'available' | 'pending' | 'deposit_wait' | 'deposit_confirmed' | 'confirmed' | 'rejected';
}

interface DesiredSlot {
  date: string;
  time: string;
 }

const CustomerReservationPage = () => {
 const [formData, setFormData] = useState({
   termsAgreed: false,
   name: '',
   gender: '',
   age: '',
   phone: '',
   desiredService: '',
   referralSource: '',
   desired_slots: [] as TimeSlot[],
   priorExperience: '',
   frontPhoto: null,
   closedPhoto: null
 });
 
 const [reservedSlots, setReservedSlots] = useState<TimeSlot[]>([]);
 const [submitted, setSubmitted] = useState(false);

 useEffect(() => {
   async function fetchReservedSlots() {
     const { data, error } = await supabase
       .from('reservations')
       .select('desired_slots, status')
       .not('status', 'eq', 'rejected');

     if (error) {
       console.error('예약 데이터 조회 실패:', error);
       return;
     }

     const slots = data.flatMap(reservation =>  
      reservation.desired_slots.map((slot: DesiredSlot) => ({
        date: new Date(slot.date),
        time: slot.time,
        status: reservation.status
       }))
     );

     setReservedSlots(slots);
   }

   fetchReservedSlots();
 }, []);

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
   e.preventDefault();
   if (!formData.termsAgreed) {
     alert('예약 전 숙지사항 확인이 필요합니다.');
     return;
   }
   
   try {
     // API 호출 및 파일 업로드 처리
     console.log('예약 요청:', formData);
     setSubmitted(true);
   } catch (error) {
     console.error('예약 요청 중 오류 발생:', error);
   }
 };

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
   const { name, value, type } = e.target;
   if (type === 'file') {
     const fileInput = e.target as HTMLInputElement;
     setFormData(prev => ({
       ...prev,
       [name]: fileInput.files?.[0] || null
     }));
   } else {
     setFormData(prev => ({
       ...prev,
       [name]: value
     }));
   }
 };

 return (
   <div className="min-h-screen bg-gray-50 p-4">
     <div className="max-w-2xl mx-auto pt-8">
       <Card>
         <CardHeader>
           <CardTitle className="text-center text-2xl">예약 요청</CardTitle>
         </CardHeader>
         <CardContent>
           {submitted ? (
             <Alert>
               <AlertDescription>
                 예약 요청이 접수되었습니다. 원장님 확인 후 예약 확정 메시지를 보내드리겠습니다.
               </AlertDescription>
             </Alert>
           ) : (
             <form onSubmit={handleSubmit} className="space-y-6">
               {/* 기존 입력 필드들 */}
               
               <div className="space-y-4">
                 <Label htmlFor="desiredDates">희망 시술일정 (1~3개 선택)</Label>
                 <Calendar
                   bookedSlots={reservedSlots}
                   onSelectSlot={(slot) => {
                     setFormData(prev => ({
                       ...prev,
                       desired_slots: [
                         ...(prev.desired_slots || []).slice(0, 2),
                         slot
                       ].slice(0, 3)
                     }));
                   }}
                   maxSelections={3}
                 />
                 
                 {/* 선택된 시간대 표시 */}
                 {formData.desired_slots.length > 0 && (
                   <div className="mt-4 space-y-2">
                     <h4 className="font-medium">선택된 시간</h4>
                     <div className="space-y-2">
                       {formData.desired_slots.map((slot, index) => (
                         <div
                           key={index}
                           className="flex justify-between items-center p-3 bg-green-50 rounded"
                         >
                           <span>
                             {format(slot.date, 'M월 d일', { locale: ko })} {slot.time}
                           </span>
                           <Button
                             type="button"
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               setFormData(prev => ({
                                 ...prev,
                                 desired_slots: prev.desired_slots.filter((_, i) => i !== index)
                               }));
                             }}
                           >
                             삭제
                           </Button>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>

               {/* 나머지 입력 필드들 */}

               <Button type="submit" className="w-full">
                 예약 요청하기
               </Button>
             </form>
           )}
         </CardContent>
       </Card>
     </div>
   </div>
 );
};

export default CustomerReservationPage;