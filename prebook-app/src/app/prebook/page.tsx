'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';

interface FormData {
  termsAgreed: boolean;
  name: string;
  gender: string;
  age: string;
  phone: string;
  desiredService: string;
  referralSource: string;
  desiredDates: string;
  priorExperience: string;
  frontPhoto: File | null;
  closedPhoto: File | null;
}

const CustomerReservationPage = () => {
  const [formData, setFormData] = useState<FormData>({
    termsAgreed: false,
    name: '',
    gender: '',
    age: '',
    phone: '',
    desiredService: '',
    referralSource: '',
    desiredDates: '',
    priorExperience: '',
    frontPhoto: null,
    closedPhoto: null
  });
  
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.termsAgreed) {
      alert('예약 전 숙지사항 확인이 필요합니다.');
      return;
    }
    
    try {
      console.log('폼 제출 시작');
      
      // 이미지 파일 업로드
      let frontPhotoUrl = null;
      let closedPhotoUrl = null;
    
      if (formData.frontPhoto) {
        console.log('앞면 사진 업로드 시작');
        const frontPhotoPath = `reservation-photos/${Date.now()}_front`;
        const { data: frontData, error: frontError } = await supabase.storage
          .from('photos')
          .upload(frontPhotoPath, formData.frontPhoto);
        
        if (frontError) {
          console.error('앞면 사진 업로드 실패:', frontError);
          throw frontError;
        }
        console.log('앞면 사진 업로드 성공:', frontData);
        frontPhotoUrl = frontData.path;
      }
  
      if (formData.closedPhoto) {
        const closedPhotoPath = `reservation-photos/${Date.now()}_closed`;
        const { data: closedData, error: closedError } = await supabase.storage
          .from('photos')
          .upload(closedPhotoPath, formData.closedPhoto);
        
        if (closedError) throw closedError;
        closedPhotoUrl = closedData.path;
      }
  
      console.log('예약 데이터 저장 시작', {
        customer_name: formData.name,
        gender: formData.gender,
        age: formData.age,
        phone: formData.phone,
        desired_service: formData.desiredService,
        referral_source: formData.referralSource,
        desired_dates: formData.desiredDates,
        prior_experience: formData.priorExperience,
        front_photo_url: frontPhotoUrl,
        closed_photo_url: closedPhotoUrl,
        status: 'pending'
      });
      
      const { data, error } = await supabase
        .from('reservations')
        .insert([
          {
            customer_name: formData.name,
            gender: formData.gender,
            age: parseInt(formData.age),
            phone: formData.phone,
            desired_service: formData.desiredService,
            referral_source: formData.referralSource,
            desired_dates: [formData.desiredDates], // 문자열을 배열로 변환
            prior_experience: formData.priorExperience,
            front_photo_url: frontPhotoUrl,
            closed_photo_url: closedPhotoUrl,
            status: 'pending'
          }
        ])
        .select();
      
      if (error) {
        console.error('예약 데이터 저장 실패:', error);
        throw error;
      }
      
      console.log('예약 요청 성공:', data);
      setSubmitted(true);

    } catch (err) {
      const error = err as any;  // 또는 더 구체적인 타입으로 단언가능
      console.error('예약 요청 중 오류 발생 상세:', {
        error,
        message: error?.message,
        details: error?.details,
        code: error?.code
      });
      alert('예약 요청 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
                  예약 요청이 접수되었어요! 확인 후 예약 확정 메시지를 보내드릴께요!
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="space-y-2">
                  <Label htmlFor="desiredDates">
                    희망 시술일정 (2~3개 기재)
                  </Label>
                  <Textarea
                    id="desiredDates"
                    name="desiredDates"
                    placeholder="예약현황에서 먼저 확인해주세요!"
                    required
                    value={formData.desiredDates}
                    onChange={handleChange}
                  />
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