# PreBook - 뷰티샵 예약 자동화 시스템
## 1. 프로젝트 개요
### 1.1 개발 배경

- 현재 원장님께서 카카오톡으로 예약 상담 후 수기로 타임블록 캘린더에 일정을 입력하는 프로세스
- 수동 입력 과정에서 발생하는 human error와 반복 작업의 비효율 존재
- 자동화를 통한 업무 효율 개선 필요

### 1.2 목표

- 예약 프로세스 자동화를 통한 업무 효율성 향상
- 예약 정보의 정확성 확보
- 원장님의 수동 작업 최소화

<br>

## 2. 예약 프로세스
### 2.1 전체 Flow
```
mermaidCopygraph TD
    A[예약 신청] --> B[관리자 검토]
    B --> C[예약 승인]
    C --> D[예약금 안내 메시지]
    D --> E[고객 예약금 송금]
    E --> F[관리자 입금 확인]
    F --> G[예약 확정]
    G --> H1[타임블록 일정 등록]
    G --> H2[카카오톡 확정 메시지]
```
### 2.2 예약 상태
```
typescriptCopytype ReservationStatus = 
  | 'pending'           // 신청됨
  | 'approved'          // 승인됨 (예약금 안내 전)
  | 'deposit_wait'      // 예약금 대기중
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
```
typescriptCopyinterface Reservation {
    id: string;
    customer_name: string;
    gender: string;
    age: number;
    phone: string;
    desired_service: string;
    referral_source: string | null;
    desired_dates: string[];
    prior_experience: string | null;
    front_photo_url: string | null;
    closed_photo_url: string | null;
    status: ReservationStatus;
    deposit_amount?: number;
    deposit_account?: string;
    deposit_deadline?: Date;
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
- 시술 정보 입력
- 희망 일정 입력
- 사진 첨부 기능

### 4.2 관리자 대시보드 (/admin/dashboard)

- 예약 목록 조회 및 필터링
- 예약 상세 정보 확인
- 예약 상태 관리
<br>

- 승인/거절
- 예약금 확인
- 예약 확정
<br>

- 카카오톡 메시지 발송
- 타임블록 일정 등록

### 4.3 자동화 기능

- 예약 확정 시 타임블록 자동 등록
- 상태별 카카오톡 메시지 자동 발송
<br>

- 예약금 안내 메시지
- 예약 확정 메시지

<br>

## 5. 구현 현황
### 5.1 완료된 기능
✅ 프로젝트 초기 설정
✅ 예약 신청 페이지 구현
✅ 관리자 대시보드 기본 구현
✅ Supabase 연동
✅ 파일 업로드 기능
### 5.2 진행 중인 기능
⬜ 예약 상태 관리 확장
⬜ 예약금 관리 기능
⬜ 필터링 & 검색 기능
### 5.3 예정된 기능
⬜ 타임블록 자동화
⬜ 카카오톡 메시지 연동
⬜ 관리자 인증

<br>

## 6. 향후 개선 사항

- 입금 확인 자동화 (은행 API 연동)
- 예약 통계 및 분석 기능
- 고객 관리 시스템 통합
- 매출 관리 연동

<br>

이 프로젝트는 단순한 예약 시스템을 넘어, 뷰티샵 운영의 효율성을 높이는 것을 목표로 합니다. 현재는 예약 프로세스 자동화에 집중하고 있으며, 추후 더 많은 운영 관리 기능을 추가할 수 있습니다.
