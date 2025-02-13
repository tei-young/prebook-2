# PreBook - 뷰티샵 예약 자동화 시스템

## 1. 프로젝트 개요
### 1.1 개발 배경
- 원장님께서 카카오톡으로 예약 상담 후 수기로 타임블록 캘린더에 일정을 입력하는 프로세스
- 수동 입력 과정에서 발생하는 human error와 반복 작업의 비효율 존재
- 자동화를 통한 업무 효율 개선 필요

### 1.2 목표
- 예약 프로세스 자동화를 통한 업무 효율성 향상
- 예약 정보의 정확성 확보
- 원장님의 수동 작업 최소화
- 고객 편의성 향상을 위한 통합 예약 시스템 제공

## 2. 예약 프로세스
### 2.1 전체 Flow
```mermaid
graph TD
   A[카카오톡 상담] --> B[예약 페이지 URL 전달]
   B --> C[고객 예약 신청]
   C --> D[관리자 승인]
   D --> E[예약금 안내 메시지 자동 발송]
   E --> F[예약금 입금 대기]
   F --> G[관리자 입금 확인]
   G --> H[최종 시간대 선택 및 예약 확정]
   H --> I1[타임블록 일정 자동 등록]
   H --> I2[카카오톡 확정 메시지 자동 발송]
```

### 2.2 예약 상태
```typescript
type ReservationStatus = 
  | 'pending'           // 신청됨
  | 'deposit_wait'      // 승인됨 & 예약금 대기중
  | 'deposit_confirmed' // 예약금 확인됨
  | 'confirmed'         // 예약 확정
  | 'rejected'          // 거절됨
```

<br>

## 3. 시스템 아키텍처
### 3.1 기술 스택

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- Database: Supabase
- Storage: Supabase Storage
- 자동화: Selenium (타임블록 웹 자동화)
- API: 카카오톡 비즈니스 채널 API

### 3.2 데이터베이스 구조
```typescript
enum serviceTypes {
  natural = 'natural',      // 자연눈썹
  combo = 'combo',          // 콤보눈썹
  shadow = 'shadow',        // 섀도우눈썹
  retouch = 'retouch',      // 리터치
  brownline = 'brownline',  // 브라운아이라인
  removal = 'removal',      // 잔흔제거
  recommend = 'recommend'   // 키뮤원장 추천시술
}

interface ServiceInfo {
  name: string;
  duration: 1 | 2;  // 시술 소요시간 (시간 단위)
}

interface DesiredTimeSlot {
  date: string;
  time: string;
  priority: 1 | 2 | 3;  // 우선순위
}

interface Reservation {
    id: string;
    customer_name: string;
    gender: string;
    age: number;
    phone: string;
    desired_service: keyof typeof serviceTypes;
    referral_source: string | null;
    desired_slots: DesiredTimeSlot[];    // 희망 시간대
    confirmed_slot?: {                   // 확정된 시간대
      date: string;
      time: string;
    };
    prior_experience: string | null;
    front_photo_url: string | null;
    closed_photo_url: string | null;
    status: ReservationStatus;
    deposit_confirmed_at?: Date;
    status_updated_at: Date;
    created_at: Date;
    updated_at: Date;
}
```

<br>

## 4. 주요 기능
### 4.1 예약 신청 페이지 (/prebook)

- 고객 정보 입력

    - 기본 정보 (이름, 성별, 나이, 연락처)
    - 시술 정보 (희망 시술 선택, 시술 경험)
    - 사진 첨부 (눈썹 사진 2장)


- 시술 선택 기능

    - 카테고리별 시술 분류 (눈썹문신/기타시술)
    - 시술별 상세 설명 제공
    - 버튼 형식의 직관적인 UI


- 통합 예약 캘린더
    
    - 예약 가능한 날짜/시간대 표시
    - 시술 소요시간에 따른 예약 가능 시간 자동 조정
    - 1~3순위 시간대 선택 기능
    - 오전/오후 시간대 구분 표시



### 4.2 관리자 대시보드 (/admin/dashboard)

- 예약 목록 조회 및 필터링
- 예약 상세 정보 확인
- 예약 상태 관리
    - 승인/거절
    - 예약금 확인
    - 최종 시간대 선택
- 예약 확정


- 자동화 기능 연동
    - 카카오톡 메시지 발송
    - 타임블록 일정 등록

- 시인성 개선된 상태 표시 시스템


### 4.3 자동화 기능

- 승인 시 예약금 안내 메시지 자동 발송
- 예약 확정 시:
    - 선택된 시간대로 타임블록 자동 등록
    - 카카오톡 확정 메시지 자동 발송

<br>

## 5. 구현 현황
### 5.1 완료된 기능
✅ 프로젝트 초기 설정<br>
✅ 기본 예약 신청 페이지 구현<br>
✅ 관리자 대시보드 기본 구현<br>
✅ Supabase 연동<br>
✅ 파일 업로드 기능<br>
✅ 예약 승인/거절 기능<br>
✅ 통합 예약 캘린더 구현<br>
✅ 시술 선택 UI 개선<br>
✅ 예약 상태 관리 확장<br>
### 5.2 진행 중인 기능
⬜ 시술 소요시간 기반 예약 시스템 구현<br>
⬜ 예약 상태 표시 시인성 개선<br>
### 5.3 예정된 기능
⬜ 카카오톡 메시지 자동화<br>
⬜ 타임블록 연동<br>
⬜ 관리자 인증<br>

<br>

## 6. 향후 개선 사항

- 예약 통계 및 분석 기능
- 고객 관리 시스템 통합
- 매출 관리 연동

<br>

이 프로젝트는 단순한 예약 시스템을 넘어, 뷰티샵 운영의 효율성을 높이는 것을 목표로 합니다. 현재는 예약 프로세스 자동화에 집중하고 있으며, 추후 더 많은 운영 관리 기능을 추가할 수 있습니다.
