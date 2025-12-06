# Firebase Authentication 설정 가이드

이 문서는 안내견 관리 시스템에 Firebase Authentication을 적용하는 방법을 안내합니다.

## 1. Firebase Console에서 Authentication 활성화

1. [Firebase Console](https://console.firebase.google.com/)에 접속합니다.
2. 프로젝트 `guidedogsystem`을 선택합니다.
3. 왼쪽 메뉴에서 **Authentication**을 클릭합니다.
4. **시작하기** 버튼을 클릭합니다.
5. **로그인 방법** 탭에서 **이메일/비밀번호**를 선택합니다.
6. **사용 설정** 토글을 활성화하고 **저장**을 클릭합니다.

## 2. Firestore Security Rules 업데이트

1. Firebase Console의 왼쪽 메뉴에서 **Firestore Database**를 클릭합니다.
2. **규칙** 탭을 선택합니다.
3. `firestore.rules` 파일의 내용을 복사하여 붙여넣습니다.
4. **게시** 버튼을 클릭하여 규칙을 적용합니다.

## 3. 첫 번째 관리자 계정 생성

Firebase Console에서 첫 번째 관리자 계정을 수동으로 생성해야 합니다.

### Authentication에서 사용자 생성

1. Firebase Console > **Authentication** > **Users** 탭으로 이동합니다.
2. **사용자 추가** 버튼을 클릭합니다.
3. 다음 정보를 입력합니다:
   - 이메일: `admin@guidedogsystem.com` (또는 원하는 이메일)
   - 비밀번호: 안전한 비밀번호 설정
4. **사용자 추가** 버튼을 클릭합니다.

### Firestore에서 사용자 역할 정보 추가

1. Firebase Console > **Firestore Database** > **데이터** 탭으로 이동합니다.
2. **컬렉션 시작** 버튼을 클릭합니다.
3. 컬렉션 ID: `users`
4. 첫 번째 문서 생성:
   - 문서 ID: Authentication에서 생성된 사용자의 **UID** 복사하여 입력
   - 필드 추가:
     ```
     id: "admin@guidedogsystem.com" (문자열)
     name: "관리자" (문자열)
     role: "admin" (문자열)
     ```
5. **저장** 버튼을 클릭합니다.

## 4. 애플리케이션 사용

### 관리자 로그인

1. 애플리케이션에 접속합니다.
2. 생성한 관리자 이메일과 비밀번호로 로그인합니다.

### 새 사용자 등록

1. 로그인 페이지에서 **회원가입** 버튼을 클릭합니다.
2. 다음 정보를 입력합니다:
   - 이메일 (예: `puppyteacher@guidedogsystem.com`)
   - 이름
   - 역할 (퍼피티처, 훈련사, 파트너 등)
   - 담당 견명 (선택사항)
   - 비밀번호 (최소 6자)
3. **회원가입** 버튼을 클릭합니다.

### 기존 로컬 인증 시스템과의 호환성

현재 시스템은 Firebase Authentication과 기존 로컬 인증 시스템을 모두 지원합니다:

- Firebase 인증 실패 시 자동으로 기존 로컬 인증 방식으로 전환됩니다.
- 기존 사용자명 형식 (예: `해달.유석종`, `guidedog`) 사용 가능합니다.
- 비밀번호: `8922`

점진적으로 모든 사용자를 Firebase Authentication으로 마이그레이션하는 것을 권장합니다.

## 5. Security Rules 설명

현재 적용된 보안 규칙:

- **인증 필수**: 모든 데이터 읽기/쓰기에 Firebase 로그인 필요
- **관리자 권한**: 대부분의 데이터 쓰기는 관리자만 가능
- **사용자 데이터**: 사용자는 자신의 데이터만 읽을 수 있음
- **일지/주문**: 로그인한 사용자가 작성 가능, 자신의 데이터만 수정/삭제 가능

## 6. 문제 해결

### "Permission denied" 오류 발생 시

1. Firebase Console에서 Security Rules가 올바르게 적용되었는지 확인
2. 사용자가 로그인되어 있는지 확인
3. Firestore의 `users` 컬렉션에 사용자 역할 정보가 있는지 확인

### 로그인이 되지 않을 때

1. Firebase Console > Authentication에서 이메일/비밀번호 인증이 활성화되어 있는지 확인
2. 브라우저 콘솔에서 오류 메시지 확인
3. Firebase 프로젝트 설정이 `src/lib/firebase.ts`와 일치하는지 확인

## 보안 권장사항

1. **강력한 비밀번호 사용**: 최소 8자 이상, 대소문자/숫자/특수문자 조합
2. **정기적인 비밀번호 변경**: 3개월마다 비밀번호 변경 권장
3. **관리자 계정 관리**: 관리자 계정 수를 최소화하고 엄격하게 관리
4. **로그 모니터링**: Firebase Console에서 인증 로그를 정기적으로 확인
