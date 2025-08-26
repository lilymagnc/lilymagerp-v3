# 주문 이관 기능 구현 계획

## 프로젝트 개요
여러 매장에서 함께 사용하는 ERP 시스템에서 A지점에서 받은 주문을 B지점으로 이관하는 기능을 구현합니다.

## 주요 요구사항
1. **주문 이관**: A지점에서 B지점으로 주문 전송
2. **금액 분배**: 발주지점과 수주지점 간 금액 분배 (기본: 발주지점 100%, 수주지점 0%)
3. **권한 관리**: 지점 관리자 및 일반 직원이 주문 이관 기능 사용 가능
4. **알림 시스템**: 실시간 알림
5. **전광판**: 주문 이관 정보 실시간 표시
6. **수주건 처리**: 수주지점에서 주문서 및 메시지 출력 가능

## 데이터 구조 설계

### 새로운 컬렉션
- `order_transfers`: 주문 이관 정보
- `notifications`: 실시간 알림
- `display_board`: 전광판 정보

### 기존 컬렉션 수정
- `orders`: 이관 정보 필드 추가
- `system`: 주문 이관 설정 추가

## 구현 단계

### Phase 1: 데이터 구조 및 타입 정의 ✅ 완료
- [x] **Task 1.1**: 주문 이관 관련 TypeScript 타입 정의 (`src/types/order-transfer.ts`)
- [x] **Task 1.2**: 시스템 설정에 주문 이관 설정 추가 (`src/hooks/use-settings.ts`)
- [x] **Task 1.3**: 프로젝트 계획 문서 작성 (`task.md`)

### Phase 2: 핵심 기능 구현 ✅ 완료
- [x] **Task 2.1**: 주문 이관 훅 구현 (`src/hooks/use-order-transfers.ts`)
- [x] **Task 2.2**: 주문 이관 다이얼로그 컴포넌트 (`src/components/order-transfer-dialog.tsx`)
- [x] **Task 2.3**: 주문 목록 페이지에 이관 버튼 추가 (`src/app/dashboard/orders/page.tsx`)

### Phase 3: 주문 이관 관리 페이지 ✅ 완료
- [x] **Task 3.1**: 주문 이관 목록 페이지 (`src/app/dashboard/transfers/page.tsx`)
- [x] **Task 3.2**: 이관 상태 업데이트 다이얼로그 (`src/app/dashboard/transfers/components/transfer-status-dialog.tsx`)
- [x] **Task 3.3**: 이관 상세 정보 다이얼로그 (`src/app/dashboard/transfers/components/transfer-detail-dialog.tsx`)

### Phase 4: 알림 및 전광판 UI 구현 ✅ 완료

- [x] **Task 4.2**: 전광판 컴포넌트 (`src/components/display-board.tsx`)
- [x] **Task 4.3**: 실시간 알림 센터 (`src/components/notification-center.tsx`)
- [x] **Task 4.4**: 전광판 전용 페이지 (`src/app/display-board/page.tsx`)
- [x] **Task 4.5**: 대시보드 레이아웃에 알림 센터 및 메뉴 추가 (`src/app/dashboard/layout.tsx`)
- [x] **Task 4.6**: 설정 페이지에 주문 이관 탭 추가 (`src/app/dashboard/settings/page.tsx`)

### Phase 5: 권한 시스템 및 통합 테스트 ✅ 완료
- [x] **Task 5.1**: 주문 이관 권한 시스템 구현

- [x] **Task 5.3**: 실시간 알림 훅 구현 (`src/hooks/use-realtime-notifications.ts`)
- [x] **Task 5.4**: 전광판 훅 구현 (`src/hooks/use-display-board.tsx`)
- [x] **Task 5.5**: 주문 이관 생성 시 알림 및 전광판 연동
- [x] **Task 5.6**: 통합 테스트

### Phase 6: Firebase 인덱스 설정 및 최종 테스트 ✅ 완료
- [x] **Task 6.1**: Firebase 인덱스 설정 (`firestore.indexes.json`)
- [x] **Task 6.2**: 실시간 알림 훅 수정
- [x] **Task 6.3**: 주문 이관 훅에서 변수 오류 수정
- [x] **Task 6.4**: Firebase 인덱스 배포
- [x] **Task 6.5**: 최종 테스트 및 문서 업데이트

## 파일 구조
```
src/
├── types/
│   └── order-transfer.ts          # 주문 이관 관련 타입 정의
├── hooks/
│   ├── use-order-transfers.ts     # 주문 이관 핵심 로직

│   ├── use-realtime-notifications.ts # 실시간 알림 훅
│   └── use-display-board.tsx      # 전광판 훅
├── components/
│   ├── order-transfer-dialog.tsx  # 이관 다이얼로그

│   ├── display-board.tsx          # 전광판 컴포넌트
│   └── notification-center.tsx    # 알림 센터
├── app/
│   ├── dashboard/
│   │   ├── orders/
│   │   │   └── page.tsx           # 주문 목록 (이관 버튼 추가)
│   │   ├── transfers/
│   │   │   ├── page.tsx           # 이관 관리 페이지
│   │   │   └── components/        # 이관 관련 다이얼로그들
│   │   ├── settings/
│   │   │   └── page.tsx           # 설정 (주문 이관 탭 추가)
│   │   └── layout.tsx             # 레이아웃 (알림 센터 추가)
│   └── display-board/
│       └── page.tsx               # 전광판 전용 페이지
└── lib/
    └── firebase.ts                # Firebase 설정
```

## 기술 스택
- **Frontend**: Next.js 14, React, TypeScript
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Firebase Firestore
- **인증**: Firebase Auth
- **음성**: Web Speech API
- **실시간**: Firebase Realtime Database

## 주의사항
1. **권한 관리**: 주문 이관 기능은 지점 관리자 권한으로 모든 지점 사용자가 사용 가능

3. **실시간 알림**: Firebase Firestore 실시간 구독 사용
4. **전광판**: 설정에 따른 자동 표시/숨김 기능
5. **금액 분배**: 기본값은 발주지점 100%, 수주지점 0%

## 성공 기준
- [x] 주문 이관 기능이 정상적으로 작동
- [x] 권한 시스템이 올바르게 적용

- [x] 실시간 알림이 즉시 표시
- [x] 전광판에 이관 정보가 실시간으로 표시
- [x] 설정에서 모든 옵션을 변경 가능
- [x] Firebase 인덱스가 정상적으로 배포됨

## 🎉 프로젝트 완료!
모든 단계가 성공적으로 완료되었습니다. 주문 이관 기능이 완전히 구현되어 사용할 준비가 되었습니다.
