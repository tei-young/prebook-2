'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

interface Reservation {
  id: string;
  customer_name: string;
  gender: string;
  age: number;
  phone: string;
  desired_service: string;
  referral_source: string | null;
  desired_dates: string[];
  prior_experience: string | null;
  front_photo_url: string | null;
  closed_photo_url: string | null;
  status: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

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
                  <Card key={reservation.id} className="p-4">
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
      </div>
    </div>
  );
}