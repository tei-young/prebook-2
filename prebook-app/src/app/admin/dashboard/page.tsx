'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Dialog from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

interface Reservation {
  id: string;
  customer_name: string;
  gender: string;
  age: number;
  phone: string;
  desired_service: string;
  referral_source: string | null;
  desired_dates: string[] | string;
  prior_experience: string | null;
  front_photo_url: string | null;
  closed_photo_url: string | null;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    async function fetchReservations() {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReservations(data || []);
      } catch (error) {
        console.error('예약 목록 조회 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, []);

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">예약 관리 대시보드</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>로딩 중...</div>
            ) : reservations.length === 0 ? (
              <div>예약 요청이 없습니다.</div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => (
                  <Card 
                    key={reservation.id} 
                    className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleReservationClick(reservation)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{reservation.customer_name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(reservation.created_at).toLocaleDateString()}
                        </p>
                        <p>희망 시술: {reservation.desired_service}</p>
                      </div>
                      <div className="text-right">
                        <span 
                          className={`px-2 py-1 rounded text-sm ${
                            reservation.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {reservation.status === 'pending' ? '대기중' : '승인됨'}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog 
          isOpen={!!selectedReservation} 
          onClose={() => setSelectedReservation(null)}
        >
          {selectedReservation && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">예약 상세 정보</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">고객 정보</h3>
                  <div className="mt-2 space-y-2">
                    <p>이름: {selectedReservation.customer_name}</p>
                    <p>성별: {selectedReservation.gender}</p>
                    <p>나이: {selectedReservation.age}세</p>
                    <p>연락처: {selectedReservation.phone}</p>
                  </div>
                </div>
                
                <div>
                    <h3 className="font-medium text-gray-700">예약 정보</h3>
                    <div className="mt-2 space-y-2">
                        <p>희망 시술: {selectedReservation.desired_service}</p>
                        <p>희망 날짜: {
                        Array.isArray(selectedReservation.desired_dates) 
                            ? selectedReservation.desired_dates.join(', ')
                            : selectedReservation.desired_dates
                        }</p>
                        <p>방문 경로: {selectedReservation.referral_source || '-'}</p>
                        <p>시술 경험: {selectedReservation.prior_experience || '없음'}</p>
                    </div>
                </div>
              </div>

              {(selectedReservation.front_photo_url || selectedReservation.closed_photo_url) && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-700 mb-2">첨부 사진</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedReservation.front_photo_url && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">정면 사진 (눈 뜬 상태)</p>
                        <img 
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${selectedReservation.front_photo_url}`}
                          alt="정면 사진"
                          className="w-full rounded"
                        />
                      </div>
                    )}
                    {selectedReservation.closed_photo_url && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">정면 사진 (눈 감은 상태)</p>
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
            </div>
          )}
        </Dialog>
      </div>
    </div>
  );
}