// src/lib/automation/timeblock.ts
import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome';

interface TimeblockEvent {
  customerName: string;
  date: string;
  time: string;
  isRetouching: boolean;
}

export class TimeblockAutomation {
  private driver: WebDriver;

  constructor() {
    // 새 브라우저 세션 생성
    const options = new Options();
    
    this.driver = new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }

  async addEvent(event: TimeblockEvent, email: string, password: string) {
    try {
      // 타임블록 사이트 직접 열기
      console.log('타임블록 사이트 접속 시도');
      await this.driver.get('https://app.timeblocks.com/');
      console.log('타임블록 사이트 접속 성공');
      
      // 로그인 코드 추가
      console.log('로그인 시도');
      try {
        const emailField = await this.driver.findElement(By.css('#signInForm > div:nth-child(1) > div > div > input[type=text]'));
        const passwordField = await this.driver.findElement(By.css('#signInForm > div:nth-child(2) > div > div > input[type=password]'));
        const loginButton = await this.driver.findElement(By.css('#signInForm > button'));
        
        await emailField.sendKeys('tsi04037@naver.com');
        await passwordField.sendKeys('akjy1191');
        await loginButton.click();
        
        // 로그인 후 페이지 로드 대기
        await this.driver.wait(until.elementLocated(By.css('.css-1gc45ry-Calendar__Container')), 10000);
        console.log('로그인 성공');
      } catch (loginError) {
        console.error('로그인 실패:', loginError);
        throw new Error('타임블록 로그인 실패');
      }
      
      // 날짜 이동 및 선택
      const dateElement = await this.findDateElement(event.date);
      await dateElement.click();
      
      // '일정' 버튼 클릭
      await this.driver.wait(
        until.elementLocated(By.css('#portal > div.css-1u7rnp7-BlockTypeSelector__Container > li:nth-child(1) > em')),
        5000
      );
      const scheduleButton = await this.driver.findElement(
        By.css('#portal > div.css-1u7rnp7-BlockTypeSelector__Container > li:nth-child(1) > em')
      );
      await scheduleButton.click();
      
      // 일정 내용 입력 (고객명)
      await this.driver.wait(
        until.elementLocated(By.css('#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_body__yy9RA > form > div > div.css-1a6c99s-EventForm__Wrapper > fieldset > div > textarea')),
        5000
      );
      const titleField = await this.driver.findElement(
        By.css('#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_body__yy9RA > form > div > div.css-1a6c99s-EventForm__Wrapper > fieldset > div > textarea')
      );
      await titleField.sendKeys(`${event.customerName} ${event.time.split(':')[0]}시`);
      
      // 색상 설정 (신규/리터치 구분)
      const colorButton = await this.driver.findElement(
        By.css('#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_body__yy9RA > form > div > div.css-1a6c99s-EventForm__Wrapper > div.css-1nppsz-ColorPicker__Container > div')
      );
      await colorButton.click();
      
      // 색상 팔레트가 나타날 때까지 대기
      await this.driver.wait(
        until.elementLocated(By.css('#portal > div:nth-child(4) > div > div > div > div.css-fye849-ColorItemList__List')),
        5000
      );
      
      // 신규/리터치에 따라 다른 색상 선택
      const colorSelector = event.isRetouching
        ? '#portal > div:nth-child(4) > div > div > div > div.css-fye849-ColorItemList__List > div:nth-child(12) > div'
        : '#portal > div:nth-child(4) > div > div > div > div.css-fye849-ColorItemList__List > div:nth-child(11) > div';
      
      const colorOption = await this.driver.findElement(By.css(colorSelector));
      await colorOption.click();
      
      // 저장 버튼 클릭
      const saveButton = await this.driver.findElement(
        By.css('#root > div:nth-child(4) > div.Modal_panel__KkNFT.Modal_medium__\\+Q98k > div > div.Modal_footer__X9QpH > button.Button_container__Uamgo.Button_primary__xUIw7.Button_large__pOZct')
      );
      await saveButton.click();
      
      console.log('이벤트 추가 프로세스 완료');
      return true;
    } catch (error) {
      console.error('이벤트 추가 실패:', error);
      throw error;
    } finally {
      // 작업 완료 후 브라우저 종료
      await this.driver.quit();
    }
  }

  // 날짜 요소 찾기
  private async findDateElement(dateString: string) {
    const date = new Date(dateString);
    const day = date.getDate();
    
    // 모든 날짜 셀을 가져와서 원하는 날짜 찾기
    const dateCells = await this.driver.findElements(
      By.css('.css-10sf0gr-DateCellLayer__Layer > div')
    );
    
    for (const cell of dateCells) {
      const text = await cell.getText();
      if (text.trim() === day.toString()) {
        return cell;
      }
    }
    
    throw new Error(`${dateString} 날짜를 찾을 수 없습니다`);
  }
}

export const timeblockAutomation = new TimeblockAutomation();