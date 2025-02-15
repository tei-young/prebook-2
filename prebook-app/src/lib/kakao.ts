// lib/kakao.ts
import { MESSAGE_TEMPLATES, customizeMessage } from '@/constants/messageTemplates';

interface KakaoTemplateArgs {
 // 예약 확정 메시지용 변수들
 appointmentDate?: string;
 appointmentTime?: string;
 customerName?: string;
}

interface KakaoMessage {
 phoneNumber: string;
 templateKey: keyof typeof MESSAGE_TEMPLATES;
 templateArgs?: KakaoTemplateArgs;
}

export const sendKakaoMessage = async (
    phoneNumber: string, 
    templateKey: keyof typeof MESSAGE_TEMPLATES,
    variables?: { [key: string]: string }
  ) => {
    const template = MESSAGE_TEMPLATES[templateKey];
    const messageContent = customizeMessage(template, variables || {});
    
    try {
      const response = await fetch('https://kapi.kakao.com/v1/api/talk/message/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_KAKAO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          message: messageContent
        })
      });
  
      if (!response.ok) {
        throw new KakaoMessageError('메시지 전송 실패');
      }
  
      return await response.json();
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      throw error;
    }
  };

// 예약금 안내 메시지 발송
export const sendDepositGuideMessage = (phoneNumber: string) => {
 return sendKakaoMessage(phoneNumber, 'DEPOSIT_GUIDE');
};

// 예약 확정 메시지 발송
export const sendConfirmationMessage = (
 phoneNumber: string,
 customerName: string,
 appointmentDate: string,
 appointmentTime: string
) => {
 return sendKakaoMessage(phoneNumber, 'CONFIRMATION', {
   customerName,
   appointmentDate,
   appointmentTime
 });
};

// 카카오톡 메시지 발송 오류 타입
export class KakaoMessageError extends Error {
 constructor(message: string) {
   super(message);
   this.name = 'KakaoMessageError';
 }
}