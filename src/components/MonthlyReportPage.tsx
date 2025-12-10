/**
 * 월간 보고서 작성 페이지 (퍼피티칭 전용)
 * 모든 질문 포함 버전
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { MonthlyReport } from '../types/types';
import { generateId } from '../utils/storage';

export const MonthlyReportPage = () => {
  const { user } = useAuth();
  const [reportMonth, setReportMonth] = useState('');

  // 1일 다이어리 항목
  const [diaryDate, setDiaryDate] = useState('');
  const [feedings, setFeedings] = useState([{ foodType: '', time: '', amount: '', notes: '' }]);
  const [dt1Records, setDt1Records] = useState([{ time: '', place: '', success: '', accident: '', notes: '' }]);
  const [dt2Records, setDt2Records] = useState([{ time: '', place: '', success: '', accident: '', notes: '' }]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // 집에서의 품행 (21개 질문)
  const [q1_crate, setQ1_crate] = useState('');
  const [q1_crate_detail, setQ1_crate_detail] = useState('');
  const [q2_humanFood, setQ2_humanFood] = useState('');
  const [q2_humanFood_detail, setQ2_humanFood_detail] = useState('');
  const [q3_aloneState, setQ3_aloneState] = useState('');
  const [q4_aloneReaction, setQ4_aloneReaction] = useState('');
  const [q4_aloneReaction_detail, setQ4_aloneReaction_detail] = useState('');
  const [q5_aloneMaxTime, setQ5_aloneMaxTime] = useState('');
  const [q6_guestReaction, setQ6_guestReaction] = useState('');
  const [q6_guestReaction_detail, setQ6_guestReaction_detail] = useState('');
  const [q7_familyReaction, setQ7_familyReaction] = useState('');
  const [q7_familyReaction_detail, setQ7_familyReaction_detail] = useState('');
  const [q8_barkingAtHome, setQ8_barkingAtHome] = useState('');
  const [q8_barkingAtHome_detail, setQ8_barkingAtHome_detail] = useState('');
  const [q9_growling, setQ9_growling] = useState('');
  const [q9_growling_detail, setQ9_growling_detail] = useState('');
  const [q10_controlReaction, setQ10_controlReaction] = useState('');
  const [q10_controlReaction_detail, setQ10_controlReaction_detail] = useState('');
  const [q11_toyReaction, setQ11_toyReaction] = useState('');
  const [q11_toyReaction_detail, setQ11_toyReaction_detail] = useState('');
  const [q12_basicTraining, setQ12_basicTraining] = useState('');
  const [q12_basicTraining_detail, setQ12_basicTraining_detail] = useState('');
  const [q13_bodyHandling, setQ13_bodyHandling] = useState('');
  const [q13_bodyHandling_detail, setQ13_bodyHandling_detail] = useState('');
  const [q14_teethBrushing, setQ14_teethBrushing] = useState('');
  const [q14_teethBrushing_detail, setQ14_teethBrushing_detail] = useState('');
  const [q15_grooming, setQ15_grooming] = useState('');
  const [q15_grooming_detail, setQ15_grooming_detail] = useState('');
  const [q16_nailCare, setQ16_nailCare] = useState('');
  const [q16_nailCare_detail, setQ16_nailCare_detail] = useState('');
  const [q17_earCleaning, setQ17_earCleaning] = useState('');
  const [q17_earCleaning_detail, setQ17_earCleaning_detail] = useState('');
  const [q18_pawCleaning, setQ18_pawCleaning] = useState('');
  const [q18_pawCleaning_detail, setQ18_pawCleaning_detail] = useState('');
  const [q19_damaged, setQ19_damaged] = useState('');
  const [q19_damaged_detail, setQ19_damaged_detail] = useState('');
  const [q20_childrenReaction, setQ20_childrenReaction] = useState('');
  const [q20_childrenReaction_detail, setQ20_childrenReaction_detail] = useState('');
  const [q21_biggestProblem, setQ21_biggestProblem] = useState('');

  // DT 품행 기록
  const [dt_responseTime, setDt_responseTime] = useState('');
  const [dt_indoorBlocked, setDt_indoorBlocked] = useState('');
  const [dt_indoorType, setDt_indoorType] = useState('');
  const [dt_beltUsage, setDt_beltUsage] = useState('');
  const [dt_dt1Location, setDt_dt1Location] = useState('');
  const [dt_dt2Location, setDt_dt2Location] = useState('');
  const [dt_walkingAccident, setDt_walkingAccident] = useState('');
  const [dt_beforeWalk, setDt_beforeWalk] = useState('');
  const [dt_signal, setDt_signal] = useState('');
  const [dt_signal_detail, setDt_signal_detail] = useState('');
  const [dt_currentProblem, setDt_currentProblem] = useState('');

  // 보행 훈련
  const [walk_avgTime, setWalk_avgTime] = useState('');
  const [walk_schedule, setWalk_schedule] = useState('');
  const [walk_coatReaction, setWalk_coatReaction] = useState('');
  const [walk_coatReaction_detail, setWalk_coatReaction_detail] = useState('');
  const [walk_headCollarUsage, setWalk_headCollarUsage] = useState('');
  const [walk_treatUsage, setWalk_treatUsage] = useState('');
  const [walk_speed, setWalk_speed] = useState('');
  const [walk_speed_detail, setWalk_speed_detail] = useState('');
  const [walk_behavior, setWalk_behavior] = useState('');
  const [walk_behavior_detail, setWalk_behavior_detail] = useState('');
  const [walk_animalReaction, setWalk_animalReaction] = useState('');
  const [walk_animalReaction_detail, setWalk_animalReaction_detail] = useState('');
  const [walk_peopleReaction, setWalk_peopleReaction] = useState('');
  const [walk_peopleReaction_detail, setWalk_peopleReaction_detail] = useState('');
  const [walk_fearObjects, setWalk_fearObjects] = useState('');
  const [walk_interests, setWalk_interests] = useState('');

  // 사회화 훈련
  const [social_placesVisited, setSocial_placesVisited] = useState('');
  const [social_frequency, setSocial_frequency] = useState('');
  const [social_crowdReaction, setSocial_crowdReaction] = useState('');
  const [social_crowdReaction_detail, setSocial_crowdReaction_detail] = useState('');
  const [social_stairs, setSocial_stairs] = useState('');
  const [social_stairs_detail, setSocial_stairs_detail] = useState('');
  const [social_escalator, setSocial_escalator] = useState('');
  const [social_escalator_detail, setSocial_escalator_detail] = useState('');
  const [social_car, setSocial_car] = useState('');
  const [social_car_detail, setSocial_car_detail] = useState('');
  const [social_bus, setSocial_bus] = useState('');
  const [social_bus_detail, setSocial_bus_detail] = useState('');
  const [social_subway, setSocial_subway] = useState('');
  const [social_subway_detail, setSocial_subway_detail] = useState('');
  const [social_cafeRestaurant, setSocial_cafeRestaurant] = useState('');
  const [social_cafeRestaurant_detail, setSocial_cafeRestaurant_detail] = useState('');
  const [social_difficulties, setSocial_difficulties] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportMonth) {
      alert('보고 월을 선택해주세요.');
      return;
    }

    const monthlyReport: MonthlyReport = {
      id: generateId(),
      userId: user?.id || '',
      userName: user?.name || '',
      dogName: user?.dogName || '',
      reportMonth,
      diaryDate,
      feedings,
      dt1Records,
      dt2Records,
      additionalNotes,
      q1_crate,
      q1_crate_detail,
      q2_humanFood,
      q2_humanFood_detail,
      q3_aloneState,
      q4_aloneReaction,
      q4_aloneReaction_detail,
      q5_aloneMaxTime,
      q6_guestReaction,
      q6_guestReaction_detail,
      q7_familyReaction,
      q7_familyReaction_detail,
      q8_barkingAtHome,
      q8_barkingAtHome_detail,
      q9_growling,
      q9_growling_detail,
      q10_controlReaction,
      q10_controlReaction_detail,
      q11_toyReaction,
      q11_toyReaction_detail,
      q12_basicTraining,
      q12_basicTraining_detail,
      q13_bodyHandling,
      q13_bodyHandling_detail,
      q14_teethBrushing,
      q14_teethBrushing_detail,
      q15_grooming,
      q15_grooming_detail,
      q16_nailCare,
      q16_nailCare_detail,
      q17_earCleaning,
      q17_earCleaning_detail,
      q18_pawCleaning,
      q18_pawCleaning_detail,
      q19_damaged,
      q19_damaged_detail,
      q20_childrenReaction,
      q20_childrenReaction_detail,
      q21_biggestProblem,
      dt_responseTime,
      dt_indoorBlocked,
      dt_indoorType,
      dt_beltUsage,
      dt_dt1Location,
      dt_dt2Location,
      dt_walkingAccident,
      dt_beforeWalk,
      dt_signal,
      dt_signal_detail,
      dt_currentProblem,
      walk_avgTime,
      walk_schedule,
      walk_coatReaction,
      walk_coatReaction_detail,
      walk_headCollarUsage,
      walk_treatUsage,
      walk_speed,
      walk_speed_detail,
      walk_behavior,
      walk_behavior_detail,
      walk_animalReaction,
      walk_animalReaction_detail,
      walk_peopleReaction,
      walk_peopleReaction_detail,
      walk_fearObjects,
      walk_interests,
      social_placesVisited,
      social_frequency,
      social_crowdReaction,
      social_crowdReaction_detail,
      social_stairs,
      social_stairs_detail,
      social_escalator,
      social_escalator_detail,
      social_car,
      social_car_detail,
      social_bus,
      social_bus_detail,
      social_subway,
      social_subway_detail,
      social_cafeRestaurant,
      social_cafeRestaurant_detail,
      social_difficulties,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 임시로 콘솔에 출력 (저장 기능은 추후 구현)
    console.log('월간 보고서:', monthlyReport);
    alert('월간 보고서가 저장되었습니다. (저장 기능 구현 예정)');
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

          {/* 1일 다이어리 항목 (외출 제외) */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded">1일 다이어리 항목</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  다이어리 날짜
                </label>
                <input
                  type="date"
                  value={diaryDate}
                  onChange={(e) => setDiaryDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* 급식 정보 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  급식 정보
                </label>
                {feedings.map((feeding, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="사료 종류"
                      value={feeding.foodType}
                      onChange={(e) => {
                        const newFeedings = [...feedings];
                        newFeedings[index].foodType = e.target.value;
                        setFeedings(newFeedings);
                      }}
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="시간"
                      value={feeding.time}
                      onChange={(e) => {
                        const newFeedings = [...feedings];
                        newFeedings[index].time = e.target.value;
                        setFeedings(newFeedings);
                      }}
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="급식량"
                      value={feeding.amount}
                      onChange={(e) => {
                        const newFeedings = [...feedings];
                        newFeedings[index].amount = e.target.value;
                        setFeedings(newFeedings);
                      }}
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="메모"
                      value={feeding.notes}
                      onChange={(e) => {
                        const newFeedings = [...feedings];
                        newFeedings[index].notes = e.target.value;
                        setFeedings(newFeedings);
                      }}
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFeedings([...feedings, { foodType: '', time: '', amount: '', notes: '' }])}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold"
                >
                  + 급식 추가
                </button>
              </div>

              {/* DT1 기록 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  DT1 (소변) 기록
                </label>
                {dt1Records.map((record, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                    <input type="text" placeholder="시간" value={record.time}
                      onChange={(e) => { const newRecords = [...dt1Records]; newRecords[index].time = e.target.value; setDt1Records(newRecords); }}
                      className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="text" placeholder="장소" value={record.place}
                      onChange={(e) => { const newRecords = [...dt1Records]; newRecords[index].place = e.target.value; setDt1Records(newRecords); }}
                      className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="text" placeholder="성공" value={record.success}
                      onChange={(e) => { const newRecords = [...dt1Records]; newRecords[index].success = e.target.value; setDt1Records(newRecords); }}
                      className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="text" placeholder="실수" value={record.accident}
                      onChange={(e) => { const newRecords = [...dt1Records]; newRecords[index].accident = e.target.value; setDt1Records(newRecords); }}
                      className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="text" placeholder="관련사항" value={record.notes}
                      onChange={(e) => { const newRecords = [...dt1Records]; newRecords[index].notes = e.target.value; setDt1Records(newRecords); }}
                      className="px-3 py-2 border rounded-lg text-sm" />
                  </div>
                ))}
                <button type="button"
                  onClick={() => setDt1Records([...dt1Records, { time: '', place: '', success: '', accident: '', notes: '' }])}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                  + DT1 추가
                </button>
              </div>

              {/* DT2 기록 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  DT2 (대변) 기록
                </label>
                {dt2Records.map((record, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                    <input type="text" placeholder="시간" value={record.time}
                      onChange={(e) => { const newRecords = [...dt2Records]; newRecords[index].time = e.target.value; setDt2Records(newRecords); }}
                      className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="text" placeholder="장소" value={record.place}
                      onChange={(e) => { const newRecords = [...dt2Records]; newRecords[index].place = e.target.value; setDt2Records(newRecords); }}
                      className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="text" placeholder="성공" value={record.success}
                      onChange={(e) => { const newRecords = [...dt2Records]; newRecords[index].success = e.target.value; setDt2Records(newRecords); }}
                      className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="text" placeholder="실수" value={record.accident}
                      onChange={(e) => { const newRecords = [...dt2Records]; newRecords[index].accident = e.target.value; setDt2Records(newRecords); }}
                      className="px-3 py-2 border rounded-lg text-sm" />
                    <input type="text" placeholder="관련사항" value={record.notes}
                      onChange={(e) => { const newRecords = [...dt2Records]; newRecords[index].notes = e.target.value; setDt2Records(newRecords); }}
                      className="px-3 py-2 border rounded-lg text-sm" />
                  </div>
                ))}
                <button type="button"
                  onClick={() => setDt2Records([...dt2Records, { time: '', place: '', success: '', accident: '', notes: '' }])}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold">
                  + DT2 추가
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  그 밖에 오늘 하고 싶은 말
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* 집에서의 품행 (21개) */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded">집에서의 품행</h3>
            <div className="space-y-4">
              {/* 1. 크레이트 행동 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">1. 크레이트 행동</label>
                <select value={q1_crate} onChange={(e) => setQ1_crate(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="편안하게 있음">편안하게 있음</option>
                  <option value="약간 불안함">약간 불안함</option>
                  <option value="거부 반응">거부 반응</option>
                </select>
                <textarea value={q1_crate_detail} onChange={(e) => setQ1_crate_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 2. 사람 음식 반응 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">2. 사람 음식을 보여줬을 때 반응</label>
                <select value={q2_humanFood} onChange={(e) => setQ2_humanFood(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="무관심">무관심</option>
                  <option value="관심 있으나 차분함">관심 있으나 차분함</option>
                  <option value="흥분함">흥분함</option>
                </select>
                <textarea value={q2_humanFood_detail} onChange={(e) => setQ2_humanFood_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 3. 집에 혼자 있는 상태 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">3. 집에 혼자 있는 상태</label>
                <select value={q3_aloneState} onChange={(e) => setQ3_aloneState(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">선택하세요</option>
                  <option value="크레이트에서">크레이트에서</option>
                  <option value="집 안 자유롭게">집 안 자유롭게</option>
                  <option value="특정 공간에서">특정 공간에서</option>
                </select>
              </div>

              {/* 4. 혼자 남겨질 때 반응 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">4. 혼자 남겨질 때 반응</label>
                <select value={q4_aloneReaction} onChange={(e) => setQ4_aloneReaction(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="조용히 있음">조용히 있음</option>
                  <option value="약간 짖음">약간 짖음</option>
                  <option value="많이 짖음">많이 짖음</option>
                  <option value="물건 파손">물건 파손</option>
                </select>
                <textarea value={q4_aloneReaction_detail} onChange={(e) => setQ4_aloneReaction_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 5. 최대 몇 시간까지 가능한가 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">5. 최대 몇 시간까지 가능한가</label>
                <input type="text" value={q5_aloneMaxTime} onChange={(e) => setQ5_aloneMaxTime(e.target.value)}
                  placeholder="예: 3시간" className="w-full px-3 py-2 border rounded-lg" />
              </div>

              {/* 6. 손님이 왔을 때 반응 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">6. 손님이 왔을 때 반응</label>
                <select value={q6_guestReaction} onChange={(e) => setQ6_guestReaction(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="차분함">차분함</option>
                  <option value="흥분함">흥분함</option>
                  <option value="경계함">경계함</option>
                  <option value="짖음">짖음</option>
                </select>
                <textarea value={q6_guestReaction_detail} onChange={(e) => setQ6_guestReaction_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 7. 가족 구성원 중 특정인에게 보이는 반응 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">7. 가족 구성원 중 특정인에게 보이는 반응</label>
                <select value={q7_familyReaction} onChange={(e) => setQ7_familyReaction(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="모두에게 동일">모두에게 동일</option>
                  <option value="특정인 선호">특정인 선호</option>
                  <option value="특정인 회피">특정인 회피</option>
                </select>
                <textarea value={q7_familyReaction_detail} onChange={(e) => setQ7_familyReaction_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 8. 집안에서 짖는 빈도 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">8. 집안에서 짖는 빈도</label>
                <select value={q8_barkingAtHome} onChange={(e) => setQ8_barkingAtHome(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="거의 없음">거의 없음</option>
                  <option value="가끔">가끔</option>
                  <option value="자주">자주</option>
                </select>
                <textarea value={q8_barkingAtHome_detail} onChange={(e) => setQ8_barkingAtHome_detail(e.target.value)}
                  placeholder="어떤 상황에서 짖는지 설명" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 9. 으르렁거림 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">9. 으르렁거림</label>
                <select value={q9_growling} onChange={(e) => setQ9_growling(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="없음">없음</option>
                  <option value="가끔 있음">가끔 있음</option>
                  <option value="자주 있음">자주 있음</option>
                </select>
                <textarea value={q9_growling_detail} onChange={(e) => setQ9_growling_detail(e.target.value)}
                  placeholder="어떤 상황에서 발생하는지 설명" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 10. 제지했을 때 반응 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">10. 제지했을 때 반응</label>
                <select value={q10_controlReaction} onChange={(e) => setQ10_controlReaction(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="즉시 멈춤">즉시 멈춤</option>
                  <option value="잠시 후 멈춤">잠시 후 멈춤</option>
                  <option value="계속 반복">계속 반복</option>
                </select>
                <textarea value={q10_controlReaction_detail} onChange={(e) => setQ10_controlReaction_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 11. 장난감에 대한 반응 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">11. 장난감에 대한 반응</label>
                <select value={q11_toyReaction} onChange={(e) => setQ11_toyReaction(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="적절히 놀음">적절히 놀음</option>
                  <option value="과도한 집착">과도한 집착</option>
                  <option value="무관심">무관심</option>
                  <option value="파괴함">파괴함</option>
                </select>
                <textarea value={q11_toyReaction_detail} onChange={(e) => setQ11_toyReaction_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 12. 기본 훈련 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">12. 기본 훈련 (앉아, 엎드려, 기다려 등)</label>
                <select value={q12_basicTraining} onChange={(e) => setQ12_basicTraining(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="잘 따름">잘 따름</option>
                  <option value="보통">보통</option>
                  <option value="어려움">어려움</option>
                </select>
                <textarea value={q12_basicTraining_detail} onChange={(e) => setQ12_basicTraining_detail(e.target.value)}
                  placeholder="어떤 명령어를 연습 중인지, 진행 상황" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 13. 바디핸들링 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">13. 바디핸들링 (몸 만지기, 포옹 등)</label>
                <select value={q13_bodyHandling} onChange={(e) => setQ13_bodyHandling(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="편안함">편안함</option>
                  <option value="약간 불편">약간 불편</option>
                  <option value="거부 반응">거부 반응</option>
                </select>
                <textarea value={q13_bodyHandling_detail} onChange={(e) => setQ13_bodyHandling_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 14. 이빨 닦기 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">14. 이빨 닦기</label>
                <select value={q14_teethBrushing} onChange={(e) => setQ14_teethBrushing(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="잘 받아들임">잘 받아들임</option>
                  <option value="약간 거부">약간 거부</option>
                  <option value="거부 반응">거부 반응</option>
                </select>
                <textarea value={q14_teethBrushing_detail} onChange={(e) => setQ14_teethBrushing_detail(e.target.value)}
                  placeholder="빈도, 방법 등" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 15. 빗질 및 드라이기 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">15. 빗질 및 드라이기</label>
                <select value={q15_grooming} onChange={(e) => setQ15_grooming(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="잘 받아들임">잘 받아들임</option>
                  <option value="약간 거부">약간 거부</option>
                  <option value="거부 반응">거부 반응</option>
                </select>
                <textarea value={q15_grooming_detail} onChange={(e) => setQ15_grooming_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 16. 발톱 정리 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">16. 발톱 정리</label>
                <select value={q16_nailCare} onChange={(e) => setQ16_nailCare(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="잘 받아들임">잘 받아들임</option>
                  <option value="약간 거부">약간 거부</option>
                  <option value="거부 반응">거부 반응</option>
                </select>
                <textarea value={q16_nailCare_detail} onChange={(e) => setQ16_nailCare_detail(e.target.value)}
                  placeholder="빈도, 방법 등" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 17. 귀 청소 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">17. 귀 청소</label>
                <select value={q17_earCleaning} onChange={(e) => setQ17_earCleaning(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="잘 받아들임">잘 받아들임</option>
                  <option value="약간 거부">약간 거부</option>
                  <option value="거부 반응">거부 반응</option>
                </select>
                <textarea value={q17_earCleaning_detail} onChange={(e) => setQ17_earCleaning_detail(e.target.value)}
                  placeholder="빈도, 방법 등" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 18. 발 청소 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">18. 발 청소</label>
                <select value={q18_pawCleaning} onChange={(e) => setQ18_pawCleaning(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="잘 받아들임">잘 받아들임</option>
                  <option value="약간 거부">약간 거부</option>
                  <option value="거부 반응">거부 반응</option>
                </select>
                <textarea value={q18_pawCleaning_detail} onChange={(e) => setQ18_pawCleaning_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 19. 파손한 것 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">19. 파손한 것</label>
                <select value={q19_damaged} onChange={(e) => setQ19_damaged(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="없음">없음</option>
                  <option value="가끔 있음">가끔 있음</option>
                  <option value="자주 있음">자주 있음</option>
                </select>
                <textarea value={q19_damaged_detail} onChange={(e) => setQ19_damaged_detail(e.target.value)}
                  placeholder="무엇을 파손했는지, 언제 발생하는지" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 20. 어린이에 대한 반응 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">20. 어린이에 대한 반응</label>
                <select value={q20_childrenReaction} onChange={(e) => setQ20_childrenReaction(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="우호적">우호적</option>
                  <option value="중립적">중립적</option>
                  <option value="회피함">회피함</option>
                  <option value="경계함">경계함</option>
                </select>
                <textarea value={q20_childrenReaction_detail} onChange={(e) => setQ20_childrenReaction_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 21. 가장 큰 문제점 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">21. 현재 가장 큰 문제점이나 개선이 필요한 부분</label>
                <textarea value={q21_biggestProblem} onChange={(e) => setQ21_biggestProblem(e.target.value)}
                  placeholder="자유롭게 작성" className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
              </div>
            </div>
          </div>

          {/* DT 품행 기록 (9개) */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded">DT 품행 기록</h3>
            <div className="space-y-4">
              {/* 1. 배뇨/배변 시 반응 시간 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">1. 배뇨/배변 하고 싶다는 신호를 보낸 후 몇 초 안에 반응을 해야 하는가</label>
                <input type="text" value={dt_responseTime} onChange={(e) => setDt_responseTime(e.target.value)}
                  placeholder="예: 10초, 30초" className="w-full px-3 py-2 border rounded-lg" />
              </div>

              {/* 2. 실내에서 차단 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">2. 실내에서 차단해 놓고 있는가</label>
                <select value={dt_indoorBlocked} onChange={(e) => setDt_indoorBlocked(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">선택하세요</option>
                  <option value="예">예</option>
                  <option value="아니오">아니오</option>
                </select>
              </div>

              {/* 3. 실내 화장실 종류 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">3. 실내 화장실을 사용한다면 어떤 종류인가</label>
                <input type="text" value={dt_indoorType} onChange={(e) => setDt_indoorType(e.target.value)}
                  placeholder="예: 배변패드, 인조잔디 등" className="w-full px-3 py-2 border rounded-lg" />
              </div>

              {/* 4. 벨트 사용 여부 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">4. DT 시 벨트를 사용하는가</label>
                <select value={dt_beltUsage} onChange={(e) => setDt_beltUsage(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">선택하세요</option>
                  <option value="항상 사용">항상 사용</option>
                  <option value="가끔 사용">가끔 사용</option>
                  <option value="사용 안 함">사용 안 함</option>
                </select>
              </div>

              {/* 5. DT1 장소 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">5. DT1(소변) 주로 하는 장소</label>
                <input type="text" value={dt_dt1Location} onChange={(e) => setDt_dt1Location(e.target.value)}
                  placeholder="예: 집 앞 잔디, 공원 등" className="w-full px-3 py-2 border rounded-lg" />
              </div>

              {/* 6. DT2 장소 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">6. DT2(대변) 주로 하는 장소</label>
                <input type="text" value={dt_dt2Location} onChange={(e) => setDt_dt2Location(e.target.value)}
                  placeholder="예: 집 앞 잔디, 공원 등" className="w-full px-3 py-2 border rounded-lg" />
              </div>

              {/* 7. 산책 중 실수 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">7. 산책하러 나가는 중간에 실수를 하는가</label>
                <select value={dt_walkingAccident} onChange={(e) => setDt_walkingAccident(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">선택하세요</option>
                  <option value="없음">없음</option>
                  <option value="가끔">가끔</option>
                  <option value="자주">자주</option>
                </select>
              </div>

              {/* 8. 산책 전 신호 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">8. 산책을 나가기 전에 신호를 보내는가</label>
                <select value={dt_beforeWalk} onChange={(e) => setDt_beforeWalk(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">선택하세요</option>
                  <option value="예">예</option>
                  <option value="아니오">아니오</option>
                </select>
              </div>

              {/* 9. 신호 종류 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">9. 신호를 보낸다면 어떤 신호를 보내는가</label>
                <select value={dt_signal} onChange={(e) => setDt_signal(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="짖음">짖음</option>
                  <option value="긁음">긁음</option>
                  <option value="안절부절">안절부절</option>
                  <option value="기타">기타</option>
                </select>
                <textarea value={dt_signal_detail} onChange={(e) => setDt_signal_detail(e.target.value)}
                  placeholder="상세 설명" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 10. 현재 DT 문제 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">10. 현재 DT와 관련하여 가장 큰 문제점</label>
                <textarea value={dt_currentProblem} onChange={(e) => setDt_currentProblem(e.target.value)}
                  placeholder="자유롭게 작성" className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
              </div>
            </div>
          </div>

          {/* 보행 훈련 (11개) */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded">보행 훈련</h3>
            <div className="space-y-4">
              {/* 1. 평균 산책 시간 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">1. 평균 산책 시간</label>
                <input type="text" value={walk_avgTime} onChange={(e) => setWalk_avgTime(e.target.value)}
                  placeholder="예: 30분, 1시간" className="w-full px-3 py-2 border rounded-lg" />
              </div>

              {/* 2. 산책 일정 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">2. 산책 일정</label>
                <input type="text" value={walk_schedule} onChange={(e) => setWalk_schedule(e.target.value)}
                  placeholder="예: 하루 2회(아침, 저녁)" className="w-full px-3 py-2 border rounded-lg" />
              </div>

              {/* 3. 조끼 착용 반응 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">3. 조끼 착용 시 반응</label>
                <select value={walk_coatReaction} onChange={(e) => setWalk_coatReaction(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="잘 받아들임">잘 받아들임</option>
                  <option value="약간 거부">약간 거부</option>
                  <option value="거부 반응">거부 반응</option>
                </select>
                <textarea value={walk_coatReaction_detail} onChange={(e) => setWalk_coatReaction_detail(e.target.value)}
                  placeholder="착용 시 행동 변화가 있다면 설명" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 4. 헤드칼라 사용 여부 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">4. 헤드칼라(젠틀리더 등) 사용 여부</label>
                <select value={walk_headCollarUsage} onChange={(e) => setWalk_headCollarUsage(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">선택하세요</option>
                  <option value="사용">사용</option>
                  <option value="사용 안 함">사용 안 함</option>
                </select>
              </div>

              {/* 5. 간식 사용 여부 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">5. 산책 중 간식 사용 여부</label>
                <select value={walk_treatUsage} onChange={(e) => setWalk_treatUsage(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">선택하세요</option>
                  <option value="항상 사용">항상 사용</option>
                  <option value="가끔 사용">가끔 사용</option>
                  <option value="사용 안 함">사용 안 함</option>
                </select>
              </div>

              {/* 6. 산책 속도 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">6. 산책 속도</label>
                <select value={walk_speed} onChange={(e) => setWalk_speed(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="적절함">적절함</option>
                  <option value="너무 빠름">너무 빠름</option>
                  <option value="너무 느림">너무 느림</option>
                </select>
                <textarea value={walk_speed_detail} onChange={(e) => setWalk_speed_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 7. 산책 품행 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">7. 산책 중 품행 (줄 당김, 멈춤 등)</label>
                <select value={walk_behavior} onChange={(e) => setWalk_behavior(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="좋음">좋음</option>
                  <option value="보통">보통</option>
                  <option value="개선 필요">개선 필요</option>
                </select>
                <textarea value={walk_behavior_detail} onChange={(e) => setWalk_behavior_detail(e.target.value)}
                  placeholder="구체적인 행동 설명" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 8. 다른 동물 반응 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">8. 다른 동물을 만났을 때 반응</label>
                <select value={walk_animalReaction} onChange={(e) => setWalk_animalReaction(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="무관심">무관심</option>
                  <option value="관심 있지만 차분">관심 있지만 차분</option>
                  <option value="흥분함">흥분함</option>
                  <option value="짖음">짖음</option>
                </select>
                <textarea value={walk_animalReaction_detail} onChange={(e) => setWalk_animalReaction_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 9. 다른 사람 반응 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">9. 다른 사람을 만났을 때 반응</label>
                <select value={walk_peopleReaction} onChange={(e) => setWalk_peopleReaction(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="무관심">무관심</option>
                  <option value="우호적">우호적</option>
                  <option value="흥분함">흥분함</option>
                  <option value="경계함">경계함</option>
                </select>
                <textarea value={walk_peopleReaction_detail} onChange={(e) => setWalk_peopleReaction_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 10. 무서워하는 물체 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">10. 무서워하는 물체나 상황</label>
                <textarea value={walk_fearObjects} onChange={(e) => setWalk_fearObjects(e.target.value)}
                  placeholder="예: 자전거, 오토바이, 큰 소리 등" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 11. 관심 보이는 것 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">11. 특별히 관심을 보이는 것</label>
                <textarea value={walk_interests} onChange={(e) => setWalk_interests(e.target.value)}
                  placeholder="예: 새, 고양이, 냄새 맡기 등" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>
            </div>
          </div>

          {/* 사회화 훈련 (10개) */}
          <div className="border-t pt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 bg-gray-100 p-3 rounded">사회화 훈련</h3>
            <div className="space-y-4">
              {/* 1. 방문한 장소 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">1. 이번 달 방문한 장소</label>
                <textarea value={social_placesVisited} onChange={(e) => setSocial_placesVisited(e.target.value)}
                  placeholder="예: 마트, 공원, 병원, 카페 등" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 2. 사회화 빈도 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">2. 사회화 훈련 빈도</label>
                <select value={social_frequency} onChange={(e) => setSocial_frequency(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">선택하세요</option>
                  <option value="매일">매일</option>
                  <option value="주 3-4회">주 3-4회</option>
                  <option value="주 1-2회">주 1-2회</option>
                  <option value="가끔">가끔</option>
                </select>
              </div>

              {/* 3. 군중 반응 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">3. 군중이 많은 곳에서의 반응</label>
                <select value={social_crowdReaction} onChange={(e) => setSocial_crowdReaction(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="차분함">차분함</option>
                  <option value="약간 불안">약간 불안</option>
                  <option value="흥분함">흥분함</option>
                  <option value="두려워함">두려워함</option>
                </select>
                <textarea value={social_crowdReaction_detail} onChange={(e) => setSocial_crowdReaction_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 4. 계단 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">4. 계단 이용</label>
                <select value={social_stairs} onChange={(e) => setSocial_stairs(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="능숙함">능숙함</option>
                  <option value="가능하지만 조심스러움">가능하지만 조심스러움</option>
                  <option value="어려워함">어려워함</option>
                  <option value="시도 안 함">시도 안 함</option>
                </select>
                <textarea value={social_stairs_detail} onChange={(e) => setSocial_stairs_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 5. 에스컬레이터 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">5. 에스컬레이터 이용</label>
                <select value={social_escalator} onChange={(e) => setSocial_escalator(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="능숙함">능숙함</option>
                  <option value="가능하지만 조심스러움">가능하지만 조심스러움</option>
                  <option value="어려워함">어려워함</option>
                  <option value="시도 안 함">시도 안 함</option>
                </select>
                <textarea value={social_escalator_detail} onChange={(e) => setSocial_escalator_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 6. 자동차 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">6. 자동차 탑승</label>
                <select value={social_car} onChange={(e) => setSocial_car(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="편안함">편안함</option>
                  <option value="약간 불안">약간 불안</option>
                  <option value="거부 반응">거부 반응</option>
                  <option value="차멀미">차멀미</option>
                </select>
                <textarea value={social_car_detail} onChange={(e) => setSocial_car_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 7. 버스 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">7. 버스 탑승</label>
                <select value={social_bus} onChange={(e) => setSocial_bus(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="편안함">편안함</option>
                  <option value="약간 불안">약간 불안</option>
                  <option value="거부 반응">거부 반응</option>
                  <option value="시도 안 함">시도 안 함</option>
                </select>
                <textarea value={social_bus_detail} onChange={(e) => setSocial_bus_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 8. 지하철 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">8. 지하철 탑승</label>
                <select value={social_subway} onChange={(e) => setSocial_subway(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="편안함">편안함</option>
                  <option value="약간 불안">약간 불안</option>
                  <option value="거부 반응">거부 반응</option>
                  <option value="시도 안 함">시도 안 함</option>
                </select>
                <textarea value={social_subway_detail} onChange={(e) => setSocial_subway_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 9. 카페/식당 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">9. 카페/식당에서의 행동</label>
                <select value={social_cafeRestaurant} onChange={(e) => setSocial_cafeRestaurant(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-2">
                  <option value="">선택하세요</option>
                  <option value="조용히 앉아 있음">조용히 앉아 있음</option>
                  <option value="약간 불안함">약간 불안함</option>
                  <option value="산만함">산만함</option>
                  <option value="시도 안 함">시도 안 함</option>
                </select>
                <textarea value={social_cafeRestaurant_detail} onChange={(e) => setSocial_cafeRestaurant_detail(e.target.value)}
                  placeholder="상세 내용" className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
              </div>

              {/* 10. 어려운 점 */}
              <div className="bg-gray-50 p-4 rounded">
                <label className="block text-sm font-semibold text-gray-700 mb-2">10. 사회화 훈련 중 가장 어려운 점</label>
                <textarea value={social_difficulties} onChange={(e) => setSocial_difficulties(e.target.value)}
                  placeholder="자유롭게 작성" className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} />
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
