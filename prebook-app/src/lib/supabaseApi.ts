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
  
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        date: booking.date,
        time: booking.time,
        service_type: booking.service_type,
        customer_name: booking.customer_name || null,
        customer_phone: booking.customer_phone || null,
        status: booking.status,
        notes: booking.notes || null
      }])
      .select();
    
    if (error) {
      console.error('예약 생성 오류:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error('예약 데이터가 생성되지 않았습니다');
    }
    
    console.log('Booking created successfully:', data[0]);
    return data[0] as Booking;
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
      // 예약 불가능 시간인지 확인
      const isUnavailable = unavailableSlots.some(
        unavailable => unavailable.date === slot.date && unavailable.time === slot.time
      );
      
      // 이미 예약된 시간인지 확인
      const isBooked = bookedSlots.some(
        booking => booking.date === slot.date && booking.time === slot.time
      );
      
      return {
        ...slot,
        available: !isUnavailable && !isBooked
      };
    });
    
    return availableSlots;
  } catch (error) {
    console.error('예약 가능 시간 조회 오류:', error);
    // 오류 발생 시에도 기본 가용 슬롯 반환 (모두 available: true)
    return allSlots;
  }
};

// 여러 날짜에 대한 예약 가능 시간 조회 (캘린더 뷰용)
export const getAvailableSlotsForMonth = async (year: number, month: number) => {
  // 해당 월의 모든 날짜 생성
  const daysInMonth = new Date(year, month, 0).getDate();
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  });
  
  // 예약 불가능 시간 조회
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = `${year}-${month.toString().padStart(2, '0')}-${daysInMonth}`;
  
  const { data: unavailableSlots, error: unavailableError } = await supabase
    .from('unavailable_slots')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);
  
  if (unavailableError) {
    console.error('예약 불가능 시간 조회 오류:', unavailableError);
    throw unavailableError;
  }
  
  // 예약된 시간 조회
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .in('status', ['deposit_wait', 'confirmed']);
  
  if (bookingsError) {
    console.error('예약 조회 오류:', bookingsError);
    throw bookingsError;
  }
  
  // 날짜별 가용 여부 확인
  const result = dates.map(date => {
    // 해당 날짜의 예약 불가능 시간
    const dateUnavailableSlots = unavailableSlots.filter(slot => slot.date === date);
    
    // 해당 날짜의 예약된 시간
    const dateBookings = bookings.filter(booking => booking.date === date);
    
    // 모든 시간 슬롯이 예약 불가능한지 확인
    const AVAILABLE_TIMES = [
      '10:00', '11:00',                       // 오전
      '13:00', '14:00', '15:00', '16:00',     // 오후
      '17:00', '18:00', '19:00'               // 저녁
    ];
    
    const availableTimes = AVAILABLE_TIMES.filter(time => {
      const isUnavailable = dateUnavailableSlots.some(slot => slot.time === time);
      const isBooked = dateBookings.some(booking => booking.time === time);
      return !isUnavailable && !isBooked;
    });
    
    return {
      date,
      hasAvailableSlot: availableTimes.length > 0,
      availableTimes
    };
  });
  
  return result;
};