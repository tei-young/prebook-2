import { exec } from 'child_process';
import { promisify } from 'util';
import { MESSAGE_TEMPLATES, customizeMessage } from '@/constants/messageTemplates';
import path from 'path';

const execAsync = promisify(exec);

export class KakaoAutomation {
  private static instance: KakaoAutomation;
  private isProcessing: boolean = false;
  private messageQueue: Array<{
    phoneNumber: string;
    message: string;
    retries: number;
  }> = [];

  // 싱글톤 패턴
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
      this.messageQueue.shift(); // 성공한 메시지 제거
      
    } catch (error) {
      const currentMessage = this.messageQueue[0];
      if (currentMessage.retries < 3) {
        currentMessage.retries++;
        // 실패한 메시지를 큐의 끝으로 이동
        this.messageQueue.push(this.messageQueue.shift()!);
        console.log(`메시지 재시도 (${currentMessage.retries}/3)`);
      } else {
        console.error('메시지 전송 최대 재시도 횟수 초과:', currentMessage);
        this.messageQueue.shift();
      }
    } finally {
      this.isProcessing = false;
      if (this.messageQueue.length > 0) {
        // 다음 메시지 처리 전 1초 대기
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  private async sendMessage(phoneNumber: string, message: string) {
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'kakao_send.ahk');
      const { stdout, stderr } = await execAsync(
        `"C:\\Program Files\\AutoHotkey\\AutoHotkey.exe" "${scriptPath}" "${phoneNumber}" "${message}"`
      );

      if (stderr) {
        throw new Error(`AutoHotkey 실행 오류: ${stderr}`);
      }

      console.log('메시지 전송 성공:', stdout);
      return true;
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      throw error;
    }
}
}

// 싱글톤 인스턴스 export
export const kakaoAutomation = KakaoAutomation.getInstance();