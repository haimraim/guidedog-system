/**
 * 데이터 조회 테이블 컴포넌트
 * NVDA 스크린리더 접근성을 최우선으로 고려
 */

import { useState, useEffect } from 'react';
import type { CombinedData } from '../types/types';
import { getCombinedData, deleteActivity, deleteGuideDog, deletePartner } from '../utils/storage';

export const DataTable: React.FC = () => {
  const [data, setData] = useState<CombinedData[]>([]);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  const loadData = () => {
    const combinedData = getCombinedData();
    setData(combinedData);
  };

  useEffect(() => {
    loadData();

    // 데이터 변경 감지를 위한 이벤트 리스너
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    // 같은 탭 내에서의 변경도 감지
    const interval = setInterval(loadData, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const handleDelete = (item: CombinedData) => {
    const confirmMessage = `${item.guideDog.name} 안내견과 ${item.partner.name} 파트너의 활동 데이터를 삭제하시겠습니까?`;

    if (window.confirm(confirmMessage)) {
      try {
        // 활동, 안내견, 파트너 정보 모두 삭제
        deleteActivity(item.activity.id);
        deleteGuideDog(item.guideDog.id);
        deletePartner(item.partner.id);

        setDeleteStatus(`${item.guideDog.name}의 데이터가 삭제되었습니다.`);
        loadData();

        // 상태 메시지 3초 후 제거
        setTimeout(() => {
          setDeleteStatus(null);
        }, 3000);
      } catch (error) {
        console.error('삭제 실패:', error);
        setDeleteStatus('데이터 삭제에 실패했습니다.');
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-md" aria-labelledby="table-heading">
      <h2 id="table-heading" className="text-2xl font-bold mb-6">
        데이터 조회
      </h2>

      {/* 삭제 상태 메시지 */}
      {deleteStatus && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded"
        >
          {deleteStatus}
        </div>
      )}

      {/* 데이터 개수 */}
      <p className="mb-4 text-gray-700">
        총 <span className="font-bold">{data.length}</span>건의 데이터가 있습니다.
      </p>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>등록된 데이터가 없습니다.</p>
          <p className="text-sm mt-2">위의 데이터 작성 폼에서 새로운 데이터를 등록해주세요.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <caption className="sr-only">
              안내견과 파트너 활동 정보 목록. 각 행은 안내견 정보, 파트너 정보, 활동 기간, 삭제 버튼으로 구성되어 있습니다.
            </caption>
            <thead>
              <tr className="bg-gray-100">
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  번호
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  견명
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  견 생년월일
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  견 성별
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  모견
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  부견
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  파트너 성명
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  파트너 성별
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  나이
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  연락처
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  주소
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  직업
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  활동 시작일
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  활동 종료일
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">
                  작업
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr
                  key={item.activity.id}
                  className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  <td className="border border-gray-300 px-4 py-3">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-3 font-semibold">
                    {item.guideDog.name || '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {formatDate(item.guideDog.birthDate)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.guideDog.gender || '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.guideDog.motherName || '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.guideDog.fatherName || '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 font-semibold">
                    {item.partner.name || '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.partner.gender || '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.partner.age ? `${item.partner.age}세` : '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.partner.phone || '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.partner.address || '-'}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {item.partner.jobCategory || '-'}
                    {item.partner.jobDetail && ` (${item.partner.jobDetail})`}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {formatDate(item.activity.startDate)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    {formatDate(item.activity.endDate)}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(item)}
                      aria-label={`${item.guideDog.name} 안내견과 ${item.partner.name} 파트너의 데이터 삭제`}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 focus:ring-4 focus:ring-red-300"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 테이블 사용 안내 */}
      {data.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-300 rounded">
          <h3 className="font-semibold mb-2">스크린리더 사용 안내</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>테이블 내비게이션: Ctrl + Alt + 화살표 키 (NVDA)</li>
            <li>헤더 읽기: Ctrl + Alt + Shift + 위/아래 화살표</li>
            <li>셀 단위 이동: 화살표 키</li>
            <li>삭제 버튼: Enter 또는 Space 키로 실행</li>
          </ul>
        </div>
      )}
    </section>
  );
};
