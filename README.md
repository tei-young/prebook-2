# PreBook - 뷰티샵 예약 자동화 시스템
<br>

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

## 2. 시스템 아키텍처
### 2.1 전체 구조
```
mermaidCopygraph TB
    A[고객] -->|예약 요청| B[PreBook 웹 폼]
    B -->|데이터 저장| C[Backend Server]
    C -->|예약 대기| D[관리자 대시보드]
    D -->|승인| E[자동화 프로세스]
    E -->|일정 등록| F[타임블록]
    E -->|메시지 발송| G[카카오톡]
```

### 2.2 기술 스택

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- Backend: (추후 결정 필요)
- Database: (추후 결정 필요)
- 자동화: Selenium (타임블록 웹 자동화)
- API: 카카오톡 비즈니스 채널 API

<br>

## 3. 핵심 기능
### 3.1 예약 접수 (PreBook.tsx)

- 고객 정보 입력 (고객명, 성별, 나이, 연락처)
- 시술 정보 입력 (희망 시술, 시술 경험)
- 희망 일정 입력 (2-3개 선택지)
- 사진 첨부 (눈썹 사진 2장)

### 3.2 관리자 대시보드 (AdminDashboard.tsx)

- 예약 요청 목록 확인
- 예약 승인/거절 처리
- 예약 현황 관리

### 3.3 자동화 프로세스

- 예약 승인 시:

1. 타임블록 캘린더 자동 등록
2. 카카오톡 예약 확정 메시지 자동 발송

<br>

## 4. 데이터 흐름
### 4.1 예약 요청 데이터
```
typescriptCopyinterface ReservationRequest {
    customerName: string;
    gender: string;
    age: number;
    phone: string;
    desiredService: string;
    referralSource: string;
    desiredDates: string[];
    priorExperience: string;
    photos: {
        front: File;
        closed: File;
    };
}
```

### 4.2 예약 확정 데이터
```
typescriptCopyinterface ConfirmedReservation {
    customerName: string;
    date: string;
    time: string;
    service: string;
    status: 'confirmed';
}
```

<br>

## 5. 구현 단계
- 현재 진행 상황

✅ 프로젝트 초기 설정<br>
✅ 예약 폼 UI 구현<br>
⬜ 관리자 대시보드 구현<br>
⬜ 백엔드 API 구현<br>
⬜ 타임블록 자동화 구현<br>
⬜ 카카오톡 메시지 연동<br>

<br>
다음 단계

- 컴포넌트 구현 완료
- 백엔드 설계 및 구현
- 자동화 프로세스 구현
- 테스트 및 배포

<br>

## 6. 향후 확장 가능성

- 예약 통계 및 분석 기능
- 고객 관리 시스템 통합
- 매출 관리 연동

이 프로젝트는 단순한 예약 시스템을 넘어, 뷰티샵 운영의 효율성을 높이는 것을 목표로 합니다. 현재는 예약 프로세스 자동화에 집중하고 있으며, 추후 더 많은 운영 관리 기능을 추가할 수 있습니다.
