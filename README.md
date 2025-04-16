# prebook-2
# 예약 시간 페이지만 공유할 수 있는 라이트한 prebook
## 프로젝트 개요
- prebook-2는 원장님의 업무 효율성을 높이고 휴먼 에러를 줄이기 위한 예약 시간 관리 시스템입니다. 기존 prebook과 달리 고객이 직접 예약을 신청하는 방식이 아닌, 원장님이 예약 가능/불가능 시간을 관리하고 고객은 이를 확인만 할 수 있는 간소화된 시스템입니다.

## 핵심 목표

- 원장님의 작업량 최소화: 예약 불가능한 시간만 명시적으로 차단
- 중복 예약 방지: 예약된 시간 자동 관리
- 고객에게 실시간 예약 가능 시간 제공
- 기존 예약 관리 시스템과의 통합

## 시스템 구성

1. 원장 어드민 페이지

  - 기본적으로 모든 시간은 '예약 가능'으로 간주
  - 원장님이 시술 날짜와 시간을 입력하여 예약 불가능 시간으로 전환 가능
  - 예약 상태 관리: deposit_wait(예약금 대기), confirmed(예약 확정), cancelled(취소)
  - 고객 정보는 선택적으로 입력 가능


2. 고객용 시술 시간 공유 페이지

  - 예약 가능한 시간만 표시
  - 시술 날짜와 시간만 보여줌
  - 예약 버튼 없음, 대신 카카오톡 또는 DM으로 문의 유도



- 데이터베이스 구조
```sql-- 예약 불가능한 시간 관리 테이블
CREATE TABLE public.unavailable_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  reason TEXT, -- 예약 불가 사유 (휴무일, 개인 일정 등)
  status TEXT NOT NULL DEFAULT 'blocked',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 예약 테이블 (간소화)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  service_type TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT, 
  status TEXT NOT NULL DEFAULT 'deposit_wait',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_status CHECK (status IN ('deposit_wait', 'confirmed', 'cancelled'))
);

-- 인덱스 생성
CREATE INDEX idx_unavailable_slots_date ON unavailable_slots(date);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
```

## 예약 프로세스

1. 기본 상태: 모든 시간은 기본적으로 '예약 가능'
2. 원장 예약 관리:

- 휴무일, 개인 일정: unavailable_slots 테이블에 등록
- 고객 예약 시: bookings 테이블에 등록 (상태: deposit_wait)


3. 예약금 확인 후: 상태를 confirmed로 변경
4. 필요시 취소: 상태를 cancelled로 변경

## 개발 범위

1. 관리자 대시보드 수정

- 기존 예약 관리 기능 유지
- 예약 불가능 시간 관리 기능 추가
- 날짜와 시간만으로 빠르게 예약 불가 처리 가능
- 예약 상태 관리 기능


2. 예약 가능 시간 조회 페이지 구현

- 모바일 최적화 웹뷰 디자인
- 예약 가능 시간만 표시
- 간결하고 직관적인 UI
- 문의 유도 버튼/텍스트 제공


3. 기존 시스템 연동

- 기존 관리자 대시보드와 통합
- 예약 상태 관리 시스템 유지



## 개발 단계

1. 단계 1: 관리자 대시보드 수정

- 예약 불가능 시간 관리 기능 추가
- 날짜/시간 이외 정보는 선택 입력 필드로 구현
- 기존 예약 관리 시스템과 통합


2. 단계 2: 예약 가능 시간 조회 페이지 구현

- 모바일 최적화 디자인
- 예약 가능 시간만 표시하는 직관적 UI
- 문의 버튼/링크 추가


3. 단계 3: 기존 기능 연결

- 관리자가 예약 확정 시 해당 슬롯 상태 변경


4. 단계 4: 자동화 기능 연결

- 기존 타임블록 자동화 기능 연결 유지



## 기대 효과

- 원장님의 수동 작업 최소화
- 중복 예약 방지를 통한 휴먼 에러 감소
- 고객에게 실시간 예약 가능 정보 제공
- 카카오톡/DM을 통한 개인화된 상담 프로세스 유지

이 시스템은 원장님이 최소한의 입력(날짜와 시간)만으로 예약 가능 시간을 관리할 수 있게 하여, 업무 효율성을 높이고 중복 예약과 같은 실수를 방지하는 것이 핵심입니다.
