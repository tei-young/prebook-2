// src/lib/automation/kakao.ts
import { MESSAGE_TEMPLATES, customizeMessage } from '@/constants/messageTemplates';

export class KakaoAutomation {
  private static instance: KakaoAutomation;
  private isProcessing: boolean = false;
  private messageQueue: Array<{
    phoneNumber: string;
    message: string;
    retries: number;
  }> = [];

  public static getInstance(): KakaoAutomation {
    if (!KakaoAutomation.instance) {
      KakaoAutomation.instance = new KakaoAutomation();
    }
    return KakaoAutomation.instance;
  }

  private constructor() {}

  async addToQueue(
    phoneNumber: string,
    templateKey: keyof typeof MESSAGE_TEMPLATES,
    variables?: { [key: string]: string }
  ) {
    const template = MESSAGE_TEMPLATES[templateKey];
    const messageContent = customizeMessage(template, variables || {});

    this.messageQueue.push({
      phoneNumber,
      message: messageContent,
      retries: 0
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    if (this.isProcessing || this.messageQueue.length === 0) return;
    
    this.isProcessing = true;
    
    try {
      const { phoneNumber, message, retries } = this.messageQueue[0];
      
      await this.sendMessage(phoneNumber, message);
      this.messageQueue.shift();
      
    } catch (error) {
      const currentMessage = this.messageQueue[0];
      if (currentMessage.retries < 3) {
        currentMessage.retries++;
        this.messageQueue.push(this.messageQueue.shift()!);
      } else {
        console.error('메시지 전송 최대 재시도 횟수 초과:', currentMessage);
        this.messageQueue.shift();
      }
    } finally {
      this.isProcessing = false;
      if (this.messageQueue.length > 0) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  private async sendMessage(phoneNumber: string, message: string) {
    try {
      const response = await fetch('/api/kakao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, message }),
      });

      if (!response.ok) {
        throw new Error('메시지 전송 실패');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error);
      }

      return true;
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      throw error;
    }
  }
}

export const kakaoAutomation = KakaoAutomation.getInstance();