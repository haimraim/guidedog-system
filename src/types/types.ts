/**
 * 안내견학교 데이터 관리 시스템 타입 정의
 * NVDA 스크린리더 접근성을 고려한 데이터 구조
 */

/**
 * 분류 (안내견 상태)
 */
export type DogCategory = '퍼피티칭' | '안내견' | '은퇴견' | '부모견';

/**
 * 성별
 */
export type Gender = '수컷' | '암컷';

/**
 * 안내견 정보
 */
export interface GuideDog {
  id: string; // 고유 ID (UUID)
  category: DogCategory; // 분류 (퍼피티칭, 안내견, 은퇴견, 부모견)
  name: string; // 견명
  birthDate: string; // 견 생년월일 (YYYY-MM-DD)
  gender: Gender; // 견 성별
  photo?: string; // 사진 (Base64 또는 URL)
  // 퍼피티칭 카테고리일 때만 사용
  puppyTeacherName?: string; // 퍼피티처 이름
  puppyTeacherPhone?: string; // 퍼피티처 연락처
  puppyTeacherAddress?: string; // 퍼피티처 주소
  // 은퇴견 카테고리일 때만 사용
  retiredHomeCareName?: string; // 은퇴견홈케어 이름
  retiredHomeCarePhone?: string; // 은퇴견홈케어 연락처
  retiredHomeCareAddress?: string; // 은퇴견홈케어 주소
  // 부모견 카테고리일 때만 사용
  parentCaregiverName?: string; // 부모견홈케어 이름
  parentCaregiverPhone?: string; // 부모견홈케어 연락처
  parentCaregiverAddress?: string; // 부모견홈케어 주소
  createdAt: string; // 생성일시
  updatedAt: string; // 수정일시
}

/**
 * 파트너 정보
 */
export interface Partner {
  id: string; // 고유 ID (UUID)
  name: string; // 파트너 성명
  phone: string; // 연락처
  address: string; // 주소
  photo?: string; // 사진 (Base64 또는 URL)
  createdAt: string; // 생성일시
  updatedAt: string; // 수정일시
}

/**
 * 활동 정보 (안내견과 파트너의 매칭)
 */
export interface Activity {
  id: string; // 고유 ID (UUID)
  guideDogId: string; // 안내견 ID
  partnerId: string; // 파트너 ID
  createdAt: string; // 생성일시
  updatedAt: string; // 수정일시
}

/**
 * 통합 데이터 (조회용)
 */
export interface CombinedData {
  activity: Activity;
  guideDog: GuideDog;
  partner: Partner;
}

/**
 * 폼 데이터 (작성용)
 */
export interface FormData {
  // 안내견 정보
  dogCategory: DogCategory | '';
  dogName: string;
  dogBirthDate: string;
  dogGender: Gender | '';
  dogPhoto?: string;

  // 퍼피티칭 카테고리일 때만 사용
  puppyTeacherName: string;
  puppyTeacherPhone: string;
  puppyTeacherAddress: string;

  // 은퇴견 카테고리일 때만 사용
  retiredHomeCareName: string;
  retiredHomeCarePhone: string;
  retiredHomeCareAddress: string;

  // 부모견 카테고리일 때만 사용
  parentCaregiverName: string;
  parentCaregiverPhone: string;
  parentCaregiverAddress: string;

  // 파트너 정보
  partnerName: string;
  phone: string;
  address: string;
  partnerPhoto?: string;
}

/**
 * 검색 필드 타입
 */
export type SearchFieldType = 'dogName' | 'partnerName';

/**
 * 검색 필터
 */
export interface SearchFilter {
  keyword: string; // 검색어
  searchField: SearchFieldType; // 검색 필드 (견명 또는 파트너 성명)
  dogCategory?: DogCategory; // 안내견 분류 필터
  dogGender?: Gender; // 안내견 성별 필터
}

/**
 * 폼 에러
 */
export interface FormErrors {
  [key: string]: string;
}

/**
 * 사용자 타입
 */
export type UserRole = 'admin' | 'partner' | 'puppyTeacher' | 'trainer' | 'retiredHomeCare' | 'parentCaregiver';

/**
 * 사용자 정보
 */
export interface User {
  id: string; // 로그인 아이디
  password?: string; // 비밀번호 (저장용)
  role: UserRole; // 권한 (관리자, 파트너, 퍼피티처, 훈련사, 은퇴견홈케어, 부모견홈케어)
  name: string; // 사용자 이름 (담당자 성명 또는 관리자)
  dogName?: string; // 안내견 이름 (담당자인 경우)
  category?: DogCategory; // 담당 카테고리 (권한 필터링용)
  createdAt?: string; // 생성일시
  updatedAt?: string; // 수정일시
}

/**
 * 다이어리 게시글
 */
