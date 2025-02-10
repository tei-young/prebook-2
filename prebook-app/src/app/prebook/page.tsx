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
                {/* 숙지사항 체크 */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="terms"
                      checked={formData.termsAgreed}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, termsAgreed: checked as boolean }))
                      }
                    />
                    <Label htmlFor="terms">예약 전 숙지사항 필독하셨나요?</Label>
                  </div>
                </div>

                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">성함</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">성별</Label>
                    <select
                      id="gender"
                      name="gender"
                      className="w-full h-10 px-3 border rounded-md"
                      required
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">선택해주세요</option>
                      <option value="female">여성</option>
                      <option value="male">남성</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">나이</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      required
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">연락처</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* 시술 정보 */}
                <div className="space-y-2">
                  <Label htmlFor="desiredService">희망시술</Label>
                  <Textarea
                    id="desiredService"
                    name="desiredService"
                    placeholder="ex) 자연눈썹/콤보/섀도우/원장님 추천/잔흔제거"
                    required
                    value={formData.desiredService}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referralSource">방문 경로 (선택사항)</Label>
                  <Input
                    id="referralSource"
                    name="referralSource"
                    placeholder="ex) 인스타그램 광고, 지인추천"
                    value={formData.referralSource}
                    onChange={handleChange}
                  />
                </div>

                {/* 여기가 캘린더로 교체된 부분 */}
                <div className="space-y-4">
                  <Label htmlFor="desiredDates">희망 시술일정 (1~3개 선택)</Label>
                  <Calendar
                    bookedSlots={reservedSlots}
                    selectedSlots={formData.desired_slots}
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

                <div className="space-y-2">
                  <Label htmlFor="priorExperience">시술 경험 (선택사항)</Label>
                  <Textarea
                    id="priorExperience"
                    name="priorExperience"
                    value={formData.priorExperience}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">사진첨부</h3>
                  <p className="text-sm text-gray-600">
                    기본카메라로 노메이크업 상태의 정면눈썹 사진 2장 전송부탁드립니다.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="frontPhoto">정면 사진 (눈 뜬 상태)</Label>
                    <Input
                      id="frontPhoto"
                      name="frontPhoto"
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closedPhoto">정면 사진 (눈 감은 상태)</Label>
                    <Input
                      id="closedPhoto"
                      name="closedPhoto"
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleChange}
                    />
                  </div>
                </div>
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