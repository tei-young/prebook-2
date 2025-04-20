import { supabase } from './supabase';

// 타입 정의
export interface UnavailableSlot {
  id?: string;
  date: string;
  time: string;
  reason?: string;
  status: 'blocked';
  created_at?: string;
  updated_at?: string;
}

export type BookingStatus = 'available' | 'deposit_wait' | 'confirmed' | 'cancelled';

export const SERVICE_MAP: Record<string, { name: string, duration: 1 | 2 }> = {
    natural: { name: '자연눈썹', duration: 2 },
    combo: { name: '콤보눈썹', duration: 2 },
    shadow: { name: '섀도우눈썹', duration: 2 },
    retouch: { name: '리터치', duration: 1 },
    brownline: { name: '브라운아이라인', duration: 1 },
    removal: { name: '잔흔제거', duration: 1 },
    recommend: { name: '키뮤원장 추천시술', duration: 2 }
  };

export interface Booking {
  id?: string;
  date: string;
  time: string;
  service_type: string;
  customer_name?: string;
  customer_phone?: string;
  status: BookingStatus;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// UnavailableSlot CRUD 함수
export const getUnavailableSlots = async (date?: string) => {
  let query = supabase.from('unavailable_slots').select('*');
  
  if (date) {
    query = query.eq('date', date);
  }
  
  const { data, error } = await query.order('date', { ascending: true });
  
  if (error) {
    console.error('예약 불가능 시간 조회 오류:', error);
    throw error;
  }
  
  return data as UnavailableSlot[];
};

export const createUnavailableSlot = async (slot: UnavailableSlot) => {
  const { data, error } = await supabase
    .from('unavailable_slots')
    .insert([{
      date: slot.date,
      time: slot.time,
      reason: slot.reason || null,
      status: 'blocked'
    }])
    .select();
  
  if (error) {
    console.error('예약 불가능 시간 생성 오류:', error);
    throw error;
  }
  
  return data[0] as UnavailableSlot;
};

export const updateUnavailableSlot = async (id: string, slot: Partial<UnavailableSlot>) => {
  const { data, error } = await supabase
    .from('unavailable_slots')
    .update({
      ...slot,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('예약 불가능 시간 업데이트 오류:', error);
    throw error;
  }
  
  return data[0] as UnavailableSlot;
};

export const deleteUnavailableSlot = async (id: string) => {
  const { error } = await supabase
    .from('unavailable_slots')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('예약 불가능 시간 삭제 오류:', error);
    throw error;
  }
  
  return true;
};

// 여러 슬롯을 한 번에 예약 불가능으로 설정 (휴무일 등)
export const bulkCreateUnavailableSlots = async (slots: UnavailableSlot[]) => {
  const { data, error } = await supabase
    .from('unavailable_slots')
    .insert(slots.map(slot => ({
      date: slot.date,
      time: slot.time,
      reason: slot.reason || null,
      status: 'blocked'
    })))
    .select();
  
  if (error) {
    console.error('예약 불가능 시간 일괄 생성 오류:', error);
    throw error;
  }
  
  return data as UnavailableSlot[];
};

// Booking CRUD 함수
export const getBookings = async (date?: string, status?: BookingStatus) => {
  let query = supabase.from('bookings').select('*');
  
  if (date) {
    query = query.eq('date', date);
  }
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('date', { ascending: true });
  
  if (error) {
    console.error('예약 조회 오류:', error);
    throw error;
  }
  
  return data as Booking[];
};

export const createBooking = async (booking: Booking) => {
    console.log('Creating booking with data:', booking);
  
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(booking),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '예약 생성 중 오류가 발생했습니다');
      }
      
      const data = await response.json();
      console.log('Booking created successfully:', data);
      return data as Booking;
    } catch (error) {
      console.error('예약 생성 오류:', error);
      throw error;
    }
  };

export const updateBookingStatus = async (id: string, status: BookingStatus) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('예약 상태 업데이트 오류:', error);
    throw error;
  }
  
  return data[0] as Booking;
};

export const updateBooking = async (id: string, booking: Partial<Booking>) => {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      ...booking,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('예약 업데이트 오류:', error);
    throw error;
  }
  
  return data[0] as Booking;
};

export const deleteBooking = async (id: string) => {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('예약 삭제 오류:', error);
    throw error;
  }
  
  return true;
};

// 예약 가능한 시간 조회 (unavailable_slots과 bookings 테이블을 모두 고려)
export const getAvailableSlots = async (date: string) => {
    // 모든 시간 슬롯 생성 (예: 10:00부터 19:00까지 1시간 간격)
    const AVAILABLE_TIMES = [
      '10:00', '11:00',                       // 오전
      '13:00', '14:00', '15:00', '16:00',     // 오후
      '17:00', '18:00', '19:00'               // 저녁
    ];
    
    // 전체 시간 슬롯 생성 - 기본적으로 모두 available: true로 설정
    const allSlots = AVAILABLE_TIMES.map(time => ({
      date,
      time,
      available: true
    }));
    
    try {
      // 예약 불가능 시간 조회
      const unavailableSlots = await getUnavailableSlots(date);
      
      // 예약된 시간 조회 (deposit_wait 또는 confirmed 상태만)
      const bookings = await getBookings(date);
      const bookedSlots = bookings.filter(
        booking => booking.status === 'deposit_wait' || booking.status === 'confirmed'
      );
      
      // 예약 가능한 시간 필터링
      const availableSlots = allSlots.map(slot => {
        const currentTime = slot.time;
        const currentHour = parseInt(currentTime.split(':')[0]);
        
        // 예약 불가능 시간인지 확인
        const isUnavailable = unavailableSlots.some(
          unavailable => unavailable.date === slot.date && unavailable.time === slot.time
        );
        
        if (isUnavailable) return { ...slot, available: false };
        
        // 직접 예약된 시간인지 확인
        const directlyBooked = bookedSlots.some(
          booking => booking.date === slot.date && booking.time === slot.time
        );
        
        if (directlyBooked) return { ...slot, available: false };
        
        // 이전 시간에 2시간짜리 예약이 있는지 확인
        const overlappingBooking = bookedSlots.some(booking => {
          const bookingHour = parseInt(booking.time.split(':')[0]);
          // 안전하게 SERVICE_MAP 속성 접근
          const serviceType = booking.service_type || '';
          const serviceInfo = SERVICE_MAP[serviceType as keyof typeof SERVICE_MAP];
          const bookingDuration = serviceInfo ? serviceInfo.duration : 1;
          
          // 현재 시간이 이전 예약 시간 + 소요시간 범위 내에 있는지 확인
          return booking.date === slot.date && 
                 bookingHour < currentHour && 
                 bookingHour + bookingDuration > currentHour;
        });
        
        return { ...slot, available: !overlappingBooking };
      });
      
      return availableSlots;
    } catch (error) {
      console.error('예약 가능 시간 조회 오류:', error);
      // 오류 발생 시에도 기본 가용 슬롯 반환 (모두 available: true)
      return allSlots;
    }
  };