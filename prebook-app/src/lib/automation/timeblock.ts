// lib/automation/timeblock.ts
import puppeteer from 'puppeteer';

interface TimeblockEvent {
  customerName: string;
  date: string;
  time: string;
  isRetouching: boolean;
}

// 대기를 위한 delay 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class TimeblockAutomation {
  private email: string = "tsi04037@naver.com"; // 실제 이메일로 변경
  private password: string = "akjy1191"; // 실제 비밀번호로 변경

  async addEvent(event: TimeblockEvent) {
    const browser = await puppeteer.launch({ headless: false });
    try {
      const page = await browser.newPage();
      
      // 타임블록 사이트 접속
      console.log('타임블록 사이트 접속 시도');
      await page.goto('https://app.timeblocks.com/');
      console.log('타임블록 사이트 접속 성공');
      
      // 로그인
      console.log('로그인 시도');
      await page.waitForSelector('#signInForm > div:nth-child(1) > div > div > input[type=text]');
      await page.type('#signInForm > div:nth-child(1) > div > div > input[type=text]', this.email);
      await page.type('#signInForm > div:nth-child(2) > div > div > input[type=password]', this.password);
      await page.click('#signInForm > button');
      
      // 로그인 후 페이지 로드 대기
      await page.waitForSelector('.css-1gc45ry-Calendar__Container');
      console.log('로그인 성공');
      
      // 대기를 추가
      await delay(2000);
      
      // 날짜 찾기 및 클릭
      const date = new Date(event.date);
      const day = date.getDate().toString();

      console.log('날짜 검색 시작:', day);
      
      // 업데이트된 날짜 셀렉터를 사용하여 클릭
      // 먼저 날짜 엘리먼트를 모두 가져옵니다
      const dateSelector = '.css-10sf0gr-DateCellLayer__Layer > div > div';
      await page.waitForSelector(dateSelector);
      
      // 페이지 컨텍스트 내에서 날짜 찾기 및 클릭
      const dateFound = await page.evaluate((targetDay) => {
        const dateElements = document.querySelectorAll('.css-1pha6mu-DateCell__Date');
        for (const element of dateElements) {
          const text = element.textContent?.trim() || '';
          console.log('찾은 날짜:', text);
          
          if (text === targetDay) {
            // 날짜 엘리먼트의 부모 요소를 클릭 (날짜 셀)
            (element.parentElement as HTMLElement).click();
            return true;
          }
        }
        return false;
      }, day);

      if (!dateFound) {
        throw new Error(`날짜를 찾을 수 없습니다: ${day}`);
      }

      console.log('날짜 클릭 완료');
      await delay(2000);
      
      // +생성 버튼 클릭
      const createButtonSelector = '#root > main > div.css-1gc45ry-Calendar__Container > div.css-1evan0f-DailyViewPanel__Container > div.main_scroll.css-fxn9ux-DailyViewPanel__Main > div > button';
      await page.waitForSelector(createButtonSelector);
      console.log('+생성 버튼 찾음');
      await page.click(createButtonSelector);
      console.log('+생성 버튼 클릭 완료');
      await delay(1000);
      
      // 일정 버튼 클릭
      const scheduleButtonSelector = '#portal > div.css-1u7rnp7-BlockTypeSelector__Container > li:nth-child(1)';
      await page.waitForSelector(scheduleButtonSelector);
      console.log('일정 버튼 찾음');
      await page.click(scheduleButtonSelector);
      console.log('일정 버튼 클릭 완료');
      await delay(1000);
      
      // 일정 제목 입력
      const titleSelector = '#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_body__yy9RA > form > div > div.css-1a6c99s-EventForm__Wrapper > fieldset > div > textarea';
      await page.waitForSelector(titleSelector);
      console.log('일정 제목 입력란 찾음');
      await page.type(titleSelector, `${event.customerName} ${event.time.split(':')[0]}시`);
      console.log('일정 제목 입력 완료');
      
      // 색상 선택 버튼 클릭
      const colorPickerSelector = '#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_body__yy9RA > form > div > div.css-1a6c99s-EventForm__Wrapper > div.css-1nppsz-ColorPicker__Container > div';
      await page.click(colorPickerSelector);
      console.log('색상 선택 버튼 클릭 완료');
      await delay(1000);
      
      // 시술 종류에 맞는 색상 선택
      const colorSelector = event.isRetouching
        ? '#portal > div:nth-child(4) > div > div > div > div.css-fye849-ColorItemList__List > div:nth-child(12) > div'
        : '#portal > div:nth-child(4) > div > div > div > div.css-fye849-ColorItemList__List > div:nth-child(11) > div';
      
      await page.waitForSelector(colorSelector);
      console.log('색상 옵션 찾음');
      await page.click(colorSelector);
      console.log('색상 선택 완료');
      await delay(1000);
      
      // 저장 버튼 클릭
      const saveButtonSelector = '#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_footer__X9QpH > button.Button_container__Uamgo.Button_primary__xUIw7.Button_large__pOZct';
      await page.click(saveButtonSelector);
      console.log('저장 버튼 클릭 완료');
      
      // 저장 완료 대기
      await delay(2000);
      
      console.log('이벤트 추가 완료');
      return true;
    } catch (error) {
      console.error('이벤트 추가 실패:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }
}

export const timeblockAutomation = new TimeblockAutomation();