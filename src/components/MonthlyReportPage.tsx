/**
 * 월간 보고서 작성 페이지 (퍼피티칭 전용)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { MonthlyReport } from '../types/types';
import { generateId } from '../utils/storage';
import {
  getMonthlyReports,
  saveMonthlyReport,
  deleteMonthlyReport,
} from '../utils/firestoreLectures';

// 선택지 매핑 객체
const ANSWER_MAPPINGS: Record<string, Record<string, string>> = {
  // 집에서의 품행
  q1: {
    '1': '① 편안하게 있는다',
    '2': '② 낑낑거리다 곧 편안해 진다.',
    '3': '③ 짖다가 곧 편안히 있는다.',
    '4': '④ 무언가를 씹는다.',
    '5': '⑤ 자리를 잡지 못하고 지속적으로 불안해 한다.'
  },
  q2: {
    '1': '① 음식이 바닥에 떨어져도 먹지 않을 정도로 관심이 없다.',
    '2': '② 식탁 주변에서 음식이 떨어지기를 기다리거나 쳐다본다.',
    '3': '③ 식탁에서 먹을 때는 관심 없으나 좌식 테이블에서 먹을 때는 관심보임.',
    '4': '④ 침을 흘리며 먹고 싶어한다.',
    '5': '⑤ 기회가 있으면 훔쳐 먹기도 한다.'
  },
  q3: {
    '1': '① 크레이트 문 닫은 상태',
    '2': '② 팬스',
    '3': '③ 풀어 둔다'
  },
  q4: {
    '1': '① 짖음 있음',
    '2': '② 낑낑 거림',
    '3': '③ 이불이나 크레이트, 다른 물건 등을 뜯는다.',
    '4': '④ 편안하게 쉼'
  },
  q6: {
    '1': '① 흥분하며 점프 한다.',
    '2': '② 흥분해서 짖는다.',
    '3': '③ 흥분하고 좋아하나 점프는 하지 않는다.',
    '4': '④ 옷이나 손 등에 입질을 한다.',
    '5': '⑤ 소변을 지린다.',
    '6': '⑥ 별로 관심 없다',
    '7': '⑦ 별로 좋아하지 않는다. (크레이트로 들어감, 털을 세우며 경계, 으르렁)'
  },
  q7: {
    '1': '① 흥분하며 점프 한다.',
    '2': '② 흥분해서 짖는다.',
    '3': '③ 흥분하고 좋아하나 점프는 하지 않는다.',
    '4': '④ 옷이나 손 등에 입질을 한다.',
    '5': '⑤ 소변을 지린다.',
    '6': '⑥ 별로 관심 없다',
    '7': '⑦ 별로 좋아하지 않는다.'
  },
  q8: {
    '1': '① 있다.',
    '2': '② 없다.'
  },
  q9: {
    '1': '① 있다.',
    '2': '② 없다.'
  },
  q10: {
    '1': '① 바로 순응한다.',
    '2': '② 말대꾸 하듯이 짖는다 (1회 이상)',
    '3': '③ 꿍얼거린다',
    '4': '④ 이를 보이며 공격적인 반응을 보인 적이 있다.',
    '5': '⑤ 배를 보이고 누워 버린다.',
    '6': '⑥ 갑자기 흥분하며 꼬리를 숨긴 채로 날뛴다.(비방향성 돌진행동)'
  },
  q11: {
    '1': '① 5초 안에 순순히 놓는다.',
    '2': '② 몇 번 다시 뺏으려고 시도한다.',
    '3': '③ 장난치듯 으르렁 소리를 낸다.',
    '4': '④ 공격적인 으르렁 소리를 낸다.',
    '5': '⑤ 물고 도망가 구석으로 숨는다.'
  },
  q12_option: {
    '1': '① 한번 명령어에 바로 실시한다.',
    '2': '② 명령어를 아직 잘 모르는것 같다.',
    '3': '③ \'기다려\' 할 수 있는 시간',
    '4': '④ \'기다려\' 할 수 있는 수준'
  },
  q13: {
    '1': '① 바로 편안하게 눕고 잠을 잘 때도 있다.',
    '2': '② 누워는 있으나 몸이 경직된 채로 긴장한다.',
    '3': '③ 발버둥 치며 일어나려고 한다.',
    '4': '④ 입질을 하며 일어나려고 한다.',
    '5': '⑤ 잘 누워 있다가 무언가 하려고 하면(귀청소 or 발톱손질) 빠져나가려 한다.'
  },
  q14: {
    '1': '① 이 닦는 것을 좋아하며 편안히 있는다.',
    '2': '② 이 닦는 것을 좋아하지만 칫솔을 씹는다.',
    '3': '③ 칫솔을 가까이하면 고개를 돌린다.',
    '4': '④ 이 닦는 것을 싫어해서 도망 다닌다.',
    '5': '⑤ 이를 닦으려고 하면 털을 세우고 공격적인 반응을 보인다.'
  },
  q15: {
    '1': '① 그루밍 하는 것을 좋아하며 편안히 잘 있는다.',
    '2': '② 그루밍 하는 것을 좋아하지만 가만히 있지 못하고 자꾸 움직인다.',
    '3': '③ 고무빗을 가지고 놀려고 한다.',
    '4': '④ 반대로 자세를 바꾸는 것에 대해 거부감을 보인다.',
    '5': '⑤ 그루밍 하는 것을 싫어해서 불러도 잘 오지 않고 도망 다닌다.',
    '6': '⑥ 그루밍 하는 것을 싫어해서 빗질 도중에 이를 드러내며 입질을 한다.'
  },
  q17: {
    '1': '① 편안하게 잘 받아들인다.',
    '2': '② 귀세정제를 가져오면 거부감을 보인다.'
  },
  q18: {
    '1': '① 가만히 앉아서 잘 기다린다.',
    '2': '② 가만 앉아는 있으나 입질을 하려고 한다.',
    '3': '③ 닦기 싫어서 도망가거나 숨어 버린다.',
    '4': '④ 으르렁 거리며 이를 드러낸다.'
  },
  q19: {
    '1': '① 있다.',
    '2': '② 없다.'
  },
  q20: {
    '1': '① 아이들이 신나서 뛰어 놀면 같이 흥분하며 뛰려고 한다.',
    '2': '② 아이들이 신나서 뛰어 놀면 관심은 보이나 얌전히 있는다.',
    '3': '③ 아이들에게 크게 관심 없다.',
    '4': '④ 아이들이 가까이 와서 만지는 것을 별로 좋아하지 않는다.',
    '5': '⑤ 아이들이 가까이 오면 피하며 구석으로 숨으려고 한다.'
  },

  // DT 품행 기록
  dt_signal: {
    '1': '① 안 걸으려고 멈춰 선다.',
    '2': '② 길 가 쪽으로 냄새를 맡으며 사람을 끌고 간다.',
    '3': '③ 걸음이 느려진다.',
    '4': '④ 걸어가면서 자연스럽게 해 버린다.',
    '기타': '기타'
  },

  // 보행 훈련
  walk_q1: {
    '1': '① 2시간 이상',
    '2': '② 1시간 이상',
    '3': '③ 30분 이상',
    '4': '④ 안 하는 날도 있다.'
  },
  walk_q3: {
    '1': '① 코트와 견줄을 착용할 때까지 가만히 앉아서 잘 기다린다.',
    '2': '② 흥분하고 점프하여 얌전히 입히기 힘들다.',
    '3': '③ 코트/견줄 착용에는 거부감이 있으나 나가서는 잘 걷는다.',
    '4': '④ 코트/견줄 착용에 거부감이 있고 나가서도 좋아하지 않는다.',
    '기타': '기타'
  },
  walk_q4: {
    '1': '① 매번 사용',
    '2': '② 가끔 사용',
    '3': '③ 사용하지 않는다.'
  },
  walk_q5: {
    '1': '① 보행도중 지속적으로 사용한다.',
    '2': '② 특별한 경우에만 사용한다. (에스컬레이터, 견유혹 컨트롤 등)',
    '3': '③ 사용하지 않는다.'
  },
  walk_q6: {
    '1': '① 나보다 앞서 걷지만 줄은 느슨하게 나와 보조를 맞추려고 노력한다.',
    '2': '② 나를 고려하지 않고 줄이 팽팽할 정도로 앞으로 당긴다.',
    '3': '③ 내 옆에 바로 붙어 보행한다.',
    '4': '④ 뒤쪽으로 자꾸 쳐진다.',
    '5': '⑤ 속도가 일정하지 않다.',
    '기타': '기타'
  },
  walk_q7: {
    '1': '① 이따금 나를 살피며 똑바로 잘 걷는다.',
    '2': '② 나에게 너무 집중해서 몸이 사선으로 치우친다.',
    '3': '③ 나에게 전혀 관심이 없고 계속 주변을 두리번 거린다.',
    '4': '④ 나에게 전혀 관심이 없고 계속 냄새만 맡으려고 한다.',
    '5': '⑤ 땅에 떨어져있는 것을 계속 주워먹으려고 한다.',
    '6': '⑥ 보행도중 앉거나 서서 안가려고 버틴다.',
    '기타': '기타'
  },

  // 사회화 훈련
  social_q2: {
    '1': '① 1회 미만',
    '2': '② 2~3 회',
    '3': '③ 4~5 회',
    '4': '④ 6회 이상'
  },
  social_q3: {
    '1': '① 평소와 크게 다르지 않다.',
    '2': '② 평소보다 많이 흥분하며 지나가는 사람들에게 관심을 많이 보인다.',
    '3': '③ 여유없이 서두르며 직진한다.',
    '4': '④ 평소보다 유난히 행동이 줄어들어 보인다.',
    '5': '⑤ 벽으로 붙어서 걸으려고 한다.',
    '6': '⑥ DT1 실수가 잦다.',
    '기타': '기타'
  },
  social_q4: {
    '1': '① 특별히 문제 없이 보조를 맞춰 잘 다닌다.',
    '2': '② 항상 너무 서두른다.',
    '3': '③ 거의 끝에 가서는 서둘러 걷는다.',
    '4': '④ 사람 뒤쪽에서 걸으려고 한다.',
    '기타': '기타'
  },
  social_q5: {
    '1': '① 편안하게 잘 탄다.',
    '2': '② (상행선/하행선)을 두려워 한다.',
    '3': '③ 안정적으로 타나 내릴 때는 서두른다.',
    '4': '④ 잘 타지만, 타 있는 동안 움직인다.',
    '5': '⑤ 안타려고 버틴다.',
    '기타': '기타'
  },
  social_q6: {
    '1': '① 편안하게 잘 타고 내리고, 운행중에도 편안하게 쉰다.',
    '2': '② 편안하게 잘 타고 내리지만, 운행중에는 쉬지 못하고 자꾸 일어난다.',
    '3': '③ 운행중에는 편안하게 잘 있지만, 타고 내릴때 주저하거나 도와줘야 한다.',
    '4': '④ 타고 내릴때 주저하거나 도와줘야 하고, 운행중에도 편안하게 쉬지 못한다.',
    '5': '⑤ 시트 위로 올라가려고 한다.',
    '기타': '기타'
  },
  social_q7: {
    '1': '① 편안하게 잘 탄다.',
    '2': '② (탈 때/내릴 때) 두려워 한다.',
    '3': '③ 타는 건 문제 없으나 버스가 흔들리면 불안해 한다. (낑낑, 자꾸 일어남, 혀쩝쩝 등)',
    '4': '④ 문이 열릴때마다 움직인다.',
    '5': '⑤ 무서워서 안타려고 한다.',
    '기타': '기타'
  }
};

export const MonthlyReportPage = () => {
  const { user } = useAuth();

  // 목록/작성 모드
  const [isWriting, setIsWriting] = useState(false);
  const [reports, setReports] = useState<MonthlyReport[]>([]);
  const [viewingReport, setViewingReport] = useState<MonthlyReport | null>(null);
  const [editingReport, setEditingReport] = useState<MonthlyReport | null>(null); // 수정 중인 보고서

  // 관리자 전용 상태
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]); // 비교용 다중 선택
  const [isComparing, setIsComparing] = useState(false); // 비교 모드
  const [showComparisonTable, setShowComparisonTable] = useState(false); // 비교 테이블 모달
  const [detailViewTab, setDetailViewTab] = useState<'home' | 'dt' | 'walk' | 'social'>('home'); // 상세보기 탭
  const [comparisonTab, setComparisonTab] = useState<'home' | 'dt' | 'walk' | 'social'>('home'); // 비교 테이블 탭
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // 폼 상태
  const [currentStep, setCurrentStep] = useState(1); // 1: 기본정보, 2: 집에서의 품행, 3: DT 품행 기록, 4: 보행 훈련, 5: 사회화 훈련
  const [status, setStatus] = useState<'draft' | 'completed'>('draft'); // 상태: 임시저장/완료

  // 보고 일자 (자동으로 오늘 날짜 설정)
  const [reportDate, setReportDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // 급식
  const [foodType, setFoodType] = useState(''); // 사료 종류
  const [dailyFeedingCount, setDailyFeedingCount] = useState(''); // 1일 급식 횟수
  const [feedingAmountPerMeal, setFeedingAmountPerMeal] = useState(''); // 1회 급식량

  // 건강
  const [weight, setWeight] = useState(''); // 체중
  const [healthNotes, setHealthNotes] = useState(''); // 건강상 특이사항

  // 집에서의 품행
  // 질문 1
  const [q1, setQ1] = useState('');
  const [q1_time, setQ1_time] = useState(''); // ②③ 선택 시
  const [q1_type, setQ1_type] = useState(''); // ④ 선택 시
  const [q1_other, setQ1_other] = useState('');

  // 질문 2
  const [q2, setQ2] = useState('');
  const [q2_food, setQ2_food] = useState(''); // ⑤ 선택 시
  const [q2_other, setQ2_other] = useState('');

  // 질문 3
  const [q3, setQ3] = useState('');

  // 질문 4
  const [q4, setQ4] = useState('');
  const [q4_bark_freq, setQ4_bark_freq] = useState(''); // ① 선택 시
  const [q4_other, setQ4_other] = useState('');

  // 질문 5
  const [q5_crate_time, setQ5_crate_time] = useState('');
  const [q5_crate_state, setQ5_crate_state] = useState('');
  const [q5_fence_time, setQ5_fence_time] = useState('');
  const [q5_fence_state, setQ5_fence_state] = useState('');
  const [q5_free_time, setQ5_free_time] = useState('');
  const [q5_free_state, setQ5_free_state] = useState('');

  // 질문 6
  const [q6, setQ6] = useState('');
  const [q6_other, setQ6_other] = useState('');

  // 질문 7
  const [q7, setQ7] = useState('');
  const [q7_dislike, setQ7_dislike] = useState(''); // ⑦ 선택 시
  const [q7_other, setQ7_other] = useState('');

  // 질문 8
  const [q8, setQ8] = useState('');
  const [q8_situation, setQ8_situation] = useState('');
  const [q8_count, setQ8_count] = useState('');

  // 질문 9
  const [q9, setQ9] = useState('');
  const [q9_situation, setQ9_situation] = useState('');
  const [q9_count, setQ9_count] = useState('');

  // 질문 10
  const [q10, setQ10] = useState('');
  const [q10_other, setQ10_other] = useState('');

  // 질문 11
  const [q11, setQ11] = useState('');
  const [q11_other, setQ11_other] = useState('');

  // 질문 12
  const [q12_option, setQ12_option] = useState(''); // ①, ②, ③, ④ 중 선택
  const [q12_commands, setQ12_commands] = useState<string[]>([]); // ①② 선택 시
  const [q12_wait_state, setQ12_wait_state] = useState(''); // ③ 선택 시
  const [q12_wait_time, setQ12_wait_time] = useState(''); // ③ 선택 시
  const [q12_wait_levels, setQ12_wait_levels] = useState<string[]>([]); // ④ 선택 시

  // 질문 13
  const [q13, setQ13] = useState('');
  const [q13_other, setQ13_other] = useState('');

  // 질문 14
  const [q14_posture, setQ14_posture] = useState('');
  const [q14_frequency, setQ14_frequency] = useState('');
  const [q14, setQ14] = useState('');
  const [q14_other, setQ14_other] = useState('');

  // 질문 15
  const [q15_posture, setQ15_posture] = useState('');
  const [q15_frequency, setQ15_frequency] = useState('');
  const [q15, setQ15] = useState('');
  const [q15_other, setQ15_other] = useState('');

  // 질문 16
  const [q16_posture, setQ16_posture] = useState('');
  const [q16_frequency, setQ16_frequency] = useState('');
  const [q16_comfortable, setQ16_comfortable] = useState<string[]>([]);
  const [q16_uncomfortable, setQ16_uncomfortable] = useState<string[]>([]);
  const [q16_options, setQ16_options] = useState<string[]>([]);
  const [q16_bleeding, setQ16_bleeding] = useState('');
  const [q16_other, setQ16_other] = useState('');

  // 질문 17
  const [q17_posture, setQ17_posture] = useState('');
  const [q17, setQ17] = useState('');
  const [q17_reason, setQ17_reason] = useState('');
  const [q17_other, setQ17_other] = useState('');

  // 질문 18
  const [q18, setQ18] = useState('');
  const [q18_treat, setQ18_treat] = useState(''); // ① 선택 시
  const [q18_bites, setQ18_bites] = useState<string[]>([]); // ② 선택 시
  const [q18_other, setQ18_other] = useState('');

  // 질문 19
  const [q19, setQ19] = useState('');
  const [q19_count, setQ19_count] = useState('');

  // 질문 20
  const [q20, setQ20] = useState('');
  const [q20_other, setQ20_other] = useState('');

  // 질문 21
  const [q21, setQ21] = useState('');

  // DT 품행 기록
  // DT 질문 1
  const [dt1_time, setDt1_time] = useState(''); // DT1(소변) 반응 시간
  const [dt2_time, setDt2_time] = useState(''); // DT2(대변) 반응 시간

  // DT 질문 2
  const [dt_indoor_blocked, setDt_indoor_blocked] = useState(''); // 실내 배변 장소 차단 여부

  // DT 질문 3
  const [dt_indoor_type, setDt_indoor_type] = useState(''); // 실내배변 형태

  // DT 질문 4
  const [dt_belt_type, setDt_belt_type] = useState(''); // 배변벨트 사용 여부

  // DT 질문 5
  const [dt1_location, setDt1_location] = useState(''); // DT1 배변 장소 (실내/실외)
  const [dt2_location, setDt2_location] = useState(''); // DT2 배변 장소 (실내/실외)

  // DT 질문 6
  const [dt_mistake_1_dt1, setDt_mistake_1_dt1] = useState(false); // ① 안 한다 - DT1
  const [dt_mistake_1_dt2, setDt_mistake_1_dt2] = useState(false); // ① 안 한다 - DT2
  const [dt_mistake_2_dt1, setDt_mistake_2_dt1] = useState(false); // ② 주 1회 정도 - DT1
  const [dt_mistake_2_dt2, setDt_mistake_2_dt2] = useState(false); // ② 주 1회 정도 - DT2
  const [dt_mistake_3_dt1, setDt_mistake_3_dt1] = useState(false); // ③ 주 2~3회 정도 - DT1
  const [dt_mistake_3_dt2, setDt_mistake_3_dt2] = useState(false); // ③ 주 2~3회 정도 - DT2
  const [dt_mistake_4_dt1, setDt_mistake_4_dt1] = useState(false); // ④ 주 4~5회 이상 - DT1
  const [dt_mistake_4_dt2, setDt_mistake_4_dt2] = useState(false); // ④ 주 4~5회 이상 - DT2

  // DT 질문 7
  const [dt_before_walk_dt1, setDt_before_walk_dt1] = useState(false); // DT1
  const [dt_before_walk_dt2, setDt_before_walk_dt2] = useState(false); // DT2

  // DT 질문 8
  const [dt_signal, setDt_signal] = useState(''); // 신호 선택
  const [dt_signal_other, setDt_signal_other] = useState(''); // 기타 입력

  // DT 질문 9
  const [dt_problems, setDt_problems] = useState(''); // 배변 문제 자유 텍스트

  // 보행 훈련
  // 보행 질문 1
  const [walk_q1, setWalk_q1] = useState(''); // 하루 평균 산책 시간

  // 보행 질문 2
  const [walk_q2, setWalk_q2] = useState(''); // 주로 산책하는 시간

  // 보행 질문 3
  const [walk_q3, setWalk_q3] = useState(''); // 코트/견줄 착용시 반응
  const [walk_q3_other, setWalk_q3_other] = useState(''); // 기타

  // 보행 질문 4
  const [walk_q4, setWalk_q4] = useState(''); // 헤드칼라 사용 여부

  // 보행 질문 5
  const [walk_q5, setWalk_q5] = useState(''); // 트릿 사용 여부

  // 보행 질문 6
  const [walk_q6, setWalk_q6] = useState(''); // 강아지의 빠르기
  const [walk_q6_other, setWalk_q6_other] = useState(''); // 기타

  // 보행 질문 7
  const [walk_q7, setWalk_q7] = useState(''); // 강아지의 행동
  const [walk_q7_other, setWalk_q7_other] = useState(''); // 기타

  // 보행 질문 8
  const [walk_q8, setWalk_q8] = useState<string[]>([]); // 동물 만났을 때 (복수 선택)
  const [walk_q8_other, setWalk_q8_other] = useState(''); // 기타

  // 보행 질문 9
  const [walk_q9, setWalk_q9] = useState<string[]>([]); // 사람 만났을 때 (복수 선택)
  const [walk_q9_target, setWalk_q9_target] = useState(''); // ⑤ 선택 시 대상
  const [walk_q9_other, setWalk_q9_other] = useState(''); // 기타

  // 보행 질문 10
  const [walk_q10, setWalk_q10] = useState(''); // 반응을 보인 물체/소리

  // 보행 질문 11
  const [walk_q11, setWalk_q11] = useState(''); // 관심을 보이는 대상

  // 사회화 훈련
  // 사회화 질문 1
  const [social_q1, setSocial_q1] = useState(''); // 지난 한 달간 가본 곳

  // 사회화 질문 2
  const [social_q2, setSocial_q2] = useState(''); // 사회화 훈련 횟수

  // 사회화 질문 3
  const [social_q3, setSocial_q3] = useState(''); // 복잡한 곳에서 반응
  const [social_q3_other, setSocial_q3_other] = useState(''); // 기타

  // 사회화 질문 4
  const [social_q4, setSocial_q4] = useState(''); // 계단
  const [social_q4_other, setSocial_q4_other] = useState(''); // 기타

  // 사회화 질문 5
  const [social_q5, setSocial_q5] = useState(''); // 에스컬레이터
  const [social_q5_direction, setSocial_q5_direction] = useState(''); // ② 선택 시 (상행선/하행선)
  const [social_q5_other, setSocial_q5_other] = useState(''); // 기타

  // 사회화 질문 6
  const [social_q6, setSocial_q6] = useState(''); // 승용차
  const [social_q6_other, setSocial_q6_other] = useState(''); // 기타

  // 사회화 질문 7
  const [social_q7, setSocial_q7] = useState(''); // 버스
  const [social_q7_when, setSocial_q7_when] = useState(''); // ② 선택 시 (탈 때/내릴 때)
  const [social_q7_other, setSocial_q7_other] = useState(''); // 기타

  // 사회화 질문 8
  const [social_q8, setSocial_q8] = useState<string[]>([]); // 지하철 (복수 선택)
  const [social_q8_other, setSocial_q8_other] = useState(''); // 기타

  // 사회화 질문 9
  const [social_q9, setSocial_q9] = useState<string[]>([]); // 카페/식당 (복수 선택)
  const [social_q9_other, setSocial_q9_other] = useState(''); // 기타

  // 사회화 질문 10
  const [social_q10, setSocial_q10] = useState(''); // 어려운 점

  // 피드백 관련
  const [feedbackText, setFeedbackText] = useState(''); // 피드백 입력 텍스트

  // 답변을 사람이 읽을 수 있는 텍스트로 변환하는 helper 함수
  const getAnswerText = (fieldName: string, value: any): string => {
    if (!value) return '미응답';
    if (ANSWER_MAPPINGS[fieldName] && ANSWER_MAPPINGS[fieldName][value]) {
      return ANSWER_MAPPINGS[fieldName][value];
    }
    return value; // 매핑이 없으면 원래 값 반환 (텍스트 필드 등)
  };

  const handleCheckboxChange = (currentArray: string[], value: string, setter: (val: string[]) => void) => {
    if (currentArray.includes(value)) {
      setter(currentArray.filter(v => v !== value));
    } else {
      setter([...currentArray, value]);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // 필터 변경 시 재로드
  useEffect(() => {
    if (user?.role === 'admin') {
      loadReports();
    }
  }, [filterYear, filterMonth, filterStartDate, filterEndDate]);

  const loadReports = async () => {
    try {
      const loadedReports = await getMonthlyReports();

      let filteredReports = loadedReports;

      // 퍼피티처: 본인이 작성한 보고서만
      if (user?.role === 'puppyTeacher') {
        filteredReports = loadedReports.filter(r => r.userId === user?.id);
      }
      // 관리자: 필터 적용
      else if (user?.role === 'admin') {
        // 년도 필터
        if (filterYear !== 'all') {
          filteredReports = filteredReports.filter(r => r.reportMonth.startsWith(filterYear));
        }
        // 월 필터
        if (filterMonth !== 'all') {
          filteredReports = filteredReports.filter(r => r.reportMonth === filterMonth);
        }
        // 일자 범위 필터
        if (filterStartDate && filterEndDate) {
          filteredReports = filteredReports.filter(r => {
            const reportDate = r.createdAt.substring(0, 10); // YYYY-MM-DD
            return reportDate >= filterStartDate && reportDate <= filterEndDate;
          });
        }
      }

      setReports(filteredReports);
    } catch (error) {
      console.error('월간 보고서 로드 실패:', error);
      alert('월간 보고서를 불러오는데 실패했습니다.');
    }
  };

  // 컴포넌트 마운트 시 및 필터 변경 시 데이터 로드
  useEffect(() => {
    loadReports();
  }, [user, filterYear, filterMonth, filterStartDate, filterEndDate]);

  // 수정 모드: 보고서 데이터를 state에 로드
  const loadReportForEdit = (report: MonthlyReport) => {
    setEditingReport(report);
    setReportDate(report.reportMonth + '-01'); // YYYY-MM-01 형식
    setStatus(report.status || 'draft');

    // 급식 및 건강 (타입 단언 사용)
    const r = report as any;
    if (r.foodType) setFoodType(r.foodType);
    if (r.dailyFeedingCount) setDailyFeedingCount(r.dailyFeedingCount);
    if (r.feedingAmountPerMeal) setFeedingAmountPerMeal(r.feedingAmountPerMeal);
    if (r.weight) setWeight(r.weight);
    if (r.healthNotes) setHealthNotes(r.healthNotes);

    // 집에서의 품행 - 실제 필드명 사용
    if (r.q1) setQ1(r.q1);
    if (r.q1_time) setQ1_time(r.q1_time);
    if (r.q1_type) setQ1_type(r.q1_type);
    if (r.q1_other) setQ1_other(r.q1_other);

    if (r.q2) setQ2(r.q2);
    if (r.q2_food) setQ2_food(r.q2_food);
    if (r.q2_other) setQ2_other(r.q2_other);

    if (r.q3) setQ3(r.q3);

    if (r.q4) setQ4(r.q4);
    if (r.q4_bark_freq) setQ4_bark_freq(r.q4_bark_freq);
    if (r.q4_other) setQ4_other(r.q4_other);

    if (r.q5_crate_time) setQ5_crate_time(r.q5_crate_time);
    if (r.q5_crate_state) setQ5_crate_state(r.q5_crate_state);
    if (r.q5_fence_time) setQ5_fence_time(r.q5_fence_time);
    if (r.q5_fence_state) setQ5_fence_state(r.q5_fence_state);
    if (r.q5_free_time) setQ5_free_time(r.q5_free_time);
    if (r.q5_free_state) setQ5_free_state(r.q5_free_state);

    if (r.q6) setQ6(r.q6);
    if (r.q6_other) setQ6_other(r.q6_other);

    if (r.q7) setQ7(r.q7);
    if (r.q7_dislike) setQ7_dislike(r.q7_dislike);
    if (r.q7_other) setQ7_other(r.q7_other);

    if (r.q8) setQ8(r.q8);
    if (r.q8_situation) setQ8_situation(r.q8_situation);
    if (r.q8_count) setQ8_count(r.q8_count);

    if (r.q9) setQ9(r.q9);
    if (r.q9_situation) setQ9_situation(r.q9_situation);
    if (r.q9_count) setQ9_count(r.q9_count);

    if (r.q10) setQ10(r.q10);
    if (r.q10_other) setQ10_other(r.q10_other);

    if (r.q11) setQ11(r.q11);
    if (r.q11_other) setQ11_other(r.q11_other);

    if (r.q12_option) setQ12_option(r.q12_option);
    if (r.q12_commands) setQ12_commands(r.q12_commands);
    if (r.q12_wait_state) setQ12_wait_state(r.q12_wait_state);
    if (r.q12_wait_time) setQ12_wait_time(r.q12_wait_time);
    if (r.q12_wait_levels) setQ12_wait_levels(r.q12_wait_levels);

    if (r.q13) setQ13(r.q13);
    if (r.q13_other) setQ13_other(r.q13_other);

    if (r.q14_posture) setQ14_posture(r.q14_posture);
    if (r.q14_frequency) setQ14_frequency(r.q14_frequency);
    if (r.q14) setQ14(r.q14);
    if (r.q14_other) setQ14_other(r.q14_other);

    if (r.q15_posture) setQ15_posture(r.q15_posture);
    if (r.q15_frequency) setQ15_frequency(r.q15_frequency);
    if (r.q15) setQ15(r.q15);
    if (r.q15_other) setQ15_other(r.q15_other);

    if (r.q16_posture) setQ16_posture(r.q16_posture);
    if (r.q16_frequency) setQ16_frequency(r.q16_frequency);
    if (r.q16_comfortable) setQ16_comfortable(r.q16_comfortable);
    if (r.q16_uncomfortable) setQ16_uncomfortable(r.q16_uncomfortable);
    if (r.q16_options) setQ16_options(r.q16_options);
    if (r.q16_bleeding) setQ16_bleeding(r.q16_bleeding);
    if (r.q16_other) setQ16_other(r.q16_other);

    if (r.q17_posture) setQ17_posture(r.q17_posture);
    if (r.q17) setQ17(r.q17);
    if (r.q17_reason) setQ17_reason(r.q17_reason);
    if (r.q17_other) setQ17_other(r.q17_other);

    if (r.q18) setQ18(r.q18);
    if (r.q18_treat) setQ18_treat(r.q18_treat);
    if (r.q18_bites) setQ18_bites(r.q18_bites);
    if (r.q18_other) setQ18_other(r.q18_other);

    if (r.q19) setQ19(r.q19);
    if (r.q19_count) setQ19_count(r.q19_count);

    if (r.q20) setQ20(r.q20);
    if (r.q20_other) setQ20_other(r.q20_other);

    if (r.q21) setQ21(r.q21);

    // DT 품행 기록 - 실제 필드명 사용
    if (r.dt1_time) setDt1_time(r.dt1_time);
    if (r.dt2_time) setDt2_time(r.dt2_time);
    if (r.dt_indoor_blocked) setDt_indoor_blocked(r.dt_indoor_blocked);
    if (r.dt_indoor_type) setDt_indoor_type(r.dt_indoor_type);
    if (r.dt_belt_type) setDt_belt_type(r.dt_belt_type);
    if (r.dt1_location) setDt1_location(r.dt1_location);
    if (r.dt2_location) setDt2_location(r.dt2_location);
    if (r.dt_mistake_1_dt1 !== undefined) setDt_mistake_1_dt1(r.dt_mistake_1_dt1);
    if (r.dt_mistake_1_dt2 !== undefined) setDt_mistake_1_dt2(r.dt_mistake_1_dt2);
    if (r.dt_mistake_2_dt1 !== undefined) setDt_mistake_2_dt1(r.dt_mistake_2_dt1);
    if (r.dt_mistake_2_dt2 !== undefined) setDt_mistake_2_dt2(r.dt_mistake_2_dt2);
    if (r.dt_mistake_3_dt1 !== undefined) setDt_mistake_3_dt1(r.dt_mistake_3_dt1);
    if (r.dt_mistake_3_dt2 !== undefined) setDt_mistake_3_dt2(r.dt_mistake_3_dt2);
    if (r.dt_mistake_4_dt1 !== undefined) setDt_mistake_4_dt1(r.dt_mistake_4_dt1);
    if (r.dt_mistake_4_dt2 !== undefined) setDt_mistake_4_dt2(r.dt_mistake_4_dt2);
    if (r.dt_before_walk_dt1 !== undefined) setDt_before_walk_dt1(r.dt_before_walk_dt1);
    if (r.dt_before_walk_dt2 !== undefined) setDt_before_walk_dt2(r.dt_before_walk_dt2);
    if (r.dt_signal) setDt_signal(r.dt_signal);
    if (r.dt_signal_other) setDt_signal_other(r.dt_signal_other);
    if (r.dt_problems) setDt_problems(r.dt_problems);

    // 보행 훈련 - 실제 필드명 사용
    if (r.walk_q1) setWalk_q1(r.walk_q1);
    if (r.walk_q2) setWalk_q2(r.walk_q2);
    if (r.walk_q3) setWalk_q3(r.walk_q3);
    if (r.walk_q3_other) setWalk_q3_other(r.walk_q3_other);
    if (r.walk_q4) setWalk_q4(r.walk_q4);
    if (r.walk_q5) setWalk_q5(r.walk_q5);
    if (r.walk_q6) setWalk_q6(r.walk_q6);
    if (r.walk_q6_other) setWalk_q6_other(r.walk_q6_other);
    if (r.walk_q7) setWalk_q7(r.walk_q7);
    if (r.walk_q7_other) setWalk_q7_other(r.walk_q7_other);
    if (r.walk_q8) setWalk_q8(r.walk_q8);
    if (r.walk_q8_other) setWalk_q8_other(r.walk_q8_other);
    if (r.walk_q9) setWalk_q9(r.walk_q9);
    if (r.walk_q9_target) setWalk_q9_target(r.walk_q9_target);
    if (r.walk_q9_other) setWalk_q9_other(r.walk_q9_other);
    if (r.walk_q10) setWalk_q10(r.walk_q10);
    if (r.walk_q11) setWalk_q11(r.walk_q11);

    // 사회화 훈련 - 실제 필드명 사용
    if (r.social_q1) setSocial_q1(r.social_q1);
    if (r.social_q2) setSocial_q2(r.social_q2);
    if (r.social_q3) setSocial_q3(r.social_q3);
    if (r.social_q3_other) setSocial_q3_other(r.social_q3_other);
    if (r.social_q4) setSocial_q4(r.social_q4);
    if (r.social_q4_other) setSocial_q4_other(r.social_q4_other);
    if (r.social_q5) setSocial_q5(r.social_q5);
    if (r.social_q5_direction) setSocial_q5_direction(r.social_q5_direction);
    if (r.social_q5_other) setSocial_q5_other(r.social_q5_other);
    if (r.social_q6) setSocial_q6(r.social_q6);
    if (r.social_q6_other) setSocial_q6_other(r.social_q6_other);
    if (r.social_q7) setSocial_q7(r.social_q7);
    if (r.social_q7_when) setSocial_q7_when(r.social_q7_when);
    if (r.social_q7_other) setSocial_q7_other(r.social_q7_other);
    if (r.social_q8) setSocial_q8(r.social_q8);
    if (r.social_q8_other) setSocial_q8_other(r.social_q8_other);
    if (r.social_q9) setSocial_q9(r.social_q9);
    if (r.social_q9_other) setSocial_q9_other(r.social_q9_other);
    if (r.social_q10) setSocial_q10(r.social_q10);

    // 작성 모드로 전환
    setCurrentStep(1);
    setIsWriting(true);
  };

  const createReportData = (): MonthlyReport => ({
    id: editingReport?.id || generateId(), // 수정 모드면 기존 ID 유지
    userId: user?.id || '',
    userName: user?.name || '',
    dogName: user?.dogName || '',
    reportMonth: reportDate.substring(0, 7), // YYYY-MM 형식으로 변환
    createdAt: editingReport?.createdAt || new Date().toISOString(), // 수정 모드면 기존 작성일 유지
    // 급식
    foodType, dailyFeedingCount, feedingAmountPerMeal,
    // 건강
    weight, healthNotes,
    // 집에서의 품행 답변 데이터
    q1, q1_time, q1_type, q1_other,
    q2, q2_food, q2_other,
    q3,
    q4, q4_bark_freq, q4_other,
    q5_crate_time, q5_crate_state, q5_fence_time, q5_fence_state, q5_free_time, q5_free_state,
    q6, q6_other,
    q7, q7_dislike, q7_other,
    q8, q8_situation, q8_count,
    q9, q9_situation, q9_count,
    q10, q10_other,
    q11, q11_other,
    q12_option, q12_commands, q12_wait_state, q12_wait_time, q12_wait_levels,
    q13, q13_other,
    q14_posture, q14_frequency, q14, q14_other,
    q15_posture, q15_frequency, q15, q15_other,
    q16_posture, q16_frequency, q16_comfortable, q16_uncomfortable, q16_options, q16_bleeding, q16_other,
    q17_posture, q17, q17_reason, q17_other,
    q18, q18_treat, q18_bites, q18_other,
    q19, q19_count,
    q20, q20_other,
    q21,
    // DT 품행 기록
    dt1_time, dt2_time,
    dt_indoor_blocked,
    dt_indoor_type,
    dt_belt_type,
    dt1_location, dt2_location,
    dt_mistake_1_dt1, dt_mistake_1_dt2,
    dt_mistake_2_dt1, dt_mistake_2_dt2,
    dt_mistake_3_dt1, dt_mistake_3_dt2,
    dt_mistake_4_dt1, dt_mistake_4_dt2,
    dt_before_walk_dt1, dt_before_walk_dt2,
    dt_signal, dt_signal_other,
    dt_problems,
    // 보행 훈련
    walk_q1, walk_q2,
    walk_q3, walk_q3_other,
    walk_q4, walk_q5,
    walk_q6, walk_q6_other,
    walk_q7, walk_q7_other,
    walk_q8, walk_q8_other,
    walk_q9, walk_q9_target, walk_q9_other,
    walk_q10, walk_q11,
    // 사회화 훈련
    social_q1, social_q2,
    social_q3, social_q3_other,
    social_q4, social_q4_other,
    social_q5, social_q5_direction, social_q5_other,
    social_q6, social_q6_other,
    social_q7, social_q7_when, social_q7_other,
    social_q8, social_q8_other,
    social_q9, social_q9_other,
    social_q10,
    status, // 상태: 'draft' 또는 'completed'
    updatedAt: new Date().toISOString(),
  });

  const handleSaveDraft = async () => {
    if (!reportDate) {
      alert('보고 일자를 선택해주세요.');
      return;
    }

    try {
      const monthlyReport = createReportData();
      await saveMonthlyReport(monthlyReport);
      await loadReports();
      alert(editingReport ? '수정되었습니다.' : '임시 저장되었습니다.');
      setIsWriting(false);
      setCurrentStep(1);
      setEditingReport(null); // 수정 모드 초기화
    } catch (error) {
      console.error('저장 실패:', error);
      alert('저장에 실패했습니다.');
    }
  };

  const handleComplete = async () => {
    if (!reportDate) {
      alert('보고 일자를 선택해주세요.');
      return;
    }

    if (window.confirm('제출하시겠습니까? 제출 후에는 수정이 불가능합니다.')) {
      try {
        // status를 'completed'로 변경
        setStatus('completed');

        // status가 업데이트된 후 저장하기 위해 직접 데이터 생성
        const monthlyReport: MonthlyReport = {
          ...createReportData(),
          status: 'completed'
        };

        await saveMonthlyReport(monthlyReport);
        await loadReports();
        alert('월간 보고서가 제출되었습니다.');
        setIsWriting(false);
        setCurrentStep(1);
        setStatus('draft'); // 다음 작성을 위해 초기화
        setEditingReport(null); // 수정 모드 초기화
      } catch (error) {
        console.error('제출 실패:', error);
        alert('제출에 실패했습니다.');
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 작성 중일 때
  if (isWriting) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">
              월간 보고서 작성
            </h2>
            <button
              onClick={() => {
                setIsWriting(false);
                setCurrentStep(1);
              }}
              className="text-neutral-600 hover:text-neutral-800"
            >
              ← 목록으로
            </button>
          </div>

        {/* 단계 표시 */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-neutral-300 text-neutral-600'} font-semibold`}>
              1
            </div>
            <span className="ml-2 text-sm font-semibold text-neutral-700">기본 정보</span>
          </div>
          <div className="w-20 h-1 mx-4 bg-neutral-300">
            <div className={`h-full ${currentStep >= 2 ? 'bg-primary-600' : 'bg-neutral-300'}`}></div>
          </div>
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-neutral-300 text-neutral-600'} font-semibold`}>
              2
            </div>
            <span className="ml-2 text-sm font-semibold text-neutral-700">집에서의 품행</span>
          </div>
        </div>

        <div className="space-y-8">
          {/* 1단계: 기본 정보 */}
          {currentStep === 1 && (
            <>
              {/* 보고 일자 선택 */}
              <div className="bg-primary-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  보고 일자 *
                </label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  required
                  disabled={status === 'completed'}
                />
              </div>

          {/* 급식 */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-neutral-800 mb-4 bg-neutral-100 p-3 rounded">급식</h3>
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="feeding-title">
              <h4 id="feeding-title" className="font-semibold text-neutral-800 mb-3">월간 급식 현황</h4>
              <div className="space-y-4 ml-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    사료 종류
                  </label>
                  <input
                    type="text"
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="예: 로얄캐닌 퍼피"
                    disabled={status === 'completed'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    1일 급식 횟수
                  </label>
                  <input
                    type="text"
                    value={dailyFeedingCount}
                    onChange={(e) => setDailyFeedingCount(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="예: 3회"
                    disabled={status === 'completed'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    1회 급식량 (그램)
                  </label>
                  <input
                    type="text"
                    value={feedingAmountPerMeal}
                    onChange={(e) => setFeedingAmountPerMeal(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="예: 150g"
                    disabled={status === 'completed'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 건강 */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-neutral-800 mb-4 bg-neutral-100 p-3 rounded">건강</h3>
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="health-title">
              <h4 id="health-title" className="font-semibold text-neutral-800 mb-3">월간 건강 현황</h4>
              <div className="space-y-4 ml-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    체중 (킬로그램)
                  </label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="예: 15.5kg"
                    disabled={status === 'completed'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    건강상 특이사항
                  </label>
                  <textarea
                    value={healthNotes}
                    onChange={(e) => setHealthNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    rows={4}
                    placeholder="건강 관련 특이사항이나 변화를 자유롭게 작성해주세요. (예: 예방접종, 병원 방문, 피부/귀 상태, 식욕 변화 등)"
                    disabled={status === 'completed'}
                  />
                </div>
              </div>
            </div>
          </div>
            </>
          )}

          {/* 2단계: 집에서의 품행 */}
          {currentStep === 2 && (
            <>
          {/* 집에서의 품행 */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-neutral-800 mb-4 bg-neutral-100 p-3 rounded">집에서의 품행</h3>

            {/* 질문 1 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q1-title">
              <h4 id="q1-title" className="font-semibold text-neutral-800 mb-3">1. 크레이트(팬스)를 닫았을 때 안에서의 행동</h4>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q1" value="1" checked={q1==='1'} onChange={(e)=>setQ1(e.target.value)} className="mt-1 mr-2" />
                  <span>① 편안하게 있는다</span>
                </label>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q1" value="2" checked={q1==='2'} onChange={(e)=>setQ1(e.target.value)} className="mt-1 mr-2" />
                    <span>② 낑낑거리다 곧 편안해 진다.</span>
                  </label>
                  {q1==='2' && (
                    <div className="ml-6 mt-2">
                      <label className="text-sm text-neutral-700">
                        편안해 질때까지 걸리는 시간 (예: 5분, 1시간 등)
                      </label>
                      <input
                        type="text"
                        value={q1_time}
                        onChange={(e)=>setQ1_time(e.target.value)}
                        className="ml-2 px-3 py-1 border border-neutral-300 rounded w-48"
                        placeholder="예: 5분"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q1" value="3" checked={q1==='3'} onChange={(e)=>setQ1(e.target.value)} className="mt-1 mr-2" />
                    <span>③ 짖다가 곧 편안히 있는다.</span>
                  </label>
                  {q1==='3' && (
                    <div className="ml-6 mt-2">
                      <label className="text-sm text-neutral-700">
                        편안해 질때까지 걸리는 시간 (예: 5분, 1시간 등)
                      </label>
                      <input
                        type="text"
                        value={q1_time}
                        onChange={(e)=>setQ1_time(e.target.value)}
                        className="ml-2 px-3 py-1 border border-neutral-300 rounded w-48"
                        placeholder="예: 10분"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q1" value="4" checked={q1==='4'} onChange={(e)=>setQ1(e.target.value)} className="mt-1 mr-2" />
                    <span>④ 무언가를 씹는다.</span>
                  </label>
                  {q1==='4' && (
                    <div className="ml-6 mt-2">
                      <label className="text-sm text-neutral-700">씹는 종류</label>
                      <input
                        type="text"
                        value={q1_type}
                        onChange={(e)=>setQ1_type(e.target.value)}
                        className="ml-2 px-3 py-1 border border-neutral-300 rounded w-64"
                        placeholder="예: 담요, 장난감 등"
                      />
                    </div>
                  )}
                </div>
                <label className="flex items-start">
                  <input type="radio" name="q1" value="5" checked={q1==='5'} onChange={(e)=>setQ1(e.target.value)} className="mt-1 mr-2" />
                  <span>⑤ 자리를 잡지 못하고 지속적으로 불안해 한다.</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q1_other} onChange={(e)=>setQ1_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 2 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q2-title">
              <h4 id="q2-title" className="font-semibold text-neutral-800 mb-3">2. 사람 음식에 대한 반응</h4>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q2" value="1" checked={q2==='1'} onChange={(e)=>setQ2(e.target.value)} className="mt-1 mr-2" />
                  <span>① 음식이 바닥에 떨어져도 먹지 않을 정도로 관심이 없다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q2" value="2" checked={q2==='2'} onChange={(e)=>setQ2(e.target.value)} className="mt-1 mr-2" />
                  <span>② 식탁 주변에서 음식이 떨어지기를 기다리거나 쳐다본다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q2" value="3" checked={q2==='3'} onChange={(e)=>setQ2(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 식탁에서 먹을 때는 관심 없으나 좌식 테이블에서 먹을 때는 관심보임.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q2" value="4" checked={q2==='4'} onChange={(e)=>setQ2(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 침을 흘리며 먹고 싶어한다.</span>
                </label>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q2" value="5" checked={q2==='5'} onChange={(e)=>setQ2(e.target.value)} className="mt-1 mr-2" />
                    <span>⑤ 기회가 있으면 훔쳐 먹기도 한다.</span>
                  </label>
                  {q2==='5' && (
                    <div className="ml-6 mt-2">
                      <label className="text-sm text-neutral-700">먹은 음식</label>
                      <input
                        type="text"
                        value={q2_food}
                        onChange={(e)=>setQ2_food(e.target.value)}
                        className="ml-2 px-3 py-1 border border-neutral-300 rounded w-64"
                        placeholder="예: 빵, 고기 등"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q2_other} onChange={(e)=>setQ2_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 3 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q3-title">
              <h4 id="q3-title" className="font-semibold text-neutral-800 mb-3">3. 혼자 있을 때 상태</h4>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q3" value="1" checked={q3==='1'} onChange={(e)=>setQ3(e.target.value)} className="mt-1 mr-2" />
                  <span>① 크레이트 문 닫은 상태</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q3" value="2" checked={q3==='2'} onChange={(e)=>setQ3(e.target.value)} className="mt-1 mr-2" />
                  <span>② 팬스</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q3" value="3" checked={q3==='3'} onChange={(e)=>setQ3(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 풀어 둔다</span>
                </label>
              </div>
            </div>

            {/* 질문 4 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q4-title">
              <h4 id="q4-title" className="font-semibold text-neutral-800 mb-3">4. 혼자 있을 때 반응</h4>
              <div className="space-y-2 ml-4">
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q4" value="1" checked={q4==='1'} onChange={(e)=>setQ4(e.target.value)} className="mt-1 mr-2" />
                    <span>① 짖음 있음</span>
                  </label>
                  {q4==='1' && (
                    <div className="ml-6 mt-2 space-y-2">
                      <label className="flex items-center">
                        <input type="radio" name="q4_bark_freq" value="한번" checked={q4_bark_freq==='한번'} onChange={(e)=>setQ4_bark_freq(e.target.value)} className="mr-2" />
                        <span>한번</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="q4_bark_freq" value="여러번" checked={q4_bark_freq==='여러번'} onChange={(e)=>setQ4_bark_freq(e.target.value)} className="mr-2" />
                        <span>여러번</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="q4_bark_freq" value="계속" checked={q4_bark_freq==='계속'} onChange={(e)=>setQ4_bark_freq(e.target.value)} className="mr-2" />
                        <span>계속</span>
                      </label>
                    </div>
                  )}
                </div>
                <label className="flex items-start">
                  <input type="radio" name="q4" value="2" checked={q4==='2'} onChange={(e)=>setQ4(e.target.value)} className="mt-1 mr-2" />
                  <span>② 낑낑 거림</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q4" value="3" checked={q4==='3'} onChange={(e)=>setQ4(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 이불이나 크레이트, 다른 물건 등을 뜯는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q4" value="4" checked={q4==='4'} onChange={(e)=>setQ4(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 편안하게 쉼</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: 예)현관앞을 떠나지 않음, 쇼파 위에 올라감 </span>
                  <input type="text" value={q4_other} onChange={(e)=>setQ4_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 5 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q5-title">
              <h4 id="q5-title" className="font-semibold text-neutral-800 mb-3">5. 아래 장소를 각각 선택하고, 혼자 있어 본 최장시간과 상태</h4>
              <div className="ml-4 space-y-4">
                <div className="border-l-4 border-primary-400 pl-4">
                  <p className="font-medium text-neutral-700 mb-2">크레이트</p>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm text-neutral-600">시간</label>
                      <input
                        type="text"
                        value={q5_crate_time}
                        onChange={(e)=>setQ5_crate_time(e.target.value)}
                        className="ml-2 px-3 py-1 border border-neutral-300 rounded w-32"
                        placeholder="예: 1시간"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600">상태</label>
                      <input
                        type="text"
                        value={q5_crate_state}
                        onChange={(e)=>setQ5_crate_state(e.target.value)}
                        className="ml-2 px-3 py-1 border border-neutral-300 rounded w-48"
                        placeholder="예: 점잖음, 난리가 남"
                      />
                    </div>
                  </div>
                </div>
                <div className="border-l-4 border-primary-400 pl-4">
                  <p className="font-medium text-neutral-700 mb-2">팬스</p>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm text-neutral-600">시간</label>
                      <input
                        type="text"
                        value={q5_fence_time}
                        onChange={(e)=>setQ5_fence_time(e.target.value)}
                        className="ml-2 px-3 py-1 border border-neutral-300 rounded w-32"
                        placeholder="예: 30분"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600">상태</label>
                      <input
                        type="text"
                        value={q5_fence_state}
                        onChange={(e)=>setQ5_fence_state(e.target.value)}
                        className="ml-2 px-3 py-1 border border-neutral-300 rounded w-48"
                        placeholder="예: 조용함"
                      />
                    </div>
                  </div>
                </div>
                <div className="border-l-4 border-primary-400 pl-4">
                  <p className="font-medium text-neutral-700 mb-2">풀린 상태</p>
                  <div className="flex gap-4">
                    <div>
                      <label className="text-sm text-neutral-600">시간</label>
                      <input
                        type="text"
                        value={q5_free_time}
                        onChange={(e)=>setQ5_free_time(e.target.value)}
                        className="ml-2 px-3 py-1 border border-neutral-300 rounded w-32"
                        placeholder="예: 2시간"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-600">상태</label>
                      <input
                        type="text"
                        value={q5_free_state}
                        onChange={(e)=>setQ5_free_state(e.target.value)}
                        className="ml-2 px-3 py-1 border border-neutral-300 rounded w-48"
                        placeholder="예: 잘 쉼"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 질문 6 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q6-title">
              <h4 id="q6-title" className="font-semibold text-neutral-800 mb-3">6. 손님이 왔을 때의 반응</h4>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q6" value="1" checked={q6==='1'} onChange={(e)=>setQ6(e.target.value)} className="mt-1 mr-2" />
                  <span>① 흥분하며 점프 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q6" value="2" checked={q6==='2'} onChange={(e)=>setQ6(e.target.value)} className="mt-1 mr-2" />
                  <span>② 흥분해서 짖는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q6" value="3" checked={q6==='3'} onChange={(e)=>setQ6(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 흥분하고 좋아하나 점프는 하지 않는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q6" value="4" checked={q6==='4'} onChange={(e)=>setQ6(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 옷이나 손 등에 입질을 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q6" value="5" checked={q6==='5'} onChange={(e)=>setQ6(e.target.value)} className="mt-1 mr-2" />
                  <span>⑤ 소변을 지린다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q6" value="6" checked={q6==='6'} onChange={(e)=>setQ6(e.target.value)} className="mt-1 mr-2" />
                  <span>⑥ 별로 관심 없다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q6" value="7" checked={q6==='7'} onChange={(e)=>setQ6(e.target.value)} className="mt-1 mr-2" />
                  <span>⑦ 별로 좋아하지 않는다. (크레이트로 들어감, 털을 세우며 경계, 으르렁)</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q6_other} onChange={(e)=>setQ6_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 7 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q7-title">
              <h4 id="q7-title" className="font-semibold text-neutral-800 mb-3">7. 가족이 귀가했을 때의 반응</h4>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q7" value="1" checked={q7==='1'} onChange={(e)=>setQ7(e.target.value)} className="mt-1 mr-2" />
                  <span>① 흥분하며 점프 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q7" value="2" checked={q7==='2'} onChange={(e)=>setQ7(e.target.value)} className="mt-1 mr-2" />
                  <span>② 흥분해서 짖는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q7" value="3" checked={q7==='3'} onChange={(e)=>setQ7(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 흥분하고 좋아하나 점프는 하지 않는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q7" value="4" checked={q7==='4'} onChange={(e)=>setQ7(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 옷이나 손 등에 입질을 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q7" value="5" checked={q7==='5'} onChange={(e)=>setQ7(e.target.value)} className="mt-1 mr-2" />
                  <span>⑤ 소변을 지린다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q7" value="6" checked={q7==='6'} onChange={(e)=>setQ7(e.target.value)} className="mt-1 mr-2" />
                  <span>⑥ 별로 관심 없다</span>
                </label>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q7" value="7" checked={q7==='7'} onChange={(e)=>setQ7(e.target.value)} className="mt-1 mr-2" />
                    <span>⑦ 별로 좋아하지 않는다.</span>
                  </label>
                  {q7==='7' && (
                    <div className="ml-6 mt-2 space-y-2">
                      <label className="flex items-center">
                        <input type="radio" name="q7_dislike" value="크레이트로 들어감" checked={q7_dislike==='크레이트로 들어감'} onChange={(e)=>setQ7_dislike(e.target.value)} className="mr-2" />
                        <span>크레이트로 들어감</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="q7_dislike" value="털을 세우며 경계" checked={q7_dislike==='털을 세우며 경계'} onChange={(e)=>setQ7_dislike(e.target.value)} className="mr-2" />
                        <span>털을 세우며 경계</span>
                      </label>
                      <label className="flex items-center">
                        <input type="radio" name="q7_dislike" value="으르렁" checked={q7_dislike==='으르렁'} onChange={(e)=>setQ7_dislike(e.target.value)} className="mr-2" />
                        <span>으르렁</span>
                      </label>
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q7_other} onChange={(e)=>setQ7_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 8 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q8-title">
              <h4 id="q8-title" className="font-semibold text-neutral-800 mb-3">8. 집에 있는 상황에서 짖은 적이 있나요?</h4>
              <div className="space-y-2 ml-4">
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q8" value="1" checked={q8==='1'} onChange={(e)=>setQ8(e.target.value)} className="mt-1 mr-2" />
                    <span>① 있다.</span>
                  </label>
                  {q8==='1' && (
                    <div className="ml-6 mt-2 space-y-2">
                      <div>
                        <label className="text-sm text-neutral-700">상황</label>
                        <input
                          type="text"
                          value={q8_situation}
                          onChange={(e)=>setQ8_situation(e.target.value)}
                          className="ml-2 px-3 py-1 border border-neutral-300 rounded w-full max-w-md"
                          placeholder="예: 초인종 소리, 다른 개 짖는 소리 등"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-neutral-700">횟수</label>
                        <input
                          type="text"
                          value={q8_count}
                          onChange={(e)=>setQ8_count(e.target.value)}
                          className="ml-2 px-3 py-1 border border-neutral-300 rounded w-32"
                          placeholder="예: 5회"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <label className="flex items-start">
                  <input type="radio" name="q8" value="2" checked={q8==='2'} onChange={(e)=>setQ8(e.target.value)} className="mt-1 mr-2" />
                  <span>② 없다.</span>
                </label>
              </div>
            </div>

            {/* 질문 9 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q9-title">
              <h4 id="q9-title" className="font-semibold text-neutral-800 mb-3">9. 으르렁 거린 적이 있나요?</h4>
              <div className="space-y-2 ml-4">
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q9" value="1" checked={q9==='1'} onChange={(e)=>setQ9(e.target.value)} className="mt-1 mr-2" />
                    <span>① 있다.</span>
                  </label>
                  {q9==='1' && (
                    <div className="ml-6 mt-2 space-y-2">
                      <div>
                        <label className="text-sm text-neutral-700">상황</label>
                        <input
                          type="text"
                          value={q9_situation}
                          onChange={(e)=>setQ9_situation(e.target.value)}
                          className="ml-2 px-3 py-1 border border-neutral-300 rounded w-full max-w-md"
                          placeholder="예: 음식을 빼앗으려 할 때 등"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-neutral-700">횟수</label>
                        <input
                          type="text"
                          value={q9_count}
                          onChange={(e)=>setQ9_count(e.target.value)}
                          className="ml-2 px-3 py-1 border border-neutral-300 rounded w-32"
                          placeholder="예: 2회"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <label className="flex items-start">
                  <input type="radio" name="q9" value="2" checked={q9==='2'} onChange={(e)=>setQ9(e.target.value)} className="mt-1 mr-2" />
                  <span>② 없다.</span>
                </label>
              </div>
            </div>

            {/* 질문 10 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q10-title">
              <h4 id="q10-title" className="font-semibold text-neutral-800 mb-3">10. 개의 잘못된 행동(입질,짖음,점프,이물섭취 등)을 사람이 컨트롤 했을 때의 반응</h4>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q10" value="1" checked={q10==='1'} onChange={(e)=>setQ10(e.target.value)} className="mt-1 mr-2" />
                  <span>① 바로 순응한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q10" value="2" checked={q10==='2'} onChange={(e)=>setQ10(e.target.value)} className="mt-1 mr-2" />
                  <span>② 말대꾸 하듯이 짖는다 (1회 이상)</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q10" value="3" checked={q10==='3'} onChange={(e)=>setQ10(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 꿍얼거린다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q10" value="4" checked={q10==='4'} onChange={(e)=>setQ10(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 이를 보이며 공격적인 반응을 보인 적이 있다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q10" value="5" checked={q10==='5'} onChange={(e)=>setQ10(e.target.value)} className="mt-1 mr-2" />
                  <span>⑤ 배를 보이고 누워 버린다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q10" value="6" checked={q10==='6'} onChange={(e)=>setQ10(e.target.value)} className="mt-1 mr-2" />
                  <span>⑥ 갑자기 흥분하며 꼬리를 숨긴 채로 날뛴다.(비방향성 돌진행동)</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q10_other} onChange={(e)=>setQ10_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 11 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q11-title">
              <h4 id="q11-title" className="font-semibold text-neutral-800 mb-3">11. 장난감이나 콩, 껌을 물고 있는 강아지에게 "놔 or 그만"을 했을 때 반응은?</h4>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q11" value="1" checked={q11==='1'} onChange={(e)=>setQ11(e.target.value)} className="mt-1 mr-2" />
                  <span>① 5초 안에 순순히 놓는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q11" value="2" checked={q11==='2'} onChange={(e)=>setQ11(e.target.value)} className="mt-1 mr-2" />
                  <span>② 몇 번 다시 뺏으려고 시도한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q11" value="3" checked={q11==='3'} onChange={(e)=>setQ11(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 장난치듯 으르렁 소리를 낸다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q11" value="4" checked={q11==='4'} onChange={(e)=>setQ11(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 공격적인 으르렁 소리를 낸다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q11" value="5" checked={q11==='5'} onChange={(e)=>setQ11(e.target.value)} className="mt-1 mr-2" />
                  <span>⑤ 물고 도망가 구석으로 숨는다.</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q11_other} onChange={(e)=>setQ11_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 12 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q12-title">
              <h4 id="q12-title" className="font-semibold text-neutral-800 mb-3">12. 집안에서 기본훈련(앉아 / 엎드려 / 서 )에 대한 강아지의 수준은?</h4>
              <div className="space-y-2 ml-4">
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q12_option" value="1" checked={q12_option==='1'} onChange={(e)=>setQ12_option(e.target.value)} className="mt-1 mr-2" />
                    <span>① 한번 명령어에 바로 실시한다.</span>
                  </label>
                  {q12_option==='1' && (
                    <div className="ml-6 mt-2 space-y-2">
                      <p className="text-sm text-neutral-700 mb-2">해당하는 것에 체크:</p>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_commands.includes('앉아')} onChange={()=>handleCheckboxChange(q12_commands,'앉아',setQ12_commands)} className="mr-2" />
                        <span>앉아</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_commands.includes('엎드려')} onChange={()=>handleCheckboxChange(q12_commands,'엎드려',setQ12_commands)} className="mr-2" />
                        <span>엎드려</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_commands.includes('서')} onChange={()=>handleCheckboxChange(q12_commands,'서',setQ12_commands)} className="mr-2" />
                        <span>서</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_commands.includes('기다려')} onChange={()=>handleCheckboxChange(q12_commands,'기다려',setQ12_commands)} className="mr-2" />
                        <span>기다려</span>
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q12_option" value="2" checked={q12_option==='2'} onChange={(e)=>setQ12_option(e.target.value)} className="mt-1 mr-2" />
                    <span>② 명령어를 아직 잘 모르는것 같다.</span>
                  </label>
                  {q12_option==='2' && (
                    <div className="ml-6 mt-2 space-y-2">
                      <p className="text-sm text-neutral-700 mb-2">해당하는 것에 체크:</p>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_commands.includes('앉아')} onChange={()=>handleCheckboxChange(q12_commands,'앉아',setQ12_commands)} className="mr-2" />
                        <span>앉아</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_commands.includes('엎드려')} onChange={()=>handleCheckboxChange(q12_commands,'엎드려',setQ12_commands)} className="mr-2" />
                        <span>엎드려</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_commands.includes('서')} onChange={()=>handleCheckboxChange(q12_commands,'서',setQ12_commands)} className="mr-2" />
                        <span>서</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_commands.includes('기다려')} onChange={()=>handleCheckboxChange(q12_commands,'기다려',setQ12_commands)} className="mr-2" />
                        <span>기다려</span>
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q12_option" value="3" checked={q12_option==='3'} onChange={(e)=>setQ12_option(e.target.value)} className="mt-1 mr-2" />
                    <span>③ '기다려' 할 수 있는 시간</span>
                  </label>
                  {q12_option==='3' && (
                    <div className="ml-6 mt-2 space-y-2">
                      <div>
                        <label className="text-sm text-neutral-700">상태</label>
                        <input
                          type="text"
                          value={q12_wait_state}
                          onChange={(e)=>setQ12_wait_state(e.target.value)}
                          className="ml-2 px-3 py-1 border border-neutral-300 rounded w-full max-w-md"
                          placeholder="예: 편안하게 앉아있음"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-neutral-700">시간</label>
                        <input
                          type="text"
                          value={q12_wait_time}
                          onChange={(e)=>setQ12_wait_time(e.target.value)}
                          className="ml-2 px-3 py-1 border border-neutral-300 rounded w-48"
                          placeholder="예: 5분"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q12_option" value="4" checked={q12_option==='4'} onChange={(e)=>setQ12_option(e.target.value)} className="mt-1 mr-2" />
                    <span>④ '기다려' 할 수 있는 수준</span>
                  </label>
                  {q12_option==='4' && (
                    <div className="ml-6 mt-2 space-y-2">
                      <p className="text-sm text-neutral-700 mb-2">해당하는 것에 체크:</p>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_wait_levels.includes('바로옆')} onChange={()=>handleCheckboxChange(q12_wait_levels,'바로옆',setQ12_wait_levels)} className="mr-2" />
                        <span>바로옆</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_wait_levels.includes('몇발자국 떨어져서')} onChange={()=>handleCheckboxChange(q12_wait_levels,'몇발자국 떨어져서',setQ12_wait_levels)} className="mr-2" />
                        <span>몇발자국 떨어져서</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_wait_levels.includes('사람이 왔다갔다 함')} onChange={()=>handleCheckboxChange(q12_wait_levels,'사람이 왔다갔다 함',setQ12_wait_levels)} className="mr-2" />
                        <span>사람이 왔다갔다 함</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_wait_levels.includes('개의 몸을 넘어다님')} onChange={()=>handleCheckboxChange(q12_wait_levels,'개의 몸을 넘어다님',setQ12_wait_levels)} className="mr-2" />
                        <span>개의 몸을 넘어다님</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q12_wait_levels.includes('사람이 안보이는 곳으로 사라짐')} onChange={()=>handleCheckboxChange(q12_wait_levels,'사람이 안보이는 곳으로 사라짐',setQ12_wait_levels)} className="mr-2" />
                        <span>사람이 안보이는 곳으로 사라짐</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 질문 13 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q13-title">
              <h4 id="q13-title" className="font-semibold text-neutral-800 mb-3">13. 바디핸들링이나 배를 보이며 눕히기를 했을때 강아지의 행동은?</h4>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q13" value="1" checked={q13==='1'} onChange={(e)=>setQ13(e.target.value)} className="mt-1 mr-2" />
                  <span>① 바로 편안하게 눕고 잠을 잘 때도 있다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q13" value="2" checked={q13==='2'} onChange={(e)=>setQ13(e.target.value)} className="mt-1 mr-2" />
                  <span>② 누워는 있으나 몸이 경직된 채로 긴장한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q13" value="3" checked={q13==='3'} onChange={(e)=>setQ13(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 발버둥 치며 일어나려고 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q13" value="4" checked={q13==='4'} onChange={(e)=>setQ13(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 입질을 하며 일어나려고 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q13" value="5" checked={q13==='5'} onChange={(e)=>setQ13(e.target.value)} className="mt-1 mr-2" />
                  <span>⑤ 잘 누워 있다가 무언가 하려고 하면(귀청소 or 발톱손질) 빠져나가려 한다.</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q13_other} onChange={(e)=>setQ13_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 14 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q14-title">
              <h4 id="q14-title" className="font-semibold text-neutral-800 mb-3">14. 이를 닦을 때 품행</h4>
              <div className="ml-4 space-y-3">
                <div className="flex gap-4 items-center">
                  <div>
                    <span className="text-sm text-neutral-700 mr-2">자세:</span>
                    <label className="mr-4">
                      <input type="radio" name="q14_posture" value="누워서" checked={q14_posture==='누워서'} onChange={(e)=>setQ14_posture(e.target.value)} className="mr-1" />
                      누워서
                    </label>
                    <label>
                      <input type="radio" name="q14_posture" value="앉아서" checked={q14_posture==='앉아서'} onChange={(e)=>setQ14_posture(e.target.value)} className="mr-1" />
                      앉아서
                    </label>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-700">주별 횟수</label>
                    <input
                      type="text"
                      value={q14_frequency}
                      onChange={(e)=>setQ14_frequency(e.target.value)}
                      className="ml-2 px-3 py-1 border border-neutral-300 rounded w-24"
                      placeholder="주 __회"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-start">
                    <input type="radio" name="q14" value="1" checked={q14==='1'} onChange={(e)=>setQ14(e.target.value)} className="mt-1 mr-2" />
                    <span>① 이 닦는 것을 좋아하며 편안히 있는다.</span>
                  </label>
                  <label className="flex items-start">
                    <input type="radio" name="q14" value="2" checked={q14==='2'} onChange={(e)=>setQ14(e.target.value)} className="mt-1 mr-2" />
                    <span>② 이 닦는 것을 좋아하지만 칫솔을 씹는다.</span>
                  </label>
                  <label className="flex items-start">
                    <input type="radio" name="q14" value="3" checked={q14==='3'} onChange={(e)=>setQ14(e.target.value)} className="mt-1 mr-2" />
                    <span>③ 칫솔을 가까이하면 고개를 돌린다.</span>
                  </label>
                  <label className="flex items-start">
                    <input type="radio" name="q14" value="4" checked={q14==='4'} onChange={(e)=>setQ14(e.target.value)} className="mt-1 mr-2" />
                    <span>④ 이 닦는 것을 싫어해서 도망 다닌다.</span>
                  </label>
                  <label className="flex items-start">
                    <input type="radio" name="q14" value="5" checked={q14==='5'} onChange={(e)=>setQ14(e.target.value)} className="mt-1 mr-2" />
                    <span>⑤ 이를 닦으려고 하면 털을 세우고 공격적인 반응을 보인다.</span>
                  </label>
                  <div className="mt-2">
                    <span className="text-sm">(기타: </span>
                    <input type="text" value={q14_other} onChange={(e)=>setQ14_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                    <span className="text-sm">)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 질문 15 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q15-title">
              <h4 id="q15-title" className="font-semibold text-neutral-800 mb-3">15. 그루밍(빗질) 할 때의 품행</h4>
              <div className="ml-4 space-y-3">
                <div className="flex gap-4 items-center">
                  <div>
                    <span className="text-sm text-neutral-700 mr-2">자세:</span>
                    <label className="mr-4">
                      <input type="radio" name="q15_posture" value="누워서" checked={q15_posture==='누워서'} onChange={(e)=>setQ15_posture(e.target.value)} className="mr-1" />
                      누워서
                    </label>
                    <label>
                      <input type="radio" name="q15_posture" value="앉아서" checked={q15_posture==='앉아서'} onChange={(e)=>setQ15_posture(e.target.value)} className="mr-1" />
                      앉아서
                    </label>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-700">주별 횟수</label>
                    <input
                      type="text"
                      value={q15_frequency}
                      onChange={(e)=>setQ15_frequency(e.target.value)}
                      className="ml-2 px-3 py-1 border border-neutral-300 rounded w-24"
                      placeholder="주 __회"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-start">
                    <input type="radio" name="q15" value="1" checked={q15==='1'} onChange={(e)=>setQ15(e.target.value)} className="mt-1 mr-2" />
                    <span>① 그루밍 하는 것을 좋아하며 편안히 잘 있는다.</span>
                  </label>
                  <label className="flex items-start">
                    <input type="radio" name="q15" value="2" checked={q15==='2'} onChange={(e)=>setQ15(e.target.value)} className="mt-1 mr-2" />
                    <span>② 그루밍 하는 것을 좋아하지만 가만히 있지 못하고 자꾸 움직인다.</span>
                  </label>
                  <label className="flex items-start">
                    <input type="radio" name="q15" value="3" checked={q15==='3'} onChange={(e)=>setQ15(e.target.value)} className="mt-1 mr-2" />
                    <span>③ 고무빗을 가지고 놀려고 한다.</span>
                  </label>
                  <label className="flex items-start">
                    <input type="radio" name="q15" value="4" checked={q15==='4'} onChange={(e)=>setQ15(e.target.value)} className="mt-1 mr-2" />
                    <span>④ 반대로 자세를 바꾸는 것에 대해 거부감을 보인다.</span>
                  </label>
                  <label className="flex items-start">
                    <input type="radio" name="q15" value="5" checked={q15==='5'} onChange={(e)=>setQ15(e.target.value)} className="mt-1 mr-2" />
                    <span>⑤ 그루밍 하는 것을 싫어해서 불러도 잘 오지 않고 도망 다닌다.</span>
                  </label>
                  <label className="flex items-start">
                    <input type="radio" name="q15" value="6" checked={q15==='6'} onChange={(e)=>setQ15(e.target.value)} className="mt-1 mr-2" />
                    <span>⑥ 그루밍 하는 것을 싫어해서 빗질 도중에 이를 드러내며 입질을 한다.</span>
                  </label>
                  <div className="mt-2">
                    <span className="text-sm">(기타: </span>
                    <input type="text" value={q15_other} onChange={(e)=>setQ15_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                    <span className="text-sm">)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 질문 16 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q16-title">
              <h4 id="q16-title" className="font-semibold text-neutral-800 mb-3">16. 발톱/발털손질 할 때의 품행</h4>
              <div className="ml-4 space-y-3">
                <div className="flex gap-4 items-center">
                  <div>
                    <span className="text-sm text-neutral-700 mr-2">자세:</span>
                    <label className="mr-4">
                      <input type="radio" name="q16_posture" value="옆으로 누워" checked={q16_posture==='옆으로 누워'} onChange={(e)=>setQ16_posture(e.target.value)} className="mr-1" />
                      옆으로 누워
                    </label>
                    <label>
                      <input type="radio" name="q16_posture" value="배를 위로 향해" checked={q16_posture==='배를 위로 향해'} onChange={(e)=>setQ16_posture(e.target.value)} className="mr-1" />
                      배를 위로 향해
                    </label>
                  </div>
                  <div>
                    <label className="text-sm text-neutral-700">주별 횟수</label>
                    <input
                      type="text"
                      value={q16_frequency}
                      onChange={(e)=>setQ16_frequency(e.target.value)}
                      className="ml-2 px-3 py-1 border border-neutral-300 rounded w-24"
                      placeholder="주 __회"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-neutral-700 mb-2">① 편안하게 잘 하는 것에 표시하세요:</p>
                    <div className="ml-4 space-y-1">
                      <label className="flex items-center">
                        <input type="checkbox" checked={q16_comfortable.includes('발톱손질')} onChange={()=>handleCheckboxChange(q16_comfortable,'발톱손질',setQ16_comfortable)} className="mr-2" />
                        <span>발톱손질</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q16_comfortable.includes('발털손질')} onChange={()=>handleCheckboxChange(q16_comfortable,'발털손질',setQ16_comfortable)} className="mr-2" />
                        <span>발털손질</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-700 mb-2">② 불편해하는 부위에 표시하세요:</p>
                    <div className="ml-4 space-y-1">
                      <label className="flex items-center">
                        <input type="checkbox" checked={q16_uncomfortable.includes('앞발')} onChange={()=>handleCheckboxChange(q16_uncomfortable,'앞발',setQ16_uncomfortable)} className="mr-2" />
                        <span>앞발</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q16_uncomfortable.includes('뒷발')} onChange={()=>handleCheckboxChange(q16_uncomfortable,'뒷발',setQ16_uncomfortable)} className="mr-2" />
                        <span>뒷발</span>
                      </label>
                    </div>
                  </div>
                  <label className="flex items-start">
                    <input type="checkbox" checked={q16_options.includes('입질')} onChange={()=>handleCheckboxChange(q16_options,'입질',setQ16_options)} className="mt-1 mr-2" />
                    <span>③ 누워는 있으나 입질을 하려고 한다.</span>
                  </label>
                  <label className="flex items-start">
                    <input type="checkbox" checked={q16_options.includes('발을빼거나밀어냄')} onChange={()=>handleCheckboxChange(q16_options,'발을빼거나밀어냄',setQ16_options)} className="mt-1 mr-2" />
                    <span>④ 몸이 경직된 상태로 누워서 발을 빼거나 밀어내려고 한다.</span>
                  </label>
                  <div>
                    <label className="flex items-start">
                      <input type="checkbox" checked={q16_options.includes('도망가려함')} onChange={()=>handleCheckboxChange(q16_options,'도망가려함',setQ16_options)} className="mt-1 mr-2" />
                      <span>⑤ 불러도 잘 오지 않고 도망 가려고 한다.</span>
                    </label>
                    {q16_options.includes('도망가려함') && (
                      <div className="ml-6 mt-2">
                        <span className="text-sm text-neutral-700 mr-2">과거에 피가 난 적이 있나요?</span>
                        <label className="mr-4">
                          <input type="radio" name="q16_bleeding" value="Y" checked={q16_bleeding==='Y'} onChange={(e)=>setQ16_bleeding(e.target.value)} className="mr-1" />
                          예
                        </label>
                        <label>
                          <input type="radio" name="q16_bleeding" value="N" checked={q16_bleeding==='N'} onChange={(e)=>setQ16_bleeding(e.target.value)} className="mr-1" />
                          아니오
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-sm">(기타: </span>
                    <input type="text" value={q16_other} onChange={(e)=>setQ16_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                    <span className="text-sm">)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 질문 17 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q17-title">
              <h4 id="q17-title" className="font-semibold text-neutral-800 mb-3">17. 귀청소 할 때의 품행</h4>
              <div className="ml-4 space-y-3">
                <div>
                  <span className="text-sm text-neutral-700 mr-2">자세:</span>
                  <label className="mr-4">
                    <input type="radio" name="q17_posture" value="누워서" checked={q17_posture==='누워서'} onChange={(e)=>setQ17_posture(e.target.value)} className="mr-1" />
                    누워서
                  </label>
                  <label>
                    <input type="radio" name="q17_posture" value="앉아서" checked={q17_posture==='앉아서'} onChange={(e)=>setQ17_posture(e.target.value)} className="mr-1" />
                    앉아서
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-start">
                    <input type="radio" name="q17" value="1" checked={q17==='1'} onChange={(e)=>setQ17(e.target.value)} className="mt-1 mr-2" />
                    <span>① 편안하게 잘 받아들인다.</span>
                  </label>
                  <div>
                    <label className="flex items-start">
                      <input type="radio" name="q17" value="2" checked={q17==='2'} onChange={(e)=>setQ17(e.target.value)} className="mt-1 mr-2" />
                      <span>② 귀세정제를 가져오면 거부감을 보인다.</span>
                    </label>
                    {q17==='2' && (
                      <div className="ml-6 mt-2">
                        <label className="text-sm text-neutral-700">계기가 있나요?</label>
                        <input
                          type="text"
                          value={q17_reason}
                          onChange={(e)=>setQ17_reason(e.target.value)}
                          className="ml-2 px-3 py-1 border border-neutral-300 rounded w-full max-w-md"
                          placeholder="계기를 입력하세요"
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-sm">(기타: </span>
                    <input type="text" value={q17_other} onChange={(e)=>setQ17_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                    <span className="text-sm">)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 질문 18 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q18-title">
              <h4 id="q18-title" className="font-semibold text-neutral-800 mb-3">18. 외출 후 발을 닦을 때의 품행</h4>
              <div className="space-y-2 ml-4">
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q18" value="1" checked={q18==='1'} onChange={(e)=>setQ18(e.target.value)} className="mt-1 mr-2" />
                    <span>① 가만히 앉아서 잘 기다린다.</span>
                  </label>
                  {q18==='1' && (
                    <div className="ml-6 mt-2">
                      <span className="text-sm text-neutral-700 mr-2">트릿 사용 여부:</span>
                      <label className="mr-4">
                        <input type="radio" name="q18_treat" value="예" checked={q18_treat==='예'} onChange={(e)=>setQ18_treat(e.target.value)} className="mr-1" />
                        예
                      </label>
                      <label>
                        <input type="radio" name="q18_treat" value="아니오" checked={q18_treat==='아니오'} onChange={(e)=>setQ18_treat(e.target.value)} className="mr-1" />
                        아니오
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q18" value="2" checked={q18==='2'} onChange={(e)=>setQ18(e.target.value)} className="mt-1 mr-2" />
                    <span>② 가만 앉아는 있으나 입질을 하려고 한다.</span>
                  </label>
                  {q18==='2' && (
                    <div className="ml-6 mt-2 space-y-1">
                      <p className="text-sm text-neutral-700 mb-2">입질 대상:</p>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q18_bites.includes('손')} onChange={()=>handleCheckboxChange(q18_bites,'손',setQ18_bites)} className="mr-2" />
                        <span>손</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" checked={q18_bites.includes('물티슈')} onChange={()=>handleCheckboxChange(q18_bites,'물티슈',setQ18_bites)} className="mr-2" />
                        <span>물티슈</span>
                      </label>
                    </div>
                  )}
                </div>
                <label className="flex items-start">
                  <input type="radio" name="q18" value="3" checked={q18==='3'} onChange={(e)=>setQ18(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 닦기 싫어서 도망가거나 숨어 버린다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q18" value="4" checked={q18==='4'} onChange={(e)=>setQ18(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 으르렁 거리며 이를 드러낸다.</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q18_other} onChange={(e)=>setQ18_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 19 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q19-title">
              <h4 id="q19-title" className="font-semibold text-neutral-800 mb-3">19. 집안의 물건을 망가뜨린 적이 있나요?</h4>
              <div className="space-y-2 ml-4">
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q19" value="1" checked={q19==='1'} onChange={(e)=>setQ19(e.target.value)} className="mt-1 mr-2" />
                    <span>① 있다.</span>
                  </label>
                  {q19==='1' && (
                    <div className="ml-6 mt-2">
                      <label className="text-sm text-neutral-700">지난 한달간 횟수</label>
                      <input
                        type="text"
                        value={q19_count}
                        onChange={(e)=>setQ19_count(e.target.value)}
                        className="ml-2 px-3 py-1 border border-neutral-300 rounded w-32"
                        placeholder="예: 3회"
                      />
                    </div>
                  )}
                </div>
                <label className="flex items-start">
                  <input type="radio" name="q19" value="2" checked={q19==='2'} onChange={(e)=>setQ19(e.target.value)} className="mt-1 mr-2" />
                  <span>② 없다.</span>
                </label>
              </div>
            </div>

            {/* 질문 20 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q20-title">
              <h4 id="q20-title" className="font-semibold text-neutral-800 mb-3">20. 집에서 자녀들과 있을 때의 반응</h4>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q20" value="1" checked={q20==='1'} onChange={(e)=>setQ20(e.target.value)} className="mt-1 mr-2" />
                  <span>① 아이들이 신나서 뛰어 놀면 같이 흥분하며 뛰려고 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q20" value="2" checked={q20==='2'} onChange={(e)=>setQ20(e.target.value)} className="mt-1 mr-2" />
                  <span>② 아이들이 신나서 뛰어 놀면 관심은 보이나 얌전히 있는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q20" value="3" checked={q20==='3'} onChange={(e)=>setQ20(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 아이들에게 크게 관심 없다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q20" value="4" checked={q20==='4'} onChange={(e)=>setQ20(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 아이들이 가까이 와서 만지는 것을 별로 좋아하지 않는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q20" value="5" checked={q20==='5'} onChange={(e)=>setQ20(e.target.value)} className="mt-1 mr-2" />
                  <span>⑤ 아이들이 가까이 오면 피하며 구석으로 숨으려고 한다.</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q20_other} onChange={(e)=>setQ20_other(e.target.value)} className="border-b border-neutral-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 21 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="q21-title">
              <h4 id="q21-title" className="font-semibold text-neutral-800 mb-3">21. 현재 품행에 있어 가장 큰 문제는?</h4>
              <div className="ml-4">
                <textarea
                  value={q21}
                  onChange={(e)=>setQ21(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  rows={4}
                  placeholder="현재 품행에서 가장 큰 문제점을 자유롭게 작성해주세요."
                />
              </div>
            </div>
          </div>
            </>
          )}

          {/* Step 3: DT 품행 기록 */}
          {currentStep === 3 && (
            <>
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-neutral-800 mb-6 pb-3 border-b-2 border-primary-500">DT 품행 기록</h3>

            {/* DT 질문 1 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="dt-q1-title">
              <h4 id="dt-q1-title" className="font-semibold text-neutral-800 mb-3">1. '하나둘,하나둘' 명령어에 몇분안에 반응하나요?</h4>
              <div className="ml-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="font-medium text-neutral-700">DT1(소변)</label>
                  <input
                    type="number"
                    value={dt1_time}
                    onChange={(e)=>setDt1_time(e.target.value)}
                    className="w-24 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="분"
                    min="0"
                  />
                  <span className="text-neutral-600">분</span>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="font-medium text-neutral-700">DT2(대변)</label>
                  <input
                    type="number"
                    value={dt2_time}
                    onChange={(e)=>setDt2_time(e.target.value)}
                    className="w-24 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="분"
                    min="0"
                  />
                  <span className="text-neutral-600">분</span>
                </div>
              </div>
            </div>

            {/* DT 질문 2 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="dt-q2-title">
              <h4 id="dt-q2-title" className="font-semibold text-neutral-800 mb-3">2. 실내 배변 장소는 차단해 두었나요?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_indoor_blocked"
                    value="예"
                    checked={dt_indoor_blocked === '예'}
                    onChange={(e)=>setDt_indoor_blocked(e.target.value)}
                    className="mt-1"
                  />
                  <span>예</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_indoor_blocked"
                    value="아니오"
                    checked={dt_indoor_blocked === '아니오'}
                    onChange={(e)=>setDt_indoor_blocked(e.target.value)}
                    className="mt-1"
                  />
                  <span>아니오</span>
                </label>
              </div>
            </div>

            {/* DT 질문 3 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="dt-q3-title">
              <h4 id="dt-q3-title" className="font-semibold text-neutral-800 mb-3">3. 실내배변은 어떤 형태로 하고 있나요?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_indoor_type"
                    value="배변매트"
                    checked={dt_indoor_type === '배변매트'}
                    onChange={(e)=>setDt_indoor_type(e.target.value)}
                    className="mt-1"
                  />
                  <span>배변매트</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_indoor_type"
                    value="배변패드"
                    checked={dt_indoor_type === '배변패드'}
                    onChange={(e)=>setDt_indoor_type(e.target.value)}
                    className="mt-1"
                  />
                  <span>배변패드</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_indoor_type"
                    value="기타"
                    checked={dt_indoor_type === '기타'}
                    onChange={(e)=>setDt_indoor_type(e.target.value)}
                    className="mt-1"
                  />
                  <span>기타</span>
                </label>
              </div>
            </div>

            {/* DT 질문 4 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="dt-q4-title">
              <h4 id="dt-q4-title" className="font-semibold text-neutral-800 mb-3">4. 배변벨트 사용 여부</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_belt_type"
                    value="사용안함"
                    checked={dt_belt_type === '사용안함'}
                    onChange={(e)=>setDt_belt_type(e.target.value)}
                    className="mt-1"
                  />
                  <span>사용안함</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_belt_type"
                    value="벨트만"
                    checked={dt_belt_type === '벨트만'}
                    onChange={(e)=>setDt_belt_type(e.target.value)}
                    className="mt-1"
                  />
                  <span>벨트만</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_belt_type"
                    value="벨트+봉투"
                    checked={dt_belt_type === '벨트+봉투'}
                    onChange={(e)=>setDt_belt_type(e.target.value)}
                    className="mt-1"
                  />
                  <span>벨트+봉투</span>
                </label>
              </div>
            </div>

            {/* DT 질문 5 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="dt-q5-title">
              <h4 id="dt-q5-title" className="font-semibold text-neutral-800 mb-3">5. 배변 장소</h4>
              <div className="ml-4 space-y-4">
                <div>
                  <p className="font-medium text-neutral-700 mb-2">DT1</p>
                  <div className="ml-4 space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="dt1_location"
                        value="실내"
                        checked={dt1_location === '실내'}
                        onChange={(e)=>setDt1_location(e.target.value)}
                        className="mt-1"
                      />
                      <span>실내</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="dt1_location"
                        value="실외"
                        checked={dt1_location === '실외'}
                        onChange={(e)=>setDt1_location(e.target.value)}
                        className="mt-1"
                      />
                      <span>실외</span>
                    </label>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-neutral-700 mb-2">DT2</p>
                  <div className="ml-4 space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="dt2_location"
                        value="실내"
                        checked={dt2_location === '실내'}
                        onChange={(e)=>setDt2_location(e.target.value)}
                        className="mt-1"
                      />
                      <span>실내</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="dt2_location"
                        value="실외"
                        checked={dt2_location === '실외'}
                        onChange={(e)=>setDt2_location(e.target.value)}
                        className="mt-1"
                      />
                      <span>실외</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* DT 질문 6 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="dt-q6-title">
              <h4 id="dt-q6-title" className="font-semibold text-neutral-800 mb-3">6. 보행 도중에 DT 실수를 할 때가 있나요?</h4>
              <div className="ml-4 space-y-3">
                <div className="flex items-start space-x-4">
                  <span className="whitespace-nowrap">① 안 한다.</span>
                  <div className="space-x-4">
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dt_mistake_1_dt1}
                        onChange={(e)=>setDt_mistake_1_dt1(e.target.checked)}
                        className="mt-1"
                      />
                      <span>DT1</span>
                    </label>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dt_mistake_1_dt2}
                        onChange={(e)=>setDt_mistake_1_dt2(e.target.checked)}
                        className="mt-1"
                      />
                      <span>DT2</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <span className="whitespace-nowrap">② 주 1회 정도 한다.</span>
                  <div className="space-x-4">
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dt_mistake_2_dt1}
                        onChange={(e)=>setDt_mistake_2_dt1(e.target.checked)}
                        className="mt-1"
                      />
                      <span>DT1</span>
                    </label>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dt_mistake_2_dt2}
                        onChange={(e)=>setDt_mistake_2_dt2(e.target.checked)}
                        className="mt-1"
                      />
                      <span>DT2</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <span className="whitespace-nowrap">③ 주 2~3회 정도 한다.</span>
                  <div className="space-x-4">
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dt_mistake_3_dt1}
                        onChange={(e)=>setDt_mistake_3_dt1(e.target.checked)}
                        className="mt-1"
                      />
                      <span>DT1</span>
                    </label>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dt_mistake_3_dt2}
                        onChange={(e)=>setDt_mistake_3_dt2(e.target.checked)}
                        className="mt-1"
                      />
                      <span>DT2</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <span className="whitespace-nowrap">④ 주 4~5회 이상 한다.</span>
                  <div className="space-x-4">
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dt_mistake_4_dt1}
                        onChange={(e)=>setDt_mistake_4_dt1(e.target.checked)}
                        className="mt-1"
                      />
                      <span>DT1</span>
                    </label>
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={dt_mistake_4_dt2}
                        onChange={(e)=>setDt_mistake_4_dt2(e.target.checked)}
                        className="mt-1"
                      />
                      <span>DT2</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* DT 질문 7 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="dt-q7-title">
              <h4 id="dt-q7-title" className="font-semibold text-neutral-800 mb-3">7. 보행 전에 반드시 DT를 하고 걷나요?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={dt_before_walk_dt1}
                    onChange={(e)=>setDt_before_walk_dt1(e.target.checked)}
                    className="mt-1"
                  />
                  <span>DT1</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={dt_before_walk_dt2}
                    onChange={(e)=>setDt_before_walk_dt2(e.target.checked)}
                    className="mt-1"
                  />
                  <span>DT2</span>
                </label>
              </div>
            </div>

            {/* DT 질문 8 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="dt-q8-title">
              <h4 id="dt-q8-title" className="font-semibold text-neutral-800 mb-3">8. 보행 도중 DT를 하고 싶어할 때 특별히 보내는 신호가 있나요?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_signal"
                    value="1"
                    checked={dt_signal === '1'}
                    onChange={(e)=>setDt_signal(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 안 걸으려고 멈춰 선다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_signal"
                    value="2"
                    checked={dt_signal === '2'}
                    onChange={(e)=>setDt_signal(e.target.value)}
                    className="mt-1"
                  />
                  <span>② 길 가 쪽으로 냄새를 맡으며 사람을 끌고 간다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_signal"
                    value="3"
                    checked={dt_signal === '3'}
                    onChange={(e)=>setDt_signal(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 걸음이 느려진다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="dt_signal"
                    value="4"
                    checked={dt_signal === '4'}
                    onChange={(e)=>setDt_signal(e.target.value)}
                    className="mt-1"
                  />
                  <span>④ 걸어가면서 자연스럽게 해 버린다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="dt_signal"
                    value="기타"
                    checked={dt_signal === '기타'}
                    onChange={(e)=>setDt_signal(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {dt_signal === '기타' && (
                      <input
                        type="text"
                        value={dt_signal_other}
                        onChange={(e)=>setDt_signal_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 신호를 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* DT 질문 9 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="dt-q9-title">
              <h4 id="dt-q9-title" className="font-semibold text-neutral-800 mb-3">9. 현재 배변문제가 있다면 어떤 것이 있나요?</h4>
              <div className="ml-4">
                <textarea
                  value={dt_problems}
                  onChange={(e)=>setDt_problems(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  rows={4}
                  placeholder="현재 배변과 관련된 문제점을 자유롭게 작성해주세요."
                />
              </div>
            </div>
          </div>
            </>
          )}

          {/* Step 4: 보행 훈련 */}
          {currentStep === 4 && (
            <>
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-neutral-800 mb-6 pb-3 border-b-2 border-primary-500">보행 훈련</h3>

            {/* 보행 질문 1 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="walk-q1-title">
              <h4 id="walk-q1-title" className="font-semibold text-neutral-800 mb-3">1. 하루 평균 산책 시간은?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q1"
                    value="1"
                    checked={walk_q1 === '1'}
                    onChange={(e)=>setWalk_q1(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 2시간 이상</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q1"
                    value="2"
                    checked={walk_q1 === '2'}
                    onChange={(e)=>setWalk_q1(e.target.value)}
                    className="mt-1"
                  />
                  <span>② 1시간 이상</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q1"
                    value="3"
                    checked={walk_q1 === '3'}
                    onChange={(e)=>setWalk_q1(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 30분 이상</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q1"
                    value="4"
                    checked={walk_q1 === '4'}
                    onChange={(e)=>setWalk_q1(e.target.value)}
                    className="mt-1"
                  />
                  <span>④ 안 하는 날도 있다.</span>
                </label>
              </div>
            </div>

            {/* 보행 질문 2 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="walk-q2-title">
              <h4 id="walk-q2-title" className="font-semibold text-neutral-800 mb-3">2. 주로 산책하는 시간을 적어주세요(예: 아침, 점심, 10시 등)</h4>
              <div className="ml-4">
                <input
                  type="text"
                  value={walk_q2}
                  onChange={(e)=>setWalk_q2(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  placeholder="예: 아침 7시, 저녁 6시"
                />
              </div>
            </div>

            {/* 보행 질문 3 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="walk-q3-title">
              <h4 id="walk-q3-title" className="font-semibold text-neutral-800 mb-3">3. 코트/견줄 착용시 강아지의 반응은?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q3"
                    value="1"
                    checked={walk_q3 === '1'}
                    onChange={(e)=>setWalk_q3(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 코트와 견줄을 착용할 때까지 가만히 앉아서 잘 기다린다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q3"
                    value="2"
                    checked={walk_q3 === '2'}
                    onChange={(e)=>setWalk_q3(e.target.value)}
                    className="mt-1"
                  />
                  <span>② 흥분하고 점프하여 얌전히 입히기 힘들다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q3"
                    value="3"
                    checked={walk_q3 === '3'}
                    onChange={(e)=>setWalk_q3(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 코트/견줄 착용에는 거부감이 있으나 나가서는 잘 걷는다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q3"
                    value="4"
                    checked={walk_q3 === '4'}
                    onChange={(e)=>setWalk_q3(e.target.value)}
                    className="mt-1"
                  />
                  <span>④ 코트/견줄 착용에 거부감이 있고 나가서도 좋아하지 않는다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="walk_q3"
                    value="기타"
                    checked={walk_q3 === '기타'}
                    onChange={(e)=>setWalk_q3(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {walk_q3 === '기타' && (
                      <input
                        type="text"
                        value={walk_q3_other}
                        onChange={(e)=>setWalk_q3_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 반응을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 보행 질문 4 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="walk-q4-title">
              <h4 id="walk-q4-title" className="font-semibold text-neutral-800 mb-3">4. 현재 헤드칼라를 사용하고 있나요?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q4"
                    value="1"
                    checked={walk_q4 === '1'}
                    onChange={(e)=>setWalk_q4(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 매번 사용</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q4"
                    value="2"
                    checked={walk_q4 === '2'}
                    onChange={(e)=>setWalk_q4(e.target.value)}
                    className="mt-1"
                  />
                  <span>② 가끔 사용</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q4"
                    value="3"
                    checked={walk_q4 === '3'}
                    onChange={(e)=>setWalk_q4(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 사용하지 않는다.</span>
                </label>
              </div>
            </div>

            {/* 보행 질문 5 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="walk-q5-title">
              <h4 id="walk-q5-title" className="font-semibold text-neutral-800 mb-3">5. 보행 시 트릿 사용 여부</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q5"
                    value="1"
                    checked={walk_q5 === '1'}
                    onChange={(e)=>setWalk_q5(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 보행도중 지속적으로 사용한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q5"
                    value="2"
                    checked={walk_q5 === '2'}
                    onChange={(e)=>setWalk_q5(e.target.value)}
                    className="mt-1"
                  />
                  <span>② 특별한 경우에만 사용한다. (에스컬레이터, 견유혹 컨트롤 등)</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q5"
                    value="3"
                    checked={walk_q5 === '3'}
                    onChange={(e)=>setWalk_q5(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 사용하지 않는다.</span>
                </label>
              </div>
            </div>

            {/* 보행 질문 6 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="walk-q6-title">
              <h4 id="walk-q6-title" className="font-semibold text-neutral-800 mb-3">6. 산책 시 강아지의 빠르기는?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q6"
                    value="1"
                    checked={walk_q6 === '1'}
                    onChange={(e)=>setWalk_q6(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 나보다 앞서 걷지만 줄은 느슨하게 나와 보조를 맞추려고 노력한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q6"
                    value="2"
                    checked={walk_q6 === '2'}
                    onChange={(e)=>setWalk_q6(e.target.value)}
                    className="mt-1"
                  />
                  <span>② 나를 고려하지 않고 줄이 팽팽할 정도로 앞으로 당긴다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q6"
                    value="3"
                    checked={walk_q6 === '3'}
                    onChange={(e)=>setWalk_q6(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 내 옆에 바로 붙어 보행한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q6"
                    value="4"
                    checked={walk_q6 === '4'}
                    onChange={(e)=>setWalk_q6(e.target.value)}
                    className="mt-1"
                  />
                  <span>④ 뒤쪽으로 자꾸 쳐진다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q6"
                    value="5"
                    checked={walk_q6 === '5'}
                    onChange={(e)=>setWalk_q6(e.target.value)}
                    className="mt-1"
                  />
                  <span>⑤ 속도가 일정하지 않다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="walk_q6"
                    value="기타"
                    checked={walk_q6 === '기타'}
                    onChange={(e)=>setWalk_q6(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {walk_q6 === '기타' && (
                      <input
                        type="text"
                        value={walk_q6_other}
                        onChange={(e)=>setWalk_q6_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 반응을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 보행 질문 7 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="walk-q7-title">
              <h4 id="walk-q7-title" className="font-semibold text-neutral-800 mb-3">7. 산책 시 강아지의 행동은?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q7"
                    value="1"
                    checked={walk_q7 === '1'}
                    onChange={(e)=>setWalk_q7(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 이따금 나를 살피며 똑바로 잘 걷는다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q7"
                    value="2"
                    checked={walk_q7 === '2'}
                    onChange={(e)=>setWalk_q7(e.target.value)}
                    className="mt-1"
                  />
                  <span>② 나에게 너무 집중해서 몸이 사선으로 치우친다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q7"
                    value="3"
                    checked={walk_q7 === '3'}
                    onChange={(e)=>setWalk_q7(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 나에게 전혀 관심이 없고 계속 주변을 두리번 거린다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q7"
                    value="4"
                    checked={walk_q7 === '4'}
                    onChange={(e)=>setWalk_q7(e.target.value)}
                    className="mt-1"
                  />
                  <span>④ 나에게 전혀 관심이 없고 계속 냄새만 맡으려고 한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q7"
                    value="5"
                    checked={walk_q7 === '5'}
                    onChange={(e)=>setWalk_q7(e.target.value)}
                    className="mt-1"
                  />
                  <span>⑤ 땅에 떨어져있는 것을 계속 주워먹으려고 한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="walk_q7"
                    value="6"
                    checked={walk_q7 === '6'}
                    onChange={(e)=>setWalk_q7(e.target.value)}
                    className="mt-1"
                  />
                  <span>⑥ 보행도중 앉거나 서서 안가려고 버틴다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="walk_q7"
                    value="기타"
                    checked={walk_q7 === '기타'}
                    onChange={(e)=>setWalk_q7(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {walk_q7 === '기타' && (
                      <input
                        type="text"
                        value={walk_q7_other}
                        onChange={(e)=>setWalk_q7_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 행동을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 보행 질문 8 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="walk-q8-title">
              <h4 id="walk-q8-title" className="font-semibold text-neutral-800 mb-3">8. 강아지나 고양이, 새 등을 만났을 때의 행동은? (유혹 순위별로 표시)</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q8.includes('1')}
                    onChange={(e)=>handleCheckboxChange(walk_q8, '1', setWalk_q8)}
                    className="mt-1"
                  />
                  <span>① 전혀 관심 없다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q8.includes('2')}
                    onChange={(e)=>handleCheckboxChange(walk_q8, '2', setWalk_q8)}
                    className="mt-1"
                  />
                  <span>② 관심을 보이나 우두커니 서 있다가 곧 나에게 관심을 돌린다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q8.includes('3')}
                    onChange={(e)=>handleCheckboxChange(walk_q8, '3', setWalk_q8)}
                    className="mt-1"
                  />
                  <span>③ 마구 흥분하며 무조건 다가가려고 힘을 쓴다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q8.includes('4')}
                    onChange={(e)=>handleCheckboxChange(walk_q8, '4', setWalk_q8)}
                    className="mt-1"
                  />
                  <span>④ 멀리서 발견하면 앞다리 자세를 낮추며 플레이 하려는 자세를 취한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q8.includes('5')}
                    onChange={(e)=>handleCheckboxChange(walk_q8, '5', setWalk_q8)}
                    className="mt-1"
                  />
                  <span>⑤ 다가오면 무서워서 도망가려 한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q8.includes('6')}
                    onChange={(e)=>handleCheckboxChange(walk_q8, '6', setWalk_q8)}
                    className="mt-1"
                  />
                  <span>⑥ 다가오면 털을 세우고 약간 공격적으로 행동한다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q8.includes('기타')}
                    onChange={(e)=>handleCheckboxChange(walk_q8, '기타', setWalk_q8)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {walk_q8.includes('기타') && (
                      <input
                        type="text"
                        value={walk_q8_other}
                        onChange={(e)=>setWalk_q8_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 행동을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 보행 질문 9 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="walk-q9-title">
              <h4 id="walk-q9-title" className="font-semibold text-neutral-800 mb-3">9. 산책 시 사람을 만났을 때 행동은?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q9.includes('1')}
                    onChange={(e)=>handleCheckboxChange(walk_q9, '1', setWalk_q9)}
                    className="mt-1"
                  />
                  <span>① 전혀 관심 없다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q9.includes('2')}
                    onChange={(e)=>handleCheckboxChange(walk_q9, '2', setWalk_q9)}
                    className="mt-1"
                  />
                  <span>② 개에게 관심을 보이는 사람에게 흥분하거나 점프한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q9.includes('3')}
                    onChange={(e)=>handleCheckboxChange(walk_q9, '3', setWalk_q9)}
                    className="mt-1"
                  />
                  <span>③ 지나가는 사람의 손이나 들고있는 물건에 입을 대려고 한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q9.includes('4')}
                    onChange={(e)=>handleCheckboxChange(walk_q9, '4', setWalk_q9)}
                    className="mt-1"
                  />
                  <span>④ 아이들에게 관심을 많이 보인다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q9.includes('5')}
                    onChange={(e)=>handleCheckboxChange(walk_q9, '5', setWalk_q9)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>⑤ 특정 사람에게 무서워하는 반응을 보인다. (대상:</span>
                    {walk_q9.includes('5') && (
                      <input
                        type="text"
                        value={walk_q9_target}
                        onChange={(e)=>setWalk_q9_target(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-48 inline-block"
                        placeholder="예: 노인, 어린이 등"
                      />
                    )}
                    <span>)</span>
                  </div>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={walk_q9.includes('기타')}
                    onChange={(e)=>handleCheckboxChange(walk_q9, '기타', setWalk_q9)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {walk_q9.includes('기타') && (
                      <input
                        type="text"
                        value={walk_q9_other}
                        onChange={(e)=>setWalk_q9_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 행동을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 보행 질문 10 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="walk-q10-title">
              <h4 id="walk-q10-title" className="font-semibold text-neutral-800 mb-3">10. 산책 시 짖거나 으르렁 거림, 꼬리 내림, 자세 낮춤, 갑자기 날뜀 등의 반응을 보인 물체 혹은 소리가 있다면 기록해 주세요.</h4>
              <div className="ml-4">
                <textarea
                  value={walk_q10}
                  onChange={(e)=>setWalk_q10(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  rows={4}
                  placeholder="반응을 보인 물체나 소리를 자유롭게 작성해주세요."
                />
              </div>
            </div>

            {/* 보행 질문 11 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="walk-q11-title">
              <h4 id="walk-q11-title" className="font-semibold text-neutral-800 mb-3">11. 산책 시 강아지가 크게 관심을 보이는 대상을 모두 적어 주세요.</h4>
              <div className="ml-4">
                <textarea
                  value={walk_q11}
                  onChange={(e)=>setWalk_q11(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  rows={4}
                  placeholder="강아지가 관심을 보이는 대상을 자유롭게 작성해주세요."
                />
              </div>
            </div>
          </div>
            </>
          )}

          {/* Step 5: 사회화 훈련 */}
          {currentStep === 5 && (
            <>
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-neutral-800 mb-6 pb-3 border-b-2 border-primary-500">사회화 훈련</h3>

            {/* 사회화 질문 1 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="social-q1-title">
              <h4 id="social-q1-title" className="font-semibold text-neutral-800 mb-3">1. 지난 한 달간 가본 곳을 모두 적어 주세요</h4>
              <div className="ml-4">
                <textarea
                  value={social_q1}
                  onChange={(e)=>setSocial_q1(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  rows={4}
                  placeholder="지난 한 달간 방문한 장소를 자유롭게 작성해주세요."
                />
              </div>
            </div>

            {/* 사회화 질문 2 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="social-q2-title">
              <h4 id="social-q2-title" className="font-semibold text-neutral-800 mb-3">2. 매일 하는 산책 이외에 일주일에 몇 번 정도 사회화 훈련을 하나요?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q2"
                    value="1"
                    checked={social_q2 === '1'}
                    onChange={(e)=>setSocial_q2(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 1회 미만</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q2"
                    value="2"
                    checked={social_q2 === '2'}
                    onChange={(e)=>setSocial_q2(e.target.value)}
                    className="mt-1"
                  />
                  <span>② 2~3 회</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q2"
                    value="3"
                    checked={social_q2 === '3'}
                    onChange={(e)=>setSocial_q2(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 4~5 회</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q2"
                    value="4"
                    checked={social_q2 === '4'}
                    onChange={(e)=>setSocial_q2(e.target.value)}
                    className="mt-1"
                  />
                  <span>④ 6회 이상</span>
                </label>
              </div>
            </div>

            {/* 사회화 질문 3 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="social-q3-title">
              <h4 id="social-q3-title" className="font-semibold text-neutral-800 mb-3">3. 사람이 많고 복잡한 곳에 방문했을 때 강아지의 반응은?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q3"
                    value="1"
                    checked={social_q3 === '1'}
                    onChange={(e)=>setSocial_q3(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 평소와 크게 다르지 않다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q3"
                    value="2"
                    checked={social_q3 === '2'}
                    onChange={(e)=>setSocial_q3(e.target.value)}
                    className="mt-1"
                  />
                  <span>② 평소보다 많이 흥분하며 지나가는 사람들에게 관심을 많이 보인다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q3"
                    value="3"
                    checked={social_q3 === '3'}
                    onChange={(e)=>setSocial_q3(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 여유없이 서두르며 직진한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q3"
                    value="4"
                    checked={social_q3 === '4'}
                    onChange={(e)=>setSocial_q3(e.target.value)}
                    className="mt-1"
                  />
                  <span>④ 평소보다 유난히 행동이 줄어들어 보인다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q3"
                    value="5"
                    checked={social_q3 === '5'}
                    onChange={(e)=>setSocial_q3(e.target.value)}
                    className="mt-1"
                  />
                  <span>⑤ 벽으로 붙어서 걸으려고 한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q3"
                    value="6"
                    checked={social_q3 === '6'}
                    onChange={(e)=>setSocial_q3(e.target.value)}
                    className="mt-1"
                  />
                  <span>⑥ DT1 실수가 잦다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="social_q3"
                    value="기타"
                    checked={social_q3 === '기타'}
                    onChange={(e)=>setSocial_q3(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {social_q3 === '기타' && (
                      <input
                        type="text"
                        value={social_q3_other}
                        onChange={(e)=>setSocial_q3_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 반응을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 사회화 질문 4 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="social-q4-title">
              <h4 id="social-q4-title" className="font-semibold text-neutral-800 mb-3">4. 계단을 오르내릴 때 특징이 있나요?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q4"
                    value="1"
                    checked={social_q4 === '1'}
                    onChange={(e)=>setSocial_q4(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 특별히 문제 없이 보조를 맞춰 잘 다닌다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q4"
                    value="2"
                    checked={social_q4 === '2'}
                    onChange={(e)=>setSocial_q4(e.target.value)}
                    className="mt-1"
                  />
                  <span>② 항상 너무 서두른다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q4"
                    value="3"
                    checked={social_q4 === '3'}
                    onChange={(e)=>setSocial_q4(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 거의 끝에 가서는 서둘러 걷는다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q4"
                    value="4"
                    checked={social_q4 === '4'}
                    onChange={(e)=>setSocial_q4(e.target.value)}
                    className="mt-1"
                  />
                  <span>④ 사람 뒤쪽에서 걸으려고 한다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="social_q4"
                    value="기타"
                    checked={social_q4 === '기타'}
                    onChange={(e)=>setSocial_q4(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {social_q4 === '기타' && (
                      <input
                        type="text"
                        value={social_q4_other}
                        onChange={(e)=>setSocial_q4_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 특징을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 사회화 질문 5 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="social-q5-title">
              <h4 id="social-q5-title" className="font-semibold text-neutral-800 mb-3">5. 에스컬레이터를 이용할 때 특징이 있나요? (이용한 경험이 있을 때만 체크)</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q5"
                    value="1"
                    checked={social_q5 === '1'}
                    onChange={(e)=>setSocial_q5(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 편안하게 잘 탄다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="social_q5"
                    value="2"
                    checked={social_q5 === '2'}
                    onChange={(e)=>setSocial_q5(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>②</span>
                    {social_q5 === '2' && (
                      <input
                        type="text"
                        value={social_q5_direction}
                        onChange={(e)=>setSocial_q5_direction(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-48 inline-block"
                        placeholder="상행선/하행선"
                      />
                    )}
                    <span className="ml-1">을 두려워 한다.</span>
                  </div>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q5"
                    value="3"
                    checked={social_q5 === '3'}
                    onChange={(e)=>setSocial_q5(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 안정적으로 타나 내릴 때는 서두른다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q5"
                    value="4"
                    checked={social_q5 === '4'}
                    onChange={(e)=>setSocial_q5(e.target.value)}
                    className="mt-1"
                  />
                  <span>④ 잘 타지만, 타 있는 동안 움직인다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q5"
                    value="5"
                    checked={social_q5 === '5'}
                    onChange={(e)=>setSocial_q5(e.target.value)}
                    className="mt-1"
                  />
                  <span>⑤ 안타려고 버틴다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="social_q5"
                    value="기타"
                    checked={social_q5 === '기타'}
                    onChange={(e)=>setSocial_q5(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {social_q5 === '기타' && (
                      <input
                        type="text"
                        value={social_q5_other}
                        onChange={(e)=>setSocial_q5_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 특징을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 사회화 질문 6 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="social-q6-title">
              <h4 id="social-q6-title" className="font-semibold text-neutral-800 mb-3">6. 승용차를 이용할 때 특징이 있나요?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q6"
                    value="1"
                    checked={social_q6 === '1'}
                    onChange={(e)=>setSocial_q6(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 편안하게 잘 타고 내리고, 운행중에도 편안하게 쉰다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q6"
                    value="2"
                    checked={social_q6 === '2'}
                    onChange={(e)=>setSocial_q6(e.target.value)}
                    className="mt-1"
                  />
                  <span>② 편안하게 잘 타고 내리지만, 운행중에는 쉬지 못하고 자꾸 일어난다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q6"
                    value="3"
                    checked={social_q6 === '3'}
                    onChange={(e)=>setSocial_q6(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 운행중에는 편안하게 잘 있지만, 타고 내릴때 주저하거나 도와줘야 한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q6"
                    value="4"
                    checked={social_q6 === '4'}
                    onChange={(e)=>setSocial_q6(e.target.value)}
                    className="mt-1"
                  />
                  <span>④ 타고 내릴때 주저하거나 도와줘야 하고, 운행중에도 편안하게 쉬지 못한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q6"
                    value="5"
                    checked={social_q6 === '5'}
                    onChange={(e)=>setSocial_q6(e.target.value)}
                    className="mt-1"
                  />
                  <span>⑤ 시트 위로 올라가려고 한다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="social_q6"
                    value="기타"
                    checked={social_q6 === '기타'}
                    onChange={(e)=>setSocial_q6(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {social_q6 === '기타' && (
                      <input
                        type="text"
                        value={social_q6_other}
                        onChange={(e)=>setSocial_q6_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 특징을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 사회화 질문 7 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="social-q7-title">
              <h4 id="social-q7-title" className="font-semibold text-neutral-800 mb-3">7. 버스를 이용할 때 특징이 있나요? (이용한 경험이 있을 때만 체크)</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q7"
                    value="1"
                    checked={social_q7 === '1'}
                    onChange={(e)=>setSocial_q7(e.target.value)}
                    className="mt-1"
                  />
                  <span>① 편안하게 잘 탄다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="social_q7"
                    value="2"
                    checked={social_q7 === '2'}
                    onChange={(e)=>setSocial_q7(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>②</span>
                    {social_q7 === '2' && (
                      <input
                        type="text"
                        value={social_q7_when}
                        onChange={(e)=>setSocial_q7_when(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-48 inline-block"
                        placeholder="탈 때/내릴 때"
                      />
                    )}
                    <span className="ml-1">두려워 한다.</span>
                  </div>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q7"
                    value="3"
                    checked={social_q7 === '3'}
                    onChange={(e)=>setSocial_q7(e.target.value)}
                    className="mt-1"
                  />
                  <span>③ 타는 건 문제 없으나 버스가 흔들리면 불안해 한다. (낑낑, 자꾸 일어남, 혀쩝쩝 등)</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q7"
                    value="4"
                    checked={social_q7 === '4'}
                    onChange={(e)=>setSocial_q7(e.target.value)}
                    className="mt-1"
                  />
                  <span>④ 문이 열릴때마다 움직인다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="social_q7"
                    value="5"
                    checked={social_q7 === '5'}
                    onChange={(e)=>setSocial_q7(e.target.value)}
                    className="mt-1"
                  />
                  <span>⑤ 무서워서 안타려고 한다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="radio"
                    name="social_q7"
                    value="기타"
                    checked={social_q7 === '기타'}
                    onChange={(e)=>setSocial_q7(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {social_q7 === '기타' && (
                      <input
                        type="text"
                        value={social_q7_other}
                        onChange={(e)=>setSocial_q7_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 특징을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 사회화 질문 8 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="social-q8-title">
              <h4 id="social-q8-title" className="font-semibold text-neutral-800 mb-3">8. 지하철을 이용할 때 특징이 있나요? (이용한 경험이 있을 때만 체크)</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q8.includes('1')}
                    onChange={(e)=>handleCheckboxChange(social_q8, '1', setSocial_q8)}
                    className="mt-1"
                  />
                  <span>① 개찰구 통과할때 주저함이나 싫어함이 있다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q8.includes('2')}
                    onChange={(e)=>handleCheckboxChange(social_q8, '2', setSocial_q8)}
                    className="mt-1"
                  />
                  <span>② 편안하게 잘 탄다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q8.includes('3')}
                    onChange={(e)=>handleCheckboxChange(social_q8, '3', setSocial_q8)}
                    className="mt-1"
                  />
                  <span>③ 지하철이 들어올 때 나는 소음에 긴장한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q8.includes('4')}
                    onChange={(e)=>handleCheckboxChange(social_q8, '4', setSocial_q8)}
                    className="mt-1"
                  />
                  <span>④ 타는 건 문제 없으나 지하철의 흔들림에 불안해 한다. (낑낑, 자꾸 일어남, 혀쩝쩝 등)</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q8.includes('5')}
                    onChange={(e)=>handleCheckboxChange(social_q8, '5', setSocial_q8)}
                    className="mt-1"
                  />
                  <span>⑤ 문이 열릴때마다 움직인다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q8.includes('6')}
                    onChange={(e)=>handleCheckboxChange(social_q8, '6', setSocial_q8)}
                    className="mt-1"
                  />
                  <span>⑥ 무서워서 안타려고 한다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q8.includes('기타')}
                    onChange={(e)=>handleCheckboxChange(social_q8, '기타', setSocial_q8)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {social_q8.includes('기타') && (
                      <input
                        type="text"
                        value={social_q8_other}
                        onChange={(e)=>setSocial_q8_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 특징을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 사회화 질문 9 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="social-q9-title">
              <h4 id="social-q9-title" className="font-semibold text-neutral-800 mb-3">9. 카페나 식당에서 기다릴때 특징이 있나요?</h4>
              <div className="ml-4 space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q9.includes('1')}
                    onChange={(e)=>handleCheckboxChange(social_q9, '1', setSocial_q9)}
                    className="mt-1"
                  />
                  <span>① 지정된 자리에서 움직임 없이 잘 쉬면서 기다린다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q9.includes('2')}
                    onChange={(e)=>handleCheckboxChange(social_q9, '2', setSocial_q9)}
                    className="mt-1"
                  />
                  <span>② 지정된 자리에 있으나 바닥 냄새를 맡거나 핥는다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q9.includes('3')}
                    onChange={(e)=>handleCheckboxChange(social_q9, '3', setSocial_q9)}
                    className="mt-1"
                  />
                  <span>③ 나를 보고 요구하듯 짖는다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q9.includes('4')}
                    onChange={(e)=>handleCheckboxChange(social_q9, '4', setSocial_q9)}
                    className="mt-1"
                  />
                  <span>④ 테이블 위 냄새를 맡는 등의 행동을 보인다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q9.includes('5')}
                    onChange={(e)=>handleCheckboxChange(social_q9, '5', setSocial_q9)}
                    className="mt-1"
                  />
                  <span>⑤ 잘 기다리지 못하고 움직여서 자세를 잡아줘야 한다.</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q9.includes('6')}
                    onChange={(e)=>handleCheckboxChange(social_q9, '6', setSocial_q9)}
                    className="mt-1"
                  />
                  <span>⑥ 계속 트릿을 요구한다.</span>
                </label>
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={social_q9.includes('기타')}
                    onChange={(e)=>handleCheckboxChange(social_q9, '기타', setSocial_q9)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <span>기타:</span>
                    {social_q9.includes('기타') && (
                      <input
                        type="text"
                        value={social_q9_other}
                        onChange={(e)=>setSocial_q9_other(e.target.value)}
                        className="ml-2 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none w-full mt-2"
                        placeholder="기타 특징을 입력해주세요"
                      />
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* 사회화 질문 10 */}
            <div className="bg-neutral-50 p-4 rounded mb-4" role="group" aria-labelledby="social-q10-title">
              <h4 id="social-q10-title" className="font-semibold text-neutral-800 mb-3">10. 사회화 훈련을 하며 어려운 점이 있었나요?</h4>
              <div className="ml-4">
                <textarea
                  value={social_q10}
                  onChange={(e)=>setSocial_q10(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  rows={4}
                  placeholder="사회화 훈련 중 어려운 점을 자유롭게 작성해주세요."
                />
              </div>
            </div>
          </div>
            </>
          )}

          {/* 버튼 영역 */}
          <div className="flex justify-between items-center sticky bottom-0 bg-white pt-6 border-t mt-8">
            <div className="flex space-x-4">
              {(currentStep === 2 || currentStep === 3 || currentStep === 4 || currentStep === 5) && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={status === 'completed'}
                  className="bg-neutral-300 hover:bg-neutral-400 text-neutral-800 font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← 이전
                </button>
              )}
            </div>

            <div className="flex space-x-4">
              {currentStep === 1 && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={status === 'completed'}
                    className="bg-warning-500 hover:bg-warning-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    중간 저장
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={status === 'completed'}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음 →
                  </button>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={status === 'completed'}
                    className="bg-warning-500 hover:bg-warning-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    중간 저장
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={status === 'completed'}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음 →
                  </button>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={status === 'completed'}
                    className="bg-warning-500 hover:bg-warning-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    중간 저장
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={status === 'completed'}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음 →
                  </button>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={status === 'completed'}
                    className="bg-warning-500 hover:bg-warning-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    중간 저장
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={status === 'completed'}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음 →
                  </button>
                </>
              )}

              {currentStep === 5 && (
                <>
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={status === 'completed'}
                    className="bg-warning-500 hover:bg-warning-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    중간 저장
                  </button>
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={status === 'completed'}
                    className="bg-success-600 hover:bg-success-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    완료
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }

  // 상세보기 모달 열기
  const openDetailView = (report: MonthlyReport) => {
    setViewingReport(report);
    // 기존 피드백이 있으면 로드
    if ((report as any).feedback) {
      setFeedbackText((report as any).feedback);
    } else {
      setFeedbackText('');
    }
  };

  // 상세보기 모달 닫기
  const closeDetailView = () => {
    setViewingReport(null);
    setFeedbackText(''); // 피드백 텍스트 초기화
  };

  // 피드백 저장
  const saveFeedback = async (reportId: string) => {
    if (!feedbackText.trim()) {
      alert('피드백 내용을 입력하세요.');
      return;
    }

    try {
      // 기존 보고서 데이터 가져오기
      const reportToUpdate = reports.find(r => r.id === reportId);
      if (!reportToUpdate) {
        alert('보고서를 찾을 수 없습니다.');
        return;
      }

      // 피드백 정보와 함께 업데이트
      const updatedReport: MonthlyReport = {
        ...reportToUpdate,
        feedback: feedbackText,
        feedbackAuthor: user?.name || '관리자',
        feedbackDate: new Date().toISOString(),
      };

      await saveMonthlyReport(updatedReport);
      alert('피드백이 저장되었습니다.');

      // 보고서 목록 다시 로드
      await loadReports();

      // 상세보기 업데이트
      setViewingReport(updatedReport);
      setFeedbackText('');
    } catch (error) {
      console.error('피드백 저장 실패:', error);
      alert('피드백 저장에 실패했습니다.');
    }
  };

  // 비교 모드 토글
  const toggleCompareMode = () => {
    if (isComparing) {
      setSelectedReportIds([]);
    }
    setIsComparing(!isComparing);
  };

  // 체크박스 토글
  const toggleReportSelection = (reportId: string) => {
    if (selectedReportIds.includes(reportId)) {
      setSelectedReportIds(selectedReportIds.filter(id => id !== reportId));
    } else {
      setSelectedReportIds([...selectedReportIds, reportId]);
    }
  };

  // 관리자 목록 뷰
  if (user?.role === 'admin') {
    return (
      <div className="max-w-7xl mx-auto">
        {/* 필터 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-neutral-800 mb-4">필터</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 년도 필터 */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">년도</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">전체</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>

            {/* 월 필터 */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">월</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">전체</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = String(i + 1).padStart(2, '0');
                  return (
                    <option key={month} value={`${filterYear !== 'all' ? filterYear : '2025'}-${month}`}>
                      {i + 1}월
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 시작 날짜 */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">시작 날짜</label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* 종료 날짜 */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">종료 날짜</label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* 비교 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-800">
            월간 보고서 목록 ({reports.length}건)
          </h2>
          <div className="space-x-4">
            <button
              onClick={toggleCompareMode}
              className={`${
                isComparing ? 'bg-neutral-600' : 'bg-primary-600'
              } hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors`}
            >
              {isComparing ? '비교 취소' : '비교 모드'}
            </button>
            {isComparing && selectedReportIds.length >= 2 && (
              <button
                onClick={() => setShowComparisonTable(true)}
                className="bg-success-600 hover:bg-success-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                비교하기 ({selectedReportIds.length}개)
              </button>
            )}
          </div>
        </div>

        {/* 목록 */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-neutral-500">작성된 월간 보고서가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  {/* 체크박스 (비교 모드) */}
                  {isComparing && (
                    <input
                      type="checkbox"
                      checked={selectedReportIds.includes(report.id)}
                      onChange={() => toggleReportSelection(report.id)}
                      className="mt-1 w-5 h-5"
                    />
                  )}

                  {/* 내용 */}
                  <div className="flex-1">
                    <button
                      onClick={() => openDetailView(report)}
                      className="text-xl font-bold text-primary-600 hover:text-primary-800 underline text-left"
                      aria-label={`${report.reportMonth} 월간 보고서, 견명 ${report.dogName}, 퍼피티처 ${report.userName}, 상태 ${report.status === 'completed' ? '완료' : '임시저장'}`}
                    >
                      {report.reportMonth} 월간 보고서
                    </button>
                    <div className="flex items-center text-sm text-neutral-600 space-x-4 mt-2">
                      <span>견명: {report.dogName}</span>
                      <span>퍼피티처: {report.userName}</span>
                      <span>작성일: {formatDate(report.createdAt)}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        report.status === 'completed'
                          ? 'bg-success-100 text-success-800'
                          : 'bg-warning-100 text-warning-800'
                      }`}>
                        {report.status === 'completed' ? '완료' : '임시저장'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 비교 테이블 모달 */}
        {showComparisonTable && (() => {
          const selectedReports = reports.filter(r => selectedReportIds.includes(r.id));

          // 필드 렌더링 헬퍼 함수
          const renderComparisonRow = (label: string, fieldName: string) => {
            const hasValue = selectedReports.some(report => {
              const value = (report as any)[fieldName];
              return value !== undefined && value !== null && value !== '';
            });
            if (!hasValue) return null;

            return (
              <tr className="hover:bg-neutral-50">
                <td className="border border-neutral-300 p-3 font-semibold bg-neutral-50 sticky left-0 min-w-[200px]">
                  {label}
                </td>
                {selectedReports.map(report => {
                  const value = (report as any)[fieldName];
                  let displayValue;
                  if (Array.isArray(value)) {
                    displayValue = value.join(', ');
                  } else if (typeof value === 'boolean') {
                    displayValue = value ? '예' : '아니오';
                  } else if (value) {
                    // getAnswerText를 사용하여 매핑 시도
                    displayValue = getAnswerText(fieldName, value);
                  } else {
                    displayValue = '-';
                  }
                  return (
                    <td key={report.id} className="border border-neutral-300 p-3">
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            );
          };

          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex justify-between items-center z-10">
                  <h3 className="text-2xl font-bold text-neutral-800">
                    보고서 비교 ({selectedReports.length}개)
                  </h3>
                  <button
                    onClick={() => setShowComparisonTable(false)}
                    className="text-neutral-600 hover:text-neutral-800 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>

                {/* 기본 정보 */}
                <div className="p-6 bg-neutral-50 border-b border-neutral-200">
                  <h4 className="text-lg font-bold text-neutral-800 mb-4">기본 정보</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-neutral-100">
                          <th className="border border-neutral-300 p-3 text-left font-semibold sticky left-0 bg-neutral-100 min-w-[200px]">
                            항목
                          </th>
                          {selectedReports.map(report => (
                            <th key={report.id} className="border border-neutral-300 p-3 text-left font-semibold min-w-[200px]">
                              {report.dogName}_{report.userName}
                              <div className="text-xs font-normal text-neutral-600 mt-1">
                                {report.reportMonth}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {renderComparisonRow('사료 종류', 'foodType')}
                        {renderComparisonRow('1일 급식 횟수', 'dailyFeedingCount')}
                        {renderComparisonRow('1회 급식량', 'feedingAmountPerMeal')}
                        {renderComparisonRow('체중', 'weight')}
                        {renderComparisonRow('건강상 특이사항', 'healthNotes')}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 탭 버튼 */}
                <div className="border-b border-neutral-200 sticky top-[88px] bg-white z-10">
                  <div className="flex space-x-1 p-2" role="tablist">
                    <button
                      role="tab"
                      aria-selected={comparisonTab === 'home'}
                      onClick={() => setComparisonTab('home')}
                      className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                        comparisonTab === 'home'
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      집에서의 품행
                    </button>
                    <button
                      role="tab"
                      aria-selected={comparisonTab === 'dt'}
                      onClick={() => setComparisonTab('dt')}
                      className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                        comparisonTab === 'dt'
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      DT 품행 기록
                    </button>
                    <button
                      role="tab"
                      aria-selected={comparisonTab === 'walk'}
                      onClick={() => setComparisonTab('walk')}
                      className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                        comparisonTab === 'walk'
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      보행 훈련
                    </button>
                    <button
                      role="tab"
                      aria-selected={comparisonTab === 'social'}
                      onClick={() => setComparisonTab('social')}
                      className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                        comparisonTab === 'social'
                          ? 'bg-primary-600 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                      }`}
                    >
                      사회화 훈련
                    </button>
                  </div>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="p-6" role="tabpanel">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-neutral-100">
                          <th className="border border-neutral-300 p-3 text-left font-semibold sticky left-0 bg-neutral-100 min-w-[250px]">
                            질문
                          </th>
                          {selectedReports.map(report => (
                            <th key={report.id} className="border border-neutral-300 p-3 text-left font-semibold min-w-[200px]">
                              {report.dogName}_{report.userName}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {/* 집에서의 품행 탭 */}
                        {comparisonTab === 'home' && (
                          <>
                            {renderComparisonRow('Q1. 크레이트 안에서의 행동', 'q1')}
                            {renderComparisonRow('Q1-1. 편안해질 때까지 시간', 'q1_time')}
                            {renderComparisonRow('Q1-2. 씹는 종류', 'q1_type')}
                            {renderComparisonRow('Q1-3. 기타', 'q1_other')}
                            {renderComparisonRow('Q2. 사람 음식 반응', 'q2')}
                            {renderComparisonRow('Q2-1. 먹은 음식', 'q2_food')}
                            {renderComparisonRow('Q2-2. 기타', 'q2_other')}
                            {renderComparisonRow('Q3. 혼자 있을 때 상태', 'q3')}
                            {renderComparisonRow('Q4. 혼자 있을 때 반응', 'q4')}
                            {renderComparisonRow('Q4-1. 짖음 빈도', 'q4_bark_freq')}
                            {renderComparisonRow('Q4-2. 기타', 'q4_other')}
                            {renderComparisonRow('Q5. 크레이트 최장시간', 'q5_crate_time')}
                            {renderComparisonRow('Q5. 크레이트 상태', 'q5_crate_state')}
                            {renderComparisonRow('Q5. 팬스 최장시간', 'q5_fence_time')}
                            {renderComparisonRow('Q5. 팬스 상태', 'q5_fence_state')}
                            {renderComparisonRow('Q5. 풀린상태 최장시간', 'q5_free_time')}
                            {renderComparisonRow('Q5. 풀린상태', 'q5_free_state')}
                            {renderComparisonRow('Q6. 손님 반응', 'q6')}
                            {renderComparisonRow('Q6-1. 기타', 'q6_other')}
                            {renderComparisonRow('Q7. 가족 귀가 반응', 'q7')}
                            {renderComparisonRow('Q7-1. 좋아하지 않는 행동', 'q7_dislike')}
                            {renderComparisonRow('Q7-2. 기타', 'q7_other')}
                            {renderComparisonRow('Q8. 집에서 짖음', 'q8')}
                            {renderComparisonRow('Q8-1. 상황', 'q8_situation')}
                            {renderComparisonRow('Q8-2. 횟수', 'q8_count')}
                            {renderComparisonRow('Q9. 으르렁', 'q9')}
                            {renderComparisonRow('Q9-1. 상황', 'q9_situation')}
                            {renderComparisonRow('Q9-2. 횟수', 'q9_count')}
                            {renderComparisonRow('Q10. 컨트롤 반응', 'q10')}
                            {renderComparisonRow('Q10-1. 기타', 'q10_other')}
                            {renderComparisonRow('Q11. 장난감 반응', 'q11')}
                            {renderComparisonRow('Q11-1. 기타', 'q11_other')}
                            {renderComparisonRow('Q12. 기본훈련 옵션', 'q12_option')}
                            {renderComparisonRow('Q12-1. 명령어', 'q12_commands')}
                            {renderComparisonRow('Q12-2. 기다려 상태', 'q12_wait_state')}
                            {renderComparisonRow('Q12-3. 기다려 시간', 'q12_wait_time')}
                            {renderComparisonRow('Q12-4. 기다려 수준', 'q12_wait_levels')}
                            {renderComparisonRow('Q13. 바디핸들링', 'q13')}
                            {renderComparisonRow('Q13-1. 기타', 'q13_other')}
                            {renderComparisonRow('Q14. 이닦기 자세', 'q14_posture')}
                            {renderComparisonRow('Q14-1. 주별 횟수', 'q14_frequency')}
                            {renderComparisonRow('Q14-2. 반응', 'q14')}
                            {renderComparisonRow('Q14-3. 기타', 'q14_other')}
                            {renderComparisonRow('Q15. 그루밍 자세', 'q15_posture')}
                            {renderComparisonRow('Q15-1. 주별 횟수', 'q15_frequency')}
                            {renderComparisonRow('Q15-2. 반응', 'q15')}
                            {renderComparisonRow('Q15-3. 기타', 'q15_other')}
                            {renderComparisonRow('Q16. 발톱손질 자세', 'q16_posture')}
                            {renderComparisonRow('Q16-1. 주별 횟수', 'q16_frequency')}
                            {renderComparisonRow('Q16-2. 편안한 것', 'q16_comfortable')}
                            {renderComparisonRow('Q16-3. 불편한 부위', 'q16_uncomfortable')}
                            {renderComparisonRow('Q16-4. 기타 반응', 'q16_options')}
                            {renderComparisonRow('Q16-5. 과거 피', 'q16_bleeding')}
                            {renderComparisonRow('Q16-6. 기타', 'q16_other')}
                            {renderComparisonRow('Q17. 귀청소 자세', 'q17_posture')}
                            {renderComparisonRow('Q17-1. 반응', 'q17')}
                            {renderComparisonRow('Q17-2. 계기', 'q17_reason')}
                            {renderComparisonRow('Q17-3. 기타', 'q17_other')}
                            {renderComparisonRow('Q18. 발닦기', 'q18')}
                            {renderComparisonRow('Q18-1. 트릿 사용', 'q18_treat')}
                            {renderComparisonRow('Q18-2. 입질 대상', 'q18_bites')}
                            {renderComparisonRow('Q18-3. 기타', 'q18_other')}
                            {renderComparisonRow('Q19. 물건 망가뜨림', 'q19')}
                            {renderComparisonRow('Q19-1. 횟수', 'q19_count')}
                            {renderComparisonRow('Q20. 자녀 반응', 'q20')}
                            {renderComparisonRow('Q20-1. 기타', 'q20_other')}
                            {renderComparisonRow('Q21. 가장 큰 문제', 'q21')}
                          </>
                        )}

                        {/* DT 품행 기록 탭 */}
                        {comparisonTab === 'dt' && (
                          <>
                            {renderComparisonRow('DT1 시간', 'dt1_time')}
                            {renderComparisonRow('DT2 시간', 'dt2_time')}
                            {renderComparisonRow('실내 배변 차단', 'dt_indoor_blocked')}
                            {renderComparisonRow('실내 배변 형태', 'dt_indoor_type')}
                            {renderComparisonRow('배변벨트 사용', 'dt_belt_type')}
                            {renderComparisonRow('DT1 장소', 'dt1_location')}
                            {renderComparisonRow('DT2 장소', 'dt2_location')}
                            {renderComparisonRow('실수 - 안함 DT1', 'dt_mistake_1_dt1')}
                            {renderComparisonRow('실수 - 안함 DT2', 'dt_mistake_1_dt2')}
                            {renderComparisonRow('실수 - 주1회 DT1', 'dt_mistake_2_dt1')}
                            {renderComparisonRow('실수 - 주1회 DT2', 'dt_mistake_2_dt2')}
                            {renderComparisonRow('실수 - 주2-3회 DT1', 'dt_mistake_3_dt1')}
                            {renderComparisonRow('실수 - 주2-3회 DT2', 'dt_mistake_3_dt2')}
                            {renderComparisonRow('실수 - 주4-5회 DT1', 'dt_mistake_4_dt1')}
                            {renderComparisonRow('실수 - 주4-5회 DT2', 'dt_mistake_4_dt2')}
                            {renderComparisonRow('보행전 DT - DT1', 'dt_before_walk_dt1')}
                            {renderComparisonRow('보행전 DT - DT2', 'dt_before_walk_dt2')}
                            {renderComparisonRow('DT 신호', 'dt_signal')}
                            {renderComparisonRow('DT 신호 기타', 'dt_signal_other')}
                            {renderComparisonRow('배변 문제', 'dt_problems')}
                          </>
                        )}

                        {/* 보행 훈련 탭 */}
                        {comparisonTab === 'walk' && (
                          <>
                            {renderComparisonRow('1. 평균 산책 시간', 'walk_q1')}
                            {renderComparisonRow('2. 산책 시간대', 'walk_q2')}
                            {renderComparisonRow('3. 코트/견줄 반응', 'walk_q3')}
                            {renderComparisonRow('3-1. 기타', 'walk_q3_other')}
                            {renderComparisonRow('4. 헤드칼라 사용', 'walk_q4')}
                            {renderComparisonRow('5. 트릿 사용', 'walk_q5')}
                            {renderComparisonRow('6. 보행 속도', 'walk_q6')}
                            {renderComparisonRow('6-1. 기타', 'walk_q6_other')}
                            {renderComparisonRow('7. 보행 행동', 'walk_q7')}
                            {renderComparisonRow('7-1. 기타', 'walk_q7_other')}
                            {renderComparisonRow('8. 동물 반응', 'walk_q8')}
                            {renderComparisonRow('8-1. 기타', 'walk_q8_other')}
                            {renderComparisonRow('9. 사람 반응', 'walk_q9')}
                            {renderComparisonRow('9-1. 대상', 'walk_q9_target')}
                            {renderComparisonRow('9-2. 기타', 'walk_q9_other')}
                            {renderComparisonRow('10. 두려운 대상', 'walk_q10')}
                            {renderComparisonRow('11. 관심 대상', 'walk_q11')}
                          </>
                        )}

                        {/* 사회화 훈련 탭 */}
                        {comparisonTab === 'social' && (
                          <>
                            {renderComparisonRow('1. 다녀온 장소', 'social_q1')}
                            {renderComparisonRow('2. 훈련 빈도', 'social_q2')}
                            {renderComparisonRow('3. 복잡한 곳 반응', 'social_q3')}
                            {renderComparisonRow('3-1. 기타', 'social_q3_other')}
                            {renderComparisonRow('4. 계단 이용', 'social_q4')}
                            {renderComparisonRow('4-1. 기타', 'social_q4_other')}
                            {renderComparisonRow('5. 에스컬레이터', 'social_q5')}
                            {renderComparisonRow('5-1. 방향', 'social_q5_direction')}
                            {renderComparisonRow('5-2. 기타', 'social_q5_other')}
                            {renderComparisonRow('6. 승용차', 'social_q6')}
                            {renderComparisonRow('6-1. 기타', 'social_q6_other')}
                            {renderComparisonRow('7. 버스', 'social_q7')}
                            {renderComparisonRow('7-1. 시간', 'social_q7_when')}
                            {renderComparisonRow('7-2. 기타', 'social_q7_other')}
                            {renderComparisonRow('8. 지하철', 'social_q8')}
                            {renderComparisonRow('8-1. 기타', 'social_q8_other')}
                            {renderComparisonRow('9. 기차', 'social_q9')}
                            {renderComparisonRow('9-1. 기타', 'social_q9_other')}
                            {renderComparisonRow('10. 가장 어려운 점', 'social_q10')}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 상세보기 모달 */}
        {viewingReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-neutral-800">
                  {viewingReport.dogName}_{viewingReport.userName} - {viewingReport.reportMonth}
                </h3>
                <button
                  onClick={closeDetailView}
                  className="text-neutral-600 hover:text-neutral-800 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              {/* 기본 정보 */}
              <div className="p-6 bg-neutral-50 border-b border-neutral-200">
                <h4 className="text-lg font-bold text-neutral-800 mb-4">기본 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="text-sm font-semibold text-neutral-600 mb-2">급식</h5>
                    <div className="space-y-2 text-sm">
                      {(viewingReport as any).foodType && (
                        <div className="flex">
                          <span className="font-semibold w-32">사료 종류:</span>
                          <span>{(viewingReport as any).foodType}</span>
                        </div>
                      )}
                      {(viewingReport as any).dailyFeedingCount && (
                        <div className="flex">
                          <span className="font-semibold w-32">1일 급식 횟수:</span>
                          <span>{(viewingReport as any).dailyFeedingCount}</span>
                        </div>
                      )}
                      {(viewingReport as any).feedingAmountPerMeal && (
                        <div className="flex">
                          <span className="font-semibold w-32">1회 급식량:</span>
                          <span>{(viewingReport as any).feedingAmountPerMeal}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="text-sm font-semibold text-neutral-600 mb-2">건강</h5>
                    <div className="space-y-2 text-sm">
                      {(viewingReport as any).weight && (
                        <div className="flex">
                          <span className="font-semibold w-32">체중:</span>
                          <span>{(viewingReport as any).weight}</span>
                        </div>
                      )}
                      {(viewingReport as any).healthNotes && (
                        <div>
                          <span className="font-semibold">건강상 특이사항:</span>
                          <p className="mt-1 text-neutral-700 whitespace-pre-wrap">{(viewingReport as any).healthNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 탭 버튼 */}
              <div className="border-b border-neutral-200">
                <div className="flex space-x-1 p-2" role="tablist">
                  <button
                    role="tab"
                    aria-selected={detailViewTab === 'home'}
                    onClick={() => setDetailViewTab('home')}
                    className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                      detailViewTab === 'home'
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    집에서의 품행
                  </button>
                  <button
                    role="tab"
                    aria-selected={detailViewTab === 'dt'}
                    onClick={() => setDetailViewTab('dt')}
                    className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                      detailViewTab === 'dt'
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    DT 품행 기록
                  </button>
                  <button
                    role="tab"
                    aria-selected={detailViewTab === 'walk'}
                    onClick={() => setDetailViewTab('walk')}
                    className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                      detailViewTab === 'walk'
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    보행 훈련
                  </button>
                  <button
                    role="tab"
                    aria-selected={detailViewTab === 'social'}
                    onClick={() => setDetailViewTab('social')}
                    className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                      detailViewTab === 'social'
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    사회화 훈련
                  </button>
                </div>
              </div>

              {/* 탭 컨텐츠 */}
              <div className="p-6" role="tabpanel">
                {/* 집에서의 품행 탭 */}
                {detailViewTab === 'home' && (
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-neutral-800 mb-4">집에서의 품행 (21개 질문)</h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-neutral-100">
                          <th className="border border-neutral-300 px-4 py-2 text-left w-1/3">질문</th>
                          <th className="border border-neutral-300 px-4 py-2 text-left">답변</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewingReport as any).q1 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q1. 크레이트(팬스)를 닫았을 때 안에서의 행동</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q1', (viewingReport as any).q1)}</td></tr>
                        )}
                        {(viewingReport as any).q1_time && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">편안해질 때까지 걸리는 시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q1_time}</td></tr>
                        )}
                        {(viewingReport as any).q1_type && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">씹는 종류</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q1_type}</td></tr>
                        )}
                        {(viewingReport as any).q1_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q1_other}</td></tr>
                        )}

                        {(viewingReport as any).q2 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q2. 사람 음식에 대한 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q2', (viewingReport as any).q2)}</td></tr>
                        )}
                        {(viewingReport as any).q2_food && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">먹은 음식</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q2_food}</td></tr>
                        )}
                        {(viewingReport as any).q2_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q2_other}</td></tr>
                        )}

                        {(viewingReport as any).q3 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q3. 혼자 있을 때 상태</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q3', (viewingReport as any).q3)}</td></tr>
                        )}

                        {(viewingReport as any).q4 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q4. 혼자 있을 때 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q4', (viewingReport as any).q4)}</td></tr>
                        )}
                        {(viewingReport as any).q4_bark_freq && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">짖음 빈도</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q4_bark_freq}</td></tr>
                        )}
                        {(viewingReport as any).q4_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q4_other}</td></tr>
                        )}

                        {((viewingReport as any).q5_crate_time || (viewingReport as any).q5_fence_time || (viewingReport as any).q5_free_time) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q5. 혼자 있어 본 최장시간과 상태</td></tr>
                        )}
                        {(viewingReport as any).q5_crate_time && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">크레이트 - 시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_crate_time}</td></tr>
                        )}
                        {(viewingReport as any).q5_crate_state && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">크레이트 - 상태</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_crate_state}</td></tr>
                        )}
                        {(viewingReport as any).q5_fence_time && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">팬스 - 시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_fence_time}</td></tr>
                        )}
                        {(viewingReport as any).q5_fence_state && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">팬스 - 상태</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_fence_state}</td></tr>
                        )}
                        {(viewingReport as any).q5_free_time && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">풀린 상태 - 시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_free_time}</td></tr>
                        )}
                        {(viewingReport as any).q5_free_state && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">풀린 상태 - 상태</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_free_state}</td></tr>
                        )}

                        {(viewingReport as any).q6 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q6. 손님이 왔을 때의 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q6', (viewingReport as any).q6)}</td></tr>
                        )}
                        {(viewingReport as any).q6_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q6_other}</td></tr>
                        )}

                        {(viewingReport as any).q7 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q7. 가족이 귀가했을 때의 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q7', (viewingReport as any).q7)}</td></tr>
                        )}
                        {(viewingReport as any).q7_dislike && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">별로 좋아하지 않는 행동</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q7_dislike}</td></tr>
                        )}
                        {(viewingReport as any).q7_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q7_other}</td></tr>
                        )}

                        {(viewingReport as any).q8 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q8. 집에 있는 상황에서 짖은 적이 있나요?</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q8', (viewingReport as any).q8)}</td></tr>
                        )}
                        {(viewingReport as any).q8_situation && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">상황</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q8_situation}</td></tr>
                        )}
                        {(viewingReport as any).q8_count && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q8_count}</td></tr>
                        )}

                        {(viewingReport as any).q9 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q9. 으르렁 거린 적이 있나요?</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q9', (viewingReport as any).q9)}</td></tr>
                        )}
                        {(viewingReport as any).q9_situation && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">상황</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q9_situation}</td></tr>
                        )}
                        {(viewingReport as any).q9_count && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q9_count}</td></tr>
                        )}

                        {(viewingReport as any).q10 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q10. 개의 잘못된 행동을 사람이 컨트롤 했을 때의 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q10', (viewingReport as any).q10)}</td></tr>
                        )}
                        {(viewingReport as any).q10_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q10_other}</td></tr>
                        )}

                        {(viewingReport as any).q11 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q11. 장난감이나 콩, 껌을 물고 있는 강아지에게 "놔 or 그만"을 했을 때 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q11', (viewingReport as any).q11)}</td></tr>
                        )}
                        {(viewingReport as any).q11_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q11_other}</td></tr>
                        )}

                        {((viewingReport as any).q12_option || (viewingReport as any).q12_commands || (viewingReport as any).q12_wait_state) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q12. 집안에서 기본훈련(앉아/엎드려/서)에 대한 강아지의 수준</td></tr>
                        )}
                        {(viewingReport as any).q12_option && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">선택</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q12_option', (viewingReport as any).q12_option)}</td></tr>
                        )}
                        {(viewingReport as any).q12_commands && Array.isArray((viewingReport as any).q12_commands) && (viewingReport as any).q12_commands.length > 0 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">명령어</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q12_commands.join(', ')}</td></tr>
                        )}
                        {(viewingReport as any).q12_wait_state && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기다려 - 상태</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q12_wait_state}</td></tr>
                        )}
                        {(viewingReport as any).q12_wait_time && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기다려 - 시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q12_wait_time}</td></tr>
                        )}
                        {(viewingReport as any).q12_wait_levels && Array.isArray((viewingReport as any).q12_wait_levels) && (viewingReport as any).q12_wait_levels.length > 0 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기다려 - 수준</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q12_wait_levels.join(', ')}</td></tr>
                        )}

                        {(viewingReport as any).q13 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q13. 바디핸들링이나 배를 보이며 눕히기를 했을때 강아지의 행동</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q13', (viewingReport as any).q13)}</td></tr>
                        )}
                        {(viewingReport as any).q13_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q13_other}</td></tr>
                        )}

                        {((viewingReport as any).q14_posture || (viewingReport as any).q14_frequency || (viewingReport as any).q14) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q14. 이를 닦을 때 품행</td></tr>
                        )}
                        {(viewingReport as any).q14_posture && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">자세</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q14_posture}</td></tr>
                        )}
                        {(viewingReport as any).q14_frequency && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">주별 횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q14_frequency}</td></tr>
                        )}
                        {(viewingReport as any).q14 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q14', (viewingReport as any).q14)}</td></tr>
                        )}
                        {(viewingReport as any).q14_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q14_other}</td></tr>
                        )}

                        {((viewingReport as any).q15_posture || (viewingReport as any).q15_frequency || (viewingReport as any).q15) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q15. 그루밍(빗질) 할 때의 품행</td></tr>
                        )}
                        {(viewingReport as any).q15_posture && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">자세</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q15_posture}</td></tr>
                        )}
                        {(viewingReport as any).q15_frequency && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">주별 횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q15_frequency}</td></tr>
                        )}
                        {(viewingReport as any).q15 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q15', (viewingReport as any).q15)}</td></tr>
                        )}
                        {(viewingReport as any).q15_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q15_other}</td></tr>
                        )}

                        {((viewingReport as any).q16_posture || (viewingReport as any).q16_frequency || (viewingReport as any).q16_comfortable || (viewingReport as any).q16_uncomfortable) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q16. 발톱/발털손질 할 때의 품행</td></tr>
                        )}
                        {(viewingReport as any).q16_posture && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">자세</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_posture}</td></tr>
                        )}
                        {(viewingReport as any).q16_frequency && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">주별 횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_frequency}</td></tr>
                        )}
                        {(viewingReport as any).q16_comfortable && Array.isArray((viewingReport as any).q16_comfortable) && (viewingReport as any).q16_comfortable.length > 0 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">편안하게 잘 하는 것</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_comfortable.join(', ')}</td></tr>
                        )}
                        {(viewingReport as any).q16_uncomfortable && Array.isArray((viewingReport as any).q16_uncomfortable) && (viewingReport as any).q16_uncomfortable.length > 0 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">불편해하는 부위</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_uncomfortable.join(', ')}</td></tr>
                        )}
                        {(viewingReport as any).q16_options && Array.isArray((viewingReport as any).q16_options) && (viewingReport as any).q16_options.length > 0 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타 반응</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_options.join(', ')}</td></tr>
                        )}
                        {(viewingReport as any).q16_bleeding && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">과거 피가 난 적</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_bleeding === 'Y' ? '예' : '아니오'}</td></tr>
                        )}
                        {(viewingReport as any).q16_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_other}</td></tr>
                        )}

                        {((viewingReport as any).q17_posture || (viewingReport as any).q17) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q17. 귀청소 할 때의 품행</td></tr>
                        )}
                        {(viewingReport as any).q17_posture && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">자세</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q17_posture}</td></tr>
                        )}
                        {(viewingReport as any).q17 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q17', (viewingReport as any).q17)}</td></tr>
                        )}
                        {(viewingReport as any).q17_reason && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">계기</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q17_reason}</td></tr>
                        )}
                        {(viewingReport as any).q17_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q17_other}</td></tr>
                        )}

                        {(viewingReport as any).q18 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q18. 외출 후 발을 닦을 때의 품행</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q18', (viewingReport as any).q18)}</td></tr>
                        )}
                        {(viewingReport as any).q18_treat && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">트릿 사용 여부</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q18_treat}</td></tr>
                        )}
                        {(viewingReport as any).q18_bites && Array.isArray((viewingReport as any).q18_bites) && (viewingReport as any).q18_bites.length > 0 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">입질 대상</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q18_bites.join(', ')}</td></tr>
                        )}
                        {(viewingReport as any).q18_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q18_other}</td></tr>
                        )}

                        {(viewingReport as any).q19 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q19. 집안의 물건을 망가뜨린 적이 있나요?</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q19', (viewingReport as any).q19)}</td></tr>
                        )}
                        {(viewingReport as any).q19_count && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">지난 한달간 횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q19_count}</td></tr>
                        )}

                        {(viewingReport as any).q20 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q20. 집에서 자녀들과 있을 때의 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q20', (viewingReport as any).q20)}</td></tr>
                        )}
                        {(viewingReport as any).q20_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q20_other}</td></tr>
                        )}

                        {(viewingReport as any).q21 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q21. 현재 품행에 있어 가장 큰 문제는?</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q21}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* DT 품행 기록 탭 */}
                {detailViewTab === 'dt' && (
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-neutral-800 mb-4">DT 품행 기록</h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-neutral-100">
                          <th className="border border-neutral-300 px-4 py-2 text-left w-1/3">질문</th>
                          <th className="border border-neutral-300 px-4 py-2 text-left">답변</th>
                        </tr>
                      </thead>
                      <tbody>
                        {((viewingReport as any).dt1_time || (viewingReport as any).dt2_time) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>1. '하나둘,하나둘' 명령어에 몇분안에 반응하나요?</td></tr>
                        )}
                        {(viewingReport as any).dt1_time && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">DT1(소변)</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt1_time}분</td></tr>
                        )}
                        {(viewingReport as any).dt2_time && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">DT2(대변)</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt2_time}분</td></tr>
                        )}

                        {(viewingReport as any).dt_indoor_blocked && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">2. 실내 배변 장소는 차단해 두었나요?</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt_indoor_blocked}</td></tr>
                        )}

                        {(viewingReport as any).dt_indoor_type && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">3. 실내배변은 어떤 형태로 하고 있나요?</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt_indoor_type}</td></tr>
                        )}

                        {(viewingReport as any).dt_belt_type && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">4. 배변벨트 사용 여부</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt_belt_type}</td></tr>
                        )}

                        {((viewingReport as any).dt1_location || (viewingReport as any).dt2_location) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>5. 배변 장소</td></tr>
                        )}
                        {(viewingReport as any).dt1_location && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">DT1</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt1_location}</td></tr>
                        )}
                        {(viewingReport as any).dt2_location && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">DT2</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt2_location}</td></tr>
                        )}

                        {((viewingReport as any).dt_mistake_1_dt1 || (viewingReport as any).dt_mistake_1_dt2 || (viewingReport as any).dt_mistake_2_dt1 || (viewingReport as any).dt_mistake_2_dt2 || (viewingReport as any).dt_mistake_3_dt1 || (viewingReport as any).dt_mistake_3_dt2 || (viewingReport as any).dt_mistake_4_dt1 || (viewingReport as any).dt_mistake_4_dt2) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>6. 보행 도중에 DT 실수를 할 때가 있나요?</td></tr>
                        )}
                        {((viewingReport as any).dt_mistake_1_dt1 || (viewingReport as any).dt_mistake_1_dt2) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">① 안 한다</td><td className="border border-neutral-300 px-4 py-2">{[(viewingReport as any).dt_mistake_1_dt1 && 'DT1', (viewingReport as any).dt_mistake_1_dt2 && 'DT2'].filter(Boolean).join(', ')}</td></tr>
                        )}
                        {((viewingReport as any).dt_mistake_2_dt1 || (viewingReport as any).dt_mistake_2_dt2) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">② 주 1회 정도 한다</td><td className="border border-neutral-300 px-4 py-2">{[(viewingReport as any).dt_mistake_2_dt1 && 'DT1', (viewingReport as any).dt_mistake_2_dt2 && 'DT2'].filter(Boolean).join(', ')}</td></tr>
                        )}
                        {((viewingReport as any).dt_mistake_3_dt1 || (viewingReport as any).dt_mistake_3_dt2) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">③ 주 2~3회 정도 한다</td><td className="border border-neutral-300 px-4 py-2">{[(viewingReport as any).dt_mistake_3_dt1 && 'DT1', (viewingReport as any).dt_mistake_3_dt2 && 'DT2'].filter(Boolean).join(', ')}</td></tr>
                        )}
                        {((viewingReport as any).dt_mistake_4_dt1 || (viewingReport as any).dt_mistake_4_dt2) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">④ 주 4~5회 이상 한다</td><td className="border border-neutral-300 px-4 py-2">{[(viewingReport as any).dt_mistake_4_dt1 && 'DT1', (viewingReport as any).dt_mistake_4_dt2 && 'DT2'].filter(Boolean).join(', ')}</td></tr>
                        )}

                        {((viewingReport as any).dt_before_walk_dt1 || (viewingReport as any).dt_before_walk_dt2) && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">7. 보행 전에 반드시 DT를 하고 걷나요?</td><td className="border border-neutral-300 px-4 py-2">{[(viewingReport as any).dt_before_walk_dt1 && 'DT1', (viewingReport as any).dt_before_walk_dt2 && 'DT2'].filter(Boolean).join(', ')}</td></tr>
                        )}

                        {(viewingReport as any).dt_signal && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">8. 보행 도중 DT를 하고 싶어할 때 특별히 보내는 신호가 있나요?</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('dt_signal', (viewingReport as any).dt_signal)}</td></tr>
                        )}
                        {(viewingReport as any).dt_signal_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt_signal_other}</td></tr>
                        )}

                        {(viewingReport as any).dt_problems && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">9. 현재 배변문제가 있다면 어떤 것이 있나요?</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt_problems}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 보행 훈련 탭 */}
                {detailViewTab === 'walk' && (
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-neutral-800 mb-4">보행 훈련</h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-neutral-100">
                          <th className="border border-neutral-300 px-4 py-2 text-left w-1/3">질문</th>
                          <th className="border border-neutral-300 px-4 py-2 text-left">답변</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewingReport as any).walk_q1 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">1. 하루 평균 산책 시간은?</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q1', (viewingReport as any).walk_q1)}</td></tr>
                        )}

                        {(viewingReport as any).walk_q2 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">2. 산책 나가는 시간대</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q2}</td></tr>
                        )}

                        {(viewingReport as any).walk_q3 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">3. 코트와 견줄 착용에 대한 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q3', (viewingReport as any).walk_q3)}</td></tr>
                        )}
                        {(viewingReport as any).walk_q3_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q3_other}</td></tr>
                        )}

                        {(viewingReport as any).walk_q4 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">4. 헤드칼라 사용 여부</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q4', (viewingReport as any).walk_q4)}</td></tr>
                        )}

                        {(viewingReport as any).walk_q5 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">5. 산책 중 트릿 사용 여부</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q5', (viewingReport as any).walk_q5)}</td></tr>
                        )}

                        {(viewingReport as any).walk_q6 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">6. 보행 속도</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q6', (viewingReport as any).walk_q6)}</td></tr>
                        )}
                        {(viewingReport as any).walk_q6_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q6_other}</td></tr>
                        )}

                        {(viewingReport as any).walk_q7 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">7. 보행중 행동</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q7', (viewingReport as any).walk_q7)}</td></tr>
                        )}
                        {(viewingReport as any).walk_q7_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q7_other}</td></tr>
                        )}

                        {(viewingReport as any).walk_q8 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">8. 보행중 다른 동물을 만났을 때 반응</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q8}</td></tr>
                        )}
                        {(viewingReport as any).walk_q8_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q8_other}</td></tr>
                        )}

                        {(viewingReport as any).walk_q9 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">9. 보행중 사람을 만났을 때 반응</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q9}</td></tr>
                        )}
                        {(viewingReport as any).walk_q9_target && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">대상</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q9_target}</td></tr>
                        )}
                        {(viewingReport as any).walk_q9_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q9_other}</td></tr>
                        )}

                        {(viewingReport as any).walk_q10 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">10. 두려워하는 대상</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q10}</td></tr>
                        )}

                        {(viewingReport as any).walk_q11 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">11. 관심을 보이는 대상</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q11}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 사회화 훈련 탭 */}
                {detailViewTab === 'social' && (
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-neutral-800 mb-4">사회화 훈련</h4>
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-neutral-100">
                          <th className="border border-neutral-300 px-4 py-2 text-left w-1/3">질문</th>
                          <th className="border border-neutral-300 px-4 py-2 text-left">답변</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewingReport as any).social_q1 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">1. 지난 한달간 다녀온 장소</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q1}</td></tr>
                        )}

                        {(viewingReport as any).social_q2 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">2. 사회화 훈련 빈도</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q2', (viewingReport as any).social_q2)}</td></tr>
                        )}

                        {(viewingReport as any).social_q3 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">3. 복잡하고 사람이 많은 곳에서의 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q3', (viewingReport as any).social_q3)}</td></tr>
                        )}
                        {(viewingReport as any).social_q3_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q3_other}</td></tr>
                        )}

                        {(viewingReport as any).social_q4 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">4. 계단 이용</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q4', (viewingReport as any).social_q4)}</td></tr>
                        )}
                        {(viewingReport as any).social_q4_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q4_other}</td></tr>
                        )}

                        {(viewingReport as any).social_q5 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">5. 에스컬레이터 이용</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q5', (viewingReport as any).social_q5)}</td></tr>
                        )}
                        {(viewingReport as any).social_q5_direction && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">방향</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q5_direction}</td></tr>
                        )}
                        {(viewingReport as any).social_q5_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q5_other}</td></tr>
                        )}

                        {(viewingReport as any).social_q6 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">6. 승용차 이용</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q6', (viewingReport as any).social_q6)}</td></tr>
                        )}
                        {(viewingReport as any).social_q6_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q6_other}</td></tr>
                        )}

                        {(viewingReport as any).social_q7 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">7. 버스 이용</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q7', (viewingReport as any).social_q7)}</td></tr>
                        )}
                        {(viewingReport as any).social_q7_when && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q7_when}</td></tr>
                        )}
                        {(viewingReport as any).social_q7_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q7_other}</td></tr>
                        )}

                        {(viewingReport as any).social_q8 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">8. 지하철 이용</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q8}</td></tr>
                        )}
                        {(viewingReport as any).social_q8_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q8_other}</td></tr>
                        )}

                        {(viewingReport as any).social_q9 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">9. 기차 이용</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q9}</td></tr>
                        )}
                        {(viewingReport as any).social_q9_other && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q9_other}</td></tr>
                        )}

                        {(viewingReport as any).social_q10 && (
                          <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">10. 사회화 훈련 중 가장 어려운 점</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q10}</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 피드백 섹션 */}
              <div className="p-6 bg-neutral-50 border-t border-neutral-200">
                <h4 className="text-lg font-bold text-neutral-800 mb-4">관리자 피드백</h4>

                {/* 기존 피드백 표시 */}
                {(viewingReport as any).feedback && (
                  <div className="mb-4 bg-white p-4 rounded-lg border border-neutral-300">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-neutral-600">
                        작성자: {(viewingReport as any).feedbackAuthor || '관리자'}
                      </span>
                      {(viewingReport as any).feedbackDate && (
                        <span className="text-sm text-neutral-500">
                          {new Date((viewingReport as any).feedbackDate).toLocaleString('ko-KR')}
                        </span>
                      )}
                    </div>
                    <p className="text-neutral-800 whitespace-pre-wrap">{(viewingReport as any).feedback}</p>
                  </div>
                )}

                {/* 관리자만 피드백 작성/수정 가능 */}
                {user?.role === 'admin' && (
                  <div>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="피드백을 작성하세요..."
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                      rows={4}
                    />
                    <button
                      onClick={() => saveFeedback(viewingReport.id)}
                      className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                      피드백 저장
                    </button>
                  </div>
                )}

                {/* 작성자는 피드백을 읽기만 가능 */}
                {user?.role !== 'admin' && !(viewingReport as any).feedback && (
                  <p className="text-neutral-500 text-center py-4">아직 피드백이 없습니다.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 퍼피티처 목록 뷰
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-neutral-800">월간 보고서</h2>
        <button
          onClick={() => setIsWriting(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          글쓰기
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-neutral-500">작성된 월간 보고서가 없습니다.</p>
          <button
            onClick={() => setIsWriting(true)}
            className="mt-4 text-primary-600 hover:text-primary-800 font-semibold"
          >
            첫 보고서 작성하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <button
                    onClick={() => openDetailView(report)}
                    className="text-xl font-bold text-primary-600 hover:text-primary-800 underline text-left"
                    aria-label={`${report.reportMonth} 월간 보고서, 견명 ${report.dogName}, 퍼피티처 ${report.userName}, 상태 ${report.status === 'completed' ? '완료' : '임시저장'}`}
                  >
                    {report.reportMonth} 월간 보고서
                  </button>
                  <div className="flex items-center text-sm text-neutral-600 space-x-4 mt-2">
                    <span>견명: {report.dogName}</span>
                    <span>퍼피티처: {report.userName}</span>
                    <span>작성일: {formatDate(report.createdAt)}</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      report.status === 'completed'
                        ? 'bg-success-100 text-success-800'
                        : 'bg-warning-100 text-warning-800'
                    }`}>
                      {report.status === 'completed' ? '완료' : '임시저장'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {/* 완료된 보고서는 수정/삭제 불가 */}
                  {report.status !== 'completed' && (
                    <>
                      <button
                        onClick={() => loadReportForEdit(report)}
                        className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={async () => {
                          if (window.confirm('이 보고서를 삭제하시겠습니까?')) {
                            try {
                              await deleteMonthlyReport(report.id);
                              await loadReports();
                              alert('삭제되었습니다.');
                            } catch (error) {
                              console.error('삭제 실패:', error);
                              alert('삭제에 실패했습니다.');
                            }
                          }
                        }}
                        className="text-error-600 hover:text-error-800 px-4 py-2"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세보기 모달 */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-neutral-800">
                {viewingReport.dogName}_{viewingReport.userName} - {viewingReport.reportMonth}
              </h3>
              <button
                onClick={closeDetailView}
                className="text-neutral-600 hover:text-neutral-800 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* 기본 정보 */}
            <div className="p-6 bg-neutral-50 border-b border-neutral-200">
              <h4 className="text-lg font-bold text-neutral-800 mb-4">기본 정보</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-neutral-600 mb-2">급식</h5>
                  <div className="space-y-2 text-sm">
                    {(viewingReport as any).foodType && (
                      <div className="flex">
                        <span className="font-semibold w-32">사료 종류:</span>
                        <span>{(viewingReport as any).foodType}</span>
                      </div>
                    )}
                    {(viewingReport as any).dailyFeedingCount && (
                      <div className="flex">
                        <span className="font-semibold w-32">1일 급식 횟수:</span>
                        <span>{(viewingReport as any).dailyFeedingCount}</span>
                      </div>
                    )}
                    {(viewingReport as any).feedingAmountPerMeal && (
                      <div className="flex">
                        <span className="font-semibold w-32">1회 급식량:</span>
                        <span>{(viewingReport as any).feedingAmountPerMeal}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <h5 className="text-sm font-semibold text-neutral-600 mb-2">건강</h5>
                  <div className="space-y-2 text-sm">
                    {(viewingReport as any).weight && (
                      <div className="flex">
                        <span className="font-semibold w-32">체중:</span>
                        <span>{(viewingReport as any).weight}</span>
                      </div>
                    )}
                    {(viewingReport as any).healthNotes && (
                      <div>
                        <span className="font-semibold">건강상 특이사항:</span>
                        <p className="mt-1 text-neutral-700 whitespace-pre-wrap">{(viewingReport as any).healthNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 탭 버튼 */}
            <div className="border-b border-neutral-200">
              <div className="flex space-x-1 p-2" role="tablist">
                <button
                  role="tab"
                  aria-selected={detailViewTab === 'home'}
                  onClick={() => setDetailViewTab('home')}
                  className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                    detailViewTab === 'home'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  집에서의 품행
                </button>
                <button
                  role="tab"
                  aria-selected={detailViewTab === 'dt'}
                  onClick={() => setDetailViewTab('dt')}
                  className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                    detailViewTab === 'dt'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  DT 품행 기록
                </button>
                <button
                  role="tab"
                  aria-selected={detailViewTab === 'walk'}
                  onClick={() => setDetailViewTab('walk')}
                  className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                    detailViewTab === 'walk'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  보행 훈련
                </button>
                <button
                  role="tab"
                  aria-selected={detailViewTab === 'social'}
                  onClick={() => setDetailViewTab('social')}
                  className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
                    detailViewTab === 'social'
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  사회화 훈련
                </button>
              </div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="p-6" role="tabpanel">
              {/* 집에서의 품행 탭 */}
              {detailViewTab === 'home' && (
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-neutral-800 mb-4">집에서의 품행 (21개 질문)</h4>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-neutral-100">
                        <th className="border border-neutral-300 px-4 py-2 text-left w-1/3">질문</th>
                        <th className="border border-neutral-300 px-4 py-2 text-left">답변</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewingReport as any).q1 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q1. 크레이트(팬스)를 닫았을 때 안에서의 행동</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q1', (viewingReport as any).q1)}</td></tr>
                      )}
                      {(viewingReport as any).q1_time && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">편안해질 때까지 걸리는 시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q1_time}</td></tr>
                      )}
                      {(viewingReport as any).q1_type && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">씹는 종류</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q1_type}</td></tr>
                      )}
                      {(viewingReport as any).q1_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q1_other}</td></tr>
                      )}

                      {(viewingReport as any).q2 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q2. 사람 음식에 대한 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q2', (viewingReport as any).q2)}</td></tr>
                      )}
                      {(viewingReport as any).q2_food && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">먹은 음식</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q2_food}</td></tr>
                      )}
                      {(viewingReport as any).q2_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q2_other}</td></tr>
                      )}

                      {(viewingReport as any).q3 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q3. 혼자 있을 때 상태</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q3', (viewingReport as any).q3)}</td></tr>
                      )}

                      {(viewingReport as any).q4 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q4. 혼자 있을 때 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q4', (viewingReport as any).q4)}</td></tr>
                      )}
                      {(viewingReport as any).q4_bark_freq && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">짖음 빈도</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q4_bark_freq}</td></tr>
                      )}
                      {(viewingReport as any).q4_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q4_other}</td></tr>
                      )}

                      {((viewingReport as any).q5_crate_time || (viewingReport as any).q5_fence_time || (viewingReport as any).q5_free_time) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q5. 혼자 있어 본 최장시간과 상태</td></tr>
                      )}
                      {(viewingReport as any).q5_crate_time && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">크레이트 - 시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_crate_time}</td></tr>
                      )}
                      {(viewingReport as any).q5_crate_state && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">크레이트 - 상태</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_crate_state}</td></tr>
                      )}
                      {(viewingReport as any).q5_fence_time && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">팬스 - 시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_fence_time}</td></tr>
                      )}
                      {(viewingReport as any).q5_fence_state && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">팬스 - 상태</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_fence_state}</td></tr>
                      )}
                      {(viewingReport as any).q5_free_time && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">풀린 상태 - 시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_free_time}</td></tr>
                      )}
                      {(viewingReport as any).q5_free_state && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">풀린 상태 - 상태</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q5_free_state}</td></tr>
                      )}

                      {(viewingReport as any).q6 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q6. 손님이 왔을 때의 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q6', (viewingReport as any).q6)}</td></tr>
                      )}
                      {(viewingReport as any).q6_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q6_other}</td></tr>
                      )}

                      {(viewingReport as any).q7 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q7. 가족이 귀가했을 때의 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q7', (viewingReport as any).q7)}</td></tr>
                      )}
                      {(viewingReport as any).q7_dislike && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">별로 좋아하지 않는 행동</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q7_dislike}</td></tr>
                      )}
                      {(viewingReport as any).q7_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q7_other}</td></tr>
                      )}

                      {(viewingReport as any).q8 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q8. 집에 있는 상황에서 짖은 적이 있나요?</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q8', (viewingReport as any).q8)}</td></tr>
                      )}
                      {(viewingReport as any).q8_situation && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">상황</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q8_situation}</td></tr>
                      )}
                      {(viewingReport as any).q8_count && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q8_count}</td></tr>
                      )}

                      {(viewingReport as any).q9 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q9. 으르렁 거린 적이 있나요?</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q9', (viewingReport as any).q9)}</td></tr>
                      )}
                      {(viewingReport as any).q9_situation && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">상황</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q9_situation}</td></tr>
                      )}
                      {(viewingReport as any).q9_count && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q9_count}</td></tr>
                      )}

                      {(viewingReport as any).q10 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q10. 개의 잘못된 행동을 사람이 컨트롤 했을 때의 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q10', (viewingReport as any).q10)}</td></tr>
                      )}
                      {(viewingReport as any).q10_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q10_other}</td></tr>
                      )}

                      {(viewingReport as any).q11 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q11. 장난감이나 콩, 껌을 물고 있는 강아지에게 "놔 or 그만"을 했을 때 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q11', (viewingReport as any).q11)}</td></tr>
                      )}
                      {(viewingReport as any).q11_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q11_other}</td></tr>
                      )}

                      {((viewingReport as any).q12_option || (viewingReport as any).q12_commands || (viewingReport as any).q12_wait_state) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q12. 집안에서 기본훈련(앉아/엎드려/서)에 대한 강아지의 수준</td></tr>
                      )}
                      {(viewingReport as any).q12_option && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">선택</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q12_option', (viewingReport as any).q12_option)}</td></tr>
                      )}
                      {(viewingReport as any).q12_commands && Array.isArray((viewingReport as any).q12_commands) && (viewingReport as any).q12_commands.length > 0 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">명령어</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q12_commands.join(', ')}</td></tr>
                      )}
                      {(viewingReport as any).q12_wait_state && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기다려 - 상태</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q12_wait_state}</td></tr>
                      )}
                      {(viewingReport as any).q12_wait_time && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기다려 - 시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q12_wait_time}</td></tr>
                      )}
                      {(viewingReport as any).q12_wait_levels && Array.isArray((viewingReport as any).q12_wait_levels) && (viewingReport as any).q12_wait_levels.length > 0 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기다려 - 수준</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q12_wait_levels.join(', ')}</td></tr>
                      )}

                      {(viewingReport as any).q13 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q13. 바디핸들링이나 배를 보이며 눕히기를 했을때 강아지의 행동</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q13', (viewingReport as any).q13)}</td></tr>
                      )}
                      {(viewingReport as any).q13_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q13_other}</td></tr>
                      )}

                      {((viewingReport as any).q14_posture || (viewingReport as any).q14_frequency || (viewingReport as any).q14) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q14. 이를 닦을 때 품행</td></tr>
                      )}
                      {(viewingReport as any).q14_posture && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">자세</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q14_posture}</td></tr>
                      )}
                      {(viewingReport as any).q14_frequency && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">주별 횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q14_frequency}</td></tr>
                      )}
                      {(viewingReport as any).q14 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q14', (viewingReport as any).q14)}</td></tr>
                      )}
                      {(viewingReport as any).q14_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q14_other}</td></tr>
                      )}

                      {((viewingReport as any).q15_posture || (viewingReport as any).q15_frequency || (viewingReport as any).q15) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q15. 그루밍(빗질) 할 때의 품행</td></tr>
                      )}
                      {(viewingReport as any).q15_posture && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">자세</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q15_posture}</td></tr>
                      )}
                      {(viewingReport as any).q15_frequency && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">주별 횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q15_frequency}</td></tr>
                      )}
                      {(viewingReport as any).q15 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q15', (viewingReport as any).q15)}</td></tr>
                      )}
                      {(viewingReport as any).q15_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q15_other}</td></tr>
                      )}

                      {((viewingReport as any).q16_posture || (viewingReport as any).q16_frequency || (viewingReport as any).q16_comfortable || (viewingReport as any).q16_uncomfortable) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q16. 발톱/발털손질 할 때의 품행</td></tr>
                      )}
                      {(viewingReport as any).q16_posture && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">자세</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_posture}</td></tr>
                      )}
                      {(viewingReport as any).q16_frequency && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">주별 횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_frequency}</td></tr>
                      )}
                      {(viewingReport as any).q16_comfortable && Array.isArray((viewingReport as any).q16_comfortable) && (viewingReport as any).q16_comfortable.length > 0 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">편안하게 잘 하는 것</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_comfortable.join(', ')}</td></tr>
                      )}
                      {(viewingReport as any).q16_uncomfortable && Array.isArray((viewingReport as any).q16_uncomfortable) && (viewingReport as any).q16_uncomfortable.length > 0 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">불편해하는 부위</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_uncomfortable.join(', ')}</td></tr>
                      )}
                      {(viewingReport as any).q16_options && Array.isArray((viewingReport as any).q16_options) && (viewingReport as any).q16_options.length > 0 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타 반응</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_options.join(', ')}</td></tr>
                      )}
                      {(viewingReport as any).q16_bleeding && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">과거 피가 난 적</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_bleeding === 'Y' ? '예' : '아니오'}</td></tr>
                      )}
                      {(viewingReport as any).q16_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q16_other}</td></tr>
                      )}

                      {((viewingReport as any).q17_posture || (viewingReport as any).q17) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>Q17. 귀청소 할 때의 품행</td></tr>
                      )}
                      {(viewingReport as any).q17_posture && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">자세</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q17_posture}</td></tr>
                      )}
                      {(viewingReport as any).q17 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q17', (viewingReport as any).q17)}</td></tr>
                      )}
                      {(viewingReport as any).q17_reason && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">계기</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q17_reason}</td></tr>
                      )}
                      {(viewingReport as any).q17_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q17_other}</td></tr>
                      )}

                      {(viewingReport as any).q18 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q18. 외출 후 발을 닦을 때의 품행</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q18', (viewingReport as any).q18)}</td></tr>
                      )}
                      {(viewingReport as any).q18_treat && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">트릿 사용 여부</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q18_treat}</td></tr>
                      )}
                      {(viewingReport as any).q18_bites && Array.isArray((viewingReport as any).q18_bites) && (viewingReport as any).q18_bites.length > 0 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">입질 대상</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q18_bites.join(', ')}</td></tr>
                      )}
                      {(viewingReport as any).q18_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q18_other}</td></tr>
                      )}

                      {(viewingReport as any).q19 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q19. 집안의 물건을 망가뜨린 적이 있나요?</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q19', (viewingReport as any).q19)}</td></tr>
                      )}
                      {(viewingReport as any).q19_count && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">지난 한달간 횟수</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q19_count}</td></tr>
                      )}

                      {(viewingReport as any).q20 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q20. 집에서 자녀들과 있을 때의 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('q20', (viewingReport as any).q20)}</td></tr>
                      )}
                      {(viewingReport as any).q20_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q20_other}</td></tr>
                      )}

                      {(viewingReport as any).q21 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">Q21. 현재 품행에 있어 가장 큰 문제는?</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).q21}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* DT 품행 기록 탭 */}
              {detailViewTab === 'dt' && (
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-neutral-800 mb-4">DT 품행 기록</h4>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-neutral-100">
                        <th className="border border-neutral-300 px-4 py-2 text-left w-1/3">질문</th>
                        <th className="border border-neutral-300 px-4 py-2 text-left">답변</th>
                      </tr>
                    </thead>
                    <tbody>
                      {((viewingReport as any).dt1_time || (viewingReport as any).dt2_time) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>1. '하나둘,하나둘' 명령어에 몇분안에 반응하나요?</td></tr>
                      )}
                      {(viewingReport as any).dt1_time && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">DT1(소변)</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt1_time}분</td></tr>
                      )}
                      {(viewingReport as any).dt2_time && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">DT2(대변)</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt2_time}분</td></tr>
                      )}

                      {(viewingReport as any).dt_indoor_blocked && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">2. 실내 배변 장소는 차단해 두었나요?</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt_indoor_blocked}</td></tr>
                      )}

                      {(viewingReport as any).dt_indoor_type && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">3. 실내배변은 어떤 형태로 하고 있나요?</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt_indoor_type}</td></tr>
                      )}

                      {(viewingReport as any).dt_belt_type && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">4. 배변벨트 사용 여부</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt_belt_type}</td></tr>
                      )}

                      {((viewingReport as any).dt1_location || (viewingReport as any).dt2_location) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>5. 배변 장소</td></tr>
                      )}
                      {(viewingReport as any).dt1_location && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">DT1</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt1_location}</td></tr>
                      )}
                      {(viewingReport as any).dt2_location && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">DT2</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt2_location}</td></tr>
                      )}

                      {((viewingReport as any).dt_mistake_1_dt1 || (viewingReport as any).dt_mistake_1_dt2 || (viewingReport as any).dt_mistake_2_dt1 || (viewingReport as any).dt_mistake_2_dt2 || (viewingReport as any).dt_mistake_3_dt1 || (viewingReport as any).dt_mistake_3_dt2 || (viewingReport as any).dt_mistake_4_dt1 || (viewingReport as any).dt_mistake_4_dt2) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold" colSpan={2}>6. 보행 도중에 DT 실수를 할 때가 있나요?</td></tr>
                      )}
                      {((viewingReport as any).dt_mistake_1_dt1 || (viewingReport as any).dt_mistake_1_dt2) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">① 안 한다</td><td className="border border-neutral-300 px-4 py-2">{[(viewingReport as any).dt_mistake_1_dt1 && 'DT1', (viewingReport as any).dt_mistake_1_dt2 && 'DT2'].filter(Boolean).join(', ')}</td></tr>
                      )}
                      {((viewingReport as any).dt_mistake_2_dt1 || (viewingReport as any).dt_mistake_2_dt2) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">② 주 1회 정도 한다</td><td className="border border-neutral-300 px-4 py-2">{[(viewingReport as any).dt_mistake_2_dt1 && 'DT1', (viewingReport as any).dt_mistake_2_dt2 && 'DT2'].filter(Boolean).join(', ')}</td></tr>
                      )}
                      {((viewingReport as any).dt_mistake_3_dt1 || (viewingReport as any).dt_mistake_3_dt2) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">③ 주 2~3회 정도 한다</td><td className="border border-neutral-300 px-4 py-2">{[(viewingReport as any).dt_mistake_3_dt1 && 'DT1', (viewingReport as any).dt_mistake_3_dt2 && 'DT2'].filter(Boolean).join(', ')}</td></tr>
                      )}
                      {((viewingReport as any).dt_mistake_4_dt1 || (viewingReport as any).dt_mistake_4_dt2) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">④ 주 4~5회 이상 한다</td><td className="border border-neutral-300 px-4 py-2">{[(viewingReport as any).dt_mistake_4_dt1 && 'DT1', (viewingReport as any).dt_mistake_4_dt2 && 'DT2'].filter(Boolean).join(', ')}</td></tr>
                      )}

                      {((viewingReport as any).dt_before_walk_dt1 || (viewingReport as any).dt_before_walk_dt2) && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">7. 보행 전에 반드시 DT를 하고 걷나요?</td><td className="border border-neutral-300 px-4 py-2">{[(viewingReport as any).dt_before_walk_dt1 && 'DT1', (viewingReport as any).dt_before_walk_dt2 && 'DT2'].filter(Boolean).join(', ')}</td></tr>
                      )}

                      {(viewingReport as any).dt_signal && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">8. 보행 도중 DT를 하고 싶어할 때 특별히 보내는 신호가 있나요?</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('dt_signal', (viewingReport as any).dt_signal)}</td></tr>
                      )}
                      {(viewingReport as any).dt_signal_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt_signal_other}</td></tr>
                      )}

                      {(viewingReport as any).dt_problems && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">9. 현재 배변문제가 있다면 어떤 것이 있나요?</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).dt_problems}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 보행 훈련 탭 */}
              {detailViewTab === 'walk' && (
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-neutral-800 mb-4">보행 훈련</h4>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-neutral-100">
                        <th className="border border-neutral-300 px-4 py-2 text-left w-1/3">질문</th>
                        <th className="border border-neutral-300 px-4 py-2 text-left">답변</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewingReport as any).walk_q1 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">1. 하루 평균 산책 시간은?</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q1', (viewingReport as any).walk_q1)}</td></tr>
                      )}

                      {(viewingReport as any).walk_q2 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">2. 산책 나가는 시간대</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q2}</td></tr>
                      )}

                      {(viewingReport as any).walk_q3 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">3. 코트와 견줄 착용에 대한 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q3', (viewingReport as any).walk_q3)}</td></tr>
                      )}
                      {(viewingReport as any).walk_q3_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q3_other}</td></tr>
                      )}

                      {(viewingReport as any).walk_q4 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">4. 헤드칼라 사용 여부</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q4', (viewingReport as any).walk_q4)}</td></tr>
                      )}

                      {(viewingReport as any).walk_q5 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">5. 산책 중 트릿 사용 여부</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q5', (viewingReport as any).walk_q5)}</td></tr>
                      )}

                      {(viewingReport as any).walk_q6 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">6. 보행 속도</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q6', (viewingReport as any).walk_q6)}</td></tr>
                      )}
                      {(viewingReport as any).walk_q6_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q6_other}</td></tr>
                      )}

                      {(viewingReport as any).walk_q7 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">7. 보행중 행동</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('walk_q7', (viewingReport as any).walk_q7)}</td></tr>
                      )}
                      {(viewingReport as any).walk_q7_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q7_other}</td></tr>
                      )}

                      {(viewingReport as any).walk_q8 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">8. 보행중 다른 동물을 만났을 때 반응</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q8}</td></tr>
                      )}
                      {(viewingReport as any).walk_q8_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q8_other}</td></tr>
                      )}

                      {(viewingReport as any).walk_q9 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">9. 보행중 사람을 만났을 때 반응</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q9}</td></tr>
                      )}
                      {(viewingReport as any).walk_q9_target && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">대상</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q9_target}</td></tr>
                      )}
                      {(viewingReport as any).walk_q9_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q9_other}</td></tr>
                      )}

                      {(viewingReport as any).walk_q10 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">10. 두려워하는 대상</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q10}</td></tr>
                      )}

                      {(viewingReport as any).walk_q11 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">11. 관심을 보이는 대상</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).walk_q11}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 사회화 훈련 탭 */}
              {detailViewTab === 'social' && (
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-neutral-800 mb-4">사회화 훈련</h4>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-neutral-100">
                        <th className="border border-neutral-300 px-4 py-2 text-left w-1/3">질문</th>
                        <th className="border border-neutral-300 px-4 py-2 text-left">답변</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewingReport as any).social_q1 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">1. 지난 한달간 다녀온 장소</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q1}</td></tr>
                      )}

                      {(viewingReport as any).social_q2 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">2. 사회화 훈련 빈도</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q2', (viewingReport as any).social_q2)}</td></tr>
                      )}

                      {(viewingReport as any).social_q3 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">3. 복잡하고 사람이 많은 곳에서의 반응</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q3', (viewingReport as any).social_q3)}</td></tr>
                      )}
                      {(viewingReport as any).social_q3_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q3_other}</td></tr>
                      )}

                      {(viewingReport as any).social_q4 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">4. 계단 이용</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q4', (viewingReport as any).social_q4)}</td></tr>
                      )}
                      {(viewingReport as any).social_q4_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q4_other}</td></tr>
                      )}

                      {(viewingReport as any).social_q5 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">5. 에스컬레이터 이용</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q5', (viewingReport as any).social_q5)}</td></tr>
                      )}
                      {(viewingReport as any).social_q5_direction && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">방향</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q5_direction}</td></tr>
                      )}
                      {(viewingReport as any).social_q5_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q5_other}</td></tr>
                      )}

                      {(viewingReport as any).social_q6 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">6. 승용차 이용</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q6', (viewingReport as any).social_q6)}</td></tr>
                      )}
                      {(viewingReport as any).social_q6_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q6_other}</td></tr>
                      )}

                      {(viewingReport as any).social_q7 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">7. 버스 이용</td><td className="border border-neutral-300 px-4 py-2">{getAnswerText('social_q7', (viewingReport as any).social_q7)}</td></tr>
                      )}
                      {(viewingReport as any).social_q7_when && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">시간</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q7_when}</td></tr>
                      )}
                      {(viewingReport as any).social_q7_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q7_other}</td></tr>
                      )}

                      {(viewingReport as any).social_q8 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">8. 지하철 이용</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q8}</td></tr>
                      )}
                      {(viewingReport as any).social_q8_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q8_other}</td></tr>
                      )}

                      {(viewingReport as any).social_q9 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">9. 기차 이용</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q9}</td></tr>
                      )}
                      {(viewingReport as any).social_q9_other && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold pl-8">기타</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q9_other}</td></tr>
                      )}

                      {(viewingReport as any).social_q10 && (
                        <tr><td className="border border-neutral-300 px-4 py-2 font-semibold">10. 사회화 훈련 중 가장 어려운 점</td><td className="border border-neutral-300 px-4 py-2">{(viewingReport as any).social_q10}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 피드백 섹션 */}
            <div className="p-6 bg-neutral-50 border-t border-neutral-200">
              <h4 className="text-lg font-bold text-neutral-800 mb-4">관리자 피드백</h4>

              {/* 기존 피드백 표시 */}
              {(viewingReport as any).feedback && (
                <div className="mb-4 bg-white p-4 rounded-lg border border-neutral-300">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm text-neutral-600">
                      작성자: {(viewingReport as any).feedbackAuthor || '관리자'}
                    </span>
                    {(viewingReport as any).feedbackDate && (
                      <span className="text-sm text-neutral-500">
                        {new Date((viewingReport as any).feedbackDate).toLocaleString('ko-KR')}
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-800 whitespace-pre-wrap">{(viewingReport as any).feedback}</p>
                </div>
              )}

              {/* 관리자만 피드백 작성/수정 가능 */}
              {user?.role === 'admin' && (
                <div>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="피드백을 작성하세요..."
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-3"
                    rows={4}
                  />
                  <button
                    onClick={() => saveFeedback(viewingReport.id)}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    피드백 저장
                  </button>
                </div>
              )}

              {/* 작성자는 피드백을 읽기만 가능 */}
              {user?.role !== 'admin' && !(viewingReport as any).feedback && (
                <p className="text-neutral-500 text-center py-4">아직 피드백이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
