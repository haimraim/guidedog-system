// 월간보고서 샘플 데이터 생성 스크립트
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDFpZyTGYzi2N8SrK8JmWJi-iSRSZZ0NHk",
  authDomain: "guidedogsystem.firebaseapp.com",
  projectId: "guidedogsystem",
  storageBucket: "guidedogsystem.firebasestorage.app",
  messagingSenderId: "757099883206",
  appId: "1:757099883206:web:dfd3a2e290594e1106c5c7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// UUID 생성 함수
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 랜덤 선택 함수
function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 5개 강아지 정보
const dogs = [
  { name: '코비', teacherName: '김민수' },
  { name: '칸초', teacherName: '이영희' },
  { name: '카누', teacherName: '박철수' },
  { name: '카라', teacherName: '정수진' },
  { name: '카야', teacherName: '최지은' }
];

// 샘플 월간보고서 생성 함수
function generateMonthlyReport(dog) {
  const reportMonth = '2025-12'; // 2025년 12월

  return {
    id: generateId(),
    userId: `${dog.name}.${dog.teacherName}`,
    userName: dog.teacherName,
    dogName: dog.name,
    reportMonth: reportMonth,

    // 집에서의 품행 (21개 질문)
    q1_crate: randomChoice(['조용히 잘 있음', '짖음', '긁음', '기타']),
    q1_crate_detail: randomChoice(['2시간', '3시간', '4시간', '하루종일']),

    q2_humanFood: randomChoice(['없음', '침 흘림', '짖음', '뛰어오름', '테이블에 발 올림', '기타']),
    q2_humanFood_detail: '간식을 원할 때 조금 침을 흘립니다.',

    q3_aloneState: randomChoice(['조용히 잘 있음', '짖음', '파괴행동', '배변실수', '기타']),

    q4_aloneReaction: randomChoice(['조용히 잘 있음', '짖음', '울부짖음', '문 긁음', '기타']),
    q4_aloneReaction_detail: '처음 5분 정도 짖다가 조용해집니다.',

    q5_aloneMaxTime: randomChoice(['1시간', '2시간', '3시간', '4시간', '5시간 이상']),

    q6_guestReaction: randomChoice(['조용함', '꼬리 흔들며 반가워함', '짖음', '뛰어오름', '으르렁', '기타']),
    q6_guestReaction_detail: '처음엔 경계하다가 금방 친해집니다.',

    q7_familyReaction: randomChoice(['조용함', '꼬리 흔들며 반가워함', '짖음', '뛰어오름', '기타']),
    q7_familyReaction_detail: '매우 반갑게 맞이합니다.',

    q8_barkingAtHome: randomChoice(['없음', '가끔', '자주', '매우 자주']),
    q8_barkingAtHome_detail: '초인종이나 외부 소음에 반응할 때만 짖습니다.',

    q9_growling: randomChoice(['없음', '장난감 뺏을 때', '음식 먹을 때', '몸 만질 때', '기타']),
    q9_growling_detail: '',

    q10_controlReaction: randomChoice(['순응적', '저항', '물려고 함', '도망감', '기타']),
    q10_controlReaction_detail: '대체로 잘 따릅니다.',

    q11_toyReaction: randomChoice(['적당히 놂', '과도하게 집착', '관심 없음', '파괴함', '기타']),
    q11_toyReaction_detail: '공놀이를 좋아합니다.',

    q12_basicTraining: randomChoice(['매우 잘함', '잘함', '보통', '어려워함', '매우 어려워함']),
    q12_basicTraining_detail: 'Sit, Down, Come 명령을 잘 따릅니다.',

    q13_bodyHandling: randomChoice(['순응적', '약간 저항', '매우 저항', '공격적 반응', '기타']),
    q13_bodyHandling_detail: '발 만지는 것만 조금 싫어합니다.',

    q14_teethBrushing: randomChoice(['순응적', '약간 저항', '매우 저항', '공격적 반응', '기타']),
    q14_teethBrushing_detail: '처음엔 싫어했지만 이제 익숙해졌습니다.',

    q15_grooming: randomChoice(['순응적', '약간 저항', '매우 저항', '공격적 반응', '기타']),
    q15_grooming_detail: '목욕은 좋아하지 않지만 참습니다.',

    q16_nailCare: randomChoice(['순응적', '약간 저항', '매우 저항', '공격적 반응', '기타']),
    q16_nailCare_detail: '조금 저항하지만 간식 주면 괜찮습니다.',

    q17_earCleaning: randomChoice(['순응적', '약간 저항', '매우 저항', '공격적 반응', '기타']),
    q17_earCleaning_detail: '귀 청소는 잘 참습니다.',

    q18_pawCleaning: randomChoice(['순응적', '약간 저항', '매우 저항', '공격적 반응', '기타']),
    q18_pawCleaning_detail: '발 닦기는 익숙해서 잘 따릅니다.',

    q19_damaged: randomChoice(['없음', '신발', '가구', '벽지', '옷', '기타']),
    q19_damaged_detail: '지난달에 슬리퍼 한 짝을 물어뜯었습니다.',

    q20_childrenReaction: randomChoice(['매우 좋음', '좋음', '무관심', '불안해함', '공격적', '해당없음']),
    q20_childrenReaction_detail: '아이들과 잘 놉니다.',

    q21_biggestProblem: '가끔 흥분하면 뛰어오르는 습관이 있습니다. 교정 중입니다.',

    // DT 품행 기록 (10개 질문)
    dt_responseTime: randomChoice(['매우 빠름', '빠름', '보통', '느림', '매우 느림']),
    dt_indoorBlocked: randomChoice(['완전 차단', '대부분 차단', '가끔 실수', '자주 실수', '차단 안됨']),
    dt_indoorType: randomChoice(['없음', '소변', '대변', '둘 다']),
    dt_beltUsage: randomChoice(['사용 안함', '가끔 사용', '자주 사용', '항상 사용']),
    dt_dt1Location: randomChoice(['잔디밭', '흙', '아스팔트', '화단', '기타']),
    dt_dt2Location: randomChoice(['잔디밭', '흙', '아스팔트', '화단', '기타']),
    dt_walkingAccident: randomChoice(['없음', '소변', '대변', '둘 다']),
    dt_beforeWalk: randomChoice(['항상', '자주', '가끔', '거의 안함', '전혀 안함']),
    dt_signal: randomChoice(['명확함', '보통', '불명확함', '신호 없음']),
    dt_signal_detail: '코를 킁킁대고 빙빙 돌면서 신호를 보냅니다.',
    dt_currentProblem: '실내 배변은 완전히 차단되었으며, 산책 전 배변도 잘 합니다.',

    // 보행 훈련 (11개 질문)
    walk_avgTime: randomChoice(['30분', '1시간', '1시간 30분', '2시간', '2시간 이상']),
    walk_schedule: randomChoice(['아침', '오전', '점심', '오후', '저녁', '밤']),
    walk_coatReaction: randomChoice(['순응적', '약간 저항', '매우 저항', '도망감', '기타']),
    walk_coatReaction_detail: '처음엔 저항했지만 이제 익숙해졌습니다.',
    walk_headCollarUsage: randomChoice(['사용 안함', '가끔 사용', '자주 사용', '항상 사용']),
    walk_treatUsage: randomChoice(['사용 안함', '가끔 사용', '자주 사용', '항상 사용']),
    walk_speed: randomChoice(['매우 빠름', '빠름', '적당함', '느림', '매우 느림']),
    walk_speed_detail: '보통 보행자 속도에 잘 맞춥니다.',
    walk_behavior: randomChoice(['침착함', '약간 흥분', '매우 흥분', '당김', '멈춤', '기타']),
    walk_behavior_detail: '가끔 흥미로운 냄새를 맡으면 멈춥니다.',
    walk_animalReaction: randomChoice(['무시함', '관심 보임', '짖음', '쫓아가려 함', '두려워함', '기타']),
    walk_animalReaction_detail: '다른 개를 보면 관심을 보이지만 통제 가능합니다.',
    walk_peopleReaction: randomChoice(['무시함', '관심 보임', '짖음', '뛰어오름', '두려워함', '기타']),
    walk_peopleReaction_detail: '사람들에게 친근하게 다가갑니다.',
    walk_fearObjects: '천둥소리나 큰 트럭 소리를 조금 무서워합니다.',
    walk_interests: '다른 개들과 냄새 맡는 것을 좋아합니다.',

    // 사회화 훈련 (10개 질문)
    social_placesVisited: '쇼핑몰, 카페, 공원, 버스정류장, 동물병원',
    social_frequency: randomChoice(['주 1회', '주 2-3회', '주 4-5회', '매일', '기타']),
    social_crowdReaction: randomChoice(['침착함', '약간 불안', '매우 불안', '짖음', '도망가려 함', '기타']),
    social_crowdReaction_detail: '처음엔 불안해하지만 금방 적응합니다.',
    social_stairs: randomChoice(['능숙함', '조심스럽게 오름', '두려워함', '거부함', '경험없음']),
    social_stairs_detail: '계단을 잘 오르내립니다.',
    social_escalator: randomChoice(['능숙함', '조심스럽게 탐', '두려워함', '거부함', '경험없음']),
    social_escalator_detail: '에스컬레이터는 아직 연습 중입니다.',
    social_car: randomChoice(['편안함', '약간 불안', '매우 불안', '멀미함', '경험없음']),
    social_car_detail: '차에 타는 것을 좋아합니다.',
    social_bus: randomChoice(['편안함', '약간 불안', '매우 불안', '짖음', '경험없음']),
    social_bus_detail: '버스는 몇 번 타봤고 잘 적응했습니다.',
    social_subway: randomChoice(['편안함', '약간 불안', '매우 불안', '짖음', '경험없음']),
    social_subway_detail: '지하철 소음에 처음엔 놀랐지만 이제 괜찮습니다.',

    // 메타데이터
    createdAt: new Date().toISOString(),
    status: 'completed'
  };
}

// 메인 실행 함수
async function main() {
  console.log('월간보고서 샘플 데이터 생성 시작...\n');

  for (const dog of dogs) {
    console.log(`${dog.name} (퍼피티처: ${dog.teacherName})의 월간보고서 생성 중...`);

    const report = generateMonthlyReport(dog);

    try {
      // Firestore에 저장
      await setDoc(doc(db, 'monthly_reports', report.id), report);
      console.log(`✓ ${dog.name} 월간보고서 저장 완료 (ID: ${report.id})\n`);
    } catch (error) {
      console.error(`✗ ${dog.name} 저장 실패:`, error);
    }
  }

  console.log('\n모든 월간보고서 생성 완료!');
  console.log('Firestore에서 확인해보세요: https://console.firebase.google.com/');
  process.exit(0);
}

// 스크립트 실행
main().catch(console.error);
