/**
 * 향상된 데이터 조회 테이블 컴포넌트
 * 검색, 필터링, 수정, 삭제, 엑셀 내보내기, 프린트 기능 포함
 */

import { useState, useEffect, useRef } from 'react';
import type { CombinedData, SearchFilter, SearchFieldType } from '../types/types';
import { getCombinedData, deleteActivity, deleteGuideDog, deletePartner, clearAllData, calculateAgeWithMonths } from '../utils/storage';
import { exportToExcel, exportBackup, importBackup, printData } from '../utils/export';
import { DataEditModal } from './DataEditModal';
import { DataForm } from './DataForm';
import { ExcelImport } from './ExcelImport';
import { DataDetailView } from './DataDetailView';
import { useAuth } from '../contexts/AuthContext';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const DataTableEnhanced = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CombinedData[]>([]);
  const [filteredData, setFilteredData] = useState<CombinedData[]>([]);
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<CombinedData | null>(null);
  const [viewingItem, setViewingItem] = useState<CombinedData | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);

  // 마이그레이션 상태
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState<string[]>([]);
  const [migrationComplete, setMigrationComplete] = useState(false);

  // 다중 선택 상태
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // 검색 상태
  const [filter, setFilter] = useState<SearchFilter>({
    keyword: '',
    searchField: 'dogName',
    dogCategory: undefined,
  });

  // 활성화된 필터 추적 (검색 버튼을 눌렀을 때만 업데이트)
  const activeFilterRef = useRef<SearchFilter | null>(null);

  // 권한 기반 데이터 필터링
  const filterDataByPermission = (allData: CombinedData[]): CombinedData[] => {
    // 관리자는 모든 데이터 볼 수 있음
    if (user?.role === 'admin') {
      return allData;
    }

    // 일반 담당자는 자기 카테고리 데이터만 볼 수 있음
    if (!user?.category || !user?.name) {
      return [];
    }

    return allData.filter(item => {
      const dog = item.guideDog;
      const category = user.category;
      const userName = user.name;

      // 퍼피티처: 퍼피티칭 카테고리이면서 자기 이름이 퍼피티처 이름과 일치
      if (category === '퍼피티칭' && user.role === 'puppyTeacher') {
        return dog.category === '퍼피티칭' && dog.puppyTeacherName === userName;
      }

      // 훈련사: 훈련견 카테고리이면서 자기 이름이 훈련사 이름과 일치
      if (category === '훈련견' && user.role === 'trainer') {
        return dog.category === '훈련견' && dog.trainerName === userName;
      }

      // 파트너: 안내견 관련 카테고리이면서 자기 이름이 파트너 이름과 일치
      if (
        (category === '안내견' || category === '안내견/폐사' || category === '안내견/일반안내견/기타') &&
        user.role === 'partner'
      ) {
        return (
          (dog.category === '안내견' ||
           dog.category === '안내견/폐사' ||
           dog.category === '안내견/일반안내견/기타') &&
          item.partner.name === userName
        );
      }

      // 은퇴견 홈케어: 은퇴견 카테고리이면서 자기 이름이 은퇴견 홈케어 이름과 일치
      if (category === '은퇴견' && user.role === 'retiredHomeCare') {
        return dog.category === '은퇴견' && dog.retiredHomeCareName === userName;
      }

      // 부모견 홈케어: 부견/모견 카테고리이면서 자기 이름이 부모견 홈케어 이름과 일치
      if ((category === '부견' || category === '모견') && user.role === 'parentCaregiver') {
        return (dog.category === '부견' || dog.category === '모견') && dog.parentCaregiverName === userName;
      }

      return false;
    });
  };

  const loadData = () => {
    const combinedData = getCombinedData();

    // 권한 기반 필터링 적용
    const permissionFilteredData = filterDataByPermission(combinedData);
    setData(permissionFilteredData);

    // 활성화된 필터가 있으면 적용, 없으면 권한 필터링된 데이터 표시
    if (activeFilterRef.current) {
      applyFilters(permissionFilteredData, activeFilterRef.current);
    } else {
      setFilteredData(permissionFilteredData);
    }
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(loadData, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // 필터 적용
  const applyFilters = (dataToFilter: CombinedData[], currentFilter: SearchFilter) => {
    let result = [...dataToFilter];

    // 안내견 분류 필터 (먼저 적용)
    if (currentFilter.dogCategory) {
      result = result.filter(item => item.guideDog.category === currentFilter.dogCategory);
    }

    // 키워드 검색 (검색 필드에 따라)
    if (currentFilter.keyword) {
      const keyword = currentFilter.keyword.toLowerCase();
      if (currentFilter.searchField === 'dogName') {
        result = result.filter(item =>
          item.guideDog.name.toLowerCase().includes(keyword)
        );
      } else if (currentFilter.searchField === 'partnerName') {
        result = result.filter(item =>
          item.partner.name.toLowerCase().includes(keyword)
        );
      }
    }

    setFilteredData(result);
  };

  const handleSearch = () => {
    // 현재 필터를 활성화된 필터로 저장
    activeFilterRef.current = { ...filter };
    applyFilters(data, filter);
  };

  const handleFilterChange = (key: keyof SearchFilter, value: string | SearchFieldType) => {
    setFilter(prev => ({ ...prev, [key]: value || undefined }));
  };

  const handleDelete = (item: CombinedData) => {
    const confirmMessage = `${item.guideDog.name} 안내견과 ${item.partner.name} 파트너의 활동 데이터를 삭제하시겠습니까?`;

    if (window.confirm(confirmMessage)) {
      try {
        deleteActivity(item.activity.id);
        deleteGuideDog(item.guideDog.id);
        deletePartner(item.partner.id);

        setDeleteStatus(`${item.guideDog.name}의 데이터가 삭제되었습니다.`);
        setViewingItem(null); // 상세뷰 닫기
        loadData();

        setTimeout(() => setDeleteStatus(null), 3000);
      } catch (error) {
        console.error('삭제 실패:', error);
        setDeleteStatus('데이터 삭제에 실패했습니다.');
      }
    }
  };

  const handleEdit = (item: CombinedData) => {
    setViewingItem(null); // 상세뷰 닫기
    setEditingItem(item);
  };

  const handleEditClose = (updated: boolean) => {
    setEditingItem(null);
    if (updated) {
      loadData();
    }
  };

  // 체크박스 토글
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredData.map(item => item.activity.id)));
    }
  };

  // 선택된 항목들 삭제
  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return;

    const confirmMessage = `선택한 ${selectedItems.size}개의 데이터를 삭제하시겠습니까?`;

    if (window.confirm(confirmMessage)) {
      try {
        let deletedCount = 0;

        selectedItems.forEach(activityId => {
          const item = filteredData.find(d => d.activity.id === activityId);
          if (item) {
            deleteActivity(item.activity.id);
            deleteGuideDog(item.guideDog.id);
            deletePartner(item.partner.id);
            deletedCount++;
          }
        });

        setDeleteStatus(`${deletedCount}개의 데이터가 삭제되었습니다.`);
        setSelectedItems(new Set());
        loadData();

        setTimeout(() => setDeleteStatus(null), 3000);
      } catch (error) {
        console.error('삭제 실패:', error);
        setDeleteStatus('데이터 삭제에 실패했습니다.');
      }
    }
  };

  const handleRowClick = (e: React.MouseEvent, item: CombinedData) => {
    // 체크박스 클릭은 무시 (체크박스 자체 이벤트로 처리)
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' && target.getAttribute('type') === 'checkbox') {
      return;
    }
    setViewingItem(item);
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, item: CombinedData) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setViewingItem(item);
    } else if (e.key === ' ') {
      e.preventDefault();
      toggleItemSelection(item.activity.id);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      if (selectedItems.size > 0) {
        handleDeleteSelected();
      }
    }
  };

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }
    exportToExcel(filteredData);
  };

  const handleBackup = () => {
    exportBackup();
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const success = await importBackup(file);
      if (success) {
        alert('데이터가 성공적으로 복원되었습니다.');
        loadData();
      }
    } catch (error) {
      alert('복원 실패: ' + (error as Error).message);
    }

    // 파일 인풋 초기화
    event.target.value = '';
  };

  const handlePrint = () => {
    if (filteredData.length === 0) {
      alert('프린트할 데이터가 없습니다.');
      return;
    }
    printData(filteredData);
  };

  const handleClearAllData = () => {
    const confirmMessage = '⚠️ 경고!\n\n모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.\n계속하려면 "확인"을 클릭하세요.';

    if (window.confirm(confirmMessage)) {
      const doubleConfirm = '정말로 모든 데이터를 삭제하시겠습니까?\n\n마지막 확인입니다.';
      if (window.confirm(doubleConfirm)) {
        try {
          clearAllData();
          setDeleteStatus('✅ 모든 데이터가 삭제되었습니다.');
          loadData();
          setTimeout(() => setDeleteStatus(null), 3000);
        } catch (error) {
          console.error('전체 삭제 실패:', error);
          setDeleteStatus('❌ 데이터 삭제에 실패했습니다.');
        }
      }
    }
  };

  // localStorage 데이터를 Firestore로 마이그레이션
  const handleMigration = async () => {
    if (isMigrating) return;

    const confirmMessage = 'localStorage에 저장된 강의실 데이터를 Firestore로 마이그레이션하시겠습니까?\n\n이 작업은 다른 PC에서도 같은 데이터를 볼 수 있도록 합니다.';
    if (!window.confirm(confirmMessage)) return;

    setIsMigrating(true);
    setMigrationLog([]);
    setMigrationComplete(false);

    const addLog = (message: string) => {
      setMigrationLog(prev => [...prev, message]);
    };

    try {
      addLog('🚀 Firestore 마이그레이션 시작...');
      let totalMigrated = 0;

      // 1. 일반 강의실 강의 마이그레이션
      addLog('📚 일반 강의실 강의 마이그레이션 중...');
      const lectures = JSON.parse(localStorage.getItem('guidedog_lectures') || '[]');
      for (const lecture of lectures) {
        try {
          await setDoc(doc(db, 'lectures', lecture.id), lecture);
          totalMigrated++;
          addLog(`  ✓ 강의: ${lecture.title}`);
        } catch (error) {
          addLog(`  ✗ 실패: ${lecture.title}`);
          console.error(error);
        }
      }
      addLog(`✅ 일반 강의실: ${lectures.length}개 완료`);

      // 2. 직원용 강의실 - 과목 마이그레이션
      addLog('📂 직원용 과목 마이그레이션 중...');
      const courses = JSON.parse(localStorage.getItem('guidedog_staff_courses') || '[]');
      for (const course of courses) {
        try {
          await setDoc(doc(db, 'staff_courses', course.id), course);
          totalMigrated++;
          addLog(`  ✓ 과목: ${course.name}`);
        } catch (error) {
          addLog(`  ✗ 실패: ${course.name}`);
          console.error(error);
        }
      }
      addLog(`✅ 직원용 과목: ${courses.length}개 완료`);

      // 3. 직원용 강의실 - 강의 마이그레이션
      addLog('📖 직원용 강의 마이그레이션 중...');
      const staffLectures = JSON.parse(localStorage.getItem('guidedog_staff_lectures') || '[]');
      for (const lecture of staffLectures) {
        try {
          await setDoc(doc(db, 'staff_lectures', lecture.id), lecture);
          totalMigrated++;
          addLog(`  ✓ 강의: ${lecture.title}`);
        } catch (error) {
          addLog(`  ✗ 실패: ${lecture.title}`);
          console.error(error);
        }
      }
      addLog(`✅ 직원용 강의: ${staffLectures.length}개 완료`);

      // 4. 안내견학교 행사 영상 마이그레이션
      addLog('🎬 안내견학교 행사 영상 마이그레이션 중...');
      const videos = JSON.parse(localStorage.getItem('guidedog_school_videos') || '[]');
      for (const video of videos) {
        try {
          await setDoc(doc(db, 'school_videos', video.id), video);
          totalMigrated++;
          addLog(`  ✓ 영상: ${video.title}`);
        } catch (error) {
          addLog(`  ✗ 실패: ${video.title}`);
          console.error(error);
        }
      }
      addLog(`✅ 안내견학교 영상: ${videos.length}개 완료`);

      // 완료 메시지
      addLog('═══════════════════════════════════════');
      addLog(`🎉 마이그레이션 완료! 총 ${totalMigrated}개 항목이 Firestore로 이동되었습니다.`);
      addLog('📱 이제 모든 PC에서 같은 데이터를 볼 수 있습니다!');
      addLog('💡 페이지를 새로고침하세요 (F5)');

      setMigrationComplete(true);
    } catch (error) {
      addLog('❌ 마이그레이션 중 오류가 발생했습니다.');
      console.error('Migration error:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <>
      {/* 상세보기가 열려있으면 전체 화면으로 표시 */}
      {viewingItem ? (
        <DataDetailView
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={() => handleEdit(viewingItem)}
          onDelete={() => handleDelete(viewingItem)}
        />
      ) : /* 수정 모달이 열려있으면 전체 화면으로 표시 */
      editingItem ? (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <DataEditModal
              item={editingItem}
              onClose={handleEditClose}
            />
          </div>
        </div>
      ) : /* 등록 모달이 열려있으면 전체 화면으로 표시 */
      showRegisterModal ? (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">새 데이터 등록</h2>
              <button
                onClick={() => {
                  setShowRegisterModal(false);
                  loadData();
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 font-semibold"
                aria-label="등록 취소"
              >
                ✕ 닫기
              </button>
            </div>
            <DataForm onSuccess={() => {
              setShowRegisterModal(false);
              loadData();
            }} />
          </div>
        </div>
      ) : showExcelImportModal ? (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">엑셀 일괄 등록</h2>
              <button
                onClick={() => {
                  setShowExcelImportModal(false);
                  loadData();
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 font-semibold"
                aria-label="닫기"
              >
                ✕ 닫기
              </button>
            </div>
            <ExcelImport onSuccess={() => {
              setShowExcelImportModal(false);
              loadData();
            }} />
          </div>
        </div>
      ) : (
        <section className="bg-white p-6 rounded-lg shadow-md" aria-labelledby="table-heading">
          <h2 id="table-heading" className="text-2xl font-bold mb-6">
            안내견 관리
          </h2>
              {/* 상태 메시지 */}
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
            {filteredData.length !== data.length ? (
              <>
                검색 결과: <span className="font-bold">{filteredData.length}</span>건
                (전체 {data.length}건 중)
              </>
            ) : (
              <>
                총 <span className="font-bold">{data.length}</span>건의 데이터가 있습니다.
              </>
            )}
          </p>

      {/* 데이터 리스트 */}
      {filteredData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {data.length === 0 ? (
            <>
              <p>등록된 데이터가 없습니다.</p>
              <p className="text-sm mt-2">상단의 등록 버튼을 클릭하여 새로운 데이터를 등록해주세요.</p>
            </>
          ) : (
            <p>검색 결과가 없습니다.</p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <caption className="sr-only">
              안내견과 파트너 목록 (스페이스 키로 선택, Enter 키로 상세보기, Delete 키로 삭제)
            </caption>
            <thead>
              <tr className="bg-gray-100">
                <th scope="col" className="border border-gray-300 px-4 py-3 text-center w-16">
                  <input
                    type="checkbox"
                    checked={filteredData.length > 0 && selectedItems.size === filteredData.length}
                    onChange={toggleSelectAll}
                    className="w-5 h-5 cursor-pointer"
                    aria-label="전체 선택"
                  />
                </th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left w-20">번호</th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left w-32">분류</th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">견명</th>
                <th scope="col" className="border border-gray-300 px-4 py-3 text-left">담당자</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => {
                // 카테고리별 담당자 이름 결정
                const getResponsiblePerson = () => {
                  switch (item.guideDog.category) {
                    case '퍼피티칭':
                      return item.guideDog.puppyTeacherName || '-';
                    case '훈련견':
                      return item.guideDog.trainerName || '-';
                    case '안내견':
                    case '안내견/폐사':
                    case '안내견/일반안내견/기타':
                      return item.partner.name || '-';
                    case '은퇴견':
                      return item.guideDog.retiredHomeCareName || '-';
                    case '부견':
                    case '모견':
                      return item.guideDog.parentCaregiverName || '-';
                    default:
                      return '-';
                  }
                };

                const isSelected = selectedItems.has(item.activity.id);

                return (
                <tr
                  key={item.activity.id}
                  onClick={(e) => handleRowClick(e, item)}
                  onKeyDown={(e) => handleRowKeyDown(e, item)}
                  tabIndex={0}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-100' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-blue-50 focus:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  role="button"
                  aria-label={`${item.guideDog.name} 안내견, ${getResponsiblePerson()}. 스페이스로 선택, Enter로 상세보기`}
                >
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item.activity.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 cursor-pointer"
                      aria-label={`${item.guideDog.name} 선택`}
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-3">{index + 1}</td>
                  <td className="border border-gray-300 px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      item.guideDog.category === '신생자견' ? 'bg-pink-100 text-pink-800' :
                      item.guideDog.category === '퍼피티칭' ? 'bg-yellow-100 text-yellow-800' :
                      item.guideDog.category === '훈련견' ? 'bg-blue-100 text-blue-800' :
                      item.guideDog.category === '반려견' ? 'bg-purple-100 text-purple-800' :
                      item.guideDog.category === '안내견' ? 'bg-green-100 text-green-800' :
                      item.guideDog.category === '안내견/폐사' ? 'bg-red-100 text-red-800' :
                      item.guideDog.category === '안내견/일반안내견/기타' ? 'bg-teal-100 text-teal-800' :
                      item.guideDog.category === '은퇴견' ? 'bg-gray-100 text-gray-800' :
                      item.guideDog.category === '시범견' ? 'bg-indigo-100 text-indigo-800' :
                      item.guideDog.category === '견사/기타' ? 'bg-orange-100 text-orange-800' :
                      item.guideDog.category === '부견' ? 'bg-cyan-100 text-cyan-800' :
                      item.guideDog.category === '모견' ? 'bg-rose-100 text-rose-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.guideDog.category || '-'}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 font-semibold text-lg">
                    {item.guideDog.name || '-'}
                    {item.guideDog.birthDate && (
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        ({calculateAgeWithMonths(item.guideDog.birthDate)})
                      </span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 font-semibold">
                    {getResponsiblePerson()}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              💡 스페이스 키로 선택, Enter 키로 상세보기, Delete 키로 삭제
            </p>
            {selectedItems.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-blue-700">
                  {selectedItems.size}개 선택됨
                </span>
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-semibold transition-colors"
                  aria-label={`선택한 ${selectedItems.size}개 항목 삭제`}
                >
                  🗑️ 선택 항목 삭제
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 검색 영역 */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">🔍 검색</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* 분류 선택 */}
          <div>
            <label htmlFor="dogCategory" className="block text-sm font-medium mb-1">
              분류
            </label>
            <select
              id="dogCategory"
              value={filter.dogCategory || ''}
              onChange={(e) => handleFilterChange('dogCategory', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="퍼피티칭">퍼피티칭</option>
              <option value="안내견">안내견</option>
              <option value="은퇴견">은퇴견</option>
              <option value="부모견">부모견</option>
            </select>
          </div>

          {/* 검색 필드 선택 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              검색 대상
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="searchField"
                  value="dogName"
                  checked={filter.searchField === 'dogName'}
                  onChange={(e) => handleFilterChange('searchField', e.target.value as SearchFieldType)}
                  className="mr-2"
                />
                견명
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="searchField"
                  value="partnerName"
                  checked={filter.searchField === 'partnerName'}
                  onChange={(e) => handleFilterChange('searchField', e.target.value as SearchFieldType)}
                  className="mr-2"
                />
                성명
              </label>
            </div>
          </div>

          {/* 검색어 입력 */}
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium mb-1">
              검색어
            </label>
            <input
              type="text"
              id="keyword"
              value={filter.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder={filter.searchField === 'dogName' ? '견명 입력' : '성명 입력'}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 검색 버튼 */}
          <div>
            <button
              onClick={handleSearch}
              className="w-full px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
              aria-label="검색"
            >
              🔍 검색
            </button>
          </div>
        </div>

        {/* 검색 초기화 */}
        {(filter.keyword || filter.dogCategory) && (
          <button
            onClick={() => {
              const newFilter: SearchFilter = { keyword: '', searchField: 'dogName', dogCategory: undefined };
              setFilter(newFilter);
              activeFilterRef.current = null; // 활성 필터 제거
              setFilteredData(data); // 전체 데이터 표시
            }}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-4 focus:ring-gray-300"
          >
            검색 초기화
          </button>
        )}
      </div>

      {/* 액션 버튼 영역 */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">📋 데이터 관리</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowExcelImportModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-semibold"
            aria-label="엑셀 일괄 등록"
          >
            📊 엑셀 일괄등록
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-semibold"
            aria-label="새 데이터 등록"
          >
            ➕ 새 데이터 등록
          </button>
          <button
            onClick={handleExportExcel}
            disabled={filteredData.length === 0}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-4 focus:ring-teal-300 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            aria-label="Excel 파일로 내보내기"
          >
            📥 내보내기
          </button>
          <button
            onClick={handlePrint}
            disabled={filteredData.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            aria-label="프린트"
          >
            🖨️ 프린트
          </button>
          <button
            onClick={handleBackup}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-semibold"
            aria-label="데이터 백업"
          >
            💾 데이터 백업
          </button>
          <label className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus:ring-4 focus:ring-orange-300 cursor-pointer font-semibold">
            📂 복원
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              className="hidden"
              aria-label="백업 파일에서 복원"
            />
          </label>
          {user?.role === 'admin' && (
            <button
              onClick={handleMigration}
              disabled={isMigrating}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-300 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              aria-label="강의실 데이터 Firestore 마이그레이션"
            >
              {isMigrating ? '⏳ 마이그레이션 중...' : '🔄 강의실 데이터 마이그레이션'}
            </button>
          )}
          <button
            onClick={handleClearAllData}
            disabled={data.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
            aria-label="모든 데이터 삭제"
          >
            🗑️ 전체 삭제
          </button>
        </div>
      </div>

      {/* 마이그레이션 진행 상황 */}
      {migrationLog.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">
            {isMigrating ? '⏳ 마이그레이션 진행 중...' : migrationComplete ? '✅ 마이그레이션 완료!' : '📋 마이그레이션 로그'}
          </h3>
          <div
            role="log"
            aria-live="polite"
            aria-atomic="false"
            className="bg-white p-4 rounded border border-blue-200 max-h-96 overflow-y-auto"
          >
            <div className="font-mono text-sm space-y-1">
              {migrationLog.map((log, index) => (
                <div key={index} className="text-gray-800">
                  {log}
                </div>
              ))}
            </div>
          </div>
          {migrationComplete && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-semibold"
              aria-label="페이지 새로고침"
            >
              🔄 페이지 새로고침 (F5)
            </button>
          )}
        </div>
      )}
        </section>
      )}
    </>
  );
};