export interface DiaryPost {
  id: string; // 고유 ID (UUID)
  userId: string; // 작성자 ID
  userName: string; // 작성자 이름
  dogName?: string; // 안내견 이름
  dogCategory?: DogCategory; // 개의 카테고리 (작성 시점)
  title: string; // 제목
  content: string; // 내용
  createdAt: string; // 작성일시
  updatedAt: string; // 수정일시
  // 퍼피티칭 전용 필드
  diaryDate?: string; // 다이어리 날짜 (YYYY-MM-DD)
  // 급식 정보 (배열)
  feedings?: Array<{
    foodType?: string; // 사료 종류
    time?: string; // 급식 시간
    amount?: string; // 급식량 (그램)
    notes?: string; // 추가 내용
  }>;
  // DT1(소변) 정보 (배열)
  dt1Records?: Array<{
    time?: string; // 시간
    place?: string; // 장소
    success?: string; // 성공 정도
    accident?: string; // 실수 여부
    notes?: string; // 관련 사항
  }>;
  // DT2(대변) 정보 (배열)
  dt2Records?: Array<{
    time?: string; // 시간
    place?: string; // 장소
    success?: string; // 성공 정도
    accident?: string; // 실수 여부
    notes?: string; // 관련 사항
  }>;
  // 외출 정보 (배열)
  outings?: Array<{
    place?: string; // 장소
    duration?: string; // 외출 시간
    notes?: string; // 특이사항
  }>;
  additionalNotes?: string; // 그 밖에 오늘 하고 싶은 말

  // 하위 호환성을 위한 기존 필드 (deprecated)
  foodType?: string;
  feedingTime?: string;
  feedingAmount?: string;
  feedingNotes?: string;
  dt1Time?: string;
  dt1Place?: string;
  dt1Success?: string;
  dt1Accident?: string;
  dt1Notes?: string;
  dt2Time?: string;
  dt2Place?: string;
  dt2Success?: string;
  dt2Accident?: string;
  dt2Notes?: string;
  outingPlace?: string;
  outingDuration?: string;
  outingNotes?: string;
}

/**
 * 진료 기록 카테고리
 */
export type MedicalRecordCategory = '일반 진료' | '백신 접종';

/**
 * 백신 종류
 */
export type VaccineType = 'DHPPL' | '광견병' | '켄넬코프' | '코로나' | '인플루엔자';

/**
 * 진료 기록
 */
export interface MedicalRecord {
  id: string; // 고유 ID (UUID)
  userId: string; // 작성자 ID
  userName: string; // 작성자 이름
  dogName: string; // 안내견 이름
  category: MedicalRecordCategory; // 카테고리 (일반 진료 / 백신 접종)
  visitDate: string; // 진료 날짜 (YYYY-MM-DD)
  hospital: string; // 병원명
  // 일반 진료일 때 사용
  diagnosis?: string; // 진단 내용
  treatment?: string; // 치료 내용
  cost?: number; // 진료비
  // 백신 접종일 때 사용
  vaccines?: VaccineType[]; // 접종한 백신 목록
  notes?: string; // 참고사항 (백신 접종 시)
  receiptPhotos: string[]; // 영수증 사진 (Base64 또는 URL)
  createdAt: string; // 작성일시
  updatedAt: string; // 수정일시
}

/**
 * 약품 종류
 */
export type MedicationType = '하트가드' | '드론탈플러스' | '프론트라인';

/**
 * 약품 체크 기록
 */
export interface MedicationCheck {
  id: string; // 고유 ID (UUID)
  userId: string; // 작성자 ID
  userName: string; // 작성자 이름
  dogName: string; // 안내견 이름
  medicationType: MedicationType; // 약품 종류
  checkDate: string; // 체크 날짜 (YYYY-MM-DD)
  dosage?: string; // 복용량 또는 도포량 (선택)
  notes?: string; // 메모 (선택)
  createdAt: string; // 생성일시
  updatedAt: string; // 수정일시
}

/**
 * 강의 카테고리
 */
export type LectureCategory = '퍼피' | '안내견' | '부모견' | '은퇴견' | '공통';

/**
 * 강의 자료
 */
export interface Lecture {
  id: string; // 고유 ID (UUID)
  category: LectureCategory; // 카테고리
  title: string; // 제목
  content: string; // 내용
  attachments: string[]; // 첨부파일 (Base64 또는 URL)
  videoUrl?: string; // 영상 파일 (NAS URL 또는 Base64)
  youtubeUrl?: string; // 유튜브 링크
  createdAt: string; // 작성일시
  updatedAt: string; // 수정일시
}

/**
 * 물품 카테고리
 */
export type ProductCategory = '사료' | '장난감' | '샴푸/린스' | '매트' | '견옷';

