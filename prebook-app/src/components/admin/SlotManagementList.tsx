'use client';

import React, { useState, useEffect } from 'react';
import { format, parse, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  UnavailableSlot, 
  Booking, 
  BookingStatus,
  createUnavailableSlot, 
  deleteUnavailableSlot, 
  getUnavailableSlots, 
  getBookings, 
  createBooking, 
  updateBookingStatus,
  bulkCreateUnavailableSlots
} from '@/lib/supabaseApi';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminCalendar from '@/components/admin/AdminCalendar';
import Dialog from '@/components/ui/dialog';

// 예약 서비스 타입 (기존 Calendar 컴포넌트에서 가져옴)
export enum serviceTypes {
  natural = 'natural',
  combo = 'combo',
  shadow = 'shadow',
  retouch = 'retouch',
  brownline = 'brownline',
  removal = 'removal',
  recommend = 'recommend'
}

export const SERVICE_MAP: Record<keyof typeof serviceTypes, { name: string, duration: 1 | 2 }> = {
  natural: { name: '자연눈썹', duration: 2 },
  combo: { name: '콤보눈썹', duration: 2 },
  shadow: { name: '섀도우눈썹', duration: 2 },
  retouch: { name: '리터치', duration: 1 },
  brownline: { name: '브라운아이라인', duration: 1 },
  removal: { name: '잔흔제거', duration: 1 },
  recommend: { name: '키뮤원장 추천시술', duration: 2 }
};

interface SlotManagementListProps {
  onRefresh?: () => void;
}

