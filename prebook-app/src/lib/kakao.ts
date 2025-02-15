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
   // TODO: 실제 카카오톡 API 연동 시 이 부분 수정
   // 현재는 콘솔에 메시지 출력으로 대체
   console.log('=== 카카오톡 메시지 발송 ===');
   console.log(`수신자: ${phoneNumber}`);
   console.log(`템플릿: ${template.title}`);
   console.log('메시지 내용:');
   console.log(messageContent);
   console.log('========================');
   
   return true;
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