/**
 * 물품 옵션값
 */
export interface ProductOptionValue {
  value: string; // 옵션값 (예: "S", "빨강")
  stock: number; // 해당 옵션값의 재고
}

/**
 * 물품 옵션
 */
export interface ProductOption {
  name: string; // 옵션명 (예: "사이즈", "색상")
  values: ProductOptionValue[]; // 옵션값들과 각각의 재고
}

/**
 * 물품
 */
export interface Product {
  id: string; // 고유 ID (UUID)
  category: ProductCategory; // 카테고리
  name: string; // 물품명
  stock: number; // 재고 수량
  options?: ProductOption[]; // 물품 옵션 (예: 사이즈, 색상 등)
  description?: string; // 물품 설명
  imageUrl?: string; // 물품 이미지 URL (base64 또는 URL)
  createdAt: string; // 생성일시
  updatedAt: string; // 수정일시
}

/**
 * 물품 신청
 */
export interface ProductOrder {
  id: string; // 고유 ID (UUID)
  userId: string; // 신청자 ID
  userName: string; // 신청자 이름
  productId: string; // 물품 ID
  productName: string; // 물품명
  productCategory: ProductCategory; // 물품 카테고리
  quantity: number; // 신청 수량
  selectedOptions?: { [optionName: string]: string }; // 선택한 옵션 (예: { "사이즈": "M", "색상": "빨강" })
  recipientName: string; // 받는 사람 이름
  recipientPhone: string; // 받는 사람 연락처
  recipientAddress: string; // 배송 주소
  status: 'pending' | 'approved' | 'shipped' | 'delivered'; // 상태
  createdAt: string; // 신청일시
  updatedAt: string; // 수정일시
}

/**
 * 보딩 코멘트
 */
export interface BoardingComment {
  id: string; // 고유 ID (UUID)
  boardingFormId: string; // 보딩 신청서 ID
  userId: string; // 작성자 ID
  userName: string; // 작성자 이름
  content: string; // 코멘트 내용
  isRead: boolean; // 신청자가 읽었는지 여부
  createdAt: string; // 작성일시
  updatedAt: string; // 수정일시
}

/**
 * 보딩 신청서
 */
export interface BoardingForm {
  id: string; // 고유 ID (UUID)
  userId: string; // 신청자 ID
  userName: string; // 신청자 이름
  dogName: string; // 안내견 이름
  dogBirthDate: string; // 생년월일
  dogGender: string; // 성별
  dogCategory: string; // 카테고리 (안내견, 퍼피티칭, 은퇴견, 부모견)

  // 보딩 기간
  startDate: string; // 시작일 (YYYY-MM-DD)
  endDate: string; // 종료일 (YYYY-MM-DD)

  // 사료 정보
  foodType: string; // 사료 종류
  feedingSchedule: string; // 급여량과 급여 시기

  // 영양제
  supplements?: string; // 먹이는 영양제 종류와 양, 시기

  // 맡긴 물품 (체크박스)
  items: string[]; // 견줄, 목줄, 헤드컬러, 하네스, 인식표, 건강수첩, 견옷, 장난감, 이불, 하트가드, 프론트라인, 드론탈플러스
  itemsEtc?: string; // 기타 물품

  // 최근 목욕일
  lastBathDate: string; // YYYY-MM-DD

  // 구충 시행
  dewormingSchedule?: string; // 구충 예정 (예: 하트가드 25년 1월 10일)

  // 백신접종
  vaccinations: string[]; // DHPPL, 광견병, 코로나, 켄넬코프, 인플루엔자, 없음

  // 보딩 사유
  boardingReason: string; // 개인 사정, 진료, 수술
  medicalReason?: string; // 진료 사유 (보딩 사유가 진료/수술인 경우)
  medicalDate?: string; // 진료/수술일 (YYYY-MM-DD)

  // 안내견 전용 필드
  aftercareTeacher?: string; // 담당 사후관리 선생님
  tearsblanket?: string; // 바닥에 이불을 깔아주면 물어뜯나요? (예/아니오)
  usesDTBelt: string; // 배변 시 DT밸트를 착용하나요? (예/아니오)

  // 퍼피 전용 필드
  needsNailTrim?: string; // 발톱 정리가 필요한가요? (예/아니오)
  needsPadTrim?: string; // 패드 털 정리가 필요한가요? (예/아니오)

  // 집으로 돌아갈 때 필요한 물품
  returnItems?: string;

  // 기타 전달사항
  notes?: string;

  // 코멘트
  comments?: BoardingComment[]; // 관리자 코멘트 목록

  // 상태
  status: 'waiting' | 'boarding' | 'completed'; // 신청 상태 (대기, 보딩중, 보딩종료)

  createdAt: string; // 신청일시
  updatedAt: string; // 수정일시
}