export default function SlotManagementList({ onRefresh }: SlotManagementListProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [unavailableSlots, setUnavailableSlots] = useState<UnavailableSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'block' | 'book'>('block');
  
  // 예약 폼 상태
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState<{
    serviceType: keyof typeof serviceTypes;
    customerName: string;
    customerPhone: string;
    notes: string;
    status: BookingStatus;
  }>({
    serviceType: 'natural',
    customerName: '',
    customerPhone: '',
    notes: '',
    status: 'deposit_wait'
  });

  // 일괄 차단 다이얼로그 상태
  const [isBulkBlockDialogOpen, setIsBulkBlockDialogOpen] = useState(false);
  const [bulkBlockForm, setBulkBlockForm] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    reason: '휴무일',
    times: ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']
  });

  // 선택된 날짜가 변경될 때 데이터 로드
  useEffect(() => {
    if (selectedDate) {
      loadSlotsData(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate]);

  // 예약 및 예약 불가능 시간 데이터 로드
  const loadSlotsData = async (date: string) => {
    try {
      setLoading(true);
      // 예약 불가능 시간 로드
      const unavailableSlotsData = await getUnavailableSlots(date);
      setUnavailableSlots(unavailableSlotsData);
      
      // 예약 데이터 로드
      const bookingsData = await getBookings(date);
      setBookings(bookingsData);
    } catch (error) {
      console.error('슬롯 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 시간 슬롯 차단 처리
  const handleBlockSlot = async (time: string) => {
    if (!selectedDate) return;
    
    try {
      setLoading(true);
      const date = format(selectedDate, 'yyyy-MM-dd');
      
      // 이미 예약 불가능한 시간인지 확인
      const isAlreadyBlocked = unavailableSlots.some(
        slot => slot.date === date && slot.time === time
      );
      
      if (isAlreadyBlocked) {
        // 이미 차단된 시간이면 차단 해제
        const slotToDelete = unavailableSlots.find(
          slot => slot.date === date && slot.time === time
        );
        
        if (slotToDelete?.id) {
          await deleteUnavailableSlot(slotToDelete.id);
        }
      } else {
        // 새로운 예약 불가능 시간 추가
        await createUnavailableSlot({
          date,
          time,
          reason: '예약 불가',
          status: 'blocked'
        });
      }
      
      // 데이터 새로고침
      await loadSlotsData(date);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('슬롯 차단 상태 변경 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 예약 생성 폼 열기
  const handleOpenBookingForm = (time: string) => {
    setSelectedSlot(time);
    setIsFormOpen(true);
  };

  // 예약 생성 처리
  const handleCreateBooking = async () => {
    if (!selectedDate || !selectedSlot) return;
    
    try {
      setLoading(true);
      const date = format(selectedDate, 'yyyy-MM-dd');
      
      // 콘솔 로그 추가하여 디버깅
      console.log('예약 생성 시도:', {
        date,
        time: selectedSlot,
        service_type: bookingForm.serviceType,
        customer_name: bookingForm.customerName || undefined,
        customer_phone: bookingForm.customerPhone || undefined,
        status: bookingForm.status,
        notes: bookingForm.notes || undefined
      });
      
      const result = await createBooking({
        date,
        time: selectedSlot,
        service_type: bookingForm.serviceType,
        customer_name: bookingForm.customerName || undefined,
        customer_phone: bookingForm.customerPhone || undefined,
        status: bookingForm.status,
        notes: bookingForm.notes || undefined
      });
      
      console.log('예약 생성 결과:', result);
      
      // 폼 초기화 및 닫기
      setIsFormOpen(false);
      setBookingForm({
        serviceType: 'natural',
        customerName: '',
        customerPhone: '',
        notes: '',
        status: 'deposit_wait'
      });
      setSelectedSlot(null);
      
      // 데이터 새로고침 - 두 번 호출하여 확실히 새로고침
      await loadSlotsData(date);
      if (onRefresh) onRefresh();
      
      // 성공 메시지 추가
      alert('예약이 성공적으로 생성되었습니다.');
    } catch (error) {
      console.error('예약 생성 오류:', error);
      alert('예약 생성 중 오류가 발생했습니다: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 예약 상태 변경 처리
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: BookingStatus) => {
    if (!selectedDate) return;
    
    try {
      setLoading(true);
      
      await updateBookingStatus(bookingId, newStatus);
      
      // 데이터 새로고침
      await loadSlotsData(format(selectedDate, 'yyyy-MM-dd'));
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('예약 상태 변경 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 일괄 차단 처리
  const handleBulkBlock = async () => {
    try {
      setLoading(true);
      
      const startDate = parse(bulkBlockForm.startDate, 'yyyy-MM-dd', new Date());
      const endDate = parse(bulkBlockForm.endDate, 'yyyy-MM-dd', new Date());
      
      // 날짜 범위 유효성 검증
      if (startDate > endDate) {
        alert('종료일이 시작일보다 빠를 수 없습니다.');
        return;
      }
      
      // 차단할 날짜 계산
      const dates: string[] = [];
      let currentDate = startDate;
      
      while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addDays(currentDate, 1);
      }
      
      // 모든 슬롯 생성
      const slotsToBlock: UnavailableSlot[] = [];
      
      for (const date of dates) {
        for (const time of bulkBlockForm.times) {
          slotsToBlock.push({
            date,
            time,
            reason: bulkBlockForm.reason,
            status: 'blocked'
          });
        }
      }
      
      // 일괄 차단 처리
      await bulkCreateUnavailableSlots(slotsToBlock);
      
      // 다이얼로그 닫기
      setIsBulkBlockDialogOpen(false);
      
      // 현재 선택된 날짜가 있다면 데이터 새로고침
      if (selectedDate) {
        await loadSlotsData(format(selectedDate, 'yyyy-MM-dd'));
      }
      
      if (onRefresh) onRefresh();
      
      alert(`${dates.length}일 동안 ${bulkBlockForm.times.length}개 시간대를 성공적으로 차단했습니다.`);
    } catch (error) {
      console.error('일괄 차단 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 시간대 체크박스 토글
  const toggleTimeSelection = (time: string) => {
    setBulkBlockForm(prev => {
      if (prev.times.includes(time)) {
        return {
          ...prev,
          times: prev.times.filter(t => t !== time)
        };
      } else {
        return {
          ...prev,
          times: [...prev.times, time].sort()
        };
      }
    });
  };

  // 모든 시간대 선택/해제
  const toggleAllTimes = (select: boolean) => {
    setBulkBlockForm(prev => ({
      ...prev,
      times: select 
        ? ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'] 
        : []
    }));
  };

  // 시간 슬롯 상태 확인
  const getSlotStatus = (time: string) => {
    if (!selectedDate) return 'available';
    
    const date = format(selectedDate, 'yyyy-MM-dd');
    
    // 예약 불가능한 시간인지 확인
    const isBlocked = unavailableSlots.some(
      slot => slot.date === date && slot.time === time
    );
    
    if (isBlocked) return 'blocked';
    
    // 예약된 시간인지 확인
    const booking = bookings.find(
      booking => booking.date === date && booking.time === time
    );
    
    if (booking) return booking.status;
    
    return 'available';
  };

  const AVAILABLE_TIMES = [
    '10:00', '11:00',                       // 오전
    '13:00', '14:00', '15:00', '16:00',     // 오후
    '17:00', '18:00', '19:00'               // 저녁
  ];

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto flex flex-col sm:flex-row">
            <Button 
            variant={mode === 'block' ? 'default' : 'outline'} 
            onClick={() => setMode('block')}
            className={cn(
                "text-base py-5 px-4 w-full sm:w-auto",
                mode === 'block' ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-white text-gray-800 hover:bg-gray-100"
            )}
            >
            시간 차단 모드
            </Button>
            <Button 
            variant={mode === 'book' ? 'default' : 'outline'} 
            onClick={() => setMode('book')}
            className={cn(
                "text-base py-5 px-4 w-full sm:w-auto",
                mode === 'book' ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-white text-gray-800 hover:bg-gray-100"
            )}
            >
            예약 생성 모드
            </Button>
        </div>

        <Button 
            onClick={() => setIsBulkBlockDialogOpen(true)}
            className="text-base py-5 px-4 w-full sm:w-auto bg-green-500 text-white hover:bg-green-600"
        >
            휴무일 일괄 설정
        </Button>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">날짜 선택</h3>
                {/* 날짜 선택용 캘린더 컴포넌트 */}
                <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-900">
                    {selectedDate ? format(selectedDate, 'yyyy년 M월 d일', { locale: ko }) : '날짜를 선택하세요'}
                    </h4>
                </div>
                <AdminCalendar
                    selectedDate={selectedDate}
                    onDateSelect={(date) => {
                    setSelectedDate(date);
                    loadSlotsData(format(date, 'yyyy-MM-dd'));
                    
                    setTimeout(() => {
                        const timeManagementSection = document.getElementById('time-management-section');
                        if (timeManagementSection) {
                        timeManagementSection.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 100);
                    }}
                />
                </div>
            
              {selectedDate && (
                <div id="time-management-section">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">시간대 관리</h3>
                  <div className="border rounded-lg p-4">
                    <div className="mb-4">
                      <h4 className="font-bold text-gray-900">
                        {format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} 시간대
                      </h4>
                      <p className="text-sm text-gray-900 font-medium mt-1">
                        {mode === 'block' 
                          ? '시간을 클릭하여 차단/해제하세요' 
                          : '시간을 클릭하여 예약을 생성하세요'}
                      </p>
                    </div>            
  
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 오전 시간대 */}
                    <div>
                    <h5 className="font-bold mb-2 text-lg text-gray-900">오전</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {AVAILABLE_TIMES.filter(time => parseInt(time) < 12).map(time => {
                            const status = getSlotStatus(time);
                            return (
                                <button
                                key={time}
                                onClick={() => mode === 'block' 
                                    ? handleBlockSlot(time) 
                                    : status === 'available' && handleOpenBookingForm(time)
                                }
                                disabled={mode === 'book' && status !== 'available'}
                                className={cn(
                                    "px-4 py-4 rounded-lg text-lg flex items-center justify-center",
                                    status === 'available' && mode === 'block' && "bg-white hover:bg-gray-100 border",
                                    status === 'available' && mode === 'book' && "bg-white hover:bg-green-50 border",
                                    status === 'blocked' && "bg-red-100 text-red-800 hover:bg-red-200",
                                    status === 'deposit_wait' && "bg-blue-100 text-blue-800",
                                    status === 'confirmed' && "bg-green-100 text-green-800",
                                    status === 'cancelled' && "bg-gray-100 text-gray-500",
                                    (mode === 'book' && status !== 'available') && "cursor-not-allowed opacity-70"
                                )}
                                >
                                {time}
                                </button>
                            );
                            })}
                        </div>
                        </div>
  
                    {/* 오후 시간대 */}
                    <div>
                    <h5 className="font-bold mb-2 text-lg text-gray-900">오후</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {AVAILABLE_TIMES.filter(time => parseInt(time) >= 12).map(time => {
                            const status = getSlotStatus(time);
                            return (
                                <button
                                key={time}
                                onClick={() => mode === 'block' 
                                    ? handleBlockSlot(time) 
                                    : status === 'available' && handleOpenBookingForm(time)
                                }
                                disabled={mode === 'book' && status !== 'available'}
                                className={cn(
                                    "px-4 py-4 rounded-lg text-lg flex items-center justify-center",
                                    status === 'available' && mode === 'block' && "bg-white hover:bg-gray-100 border",
                                    status === 'available' && mode === 'book' && "bg-white hover:bg-green-50 border",
                                    status === 'blocked' && "bg-red-100 text-red-800 hover:bg-red-200",
                                    status === 'deposit_wait' && "bg-blue-100 text-blue-800",
                                    status === 'confirmed' && "bg-green-100 text-green-800",
                                    status === 'cancelled' && "bg-gray-100 text-gray-500",
                                    (mode === 'book' && status !== 'available') && "cursor-not-allowed opacity-70"
                                )}
                                >
                                {parseInt(time) > 12 ? `${parseInt(time) - 12}:${time.split(':')[1]}` : time}
                                </button>
                            );
                            })}
                        </div>
                        </div>
                  </div>
                )}
              </div>
  
            {/* 예약 목록 섹션은 시간 UI 아래로 이동 */}
            {bookings.length > 0 && (
            <div className="mt-6 border rounded-lg p-4">
                <h3 className="font-medium mb-4 text-lg">
                {format(selectedDate, 'yyyy년 M월 d일', { locale: ko })} 예약 목록
                </h3>
                
                <div className="space-y-4">
                {bookings.map(booking => (
                    <div 
                    key={booking.id} 
                    className={cn(
                        "p-4 rounded-lg border",
                        booking.status === 'deposit_wait' && "border-blue-200 bg-blue-50",
                        booking.status === 'confirmed' && "border-green-200 bg-green-50",
                        booking.status === 'cancelled' && "border-gray-200 bg-gray-50"
                    )}
                    >
                    <div className="flex flex-col sm:flex-row justify-between items-start">
                        <div>
                        <div className="font-medium text-lg">
                            {booking.time} - {SERVICE_MAP[booking.service_type as keyof typeof serviceTypes]?.name || booking.service_type}
                        </div>
                        {booking.customer_name && (
                            <div className="text-base mt-1">고객명: {booking.customer_name}</div>
                        )}
                        {booking.customer_phone && (
                            <div className="text-base">연락처: {booking.customer_phone}</div>
                        )}
                        {booking.notes && (
                            <div className="text-base mt-2 text-gray-600">{booking.notes}</div>
                        )}
                        </div>
                        <div className="flex space-x-2 mt-3 sm:mt-0">
                        {booking.status === 'deposit_wait' && (
                            <>
                            <Button 
                                size="sm"
                                className="text-base py-3 px-4"
                                onClick={() => handleUpdateBookingStatus(booking.id!, 'confirmed')}
                            >
                                확정
                            </Button>
                            <Button 
                                size="sm"
                                variant="destructive"
                                className="text-base py-3 px-4"
                                onClick={() => handleUpdateBookingStatus(booking.id!, 'cancelled')}
                            >
                                취소
                            </Button>
                            </>
                        )}
                        {booking.status === 'confirmed' && (
                            <Button 
                            size="sm"
                            variant="destructive"
                            className="text-base py-3 px-4"
                            onClick={() => handleUpdateBookingStatus(booking.id!, 'cancelled')}
                            >
                            취소
                            </Button>
                        )}
                        {booking.status === 'cancelled' && (
                            <span className="text-base text-gray-500 px-3 py-2 bg-gray-100 rounded-lg">취소됨</span>
                        )}
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            </div>
            )}
            </div>
                    )}
            </div>
  
      {/* 예약 생성 폼 다이얼로그 */}
      <Dialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">새 예약 생성</h2>
          
          <div className="mb-4">
            <h3 className="font-medium text-gray-700">예약 정보</h3>
            <div className="mt-2">
              <p>날짜: {selectedDate ? format(selectedDate, 'yyyy년 M월 d일', { locale: ko }) : ''}</p>
              <p>시간: {selectedSlot}</p>
            </div>
          </div>
  
          <div className="space-y-4">
            <div>
              <Label htmlFor="serviceType">시술 종류</Label>
              <select
                id="serviceType"
                className="w-full h-10 px-3 border rounded-md mt-1"
                value={bookingForm.serviceType}
                onChange={(e) => setBookingForm(prev => ({ 
                  ...prev, 
                  serviceType: e.target.value as keyof typeof serviceTypes 
                }))}
              >
                {Object.entries(SERVICE_MAP).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.name} ({value.duration}시간)
                  </option>
                ))}
              </select>
            </div>
  
            <div>
              <Label htmlFor="customerName">고객명 (선택)</Label>
              <Input
                id="customerName"
                value={bookingForm.customerName}
                onChange={(e) => setBookingForm(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="고객 이름"
              />
            </div>
  
            <div>
              <Label htmlFor="customerPhone">연락처 (선택)</Label>
              <Input
                id="customerPhone"
                value={bookingForm.customerPhone}
                onChange={(e) => setBookingForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                placeholder="010-0000-0000"
              />
            </div>
  
            <div>
              <Label htmlFor="notes">메모 (선택)</Label>
              <Textarea
                id="notes"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="예약 관련 메모"
                rows={3}
              />
            </div>
  
            <div>
              <Label htmlFor="status">예약 상태</Label>
              <select
                id="status"
                className="w-full h-10 px-3 border rounded-md mt-1"
                value={bookingForm.status}
                onChange={(e) => setBookingForm(prev => ({ 
                  ...prev, 
                  status: e.target.value as BookingStatus
                }))}
              >
                <option value="deposit_wait">예약금 대기</option>
                <option value="confirmed">예약 확정</option>
              </select>
            </div>
          </div>
  
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreateBooking} disabled={loading}>
              {loading ? '처리 중...' : '예약 생성'}
            </Button>
          </div>
        </div>
      </Dialog>
  
      {/* 일괄 차단 다이얼로그 */}
      <Dialog isOpen={isBulkBlockDialogOpen} onClose={() => setIsBulkBlockDialogOpen(false)}>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">휴무일 일괄 설정</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                value={bulkBlockForm.startDate}
                onChange={(e) => setBulkBlockForm(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                value={bulkBlockForm.endDate}
                onChange={(e) => setBulkBlockForm(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
  
          <div>
            <Label htmlFor="reason">사유</Label>
            <Input
              id="reason"
              value={bulkBlockForm.reason}
              onChange={(e) => setBulkBlockForm(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="휴무일, 개인 일정 등"
            />
          </div>
  
          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>차단할 시간대</Label>
              <div className="space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => toggleAllTimes(true)}
                >
                  전체 선택
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => toggleAllTimes(false)}
                >
                  전체 해제
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {AVAILABLE_TIMES.map(time => (
                <label 
                key={time}
                className={cn(
                    "flex items-center p-3 border rounded-lg cursor-pointer",
                    bulkBlockForm.times.includes(time) ? "bg-red-50 border-red-200" : "hover:bg-gray-50"
                )}
                >
                <input
                    type="checkbox"
                    className="mr-2 h-5 w-5"
                    checked={bulkBlockForm.times.includes(time)}
                    onChange={() => toggleTimeSelection(time)}
                />
                <span className="text-base">
                    {parseInt(time) > 12 ? `${parseInt(time) - 12}:${time.split(':')[1]}` : time}
                </span>
                </label>
            ))}
            </div>
          </div>
  
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setIsBulkBlockDialogOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleBulkBlock} 
              disabled={loading || bulkBlockForm.times.length === 0}
            >
              {loading ? '처리 중...' : '일괄 차단'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
    </div>
  )}