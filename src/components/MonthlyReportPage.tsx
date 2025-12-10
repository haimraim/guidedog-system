/**
 * 월간 보고서 작성 페이지 (퍼피티칭 전용)
 * 원본 사양 그대로 구현
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { MonthlyReport } from '../types/types';
import { generateId } from '../utils/storage';

export const MonthlyReportPage = () => {
  const { user } = useAuth();
  const [reportMonth, setReportMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // 집에서의 품행
  const [q1, setQ1] = useState('');
  const [q1_time2, setQ1_time2] = useState('');
  const [q1_time3, setQ1_time3] = useState('');
  const [q1_type4, setQ1_type4] = useState('');
  const [q1_other, setQ1_other] = useState('');

  const [q2, setQ2] = useState('');
  const [q2_food, setQ2_food] = useState('');
  const [q2_other, setQ2_other] = useState('');

  const [q3, setQ3] = useState('');

  const [q4, setQ4] = useState<string[]>([]);
  const [q4_other, setQ4_other] = useState('');

  const [q5_state, setQ5_state] = useState('');
  const [q5_time, setQ5_time] = useState('');

  const [q6, setQ6] = useState<string[]>([]);
  const [q6_other, setQ6_other] = useState('');

  const [q7, setQ7] = useState<string[]>([]);
  const [q7_other, setQ7_other] = useState('');

  const [q8, setQ8] = useState('');
  const [q8_count, setQ8_count] = useState('');
  const [q8_situation, setQ8_situation] = useState('');

  const [q9, setQ9] = useState('');
  const [q9_count, setQ9_count] = useState('');
  const [q9_situation, setQ9_situation] = useState('');

  const [q10, setQ10] = useState('');
  const [q10_other, setQ10_other] = useState('');

  const [q11, setQ11] = useState('');
  const [q11_other, setQ11_other] = useState('');

  const [q12_commands, setQ12_commands] = useState<string[]>([]);
  const [q12_wait_state, setQ12_wait_state] = useState('');
  const [q12_wait_time, setQ12_wait_time] = useState('');
  const [q12_wait_level, setQ12_wait_level] = useState<string[]>([]);

  const [q13, setQ13] = useState('');
  const [q13_other, setQ13_other] = useState('');

  const [q14_behavior, setQ14_behavior] = useState('');
  const [q14_posture, setQ14_posture] = useState('');
  const [q14_frequency, setQ14_frequency] = useState('');
  const [q14_other, setQ14_other] = useState('');

  const [q15_behavior, setQ15_behavior] = useState('');
  const [q15_posture, setQ15_posture] = useState('');
  const [q15_frequency, setQ15_frequency] = useState('');
  const [q15_other, setQ15_other] = useState('');

  const [q16_good, setQ16_good] = useState<string[]>([]);
  const [q16_uncomfortable, setQ16_uncomfortable] = useState<string[]>([]);
  const [q16_posture, setQ16_posture] = useState('');
  const [q16_frequency, setQ16_frequency] = useState('');
  const [q16_bleeding, setQ16_bleeding] = useState('');
  const [q16_other, setQ16_other] = useState('');

  const [q17, setQ17] = useState('');
  const [q17_posture, setQ17_posture] = useState('');
  const [q17_reason, setQ17_reason] = useState('');
  const [q17_other, setQ17_other] = useState('');

  const [q18, setQ18] = useState('');
  const [q18_treat, setQ18_treat] = useState('');
  const [q18_bite, setQ18_bite] = useState<string[]>([]);
  const [q18_other, setQ18_other] = useState('');

  const [q19, setQ19] = useState('');
  const [q19_count, setQ19_count] = useState('');
  const [q19_type, setQ19_type] = useState('');
  const [q19_situation, setQ19_situation] = useState('');

  const [q20, setQ20] = useState('');
  const [q20_other, setQ20_other] = useState('');

  const [q21, setQ21] = useState('');

  // DT 품행 기록
  const [dt1_minutes, setDt1_minutes] = useState('');
  const [dt2_minutes, setDt2_minutes] = useState('');
  const [dt_indoor_blocked, setDt_indoor_blocked] = useState('');
  const [dt_indoor_type, setDt_indoor_type] = useState('');
  const [dt_belt, setDt_belt] = useState('');
  const [dt1_location, setDt1_location] = useState('');
  const [dt2_location, setDt2_location] = useState('');
  const [dt_accident, setDt_accident] = useState('');
  const [dt_accident_type, setDt_accident_type] = useState<string[]>([]);
  const [dt_before_walk, setDt_before_walk] = useState<string[]>([]);
  const [dt_signal, setDt_signal] = useState<string[]>([]);
  const [dt_signal_other, setDt_signal_other] = useState('');
  const [dt_current_problem, setDt_current_problem] = useState('');

  // 보행 훈련
  const [walk_time, setWalk_time] = useState('');
  const [walk_schedule, setWalk_schedule] = useState('');
  const [walk_coat, setWalk_coat] = useState('');
  const [walk_coat_other, setWalk_coat_other] = useState('');
  const [walk_headcollar, setWalk_headcollar] = useState('');
  const [walk_treat, setWalk_treat] = useState('');
  const [walk_speed, setWalk_speed] = useState('');
  const [walk_speed_other, setWalk_speed_other] = useState('');
  const [walk_behavior, setWalk_behavior] = useState('');
  const [walk_behavior_other, setWalk_behavior_other] = useState('');
  const [walk_animal, setWalk_animal] = useState('');
  const [walk_animal_priority, setWalk_animal_priority] = useState('');
  const [walk_animal_other, setWalk_animal_other] = useState('');
  const [walk_people, setWalk_people] = useState('');
  const [walk_people_target, setWalk_people_target] = useState('');
  const [walk_people_other, setWalk_people_other] = useState('');
  const [walk_fear_objects, setWalk_fear_objects] = useState('');
  const [walk_interests, setWalk_interests] = useState('');

  // 사회화 훈련
  const [social_places, setSocial_places] = useState('');
  const [social_frequency, setSocial_frequency] = useState('');
  const [social_crowd, setSocial_crowd] = useState('');
  const [social_crowd_other, setSocial_crowd_other] = useState('');
  const [social_stairs, setSocial_stairs] = useState('');
  const [social_stairs_other, setSocial_stairs_other] = useState('');
  const [social_escalator, setSocial_escalator] = useState('');
  const [social_escalator_other, setSocial_escalator_other] = useState('');
  const [social_car, setSocial_car] = useState('');
  const [social_car_other, setSocial_car_other] = useState('');
  const [social_bus, setSocial_bus] = useState('');
  const [social_bus_other, setSocial_bus_other] = useState('');
  const [social_subway, setSocial_subway] = useState<string[]>([]);
  const [social_subway_other, setSocial_subway_other] = useState('');
  const [social_cafe, setSocial_cafe] = useState('');
  const [social_cafe_other, setSocial_cafe_other] = useState('');
  const [social_difficulties, setSocial_difficulties] = useState('');

  const handleCheckboxChange = (currentArray: string[], value: string, setter: (val: string[]) => void) => {
    if (currentArray.includes(value)) {
      setter(currentArray.filter(v => v !== value));
    } else {
      setter([...currentArray, value]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportMonth) {
      alert('보고 월을 선택해주세요.');
      return;
    }

    const monthlyReport = {
      id: generateId(),
      userId: user?.id || '',
      userName: user?.name || '',
      dogName: user?.dogName || '',
      reportMonth,
      // 모든 답변 데이터
      q1, q1_time2, q1_time3, q1_type4, q1_other,
      q2, q2_food, q2_other,
      q3,
      q4, q4_other,
      q5_state, q5_time,
      q6, q6_other,
      q7, q7_other,
      q8, q8_count, q8_situation,
      q9, q9_count, q9_situation,
      q10, q10_other,
      q11, q11_other,
      q12_commands, q12_wait_state, q12_wait_time, q12_wait_level,
      q13, q13_other,
      q14_behavior, q14_posture, q14_frequency, q14_other,
      q15_behavior, q15_posture, q15_frequency, q15_other,
      q16_good, q16_uncomfortable, q16_posture, q16_frequency, q16_bleeding, q16_other,
      q17, q17_posture, q17_reason, q17_other,
      q18, q18_treat, q18_bite, q18_other,
      q19, q19_count, q19_type, q19_situation,
      q20, q20_other,
      q21,
      dt1_minutes, dt2_minutes, dt_indoor_blocked, dt_indoor_type, dt_belt,
      dt1_location, dt2_location, dt_accident, dt_accident_type,
      dt_before_walk, dt_signal, dt_signal_other, dt_current_problem,
      walk_time, walk_schedule, walk_coat, walk_coat_other,
      walk_headcollar, walk_treat, walk_speed, walk_speed_other,
      walk_behavior, walk_behavior_other, walk_animal, walk_animal_priority, walk_animal_other,
      walk_people, walk_people_target, walk_people_other,
      walk_fear_objects, walk_interests,
      social_places, social_frequency, social_crowd, social_crowd_other,
      social_stairs, social_stairs_other, social_escalator, social_escalator_other,
      social_car, social_car_other, social_bus, social_bus_other,
      social_subway, social_subway_other, social_cafe, social_cafe_other,
      social_difficulties,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('월간 보고서:', monthlyReport);
    alert('월간 보고서가 저장되었습니다.');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">월간 보고서 작성</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 보고 월 선택 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              보고 월 *
            </label>
            <input
              type="month"
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
          </div>

          {/* 집에서의 품행 */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded">집에서의 품행</h3>

            {/* 질문 1 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">1. 크레이트(팬스)를 닫았을 때 안에서의 행동</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q1" value="1" checked={q1==='1'} onChange={(e)=>setQ1(e.target.value)} className="mt-1 mr-2" />
                  <span>① 편안하게 있는다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q1" value="2" checked={q1==='2'} onChange={(e)=>setQ1(e.target.value)} className="mt-1 mr-2" />
                  <span>② 낑낑거리다 곧 편안해 진다. (편안해 질때까지 걸리는 시간: <input type="text" value={q1_time2} onChange={(e)=>setQ1_time2(e.target.value)} className="border-b border-gray-400 px-2 w-24 mx-1" />)</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q1" value="3" checked={q1==='3'} onChange={(e)=>setQ1(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 짖다가 곧 편안히 있는다. (편안해 질때까지 걸리는 시간: <input type="text" value={q1_time3} onChange={(e)=>setQ1_time3(e.target.value)} className="border-b border-gray-400 px-2 w-24 mx-1" />)</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q1" value="4" checked={q1==='4'} onChange={(e)=>setQ1(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 무언가를 씹는다. (씹는 종류: <input type="text" value={q1_type4} onChange={(e)=>setQ1_type4(e.target.value)} className="border-b border-gray-400 px-2 w-32 mx-1" />)</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q1" value="5" checked={q1==='5'} onChange={(e)=>setQ1(e.target.value)} className="mt-1 mr-2" />
                  <span>⑤ 자리를 잡지 못하고 지속적으로 불안해 한다.</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q1_other} onChange={(e)=>setQ1_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 2 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">2. 사람 음식에 대한 반응</p>
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
                <label className="flex items-start">
                  <input type="radio" name="q2" value="5" checked={q2==='5'} onChange={(e)=>setQ2(e.target.value)} className="mt-1 mr-2" />
                  <span>⑤ 기회가 있으면 훔쳐 먹기도 한다. (먹은 음식: <input type="text" value={q2_food} onChange={(e)=>setQ2_food(e.target.value)} className="border-b border-gray-400 px-2 w-32 mx-1" />)</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q2_other} onChange={(e)=>setQ2_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 3 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">3. 혼자 있을 때 상태</p>
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
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">4. 혼자 있을 때 반응</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="checkbox" checked={q4.includes('1')} onChange={()=>handleCheckboxChange(q4,'1',setQ4)} className="mt-1 mr-2" />
                  <span>① 짖음 있음 (한번, 여러번, 계속)</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q4.includes('2')} onChange={()=>handleCheckboxChange(q4,'2',setQ4)} className="mt-1 mr-2" />
                  <span>② 낑낑 거림</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q4.includes('3')} onChange={()=>handleCheckboxChange(q4,'3',setQ4)} className="mt-1 mr-2" />
                  <span>③ 이불이나 크레이트, 다른 물건 등을 뜯는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q4.includes('4')} onChange={()=>handleCheckboxChange(q4,'4',setQ4)} className="mt-1 mr-2" />
                  <span>④ 편안하게 쉼</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: 예)현관앞을 떠나지 않음 , 쇼파 위에 올라감 </span>
                  <input type="text" value={q4_other} onChange={(e)=>setQ4_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 5 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">5. 혼자 있어 본 최장시간과 상태</p>
              <div className="ml-4 space-y-2">
                <div>
                  <span>(크레이트, 팬스, 풀린 상태 </span>
                  <input type="text" value={q5_state} onChange={(e)=>setQ5_state(e.target.value)} className="border-b border-gray-400 px-2 w-32 mx-1" />
                  <input type="text" value={q5_time} onChange={(e)=>setQ5_time(e.target.value)} className="border-b border-gray-400 px-2 w-24 mx-1" />
                  <span> 시간)</span>
                </div>
              </div>
            </div>

            {/* 질문 6 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">6. 손님이 왔을 때의 반응</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="checkbox" checked={q6.includes('1')} onChange={()=>handleCheckboxChange(q6,'1',setQ6)} className="mt-1 mr-2" />
                  <span>① 흥분하며 점프 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q6.includes('2')} onChange={()=>handleCheckboxChange(q6,'2',setQ6)} className="mt-1 mr-2" />
                  <span>② 흥분해서 짖는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q6.includes('3')} onChange={()=>handleCheckboxChange(q6,'3',setQ6)} className="mt-1 mr-2" />
                  <span>③ 흥분하고 좋아하나 점프는 하지 않는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q6.includes('4')} onChange={()=>handleCheckboxChange(q6,'4',setQ6)} className="mt-1 mr-2" />
                  <span>④ 옷이나 손 등에 입질을 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q6.includes('5')} onChange={()=>handleCheckboxChange(q6,'5',setQ6)} className="mt-1 mr-2" />
                  <span>⑤ 소변을 지린다.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q6.includes('6')} onChange={()=>handleCheckboxChange(q6,'6',setQ6)} className="mt-1 mr-2" />
                  <span>⑥ 별로 관심 없다</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q6.includes('7')} onChange={()=>handleCheckboxChange(q6,'7',setQ6)} className="mt-1 mr-2" />
                  <span>⑦ 별로 좋아하지 않는다. (크레이트로 들어감, 털을 세우며 경계, 으르렁)</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q6_other} onChange={(e)=>setQ6_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 7 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">7. 가족이 귀가했을 때의 반응</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="checkbox" checked={q7.includes('1')} onChange={()=>handleCheckboxChange(q7,'1',setQ7)} className="mt-1 mr-2" />
                  <span>① 흥분하며 점프 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q7.includes('2')} onChange={()=>handleCheckboxChange(q7,'2',setQ7)} className="mt-1 mr-2" />
                  <span>② 흥분해서 짖는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q7.includes('3')} onChange={()=>handleCheckboxChange(q7,'3',setQ7)} className="mt-1 mr-2" />
                  <span>③ 흥분하고 좋아하나 점프는 하지 않는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q7.includes('4')} onChange={()=>handleCheckboxChange(q7,'4',setQ7)} className="mt-1 mr-2" />
                  <span>④ 옷이나 손 등에 입질을 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q7.includes('5')} onChange={()=>handleCheckboxChange(q7,'5',setQ7)} className="mt-1 mr-2" />
                  <span>⑤ 소변을 지린다.</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q7.includes('6')} onChange={()=>handleCheckboxChange(q7,'6',setQ7)} className="mt-1 mr-2" />
                  <span>⑥ 별로 관심 없다</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={q7.includes('7')} onChange={()=>handleCheckboxChange(q7,'7',setQ7)} className="mt-1 mr-2" />
                  <span>⑦ 별로 좋아하지 않는다. (크레이트로 들어감, 털을 세우며 경계, 으르렁)</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q7_other} onChange={(e)=>setQ7_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 8 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">8. 집에 있는 상황에서 짖은 적이 있나요?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q8" value="1" checked={q8==='1'} onChange={(e)=>setQ8(e.target.value)} className="mt-1 mr-2" />
                  <span>① 있다. (횟수: <input type="text" value={q8_count} onChange={(e)=>setQ8_count(e.target.value)} className="border-b border-gray-400 px-2 w-20 mx-1" /> 상황: <input type="text" value={q8_situation} onChange={(e)=>setQ8_situation(e.target.value)} className="border-b border-gray-400 px-2 w-48 mx-1" />)</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q8" value="2" checked={q8==='2'} onChange={(e)=>setQ8(e.target.value)} className="mt-1 mr-2" />
                  <span>② 없다.</span>
                </label>
              </div>
            </div>

            {/* 질문 9 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">9. 으르렁 거린 적이 있나요?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q9" value="1" checked={q9==='1'} onChange={(e)=>setQ9(e.target.value)} className="mt-1 mr-2" />
                  <span>① 있다. (횟수: <input type="text" value={q9_count} onChange={(e)=>setQ9_count(e.target.value)} className="border-b border-gray-400 px-2 w-20 mx-1" /> 상황: <input type="text" value={q9_situation} onChange={(e)=>setQ9_situation(e.target.value)} className="border-b border-gray-400 px-2 w-48 mx-1" />)</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q9" value="2" checked={q9==='2'} onChange={(e)=>setQ9(e.target.value)} className="mt-1 mr-2" />
                  <span>② 없다.</span>
                </label>
              </div>
            </div>

            {/* 질문 10 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">10. 개의 잘못된 행동(입질,짖음,점프,이물섭취 등)을 사람이 컨트롤 했을 때의 반응</p>
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
                  <input type="text" value={q10_other} onChange={(e)=>setQ10_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 11 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">11. 장난감이나 콩, 껌을 물고 있는 강아지에게 "놔 or 그만"을 했을 때 반응은?</p>
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
                  <input type="text" value={q11_other} onChange={(e)=>setQ11_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 12 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">12. 집안에서 기본훈련(앉아 / 엎드려 / 서 )에 대한 강아지의 수준은?</p>
              <div className="space-y-3 ml-4">
                <div>
                  <p className="mb-2">① 한번 명령어에 바로 실시한다. *O표 하세요</p>
                  <div className="ml-4 space-x-4">
                    <label><input type="checkbox" checked={q12_commands.includes('앉아')} onChange={()=>handleCheckboxChange(q12_commands,'앉아',setQ12_commands)} className="mr-1" />앉아</label>
                    <label><input type="checkbox" checked={q12_commands.includes('엎드려')} onChange={()=>handleCheckboxChange(q12_commands,'엎드려',setQ12_commands)} className="mr-1" />엎드려</label>
                    <label><input type="checkbox" checked={q12_commands.includes('서')} onChange={()=>handleCheckboxChange(q12_commands,'서',setQ12_commands)} className="mr-1" />서</label>
                    <label><input type="checkbox" checked={q12_commands.includes('기다려')} onChange={()=>handleCheckboxChange(q12_commands,'기다려',setQ12_commands)} className="mr-1" />기다려</label>
                  </div>
                </div>
                <div>
                  <p>② 명령어를 아직 잘 모르는것 같다. (위에서 해당하는 것에 표시)</p>
                </div>
                <div>
                  <p>③ '기다려' 할 수 있는 시간</p>
                  <div className="ml-4">
                    <span>상태: </span>
                    <input type="text" value={q12_wait_state} onChange={(e)=>setQ12_wait_state(e.target.value)} className="border-b border-gray-400 px-2 w-32 mx-1" />
                    <span> 시간: </span>
                    <input type="text" value={q12_wait_time} onChange={(e)=>setQ12_wait_time(e.target.value)} className="border-b border-gray-400 px-2 w-24 mx-1" />
                  </div>
                </div>
                <div>
                  <p className="mb-2">④ '기다려' 할 수 있는 수준</p>
                  <div className="ml-4 flex flex-wrap gap-2">
                    <label><input type="checkbox" checked={q12_wait_level.includes('바로옆')} onChange={()=>handleCheckboxChange(q12_wait_level,'바로옆',setQ12_wait_level)} className="mr-1" />바로옆</label>
                    <label><input type="checkbox" checked={q12_wait_level.includes('몇발자국떨어져서')} onChange={()=>handleCheckboxChange(q12_wait_level,'몇발자국떨어져서',setQ12_wait_level)} className="mr-1" />몇발자국 떨어져서</label>
                    <label><input type="checkbox" checked={q12_wait_level.includes('사람왔다갔다')} onChange={()=>handleCheckboxChange(q12_wait_level,'사람왔다갔다',setQ12_wait_level)} className="mr-1" />사람이 왔다갔다 함</label>
                    <label><input type="checkbox" checked={q12_wait_level.includes('개몸넘어다님')} onChange={()=>handleCheckboxChange(q12_wait_level,'개몸넘어다님',setQ12_wait_level)} className="mr-1" />개의 몸을 넘어다님</label>
                    <label><input type="checkbox" checked={q12_wait_level.includes('사람사라짐')} onChange={()=>handleCheckboxChange(q12_wait_level,'사람사라짐',setQ12_wait_level)} className="mr-1" />사람이 안보이는 곳으로 사라짐</label>
                  </div>
                </div>
              </div>
            </div>

            {/* 질문 13 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">13. 바디핸들링이나 배를 보이며 눕히기를 했을때 강아지의 행동은?</p>
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
                  <input type="text" value={q13_other} onChange={(e)=>setQ13_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 14 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">14. 이를 닦을 때 품행</p>
              <div className="space-y-3 ml-4">
                <div>
                  <span>자세: </span>
                  <input type="text" value={q14_posture} onChange={(e)=>setQ14_posture(e.target.value)} placeholder="누워서, 앉아서" className="border-b border-gray-400 px-2 w-32 mx-1" />
                  <span> / 횟수: 주 </span>
                  <input type="text" value={q14_frequency} onChange={(e)=>setQ14_frequency(e.target.value)} className="border-b border-gray-400 px-2 w-16 mx-1" />
                  <span> 회</span>
                </div>
                <label className="flex items-start">
                  <input type="radio" name="q14" value="1" checked={q14_behavior==='1'} onChange={(e)=>setQ14_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>① 이 닦는 것을 좋아하며 편안히 있는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q14" value="2" checked={q14_behavior==='2'} onChange={(e)=>setQ14_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>② 이 닦는 것을 좋아하지만 칫솔을 씹는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q14" value="3" checked={q14_behavior==='3'} onChange={(e)=>setQ14_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 칫솔을 가까이하면 고개를 돌린다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q14" value="4" checked={q14_behavior==='4'} onChange={(e)=>setQ14_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 이 닦는 것을 싫어해서 도망 다닌다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q14" value="5" checked={q14_behavior==='5'} onChange={(e)=>setQ14_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>⑤ 이를 닦으려고 하면 털을 세우고 공격적인 반응을 보인다.</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q14_other} onChange={(e)=>setQ14_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 15 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">15. 그루밍(빗질) 할 때의 품행</p>
              <div className="space-y-3 ml-4">
                <div>
                  <span>자세: </span>
                  <input type="text" value={q15_posture} onChange={(e)=>setQ15_posture(e.target.value)} className="border-b border-gray-400 px-2 w-32 mx-1" />
                  <span> / 횟수: 주 </span>
                  <input type="text" value={q15_frequency} onChange={(e)=>setQ15_frequency(e.target.value)} className="border-b border-gray-400 px-2 w-16 mx-1" />
                  <span> 회</span>
                </div>
                <label className="flex items-start">
                  <input type="radio" name="q15" value="1" checked={q15_behavior==='1'} onChange={(e)=>setQ15_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>① 그루밍 하는 것을 좋아하며 편안히 잘 있는다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q15" value="2" checked={q15_behavior==='2'} onChange={(e)=>setQ15_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>② 그루밍 하는 것을 좋아하지만 가만히 있지 못하고 자꾸 움직인다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q15" value="3" checked={q15_behavior==='3'} onChange={(e)=>setQ15_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 고무빗을 가지고 놀려고 한다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q15" value="4" checked={q15_behavior==='4'} onChange={(e)=>setQ15_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 반대로 자세를 바꾸는 것에 대해 거부감을 보인다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q15" value="5" checked={q15_behavior==='5'} onChange={(e)=>setQ15_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>⑤ 그루밍 하는 것을 싫어해서 불러도 잘 오지 않고 도망 다닌다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q15" value="6" checked={q15_behavior==='6'} onChange={(e)=>setQ15_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>⑥ 그루밍 하는 것을 싫어해서 빗질 도중에 이를 드러내며 입질을 한다.</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q15_other} onChange={(e)=>setQ15_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 16 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">16. 발톱/발털손질 할 때의 품행</p>
              <div className="space-y-3 ml-4">
                <div>
                  <span>자세: </span>
                  <input type="text" value={q16_posture} onChange={(e)=>setQ16_posture(e.target.value)} placeholder="옆으로 누워, 배를 위로 향해" className="border-b border-gray-400 px-2 w-40 mx-1" />
                  <span> / 횟수: 주 </span>
                  <input type="text" value={q16_frequency} onChange={(e)=>setQ16_frequency(e.target.value)} className="border-b border-gray-400 px-2 w-16 mx-1" />
                  <span> 회</span>
                </div>
                <div>
                  <p className="mb-2">① 편안하게 잘 하는 것에 표시하세요</p>
                  <div className="ml-4 space-x-4">
                    <label><input type="checkbox" checked={q16_good.includes('발톱손질')} onChange={()=>handleCheckboxChange(q16_good,'발톱손질',setQ16_good)} className="mr-1" />발톱손질</label>
                    <label><input type="checkbox" checked={q16_good.includes('발털손질')} onChange={()=>handleCheckboxChange(q16_good,'발털손질',setQ16_good)} className="mr-1" />발털손질</label>
                  </div>
                </div>
                <div>
                  <p className="mb-2">② 불편해하는 부위에 표시하세요</p>
                  <div className="ml-4 space-x-4">
                    <label><input type="checkbox" checked={q16_uncomfortable.includes('앞발')} onChange={()=>handleCheckboxChange(q16_uncomfortable,'앞발',setQ16_uncomfortable)} className="mr-1" />앞발</label>
                    <label><input type="checkbox" checked={q16_uncomfortable.includes('뒷발')} onChange={()=>handleCheckboxChange(q16_uncomfortable,'뒷발',setQ16_uncomfortable)} className="mr-1" />뒷발</label>
                  </div>
                </div>
                <p>③ 누워는 있으나 입질을 하려고 한다.</p>
                <p>④ 몸이 경직된 상태로 누워서 발을 빼거나 밀어내려고 한다.</p>
                <div>
                  <span>⑤ 불러도 잘 오지 않고 도망 가려고 한다. (과거에 피가 난 적이 있나요? </span>
                  <select value={q16_bleeding} onChange={(e)=>setQ16_bleeding(e.target.value)} className="border border-gray-400 px-2 py-1 rounded mx-1">
                    <option value="">선택</option>
                    <option value="Y">Y</option>
                    <option value="N">N</option>
                  </select>
                  <span>)</span>
                </div>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q16_other} onChange={(e)=>setQ16_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 17 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">17. 귀청소 할 때의 품행</p>
              <div className="space-y-3 ml-4">
                <div>
                  <span>자세: </span>
                  <input type="text" value={q17_posture} onChange={(e)=>setQ17_posture(e.target.value)} placeholder="누워서, 앉아서" className="border-b border-gray-400 px-2 w-32 mx-1" />
                </div>
                <label className="flex items-start">
                  <input type="radio" name="q17" value="1" checked={q17==='1'} onChange={(e)=>setQ17(e.target.value)} className="mt-1 mr-2" />
                  <span>① 편안하게 잘 받아들인다.</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q17" value="2" checked={q17==='2'} onChange={(e)=>setQ17(e.target.value)} className="mt-1 mr-2" />
                  <span>② 귀세정제를 가져오면 거부감을 보인다. (계기가 있나요? <input type="text" value={q17_reason} onChange={(e)=>setQ17_reason(e.target.value)} className="border-b border-gray-400 px-2 w-48 mx-1" />)</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={q17_other} onChange={(e)=>setQ17_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 18 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">18. 외출 후 발을 닦을 때의 품행</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q18" value="1" checked={q18==='1'} onChange={(e)=>setQ18(e.target.value)} className="mt-1 mr-2" />
                  <span>① 가만히 앉아서 잘 기다린다. (트릿 사용 여부:
                    <select value={q18_treat} onChange={(e)=>setQ18_treat(e.target.value)} className="border border-gray-400 px-2 py-1 rounded mx-1">
                      <option value="">선택</option>
                      <option value="Y">Y</option>
                      <option value="N">N</option>
                    </select>
                  )</span>
                </label>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="q18" value="2" checked={q18==='2'} onChange={(e)=>setQ18(e.target.value)} className="mt-1 mr-2" />
                    <span>② 가만 앉아는 있으나 입질을 하려고 한다.</span>
                  </label>
                  <div className="ml-6 mt-1 space-x-4">
                    <label><input type="checkbox" checked={q18_bite.includes('손')} onChange={()=>handleCheckboxChange(q18_bite,'손',setQ18_bite)} className="mr-1" />손</label>
                    <label><input type="checkbox" checked={q18_bite.includes('물티슈')} onChange={()=>handleCheckboxChange(q18_bite,'물티슈',setQ18_bite)} className="mr-1" />물티슈</label>
                  </div>
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
                  <input type="text" value={q18_other} onChange={(e)=>setQ18_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 19 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">19. 집안의 물건을 망가뜨린 적이 있나요?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="q19" value="1" checked={q19==='1'} onChange={(e)=>setQ19(e.target.value)} className="mt-1 mr-2" />
                  <span>① 있다. (지난 한달간 횟수: <input type="text" value={q19_count} onChange={(e)=>setQ19_count(e.target.value)} className="border-b border-gray-400 px-2 w-20 mx-1" /> 회)</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="q19" value="2" checked={q19==='2'} onChange={(e)=>setQ19(e.target.value)} className="mt-1 mr-2" />
                  <span>② 없다.</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(종류: </span>
                  <input type="text" value={q19_type} onChange={(e)=>setQ19_type(e.target.value)} className="border-b border-gray-400 px-2 w-40 mx-1" />
                  <span className="text-sm"> / 상황: </span>
                  <input type="text" value={q19_situation} onChange={(e)=>setQ19_situation(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-sm" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 20 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">20. 집에서 자녀들과 있을 때의 반응</p>
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
                  <input type="text" value={q20_other} onChange={(e)=>setQ20_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 21 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">21. 현재 품행에 있어 가장 큰 문제는?</p>
              <div className="ml-4">
                <textarea
                  value={q21}
                  onChange={(e)=>setQ21(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="자유롭게 작성해주세요"
                />
              </div>
            </div>
          </div>

          {/* DT 품행 기록 */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded">DT 품행 기록</h3>

            {/* 질문 1 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">1. '하나둘,하나둘' 명령어에 몇분안에 반응하나요?</p>
              <div className="ml-4 space-y-2">
                <div>
                  <span>DT1: </span>
                  <input type="text" value={dt1_minutes} onChange={(e)=>setDt1_minutes(e.target.value)} className="border-b border-gray-400 px-2 w-20 mx-1" />
                  <span> 분</span>
                </div>
                <div>
                  <span>DT2: </span>
                  <input type="text" value={dt2_minutes} onChange={(e)=>setDt2_minutes(e.target.value)} className="border-b border-gray-400 px-2 w-20 mx-1" />
                  <span> 분</span>
                </div>
              </div>
            </div>

            {/* 질문 2 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">2. 실내 배변 장소는 차단해 두었나요?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="dt_indoor_blocked" value="예" checked={dt_indoor_blocked==='예'} onChange={(e)=>setDt_indoor_blocked(e.target.value)} className="mt-1 mr-2" />
                  <span>예</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="dt_indoor_blocked" value="아니오" checked={dt_indoor_blocked==='아니오'} onChange={(e)=>setDt_indoor_blocked(e.target.value)} className="mt-1 mr-2" />
                  <span>아니오</span>
                </label>
              </div>
            </div>

            {/* 질문 3 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">3. 실내배변은 어떤 형태로 하고 있나요?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="dt_indoor_type" value="배변매트" checked={dt_indoor_type==='배변매트'} onChange={(e)=>setDt_indoor_type(e.target.value)} className="mt-1 mr-2" />
                  <span>배변매트</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="dt_indoor_type" value="배변패드" checked={dt_indoor_type==='배변패드'} onChange={(e)=>setDt_indoor_type(e.target.value)} className="mt-1 mr-2" />
                  <span>배변패드</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="dt_indoor_type" value="기타" checked={dt_indoor_type.startsWith('기타')} onChange={(e)=>setDt_indoor_type(e.target.value)} className="mt-1 mr-2" />
                  <span>기타: <input type="text" value={dt_indoor_type.startsWith('기타:') ? dt_indoor_type.substring(3) : ''} onChange={(e)=>setDt_indoor_type('기타:'+e.target.value)} className="border-b border-gray-400 px-2 w-64 mx-1" placeholder="직접 입력" /></span>
                </label>
              </div>
            </div>

            {/* 질문 4 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">4. 배변벨트 사용 여부</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="dt_belt" value="사용안함" checked={dt_belt==='사용안함'} onChange={(e)=>setDt_belt(e.target.value)} className="mt-1 mr-2" />
                  <span>사용안함</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="dt_belt" value="벨트만" checked={dt_belt==='벨트만'} onChange={(e)=>setDt_belt(e.target.value)} className="mt-1 mr-2" />
                  <span>벨트만</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="dt_belt" value="벨트+봉투" checked={dt_belt==='벨트+봉투'} onChange={(e)=>setDt_belt(e.target.value)} className="mt-1 mr-2" />
                  <span>벨트+봉투</span>
                </label>
              </div>
            </div>

            {/* 질문 5 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">5. 배변 장소</p>
              <div className="ml-4 space-y-3">
                <div>
                  <span className="font-medium">DT1: </span>
                  <label className="mr-4">
                    <input type="radio" name="dt1_location" value="실내" checked={dt1_location==='실내'} onChange={(e)=>setDt1_location(e.target.value)} className="mr-1" />
                    실내
                  </label>
                  <label>
                    <input type="radio" name="dt1_location" value="실외" checked={dt1_location==='실외'} onChange={(e)=>setDt1_location(e.target.value)} className="mr-1" />
                    실외
                  </label>
                </div>
                <div>
                  <span className="font-medium">DT2: </span>
                  <label className="mr-4">
                    <input type="radio" name="dt2_location" value="실내" checked={dt2_location==='실내'} onChange={(e)=>setDt2_location(e.target.value)} className="mr-1" />
                    실내
                  </label>
                  <label>
                    <input type="radio" name="dt2_location" value="실외" checked={dt2_location==='실외'} onChange={(e)=>setDt2_location(e.target.value)} className="mr-1" />
                    실외
                  </label>
                </div>
              </div>
            </div>

            {/* 질문 6 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">6. 보행 도중에 DT 실수를 할 때가 있나요?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="dt_accident" value="없음" checked={dt_accident==='없음'} onChange={(e)=>setDt_accident(e.target.value)} className="mt-1 mr-2" />
                  <span>① 거의 없음</span>
                </label>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="dt_accident" value="가끔" checked={dt_accident==='가끔'} onChange={(e)=>setDt_accident(e.target.value)} className="mt-1 mr-2" />
                    <span>② 가끔 있음</span>
                  </label>
                  {dt_accident==='가끔' && (
                    <div className="ml-6 mt-1 space-x-4">
                      <label><input type="checkbox" checked={dt_accident_type.includes('DT1')} onChange={()=>handleCheckboxChange(dt_accident_type,'DT1',setDt_accident_type)} className="mr-1" />DT1</label>
                      <label><input type="checkbox" checked={dt_accident_type.includes('DT2')} onChange={()=>handleCheckboxChange(dt_accident_type,'DT2',setDt_accident_type)} className="mr-1" />DT2</label>
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="dt_accident" value="자주" checked={dt_accident==='자주'} onChange={(e)=>setDt_accident(e.target.value)} className="mt-1 mr-2" />
                    <span>③ 자주 있음</span>
                  </label>
                  {dt_accident==='자주' && (
                    <div className="ml-6 mt-1 space-x-4">
                      <label><input type="checkbox" checked={dt_accident_type.includes('DT1')} onChange={()=>handleCheckboxChange(dt_accident_type,'DT1',setDt_accident_type)} className="mr-1" />DT1</label>
                      <label><input type="checkbox" checked={dt_accident_type.includes('DT2')} onChange={()=>handleCheckboxChange(dt_accident_type,'DT2',setDt_accident_type)} className="mr-1" />DT2</label>
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-start">
                    <input type="radio" name="dt_accident" value="매번" checked={dt_accident==='매번'} onChange={(e)=>setDt_accident(e.target.value)} className="mt-1 mr-2" />
                    <span>④ 매번 있음</span>
                  </label>
                  {dt_accident==='매번' && (
                    <div className="ml-6 mt-1 space-x-4">
                      <label><input type="checkbox" checked={dt_accident_type.includes('DT1')} onChange={()=>handleCheckboxChange(dt_accident_type,'DT1',setDt_accident_type)} className="mr-1" />DT1</label>
                      <label><input type="checkbox" checked={dt_accident_type.includes('DT2')} onChange={()=>handleCheckboxChange(dt_accident_type,'DT2',setDt_accident_type)} className="mr-1" />DT2</label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 질문 7 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">7. 보행 전에 반드시 DT를 하고 걷나요?</p>
              <div className="ml-4 space-x-6">
                <label>
                  <input type="checkbox" checked={dt_before_walk.includes('DT1')} onChange={()=>handleCheckboxChange(dt_before_walk,'DT1',setDt_before_walk)} className="mr-1" />
                  DT1
                </label>
                <label>
                  <input type="checkbox" checked={dt_before_walk.includes('DT2')} onChange={()=>handleCheckboxChange(dt_before_walk,'DT2',setDt_before_walk)} className="mr-1" />
                  DT2
                </label>
              </div>
            </div>

            {/* 질문 8 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">8. 보행 도중 DT를 하고 싶어할 때 특별히 보내는 신호가 있나요?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="checkbox" checked={dt_signal.includes('냄새맡기')} onChange={()=>handleCheckboxChange(dt_signal,'냄새맡기',setDt_signal)} className="mt-1 mr-2" />
                  <span>① 특정 장소에서 냄새를 집중적으로 맡는다</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={dt_signal.includes('멈춤')} onChange={()=>handleCheckboxChange(dt_signal,'멈춤',setDt_signal)} className="mt-1 mr-2" />
                  <span>② 갑자기 멈춰 서서 움직이지 않는다</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={dt_signal.includes('방향전환')} onChange={()=>handleCheckboxChange(dt_signal,'방향전환',setDt_signal)} className="mt-1 mr-2" />
                  <span>③ 특정 방향으로 가려고 한다</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={dt_signal.includes('낑낑')} onChange={()=>handleCheckboxChange(dt_signal,'낑낑',setDt_signal)} className="mt-1 mr-2" />
                  <span>④ 낑낑거리거나 소리를 낸다</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={dt_signal_other} onChange={(e)=>setDt_signal_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 9 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">9. 현재 배변문제가 있다면 어떤 것이 있나요?</p>
              <div className="ml-4">
                <textarea
                  value={dt_current_problem}
                  onChange={(e)=>setDt_current_problem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="자유롭게 작성해주세요"
                />
              </div>
            </div>
          </div>

          {/* 보행 훈련 */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded">보행 훈련</h3>

            {/* 질문 1 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">1. 일일 보행 시간은 얼마나 되나요?</p>
              <div className="ml-4">
                <input type="text" value={walk_time} onChange={(e)=>setWalk_time(e.target.value)} className="border-b border-gray-400 px-2 w-64" placeholder="예) 하루 2회, 회당 30분" />
              </div>
            </div>

            {/* 질문 2 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">2. 보행 스케줄은 어떻게 되나요?</p>
              <div className="ml-4">
                <textarea
                  value={walk_schedule}
                  onChange={(e)=>setWalk_schedule(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="예) 오전 8시, 오후 6시"
                />
              </div>
            </div>

            {/* 질문 3 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">3. 보행 중 코트를 착용하나요?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="walk_coat" value="항상착용" checked={walk_coat==='항상착용'} onChange={(e)=>setWalk_coat(e.target.value)} className="mt-1 mr-2" />
                  <span>① 항상 착용</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_coat" value="가끔착용" checked={walk_coat==='가끔착용'} onChange={(e)=>setWalk_coat(e.target.value)} className="mt-1 mr-2" />
                  <span>② 가끔 착용</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_coat" value="착용안함" checked={walk_coat==='착용안함'} onChange={(e)=>setWalk_coat(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 착용 안함</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={walk_coat_other} onChange={(e)=>setWalk_coat_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 4 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">4. 헤드칼라를 사용하나요?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="walk_headcollar" value="항상사용" checked={walk_headcollar==='항상사용'} onChange={(e)=>setWalk_headcollar(e.target.value)} className="mt-1 mr-2" />
                  <span>① 항상 사용</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_headcollar" value="가끔사용" checked={walk_headcollar==='가끔사용'} onChange={(e)=>setWalk_headcollar(e.target.value)} className="mt-1 mr-2" />
                  <span>② 가끔 사용</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_headcollar" value="사용안함" checked={walk_headcollar==='사용안함'} onChange={(e)=>setWalk_headcollar(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 사용 안함</span>
                </label>
              </div>
            </div>

            {/* 질문 5 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">5. 보행 중 트릿(간식)을 사용하나요?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="walk_treat" value="항상사용" checked={walk_treat==='항상사용'} onChange={(e)=>setWalk_treat(e.target.value)} className="mt-1 mr-2" />
                  <span>① 항상 사용</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_treat" value="필요시사용" checked={walk_treat==='필요시사용'} onChange={(e)=>setWalk_treat(e.target.value)} className="mt-1 mr-2" />
                  <span>② 필요할 때만 사용</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_treat" value="사용안함" checked={walk_treat==='사용안함'} onChange={(e)=>setWalk_treat(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 사용 안함</span>
                </label>
              </div>
            </div>

            {/* 질문 6 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">6. 보행 속도는 어떤가요?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="walk_speed" value="매우빠름" checked={walk_speed==='매우빠름'} onChange={(e)=>setWalk_speed(e.target.value)} className="mt-1 mr-2" />
                  <span>① 매우 빠름 (당기는 편)</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_speed" value="적당" checked={walk_speed==='적당'} onChange={(e)=>setWalk_speed(e.target.value)} className="mt-1 mr-2" />
                  <span>② 적당함</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_speed" value="느림" checked={walk_speed==='느림'} onChange={(e)=>setWalk_speed(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 느림 (끌려다니는 편)</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={walk_speed_other} onChange={(e)=>setWalk_speed_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 7 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">7. 보행 중 주로 나타나는 행동은?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="walk_behavior" value="집중보행" checked={walk_behavior==='집중보행'} onChange={(e)=>setWalk_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>① 집중해서 잘 걷는다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_behavior" value="냄새맡기" checked={walk_behavior==='냄새맡기'} onChange={(e)=>setWalk_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>② 자주 냄새를 맡으려 한다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_behavior" value="산만" checked={walk_behavior==='산만'} onChange={(e)=>setWalk_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 주변에 관심이 많아 산만하다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_behavior" value="당김" checked={walk_behavior==='당김'} onChange={(e)=>setWalk_behavior(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 줄을 많이 당긴다</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={walk_behavior_other} onChange={(e)=>setWalk_behavior_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 8 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">8. 다른 동물(개, 고양이 등)을 만났을 때 반응은?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="walk_animal" value="무관심" checked={walk_animal==='무관심'} onChange={(e)=>setWalk_animal(e.target.value)} className="mt-1 mr-2" />
                  <span>① 관심 없다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_animal" value="관심" checked={walk_animal==='관심'} onChange={(e)=>setWalk_animal(e.target.value)} className="mt-1 mr-2" />
                  <span>② 관심을 보이나 통제 가능하다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_animal" value="흥분" checked={walk_animal==='흥분'} onChange={(e)=>setWalk_animal(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 흥분하며 다가가려 한다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_animal" value="짖음" checked={walk_animal==='짖음'} onChange={(e)=>setWalk_animal(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 짖거나 경계한다</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(우선 관심 대상: </span>
                  <input type="text" value={walk_animal_priority} onChange={(e)=>setWalk_animal_priority(e.target.value)} placeholder="예) 개, 고양이, 새 등" className="border-b border-gray-400 px-2 w-48 mx-1" />
                  <span className="text-sm">)</span>
                </div>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={walk_animal_other} onChange={(e)=>setWalk_animal_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 9 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">9. 보행 중 사람을 만났을 때 반응은?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="walk_people" value="무관심" checked={walk_people==='무관심'} onChange={(e)=>setWalk_people(e.target.value)} className="mt-1 mr-2" />
                  <span>① 관심 없다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_people" value="관심" checked={walk_people==='관심'} onChange={(e)=>setWalk_people(e.target.value)} className="mt-1 mr-2" />
                  <span>② 관심을 보이나 통제 가능하다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_people" value="흥분" checked={walk_people==='흥분'} onChange={(e)=>setWalk_people(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 흥분하며 다가가려 한다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="walk_people" value="경계" checked={walk_people==='경계'} onChange={(e)=>setWalk_people(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 경계하거나 피하려 한다</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(특히 관심 보이는 대상: </span>
                  <input type="text" value={walk_people_target} onChange={(e)=>setWalk_people_target(e.target.value)} placeholder="예) 어린이, 노인, 운동하는 사람 등" className="border-b border-gray-400 px-2 w-64 mx-1" />
                  <span className="text-sm">)</span>
                </div>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={walk_people_other} onChange={(e)=>setWalk_people_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 10 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">10. 보행 중 두려워하거나 피하려는 대상이 있나요?</p>
              <div className="ml-4">
                <textarea
                  value={walk_fear_objects}
                  onChange={(e)=>setWalk_fear_objects(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="예) 자동차, 오토바이 소리, 공사장, 큰 트럭, 우산 등"
                />
              </div>
            </div>

            {/* 질문 11 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">11. 보행 중 가장 관심을 보이는 것은?</p>
              <div className="ml-4">
                <textarea
                  value={walk_interests}
                  onChange={(e)=>setWalk_interests(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="예) 냄새 맡기, 다른 개, 사람, 음식물 찾기, 풀뜯기 등"
                />
              </div>
            </div>
          </div>

          {/* 사회화 훈련 */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded">사회화 훈련</h3>

            {/* 질문 1 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">1. 이번 달 다녀온 장소는?</p>
              <div className="ml-4">
                <textarea
                  value={social_places}
                  onChange={(e)=>setSocial_places(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="예) 마트, 쇼핑몰, 공원, 카페, 식당, 지하철, 버스 등"
                />
              </div>
            </div>

            {/* 질문 2 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">2. 사회화 훈련 빈도는?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="social_frequency" value="주5회이상" checked={social_frequency==='주5회이상'} onChange={(e)=>setSocial_frequency(e.target.value)} className="mt-1 mr-2" />
                  <span>① 주 5회 이상</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_frequency" value="주3-4회" checked={social_frequency==='주3-4회'} onChange={(e)=>setSocial_frequency(e.target.value)} className="mt-1 mr-2" />
                  <span>② 주 3-4회</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_frequency" value="주1-2회" checked={social_frequency==='주1-2회'} onChange={(e)=>setSocial_frequency(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 주 1-2회</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_frequency" value="월1-2회" checked={social_frequency==='월1-2회'} onChange={(e)=>setSocial_frequency(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 월 1-2회</span>
                </label>
              </div>
            </div>

            {/* 질문 3 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">3. 사람이 많은 곳에서의 반응은?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="social_crowd" value="차분" checked={social_crowd==='차분'} onChange={(e)=>setSocial_crowd(e.target.value)} className="mt-1 mr-2" />
                  <span>① 차분하게 잘 있는다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_crowd" value="약간긴장" checked={social_crowd==='약간긴장'} onChange={(e)=>setSocial_crowd(e.target.value)} className="mt-1 mr-2" />
                  <span>② 약간 긴장하지만 적응한다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_crowd" value="흥분" checked={social_crowd==='흥분'} onChange={(e)=>setSocial_crowd(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 흥분하거나 산만해진다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_crowd" value="두려움" checked={social_crowd==='두려움'} onChange={(e)=>setSocial_crowd(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 두려워하거나 피하려 한다</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={social_crowd_other} onChange={(e)=>setSocial_crowd_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 4 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">4. 계단 이용 시 반응은?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="social_stairs" value="잘이용" checked={social_stairs==='잘이용'} onChange={(e)=>setSocial_stairs(e.target.value)} className="mt-1 mr-2" />
                  <span>① 잘 이용한다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_stairs" value="주저" checked={social_stairs==='주저'} onChange={(e)=>setSocial_stairs(e.target.value)} className="mt-1 mr-2" />
                  <span>② 주저하지만 이용 가능하다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_stairs" value="어려움" checked={social_stairs==='어려움'} onChange={(e)=>setSocial_stairs(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 어려워한다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_stairs" value="경험없음" checked={social_stairs==='경험없음'} onChange={(e)=>setSocial_stairs(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 아직 경험해보지 않았다</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={social_stairs_other} onChange={(e)=>setSocial_stairs_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 5 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">5. 에스컬레이터 이용 시 반응은?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="social_escalator" value="잘이용" checked={social_escalator==='잘이용'} onChange={(e)=>setSocial_escalator(e.target.value)} className="mt-1 mr-2" />
                  <span>① 잘 이용한다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_escalator" value="주저" checked={social_escalator==='주저'} onChange={(e)=>setSocial_escalator(e.target.value)} className="mt-1 mr-2" />
                  <span>② 주저하지만 이용 가능하다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_escalator" value="어려움" checked={social_escalator==='어려움'} onChange={(e)=>setSocial_escalator(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 어려워한다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_escalator" value="경험없음" checked={social_escalator==='경험없음'} onChange={(e)=>setSocial_escalator(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 아직 경험해보지 않았다</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={social_escalator_other} onChange={(e)=>setSocial_escalator_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 6 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">6. 자동차 탑승 시 반응은?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="social_car" value="편안" checked={social_car==='편안'} onChange={(e)=>setSocial_car(e.target.value)} className="mt-1 mr-2" />
                  <span>① 편안하게 잘 탄다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_car" value="긴장" checked={social_car==='긴장'} onChange={(e)=>setSocial_car(e.target.value)} className="mt-1 mr-2" />
                  <span>② 약간 긴장하지만 탑승 가능하다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_car" value="어려움" checked={social_car==='어려움'} onChange={(e)=>setSocial_car(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 어려워한다 (구토, 침흘림 등)</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_car" value="경험없음" checked={social_car==='경험없음'} onChange={(e)=>setSocial_car(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 아직 경험해보지 않았다</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={social_car_other} onChange={(e)=>setSocial_car_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 7 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">7. 버스 탑승 시 반응은?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="social_bus" value="편안" checked={social_bus==='편안'} onChange={(e)=>setSocial_bus(e.target.value)} className="mt-1 mr-2" />
                  <span>① 편안하게 잘 탄다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_bus" value="긴장" checked={social_bus==='긴장'} onChange={(e)=>setSocial_bus(e.target.value)} className="mt-1 mr-2" />
                  <span>② 약간 긴장하지만 탑승 가능하다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_bus" value="어려움" checked={social_bus==='어려움'} onChange={(e)=>setSocial_bus(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 어려워한다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_bus" value="경험없음" checked={social_bus==='경험없음'} onChange={(e)=>setSocial_bus(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 아직 경험해보지 않았다</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={social_bus_other} onChange={(e)=>setSocial_bus_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 8 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">8. 지하철 탑승 시 반응은?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="checkbox" checked={social_subway.includes('편안')} onChange={()=>handleCheckboxChange(social_subway,'편안',setSocial_subway)} className="mt-1 mr-2" />
                  <span>① 편안하게 잘 탄다</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={social_subway.includes('긴장')} onChange={()=>handleCheckboxChange(social_subway,'긴장',setSocial_subway)} className="mt-1 mr-2" />
                  <span>② 약간 긴장하지만 탑승 가능하다</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={social_subway.includes('소음두려움')} onChange={()=>handleCheckboxChange(social_subway,'소음두려움',setSocial_subway)} className="mt-1 mr-2" />
                  <span>③ 소음을 두려워한다</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={social_subway.includes('사람두려움')} onChange={()=>handleCheckboxChange(social_subway,'사람두려움',setSocial_subway)} className="mt-1 mr-2" />
                  <span>④ 많은 사람들을 두려워한다</span>
                </label>
                <label className="flex items-start">
                  <input type="checkbox" checked={social_subway.includes('경험없음')} onChange={()=>handleCheckboxChange(social_subway,'경험없음',setSocial_subway)} className="mt-1 mr-2" />
                  <span>⑤ 아직 경험해보지 않았다</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={social_subway_other} onChange={(e)=>setSocial_subway_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 9 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">9. 카페나 식당에서의 반응은?</p>
              <div className="space-y-2 ml-4">
                <label className="flex items-start">
                  <input type="radio" name="social_cafe" value="차분" checked={social_cafe==='차분'} onChange={(e)=>setSocial_cafe(e.target.value)} className="mt-1 mr-2" />
                  <span>① 차분하게 잘 있는다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_cafe" value="산만" checked={social_cafe==='산만'} onChange={(e)=>setSocial_cafe(e.target.value)} className="mt-1 mr-2" />
                  <span>② 약간 산만하지만 통제 가능하다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_cafe" value="음식관심" checked={social_cafe==='음식관심'} onChange={(e)=>setSocial_cafe(e.target.value)} className="mt-1 mr-2" />
                  <span>③ 음식에 관심이 많아 어렵다</span>
                </label>
                <label className="flex items-start">
                  <input type="radio" name="social_cafe" value="경험없음" checked={social_cafe==='경험없음'} onChange={(e)=>setSocial_cafe(e.target.value)} className="mt-1 mr-2" />
                  <span>④ 아직 경험해보지 않았다</span>
                </label>
                <div className="mt-2">
                  <span className="text-sm">(기타: </span>
                  <input type="text" value={social_cafe_other} onChange={(e)=>setSocial_cafe_other(e.target.value)} className="border-b border-gray-400 px-2 w-full max-w-md" />
                  <span className="text-sm">)</span>
                </div>
              </div>
            </div>

            {/* 질문 10 */}
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-semibold text-gray-800 mb-3">10. 사회화 훈련 중 어려움이나 특이사항이 있나요?</p>
              <div className="ml-4">
                <textarea
                  value={social_difficulties}
                  onChange={(e)=>setSocial_difficulties(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={4}
                  placeholder="사회화 훈련 중 겪은 어려움, 개선사항, 특이사항 등을 자유롭게 작성해주세요"
                />
              </div>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex justify-end space-x-4 sticky bottom-0 bg-white pt-4 border-t">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
