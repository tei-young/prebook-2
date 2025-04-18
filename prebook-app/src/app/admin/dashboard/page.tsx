'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { isSameDay } from 'date-fns';
import Dialog from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { SERVICE_MAP, serviceTypes } from '@/components/calendar/Calendar';
import { kakaoAutomation } from '@/lib/automation/kakao';
import SlotManagementList from '@/components/admin/SlotManagementList';

type ReservationStatus = 'pending' | 'deposit_wait' | 'deposit_confirmed' | 'confirmed' | 'rejected';

interface TimeSlot {
  date: string;
  time: string;
}

interface Reservation {
  id: string;
  customer_name: string;
  gender: string;
  age: number;
  phone: string;
  desired_service: string;
  referral_source: string | null;
  desired_slots: TimeSlot[];
  selected_slot?: TimeSlot;
  prior_experience: string | null;
  front_photo_url: string | null;
  closed_photo_url: string | null;
  status: ReservationStatus;
  status_updated_at: string;
  created_at: string;
  source?: 'owner' | 'customer';
}

type AdminTab = 'reservations' | 'slots';

export default function AdminDashboard() {
  // 탭 상태 추가
  const [activeTab, setActiveTab] = useState<AdminTab>('reservations');
  
  // 기존 상태들
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);
  
  async function fetchReservations() {
    try {
      setLoading(true);
      
      // 1. 고객 예약 요청 불러오기 (reservation 테이블)
      const { data: customerReservations, error: customerError } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (customerError) throw customerError;
      
      // 2. 원장 생성 예약 불러오기 (bookings 테이블)
      const { data: ownerBookings, error: ownerError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ownerError) throw ownerError;
  
      // 3. bookings 데이터를 reservation 형식으로 변환
      const convertedBookings = ownerBookings.map(booking => {
        return {
          id: booking.id,
          customer_name: booking.customer_name || '원장 생성 예약',
          gender: '-',  // 원장 생성 예약에는 없는 필드
          age: 0,       // 원장 생성 예약에는 없는 필드
          phone: booking.customer_phone || '-',
          desired_service: booking.service_type,
          referral_source: null,
          desired_slots: [], // 원장 생성 예약에는 없는 필드
          selected_slot: {
            date: booking.date,
            time: booking.time
          },
          prior_experience: null,
          front_photo_url: null,
          closed_photo_url: null,
          status: booking.status === 'deposit_wait' ? 'deposit_wait' : 
                 booking.status === 'confirmed' ? 'confirmed' : 
                 booking.status === 'cancelled' ? 'rejected' : 'pending',
          status_updated_at: booking.updated_at,
          created_at: booking.created_at,
          // bookings 테이블에서 온 데이터 표시
          source: 'owner' // 원장 생성 예약 표시
        };
      });
      
      // 4. 두 데이터 합치기
      const allReservations = [...customerReservations, ...convertedBookings];
      // 생성일 기준 내림차순 정렬
      allReservations.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setReservations(allReservations);
    } catch (error) {
      console.error('예약 목록 조회 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setSelectedSlot(reservation.selected_slot || null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleApproveWithSlot = async (reservationId: string) => {
    if (!selectedSlot || !selectedReservation) return;
    
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: 'deposit_wait',
          selected_slot: selectedSlot,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);

      if (error) throw error;

      // 예약금 안내 메시지 발송
      try {
        await kakaoAutomation.addToQueue(
          selectedReservation.phone,
          'DEPOSIT_GUIDE'
        );
      } catch (messageError) {
        console.error('예약금 안내 메시지 큐 추가 실패:', messageError);
      }

      setReservations(prev =>
        prev.map(reservation =>
          reservation.id === reservationId
            ? { 
                ...reservation, 
                status: 'deposit_wait', 
                selected_slot: selectedSlot,
                status_updated_at: new Date().toISOString()
              }
            : reservation
        )
      );

      if (selectedReservation?.id === reservationId) {
        setSelectedReservation(prev => 
          prev ? { 
            ...prev, 
            status: 'deposit_wait', 
            selected_slot: selectedSlot,
            status_updated_at: new Date().toISOString()
          } : null
        );
      }

    } catch (error) {
      console.error('예약 승인 중 오류 발생:', error);
      alert('예약 승인 중 오류가 발생했습니다.');
    }
  };

  const handleStatusChange = async (reservationId: string, newStatus: ReservationStatus) => {
    if (!selectedReservation) return;
  
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ 
          status: newStatus,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', reservationId);
  
      if (error) throw error;
  
      // 상태별 자동화 처리
      if (newStatus === 'confirmed' && selectedReservation.selected_slot) {
        try {
          // 카카오톡 메시지 발송
          try {
            await kakaoAutomation.addToQueue(
              selectedReservation.phone,
              'CONFIRMATION',
              {
                customerName: selectedReservation.customer_name,
                appointmentDate: format(new Date(selectedReservation.selected_slot.date), 'M월 d일'),
                appointmentTime: selectedReservation.selected_slot.time
              }
            );
          } catch (messageError) {
            console.error('예약 확정 메시지 큐 추가 실패:', messageError);
          }
  
          // 타임블록 일정 등록
          console.log('타임블록 API 호출 시작');
          console.log('전송 데이터:', {
            customerName: selectedReservation.customer_name,
            date: selectedReservation.selected_slot.date,
            time: selectedReservation.selected_slot.time,
            isRetouching: selectedReservation.desired_service === 'retouch'
          });
  
          const response = await fetch('/api/timeblock', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerName: selectedReservation.customer_name,
              date: selectedReservation.selected_slot.date,
              time: selectedReservation.selected_slot.time,
              isRetouching: selectedReservation.desired_service === 'retouch'
            }),
          });
  
          const responseData = await response.json();
          console.log('타임블록 API 응답:', responseData);
          
          if (!response.ok) {
            throw new Error(responseData.error || '타임블록 등록 실패');
          }
          
          console.log('타임블록 일정 등록 성공');
        } catch (error) {
          console.error('자동화 처리 중 오류 발생:', error);
        }
      }
  
      setReservations(prev =>
        prev.map(reservation =>
          reservation.id === reservationId
            ? { 
                ...reservation, 
                status: newStatus,
                status_updated_at: new Date().toISOString()
              }
            : reservation
        )
      );
  
      if (selectedReservation?.id === reservationId) {
        setSelectedReservation(prev => 
          prev ? { 
            ...prev, 
            status: newStatus,
            status_updated_at: new Date().toISOString()
          } : null
        );
      }
  
    } catch (error) {
      console.error('상태 변경 중 오류 발생:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">예약 관리 대시보드</CardTitle>
            {/* 탭 메뉴 개선 */}
            <div className="flex border-b mt-4 overflow-x-auto">
              <button
                className={cn(
                  "py-3 px-4 font-medium text-base whitespace-nowrap",
                  activeTab === 'reservations' 
                    ? "border-b-2 border-blue-500 text-blue-600" 
                    : "text-gray-800 hover:text-gray-800"
                )}
                onClick={() => setActiveTab('reservations')}
              >
                예약 관리
              </button>
              <button
                className={cn(
                  "py-3 px-4 font-medium text-base whitespace-nowrap",
                  activeTab === 'slots' 
                    ? "border-b-2 border-blue-500 text-blue-600" 
                    : "text-gray-800 hover:text-gray-700"
                )}
                onClick={() => setActiveTab('slots')}
              >
                예약 시간 관리
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {/* 탭 내용 */}
            {activeTab === 'reservations' ? (
              // 기존 예약 관리 UI
              loading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : reservations.length === 0 ? (
                <div className="text-center p-8 text-gray-800 text-lg">예약 요청이 없습니다.</div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((reservation) => (
                    <Card 
                      key={reservation.id} 
                      className={cn(
                        "p-4 cursor-pointer hover:shadow-lg transition-shadow",
                        reservation.source === 'owner' && "border-blue-300" // 원장 생성 예약 강조
                      )}
                      onClick={() => handleReservationClick(reservation)}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg text-gray-900">
                            {reservation.customer_name}
                            {reservation.source === 'owner' && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                원장 생성
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-800 mt-1">
                            {new Date(reservation.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-base text-gray-800 mt-1">희망 시술: {SERVICE_MAP[reservation.desired_service as keyof typeof serviceTypes]?.name || reservation.desired_service}</p>
                        </div>
                        <div className="text-right mt-3 sm:mt-0">
                          <span 
                            className={cn(
                              "px-3 py-2 rounded text-base font-medium",
                              {
                                'bg-yellow-100 text-yellow-800': reservation.status === 'pending',
                                'bg-blue-100 text-blue-800': reservation.status === 'deposit_wait',
                                'bg-green-100 text-green-800': reservation.status === 'confirmed',
                                'bg-red-100 text-red-800': reservation.status === 'rejected'
                              }
                            )}
                          >
                            {reservation.status === 'pending' ? '대기중' :
                            reservation.status === 'deposit_wait' ? '예약금 대기중' :
                            reservation.status === 'confirmed' ? '예약 확정' :
                            '거절됨'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              // 새로운 예약 시간 관리 UI
              <SlotManagementList onRefresh={fetchReservations} />
            )}
          </CardContent>
        </Card>

        {/* 예약 상세 다이얼로그 - 모바일 최적화 */}
        <Dialog 
          isOpen={!!selectedReservation && activeTab === 'reservations'} 
          onClose={() => {
            setSelectedReservation(null);
            setSelectedSlot(null);
          }}
        >
          {selectedReservation && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                예약 상세 정보
                {(selectedReservation as any).source === 'owner' && (
                  <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    원장 생성
                  </span>
                )}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-lg text-gray-900">고객 정보</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-base text-gray-800">이름: {selectedReservation.customer_name}</p>
                    {/* 원장 생성 예약에는 성별, 나이 정보가 없을 수 있음 */}
                    {!(selectedReservation as any).source && (
                      <>
                        <p className="text-base text-gray-800">성별: {selectedReservation.gender === 'female' ? '여성' : '남성'}</p>
                        <p className="text-base text-gray-800">나이: {selectedReservation.age}세</p>
                      </>
                    )}
                    <p className="text-base text-gray-800">연락처: {selectedReservation.phone || '-'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-lg text-gray-900">예약 정보</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-base text-gray-800">희망 시술: {SERVICE_MAP[selectedReservation.desired_service as keyof typeof serviceTypes]?.name || selectedReservation.desired_service}</p>
                    
                    {/* 원장 생성 예약은 선택된 시간만 있고 희망 시간대 목록은 없음 */}
                    {(selectedReservation as any).source === 'owner' ? (
                      <div>
                        <h4 className="font-medium text-gray-900">예약 시간</h4>
                        <div className="p-3 rounded border bg-green-100 border-green-500 mt-1 text-base">
                          {selectedReservation.selected_slot && format(new Date(selectedReservation.selected_slot.date), 'M월 d일', { locale: ko })} {selectedReservation.selected_slot?.time}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">희망 시간대</h4>
                        {selectedReservation.desired_slots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => handleSlotSelect(slot)}
                            disabled={selectedReservation.status !== 'pending'}
                            className={cn(
                              "w-full p-3 rounded border text-left text-base",
                              selectedSlot?.time === slot.time && selectedSlot?.date === slot.date
                                ? "bg-green-100 border-green-500 text-green-800"
                                : selectedReservation.status === 'pending'
                                  ? "hover:bg-gray-50 text-gray-800"
                                  : "bg-gray-50 text-gray-800 cursor-not-allowed",
                              selectedReservation.selected_slot?.time === slot.time && 
                              selectedReservation.selected_slot?.date === slot.date
                                ? "ring-2 ring-green-500"
                                : ""
                            )}
                          >
                            {index + 1}순위: {format(new Date(slot.date), 'M월 d일', { locale: ko })} {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-base text-gray-800">방문 경로: {selectedReservation.referral_source || '-'}</p>
                    <p className="text-base text-gray-800">시술 경험: {selectedReservation.prior_experience || '없음'}</p>
                  </div>
                </div>
              </div>

              {/* 사진 표시 부분 - 원장 생성 예약에는 사진이 없음 */}
              {!(selectedReservation as any).source && (selectedReservation.front_photo_url || selectedReservation.closed_photo_url) && (
                <div className="mt-4">
                  <h3 className="font-medium text-lg text-gray-900 mb-2">첨부 사진</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedReservation.front_photo_url && (
                      <div>
                        <p className="text-base text-gray-800 mb-1">정면 사진 (눈 뜬 상태)</p>
                        <img 
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${selectedReservation.front_photo_url}`}
                          alt="정면 사진"
                          className="w-full rounded"
                        />
                      </div>
                    )}
                    {selectedReservation.closed_photo_url && (
                      <div>
                        <p className="text-base text-gray-800 mb-1">정면 사진 (눈 감은 상태)</p>
                        <img 
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${selectedReservation.closed_photo_url}`}
                          alt="정면 사진 (눈 감은 상태)"
                          className="w-full rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 상태 표시 및 승인/거절 버튼 */}
              <div className="mt-6 space-y-3">
                {/* 현재 상태 표시 */}
                <div className={cn(
                  "w-full p-3 rounded text-center text-base font-medium",
                  {
                    'bg-yellow-100 text-yellow-800': selectedReservation.status === 'pending',
                    'bg-blue-100 text-blue-800': selectedReservation.status === 'deposit_wait',
                    'bg-green-100 text-green-800': selectedReservation.status === 'confirmed',
                    'bg-red-100 text-red-800': selectedReservation.status === 'rejected'
                  }
                )}>
                  현재 상태: {
                    selectedReservation.status === 'pending' ? '대기중' :
                    selectedReservation.status === 'deposit_wait' ? '예약금 대기중' :
                    selectedReservation.status === 'confirmed' ? '예약 확정' :
                    '거절됨'
                  }
                </div>

                {/* 승인/거절 버튼 */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  {/* 고객 예약인 경우 */}
                  {!(selectedReservation as any).source && selectedReservation.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleStatusChange(selectedReservation.id, 'rejected')}
                        className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-base font-medium"
                      >
                        예약 거절
                      </button>
                      <button
                        onClick={() => handleApproveWithSlot(selectedReservation.id)}
                        className={cn(
                          "px-4 py-3 rounded-lg text-base font-medium",
                          selectedSlot
                            ? "bg-green-500 text-white hover:bg-green-700"
                            : "bg-gray-300 text-gray-800 cursor-not-allowed"
                        )}
                        disabled={!selectedSlot}
                      >
                        예약 승인
                      </button>
                    </>
                  ) : selectedReservation.status === 'deposit_wait' ? (
                    <>
                      <button
                        onClick={() => handleStatusChange(selectedReservation.id, 'rejected')}
                        className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 text-base font-medium"
                      >
                        예약 {(selectedReservation as any).source === 'owner' ? '취소' : '거절'}
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedReservation.id, 'confirmed')}
                        className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-base font-medium"
                      >
                        예약 확정
                      </button>
                    </>
                  ) : (
                    <div className={cn(
                      "px-4 py-3 rounded-lg text-base font-medium",
                      selectedReservation.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    )}>
                      {selectedReservation.status === 'confirmed' ? '예약 확정' : '거절됨'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </div>
  );
}