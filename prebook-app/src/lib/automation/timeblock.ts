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
  private email: string = "tsi04037@naver.com"; 
  private password: string = "akjy1191"; 

  async addEvent(event: TimeblockEvent) {
    // 브라우저 시작 시 알림 권한을 차단하도록 설정
    const browser = await puppeteer.launch({ 
      headless: false,
      args: [
        '--disable-notifications',
        '--disable-extensions',
        '--disable-popup-blocking',
        '--start-maximized'
      ],
      defaultViewport: null
    });

    try {
      const context = browser.defaultBrowserContext();
      // 알림 권한 차단 (도메인 패턴 지정)
      await context.overridePermissions('https://app.timeblocks.com', []);
      
      const page = await browser.newPage();
      
      // 페이지 로드 타임아웃 설정 증가
      page.setDefaultNavigationTimeout(60000);
      page.setDefaultTimeout(60000);
      
      // 타임블록 사이트 접속
      console.log('타임블록 사이트 접속 시도');
      await page.goto('https://app.timeblocks.com/', { waitUntil: 'networkidle2' });
      console.log('타임블록 사이트 접속 성공');
      
      // 스크린샷 디버깅 (문제 확인용)
      await page.screenshot({ path: 'timeblock-initial.png' });
      
      // 로그인
      console.log('로그인 시도');
      try {
        await page.waitForSelector('#signInForm > div:nth-child(1) > div > div > input[type=text]', { timeout: 10000 });
        await delay(1000); // 추가 대기
        await page.type('#signInForm > div:nth-child(1) > div > div > input[type=text]', this.email);
        await page.type('#signInForm > div:nth-child(2) > div > div > input[type=password]', this.password);
        await page.click('#signInForm > button');
        console.log('로그인 양식 제출 완료');
      } catch (error: unknown) {
        console.error('로그인 양식 작성 오류:', error);
        await page.screenshot({ path: 'login-error.png' });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error('로그인 양식 작성 실패: ' + errorMessage);
      }
      
      // 로그인 후 페이지 로드 대기 (셀렉터가 변경되었을 수 있으므로 여러 셀렉터 시도)
      console.log('로그인 후 페이지 로드 대기 중...');
      
      try {
        // 여러 가능한 셀렉터 중 하나라도 나타나면 로그인 성공으로 간주
        await Promise.race([
          page.waitForSelector('.css-1gc45ry-Calendar__Container', { timeout: 20000 }),
          page.waitForSelector('.Calendar__Container', { timeout: 20000 }),
          page.waitForSelector('.calendarContainer', { timeout: 20000 }),
          page.waitForSelector('[data-testid="calendar-container"]', { timeout: 20000 }),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 })
        ]);
        console.log('로그인 성공');
        await page.screenshot({ path: 'after-login.png' });
      } catch (error: unknown) {
        console.error('로그인 후 페이지 로드 실패:', error);
        // 현재 페이지 HTML 내용 확인
        const pageContent = await page.content();
        console.log('현재 페이지 내용 일부:', pageContent.substring(0, 500));
        await page.screenshot({ path: 'login-timeout.png' });
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error('로그인 후 달력 화면 로드 실패: ' + errorMessage);
      }
      
      // 대기를 추가
      await delay(3000);
      
      // 페이지에서 사용 가능한 모든 셀렉터 찾기 (디버깅용)
      const availableSelectors = await page.evaluate(() => {
        const result: Record<string, any> = {};
        // 가능한 날짜 관련 클래스 검사
        const classesToCheck = [
          '.css-10sf0gr-DateCellLayer__Layer',
          '.DateCellLayer__Layer',
          '.DateCell__Date',
          '.css-1pha6mu-DateCell__Date'
        ];
        
        for (const cls of classesToCheck) {
          try {
            const elements = document.querySelectorAll(cls);
            result[cls] = elements.length;
          } catch (e) {
            result[cls] = `Error: ${e instanceof Error ? e.message : String(e)}`;
          }
        }
        
        // 현재 페이지의 모든 클래스 이름 수집
        const allClasses = new Set<string>();
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          if (el.className && typeof el.className === 'string') {
            el.className.split(' ').forEach(cls => {
              if (cls) allClasses.add(cls);
            });
          }
        });
        
        result['availableClasses'] = Array.from(allClasses);
        
        return result;
      });
      
      console.log('사용 가능한 셀렉터:', availableSelectors);
      
      // 날짜 찾기 및 클릭
      const date = new Date(event.date);
      const day = date.getDate().toString();

      console.log('날짜 검색 시작:', day);
      
      // 업데이트된 날짜 셀렉터를 사용하여 클릭
      // 먼저 날짜 엘리먼트를 모두 가져옵니다
      try {
        const dateSelector = '.css-1pha6mu-DateCell__Date';
        await page.waitForSelector(dateSelector, { timeout: 10000 });
        
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
        await page.screenshot({ path: 'date-clicked.png' });
        await delay(2000);
      } catch (error: unknown) {
        console.error('날짜 선택 실패:', error);
        await page.screenshot({ path: 'date-selection-error.png' });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error('날짜 선택 실패: ' + errorMessage);
      }
      
      // +생성 버튼 클릭
      try {
        const createButtonSelector = '#root > main > div.css-1gc45ry-Calendar__Container > div.css-1evan0f-DailyViewPanel__Container > div.main_scroll.css-fxn9ux-DailyViewPanel__Main > div > button';
        await page.waitForSelector(createButtonSelector, { timeout: 10000 });
        console.log('+생성 버튼 찾음');
        await page.click(createButtonSelector);
        console.log('+생성 버튼 클릭 완료');
        await page.screenshot({ path: 'create-button-clicked.png' });
        await delay(2000);
      } catch (error: unknown) {
        console.error('+생성 버튼 클릭 실패:', error);
        await page.screenshot({ path: 'create-button-error.png' });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error('+생성 버튼 클릭 실패: ' + errorMessage);
      }
      
      // 일정 버튼 클릭
      try {
        const scheduleButtonSelector = '#portal > div.css-1u7rnp7-BlockTypeSelector__Container > li:nth-child(1)';
        await page.waitForSelector(scheduleButtonSelector, { timeout: 10000 });
        console.log('일정 버튼 찾음');
        await page.click(scheduleButtonSelector);
        console.log('일정 버튼 클릭 완료');
        await page.screenshot({ path: 'schedule-button-clicked.png' });
        await delay(2000);
      } catch (error: unknown) {
        console.error('일정 버튼 클릭 실패:', error);
        await page.screenshot({ path: 'schedule-button-error.png' });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error('일정 버튼 클릭 실패: ' + errorMessage);
      }
      
      // 일정 제목 입력
      try {
        const titleSelector = '#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_body__yy9RA > form > div > div.css-1a6c99s-EventForm__Wrapper > fieldset > div > textarea';
        await page.waitForSelector(titleSelector, { timeout: 10000 });
        console.log('일정 제목 입력란 찾음');
        await page.type(titleSelector, `${event.customerName} ${event.time.split(':')[0]}시`);
        console.log('일정 제목 입력 완료');
        await page.screenshot({ path: 'title-entered.png' });
        await delay(1000);
      } catch (error: unknown) {
        console.error('일정 제목 입력 실패:', error);
        await page.screenshot({ path: 'title-entry-error.png' });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error('일정 제목 입력 실패: ' + errorMessage);
      }
      
      // 색상 선택 버튼 클릭
      try {
        const colorPickerSelector = '#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_body__yy9RA > form > div > div.css-1a6c99s-EventForm__Wrapper > div.css-1nppsz-ColorPicker__Container > div';
        await page.waitForSelector(colorPickerSelector, { timeout: 10000 });
        console.log('색상 선택 버튼 찾음');
        await page.click(colorPickerSelector);
        console.log('색상 선택 버튼 클릭 완료');
        await page.screenshot({ path: 'color-picker-clicked.png' });
        await delay(2000);
      } catch (error: unknown) {
        console.error('색상 선택 버튼 클릭 실패:', error);
        await page.screenshot({ path: 'color-picker-error.png' });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error('색상 선택 버튼 클릭 실패: ' + errorMessage);
      }
      
      // 시술 종류에 맞는 색상 선택
      try {
        const colorSelector = event.isRetouching
          ? '#portal > div:nth-child(4) > div > div > div > div.css-fye849-ColorItemList__List > div:nth-child(12) > div'
          : '#portal > div:nth-child(4) > div > div > div > div.css-fye849-ColorItemList__List > div:nth-child(11) > div';
        
        await page.waitForSelector(colorSelector, { timeout: 10000 });
        console.log('색상 옵션 찾음');
        await page.click(colorSelector);
        console.log('색상 선택 완료');
        await page.screenshot({ path: 'color-selected.png' });
        await delay(1000);
      } catch (error: unknown) {
        console.error('색상 선택 실패:', error);
        await page.screenshot({ path: 'color-selection-error.png' });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error('색상 선택 실패: ' + errorMessage);
      }
      
      // 저장 버튼 클릭
      try {
        const saveButtonSelector = '#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_footer__X9QpH > button.Button_container__Uamgo.Button_primary__xUIw7.Button_large__pOZct';
        await page.waitForSelector(saveButtonSelector, { timeout: 10000 });
        console.log('저장 버튼 찾음');
        await page.click(saveButtonSelector);
        console.log('저장 버튼 클릭 완료');
        await page.screenshot({ path: 'save-button-clicked.png' });
        await delay(2000);
      } catch (error: unknown) {
        console.error('저장 버튼 클릭 실패:', error);
        await page.screenshot({ path: 'save-button-error.png' });
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error('저장 버튼 클릭 실패: ' + errorMessage);
      }
      
      console.log('이벤트 추가 완료');
      return true;
    } catch (error: unknown) {
      console.error('이벤트 추가 실패:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error('이벤트 추가 실패: ' + errorMessage);
    } finally {
      await browser.close();
    }
  }
}

export const timeblockAutomation = new TimeblockAutomation();