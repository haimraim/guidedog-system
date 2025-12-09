/**
 * 약품 체크 페이지 컴포넌트
 * 매월 약품 복용/도포 체크리스트 관리
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGuideDogs } from '../utils/storage';
import type { MedicationCheck, MedicationType, GuideDog } from '../types/types';
import { generateId } from '../utils/storage';
import { getMedicationChecks, saveMedicationCheck, deleteMedicationCheck } from '../utils/firestoreLectures';

// 약품별 정보
const MEDICATION_INFO = {
  '하트가드': {
    name: '하트가드 (심장사상충 예방약)',
    form: '사각형 캡슐 케이스 내 개별 포장',
    schedule: '매월 10일',
    dosage: '1회 1개',
    instructions: [
      '사료 급여 후 간식처럼 제공하면 좋습니다.',
      '삼키는지 반드시 확인하세요.',
      '먹지 않고 숨기는 경우, 약을 쪼개거나 잘게 부숴서 간식에 섞어 주세요.',
    ],
    warning: '약은 반드시 안내견이 닿지 않는 높은 곳이나 밀폐용기에 보관합니다. 과다 복용 시 즉시 담당자에게 연락합니다.',
  },
  '드론탈플러스': {
    name: '드론탈플러스 (종합 구충약)',
    form: '원형 알약',
    schedule: '4월, 7월, 10월, 1월의 첫째 날',
    dosage: '체중 10kg당 1알 (보통 2.5~3알)',
    instructions: [
      '약을 사료나 간식 등에 섞어 제공합니다.',
      '삼키지 않고 뱉는 경우 직접 입을 벌려 먹여야 하며, 즉시 재투여를 시도합니다. 그 과정에서 손이 물리지 않도록 주의하세요.',
    ],
    warning: '복용 후 반드시 삼켰는지 확인하세요.',
  },
  '프론트라인': {
    name: '프론트라인 (외부 기생충 예방약)',
    form: '뾰족한 삼각형 케이스 내 개별 포장',
    schedule: '매월 1~10일 사이',
    dosage: '1회분',
    instructions: [
      '안내견의 목과 어깨 사이 털을 가르고, 피부에 직접 약을 발라줍니다.',
      '손에 묻지 않도록 주의하고, 도포 후 2일간은 목욕하지 않습니다.',
    ],
    warning: '내용물을 절대 섭취하지 않도록 주의하고, 도포 후 안내견이 핥지 않게 합니다.',
  },
};

type CategoryType = '안내견' | '퍼피' | '은퇴견' | '부모견';

export const MedicationCheckPage = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState<MedicationCheck[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<MedicationType | null>(null);
  const [checkDate, setCheckDate] = useState('');
  const [notes, setNotes] = useState('');

  // 관리자용 상태
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('안내견');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadChecks();
  }, []);

  const loadChecks = async () => {
    const allChecks = await getMedicationChecks();

    // 관리자는 모든 기록 표시
    if (user?.role === 'admin') {
      setChecks(allChecks);
      return;
    }

    // 일반 담당자는 자신이 작성한 기록만 표시
    const filteredChecks = allChecks.filter(c => c.userId === user?.id);
    setChecks(filteredChecks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMedication || !checkDate) {
      alert('약품과 날짜를 선택해주세요.');
      return;
    }

    if (!user?.dogName) {
      alert('안내견 정보가 없습니다.');
      return;
    }

    const check: MedicationCheck = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      dogName: user.dogName,
      medicationType: selectedMedication,
      checkDate,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveMedicationCheck(check);
    resetForm();
    await loadChecks();
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteMedicationCheck(id);
      await loadChecks();
    }
  };

  const resetForm = () => {
    setSelectedMedication(null);
    setCheckDate('');
    setNotes('');
    setIsAdding(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 약품별 이번 달 체크 여부 확인 (일반 사용자용)
  const getMonthlyStatus = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const medicationTypes: MedicationType[] = ['하트가드', '드론탈플러스', '프론트라인'];

    return medicationTypes.map(type => {
      const monthlyChecks = checks.filter(check => {
        const checkDate = new Date(check.checkDate);
        return check.medicationType === type &&
               check.dogName === user?.dogName &&
               checkDate.getFullYear() === currentYear &&
               checkDate.getMonth() + 1 === currentMonth;
      });

      return {
        type,
        checked: monthlyChecks.length > 0,
        lastCheck: monthlyChecks[0]?.checkDate,
      };
    });
  };

  // 연간 체크 현황 계산 (일반 사용자용)
  const getYearlyStatus = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const medicationTypes: MedicationType[] = ['하트가드', '드론탈플러스', '프론트라인'];
    const months = [];

    // 1월부터 현재 월까지
    for (let month = 1; month <= currentMonth; month++) {
      months.push(month);
    }

    return {
      months,
      medications: medicationTypes.map(type => {
        const monthlyData = months.map(month => {
          const monthChecks = checks.filter(check => {
            const checkDate = new Date(check.checkDate);
            return check.medicationType === type &&
                   check.dogName === user?.dogName &&
                   checkDate.getFullYear() === currentYear &&
                   checkDate.getMonth() + 1 === month;
          });
          return {
            month,
            checked: monthChecks.length > 0,
            count: monthChecks.length,
          };
        });
        return {
          type,
          monthlyData,
        };
      }),
    };
  };

  // 관리자용: 카테고리별 안내견 목록 가져오기
  const getDogsByCategory = (category: CategoryType): GuideDog[] => {
    const allDogs = getGuideDogs();

    switch (category) {
      case '안내견':
        return allDogs.filter(dog =>
          dog.category === '안내견' ||
          dog.category === '안내견/폐사' ||
          dog.category === '안내견/일반안내견/기타'
        );
      case '퍼피':
        return allDogs.filter(dog => dog.category === '퍼피티칭');
      case '은퇴견':
        return allDogs.filter(dog => dog.category === '은퇴견');
      case '부모견':
        return allDogs.filter(dog => dog.category === '부견' || dog.category === '모견');
      default:
        return [];
    }
  };

  // 관리자용: 월별 약품 체크 현황 테이블 데이터
  const getAdminMonthlyTable = () => {
    const dogs = getDogsByCategory(selectedCategory);
    const medicationTypes: MedicationType[] = ['하트가드', '드론탈플러스', '프론트라인'];

    return dogs.map(dog => {
      const dogChecks = medicationTypes.map(medType => {
        const monthChecks = checks.filter(check => {
          const checkDate = new Date(check.checkDate);
          return check.dogName === dog.name &&
                 check.medicationType === medType &&
                 checkDate.getFullYear() === selectedYear &&
                 checkDate.getMonth() + 1 === selectedMonth;
        });

        return {
          medicationType: medType,
          checked: monthChecks.length > 0,
          checkerName: monthChecks[0]?.userName || '-',
        };
      });

      return {
        dogName: dog.name,
        checks: dogChecks,
      };
    });
  };

  const monthlyStatus = user?.role !== 'admin' ? getMonthlyStatus() : [];
  const yearlyStatus = user?.role !== 'admin' ? getYearlyStatus() : null;
  const adminTableData = user?.role === 'admin' ? getAdminMonthlyTable() : [];

  // 체크 추가 폼
  if (isAdding) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">약품 체크 기록</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 약품 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                약품 선택 *
              </label>
              <div className="space-y-3">
                {(Object.keys(MEDICATION_INFO) as MedicationType[]).map((type) => {
                  const info = MEDICATION_INFO[type];
                  return (
                    <label
                      key={type}
                      className={`block p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedMedication === type
                          ? 'bg-blue-50 border-blue-500'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          name="medication"
                          checked={selectedMedication === type}
                          onChange={() => setSelectedMedication(type)}
                          className="w-5 h-5 text-blue-600 mt-1 focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-semibold text-gray-800">{info.name}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>형태: {info.form}</div>
                            <div>일정: {info.schedule}</div>
                            <div>용량: {info.dosage}</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 선택된 약품 정보 표시 */}
            {selectedMedication && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">복용/도포 방법</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 mb-3">
                  {MEDICATION_INFO[selectedMedication].instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ul>
                <div className="text-sm font-semibold text-red-600">
                  ※ {MEDICATION_INFO[selectedMedication].warning}
                </div>
              </div>
            )}

            {/* 체크 날짜 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                체크 날짜 *
              </label>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    setCheckDate(`${year}-${month}-${day}`);
                  }}
                  className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold rounded-lg transition-colors border-2 border-blue-300"
                >
                  오늘
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const year = yesterday.getFullYear();
                    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
                    const day = String(yesterday.getDate()).padStart(2, '0');
                    setCheckDate(`${year}-${month}-${day}`);
                  }}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition-colors border-2 border-gray-300"
                >
                  어제
                </button>
              </div>
              <input
                type="date"
                id="checkDate"
                value={checkDate}
                onChange={(e) => setCheckDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>

            {/* 메모 */}
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                메모 (선택)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={3}
                placeholder="특이사항이나 추가 메모를 입력하세요"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                체크 완료
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 관리자 화면
  if (user?.role === 'admin') {
    return (
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">약품 체크 관리 (관리자)</h2>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">필터</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                카테고리
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as CategoryType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="안내견">안내견</option>
                <option value="퍼피">퍼피</option>
                <option value="은퇴견">은퇴견</option>
                <option value="부모견">부모견</option>
              </select>
            </div>

            {/* 년도 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                년도
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {[2025, 2024, 2023, 2022].map(year => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </div>

            {/* 월 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                월
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}월</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 월별 체크 현황 테이블 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {selectedCategory} - {selectedYear}년 {selectedMonth}월 약품 체크 현황
          </h3>
          {adminTableData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              해당 카테고리에 안내견이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                      견명
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                      하트가드
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                      드론탈플러스
                    </th>
                    <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                      프론트라인
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adminTableData.map((row) => (
                    <tr key={row.dogName} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-800">
                        {row.dogName}
                      </td>
                      {row.checks.map((check, idx) => (
                        <td
                          key={idx}
                          className={`border border-gray-300 px-4 py-3 text-center ${
                            check.checked ? 'bg-green-50' : 'bg-red-50'
                          }`}
                        >
                          {check.checked ? (
                            <div>
                              <div className="text-green-600 font-semibold">✓</div>
                              <div className="text-xs text-gray-600 mt-1">{check.checkerName}</div>
                            </div>
                          ) : (
                            <div className="text-red-500 font-semibold">✗</div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="text-green-600 font-semibold">✓</span>
              <span>체크 완료 (체크한 사람 이름 표시)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-red-500 font-semibold">✗</span>
              <span>체크 안 함</span>
            </div>
          </div>
        </div>

        {/* 약품별 안내 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">약품별 안내</h3>
          <div className="space-y-4">
            {(Object.keys(MEDICATION_INFO) as MedicationType[]).map((type) => {
              const info = MEDICATION_INFO[type];
              return (
                <details key={type} className="border border-gray-200 rounded-lg">
                  <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50">
                    {info.name}
                  </summary>
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-2 text-sm text-gray-700">
                      <div><strong>형태:</strong> {info.form}</div>
                      <div><strong>일정:</strong> {info.schedule}</div>
                      <div><strong>용량:</strong> {info.dosage}</div>
                      <div className="pt-2">
                        <strong>복용/도포 방법:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {info.instructions.map((instruction, index) => (
                            <li key={index}>{instruction}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="pt-2 text-red-600 font-semibold">
                        ※ {info.warning}
                      </div>
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 일반 사용자 메인 화면
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">약품 체크 관리</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          기록 작성
        </button>
      </div>

      {/* 미완료 약품 알림 */}
      {monthlyStatus.filter(s => !s.checked).length > 0 && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <span className="text-red-500 text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-2">
                이번 달 아직 체크하지 않은 약품
              </h3>
              <div className="flex flex-wrap gap-3">
                {monthlyStatus.filter(s => !s.checked).map(({ type }) => (
                  <span
                    key={type}
                    className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-semibold border border-red-300"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 연간 체크 현황 표 */}
      {yearlyStatus && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {new Date().getFullYear()}년 연간 체크 현황
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                    약품명
                  </th>
                  {yearlyStatus.months.map(month => (
                    <th
                      key={month}
                      className={`border border-gray-300 px-3 py-3 text-center font-semibold ${
                        month === new Date().getMonth() + 1
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-800'
                      }`}
                    >
                      {month}월
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yearlyStatus.medications.map(({ type, monthlyData }) => (
                  <tr key={type} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-800">
                      {type}
                    </td>
                    {monthlyData.map(({ month, checked, count }) => (
                      <td
                        key={month}
                        className={`border border-gray-300 px-3 py-3 text-center ${
                          month === new Date().getMonth() + 1
                            ? 'bg-blue-50'
                            : ''
                        }`}
                      >
                        {checked ? (
                          <div className="flex flex-col items-center">
                            <span className="text-green-600 text-sm font-semibold">완료</span>
                            {count > 1 && (
                              <span className="text-xs text-gray-500">({count}회)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-red-500 text-sm font-semibold">미완료</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="text-green-600 font-semibold">완료</span>
              <span>- 체크 완료</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-red-500 font-semibold">미완료</span>
              <span>- 체크 안 함</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-100 border border-blue-300 rounded"></div>
              <span>이번 달</span>
            </div>
          </div>
        </div>
      )}

      {/* 약품별 안내 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">약품별 안내</h3>
        <div className="space-y-4">
          {(Object.keys(MEDICATION_INFO) as MedicationType[]).map((type) => {
            const info = MEDICATION_INFO[type];
            return (
              <details key={type} className="border border-gray-200 rounded-lg">
                <summary className="cursor-pointer p-4 font-semibold text-gray-800 hover:bg-gray-50">
                  {info.name}
                </summary>
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="space-y-2 text-sm text-gray-700">
                    <div><strong>형태:</strong> {info.form}</div>
                    <div><strong>일정:</strong> {info.schedule}</div>
                    <div><strong>용량:</strong> {info.dosage}</div>
                    <div className="pt-2">
                      <strong>복용/도포 방법:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        {info.instructions.map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 text-red-600 font-semibold">
                      ※ {info.warning}
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {/* 체크 기록 내역 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">체크 기록 내역</h3>
        {checks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>체크 기록이 없습니다.</p>
            <button
              onClick={() => setIsAdding(true)}
              className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
            >
              첫 체크 기록하기
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                    약품명
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                    체크 날짜
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-800">
                    메모
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-800">
                    삭제
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 날짜 내림차순 정렬 */}
                {checks
                  .sort((a, b) => new Date(b.checkDate).getTime() - new Date(a.checkDate).getTime())
                  .map(check => (
                    <tr key={check.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-800">
                        {check.medicationType}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">
                        {formatDate(check.checkDate)}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-sm text-gray-600">
                        {check.notes || '-'}
                      </td>
                      <td className="border border-gray-300 px-4 py-3 text-center">
                        {check.userId === user?.id && (
                          <button
                            onClick={() => handleDelete(check.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-semibold"
                          >
                            삭제
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
