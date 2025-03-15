// lib/automation/timeblock.ts
import puppeteer from 'puppeteer';

interface TimeblockEvent {
  customerName: string;
  date: string;
  time: string;
  isRetouching: boolean;
}

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
      
      // 날짜 찾기 및 클릭
      const date = new Date(event.date);
      const day = date.getDate().toString();

      // 날짜 셀 찾기
      console.log('날짜 검색 시작:', day);
      const dateElements = await page.$$('.css-10sf0gr-DateCellLayer__Layer > div');
      let dateFound = false;
      for (const element of dateElements) {
        const text = await page.evaluate(el => el?.textContent?.trim() || '', element);
        console.log('검색된 텍스트:', text);
        if (text === day) {
          await element.click();
          dateFound = true;
          console.log('날짜 발견 및 클릭:', day);
          break;
        }
      }

      if (!dateFound) {
        throw new Error(`날짜를 찾을 수 없습니다: ${event.date}`);
      }
      
      // '일정' 버튼 클릭
      await page.waitForSelector('#portal > div.css-1u7rnp7-BlockTypeSelector__Container > li:nth-child(1) > em');
      await page.click('#portal > div.css-1u7rnp7-BlockTypeSelector__Container > li:nth-child(1) > em');
      
      // 일정 내용 입력
      await page.waitForSelector('#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_body__yy9RA > form > div > div.css-1a6c99s-EventForm__Wrapper > fieldset > div > textarea');
      await page.type('#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_body__yy9RA > form > div > div.css-1a6c99s-EventForm__Wrapper > fieldset > div > textarea', 
        `${event.customerName} ${event.time.split(':')[0]}시`);
      
      // 색상 버튼 클릭
      await page.click('#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_body__yy9RA > form > div > div.css-1a6c99s-EventForm__Wrapper > div.css-1nppsz-ColorPicker__Container > div');
      
      // 색상 선택
      await page.waitForSelector('#portal > div:nth-child(4) > div > div > div > div.css-fye849-ColorItemList__List');
      const colorSelector = event.isRetouching
        ? '#portal > div:nth-child(4) > div > div > div > div.css-fye849-ColorItemList__List > div:nth-child(12) > div'
        : '#portal > div:nth-child(4) > div > div > div > div.css-fye849-ColorItemList__List > div:nth-child(11) > div';
      
      await page.click(colorSelector);
      
      // 저장 버튼 클릭
      await page.click('#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_footer__X9QpH > button.Button_container__Uamgo.Button_primary__xUIw7.Button_large__pOZct');
      
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