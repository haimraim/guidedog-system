# GIMS - Guidedog Interaction Management Service

삼성안내견학교 안내견 관리 시스템

## 프로젝트 개요

GIMS는 안내견, 훈련견, 퍼피, 은퇴견, 부모견 등 다양한 카테고리의 견들과 파트너(시각장애인), 퍼피티처, 훈련사, 홈케어 담당자들의 정보를 통합 관리하는 웹 애플리케이션입니다.

**중요**: 본 시스템의 주요 사용자는 시각장애인입니다. 모든 기능은 스크린리더(NVDA, JAWS 등)와 완벽하게 호환되어야 합니다.

## 라이브 데모

- **URL**: https://guidedog-system.vercel.app/
- **테스트 계정**:
  - 관리자: `guidedog` / `8922`
  - 퍼피티처: `청록.김인성` / `8922`
  - 파트너: `해달.유석종` / `8922`

## 기술 스택

| 기술 | 버전 | 용도 |
|------|------|------|
| React | 19.x | UI 프레임워크 |
| TypeScript | 5.9.x | 타입 안전성 |
| Tailwind CSS | 4.x | 스타일링 |
| Vite | 7.x | 빌드 도구 |
| Firebase Firestore | - | 실시간 데이터베이스 |
| Firebase Auth | - | 사용자 인증 |
| Video.js | 8.x | 비디오 플레이어 |
| xlsx | 0.18.x | 엑셀 파일 처리 |

## 주요 기능

### 1. 안내견 데이터 관리
- 견 정보 등록/수정/삭제/조회
- 카테고리: 퍼피티칭, 안내견, 훈련견, 은퇴견, 부견, 모견
- 엑셀 Import/Export

### 2. 파트너 관리
- 시각장애인 파트너 정보 관리
- 견-파트너 매칭 이력

### 3. 다이어리/월간 관리
- 퍼피티처: 1일 다이어리 작성
- 파트너: 월간 관리 기록 (품행/건강/보행 상태)

### 4. 보딩 신청 시스템
- 위탁 보호 신청서 작성
- 상태 관리: 대기 → 보딩중 → 보딩종료
- 관리자 코멘트 기능

### 5. 물품 신청
- 사료, 용품, 약품 주문
- 배송 상태 추적

### 6. 약품 체크
- 월간 구충제 투약 기록
- 하트가드, 프론트라인, 드론탈플러스

### 7. 문자 통보 서비스
- SMS/LMS 발송 (ppurio API)
- 수신자 선택 (개별/그룹/전체)

### 8. 강의실/영상 시청실
- 교육 영상 관리 및 시청
- 역할별 접근 권한

### 9. 월간 보고서
- 월별 활동 통계 리포트

## 사용자 역할

| 역할 | ID 형식 | 설명 |
|------|---------|------|
| admin | `guidedog` | 전체 시스템 관리 |
| moderator | 이름 | 제한된 관리 기능 |
| puppyTeacher | `견명.퍼피티처명` | 퍼피 다이어리 작성 |
| partner | `견명.파트너명` | 월간 관리 기록 |
| trainer | `견명.훈련사명` | 훈련견 담당 |
| retiredHomeCare | `견명.담당자명` | 은퇴견 관리 |
| parentCaregiver | `견명.담당자명` | 부모견 관리 |

## 설치 및 실행

### 요구사항
- Node.js 20 이상
- npm 또는 yarn

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env
```
`.env` 파일을 열어 실제 API 키를 입력하세요.

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173` 접속

### 4. 프로덕션 빌드
```bash
npm run build
```
빌드 결과물은 `dist` 폴더에 생성됩니다.

## 프로젝트 구조

```
guidedog-system/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── MainLayout.tsx   # 메인 레이아웃 (네비게이션)
│   │   ├── AuthPage.tsx     # 인증 페이지
│   │   ├── DiaryPage.tsx    # 다이어리/월간관리
│   │   ├── BoardingFormPage.tsx  # 보딩 신청
│   │   ├── ProductOrderPage.tsx  # 물품 신청
│   │   ├── MedicationCheckPage.tsx  # 약품 체크
│   │   ├── MessageSendPage.tsx  # 문자 발송
│   │   ├── LecturePage.tsx  # 강의실
│   │   ├── VideoRoomPage.tsx  # 영상 시청실
│   │   └── MonthlyReportPage.tsx  # 월간 보고서
│   ├── contexts/
│   │   └── AuthContext.tsx  # 인증 상태 관리
│   ├── services/
│   │   └── firestoreService.ts  # Firestore CRUD
│   ├── types/
│   │   └── types.ts         # TypeScript 타입 정의
│   ├── utils/
│   │   └── storage.ts       # 로컬 스토리지 + Firestore 동기화
│   └── lib/
│       └── firebase.ts      # Firebase 초기화
├── .env.example             # 환경변수 템플릿
└── package.json
```

## 외부 API 연동

### 1. ppurio SMS API (에버랜드 제휴)
- SMS/LMS 발송
- 환경변수: `VITE_PPURIO_*`

### 2. CJ대한통운 배송조회 API
- 운송장 추적
- 환경변수: `VITE_CJ_*`

### 3. Firebase
- Firestore: 실시간 데이터베이스
- Auth: 사용자 인증
- Storage: 파일 저장

## 접근성 (필수)

본 시스템은 시각장애인 사용자를 위해 다음 접근성 기준을 준수합니다:

### 스크린리더 호환
- NVDA, JAWS 등 스크린리더와 완벽 호환
- 시맨틱 HTML 사용
- ARIA 속성 적용

### 키보드 네비게이션
- Tab/Shift+Tab으로 모든 요소 탐색
- Enter/Space로 버튼 실행
- 명확한 포커스 표시

### 폼 접근성
- 모든 입력 필드에 label 연결
- 필수 항목 명시
- 에러 메시지 연결

## 배포

### Vercel 배포
```bash
npm run build
npx vercel --prod
```

## 문서

- **기술사양서**: `GIMS_기술사양서_제노이드.docx`
- **화면 설명**: `문서.pptx`

## 문의

프로젝트 관련 문의사항이 있으시면 삼성안내견학교 담당자에게 연락해주세요.
