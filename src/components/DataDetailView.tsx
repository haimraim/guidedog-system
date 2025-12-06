/**
 * 데이터 상세보기 컴포넌트
 * 전체화면으로 상세 정보 표시 및 수정/삭제 기능 제공
 */

import { useEffect, useRef, useState } from 'react';
import type { CombinedData, DiaryPost, MedicalRecord } from '../types/types';
import { calculateAgeWithMonths } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

interface DataDetailViewProps {
  item: CombinedData;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

type TabType = 'diary' | 'medical';

interface AuthorCategory {
  category: string;
  name: string;
  fullLabel: string;
}

export const DataDetailView = ({ item, onClose, onEdit, onDelete }: DataDetailViewProps) => {
  const { user } = useAuth();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<TabType | null>(null);
  const [allDiaryPosts, setAllDiaryPosts] = useState<DiaryPost[]>([]);
  const [allMedicalRecords, setAllMedicalRecords] = useState<MedicalRecord[]>([]);
  const [selectedDiaryAuthor, setSelectedDiaryAuthor] = useState<string>('all');
  const [selectedMedicalAuthor, setSelectedMedicalAuthor] = useState<string>('all');

  useEffect(() => {
    // 컴포넌트 마운트 시 닫기 버튼에 포커스
    closeButtonRef.current?.focus();

    // ESC 키로 닫기
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    // 다이어리와 진료 기록 로드
    loadDiaryPosts();
    loadMedicalRecords();
  }, [item]);

  const loadDiaryPosts = () => {
    const data = localStorage.getItem('guidedog_diary');
    if (data) {
      const allPosts: DiaryPost[] = JSON.parse(data);
      // 해당 안내견과 관련된 모든 다이어리 (안내견 이름이 일치하는 것)
      const filtered = allPosts.filter(post => post.dogName === item.guideDog.name);
      setAllDiaryPosts(filtered);
    }
  };

  const loadMedicalRecords = () => {
    const data = localStorage.getItem('guidedog_medical');
    if (data) {
      const allRecords: MedicalRecord[] = JSON.parse(data);
      // 해당 안내견의 진료 기록만 필터링
      const filtered = allRecords.filter(record => record.dogName === item.guideDog.name);
      setAllMedicalRecords(filtered);
    }
  };

  // 다이어리 작성자 카테고리 목록 생성
  const getDiaryAuthors = (): AuthorCategory[] => {
    const authors = new Map<string, AuthorCategory>();

    allDiaryPosts.forEach(post => {
      const key = post.userName;
      if (!authors.has(key)) {
        // 카테고리 결정 (파트너인지 퍼피티처인지 등)
        let category = '기타';
        if (post.userName === item.partner.name) {
          category = '파트너';
        } else if (item.guideDog.puppyTeacherName && post.userName === item.guideDog.puppyTeacherName) {
          category = '퍼피티처';
        } else if (item.guideDog.retiredHomeCareName && post.userName === item.guideDog.retiredHomeCareName) {
          category = '은퇴견 홈케어';
        } else if (item.guideDog.parentCaregiverName && post.userName === item.guideDog.parentCaregiverName) {
          category = '부모견 홈케어';
        }

        authors.set(key, {
          category,
          name: post.userName,
          fullLabel: `${category}/${post.userName}`,
        });
      }
    });

    return Array.from(authors.values());
  };

  // 진료 기록 작성자 카테고리 목록 생성
  const getMedicalAuthors = (): AuthorCategory[] => {
    const authors = new Map<string, AuthorCategory>();

    allMedicalRecords.forEach(record => {
      const key = record.userName;
      if (!authors.has(key)) {
        // 카테고리 결정
        let category = '기타';
        if (record.userName === item.partner.name) {
          category = '파트너';
        } else if (item.guideDog.puppyTeacherName && record.userName === item.guideDog.puppyTeacherName) {
          category = '퍼피티처';
        } else if (item.guideDog.retiredHomeCareName && record.userName === item.guideDog.retiredHomeCareName) {
          category = '은퇴견 홈케어';
        } else if (item.guideDog.parentCaregiverName && record.userName === item.guideDog.parentCaregiverName) {
          category = '부모견 홈케어';
        }

        authors.set(key, {
          category,
          name: record.userName,
          fullLabel: `${category}/${record.userName}`,
        });
      }
    });

    return Array.from(authors.values());
  };

  // 필터링된 다이어리 목록
  const filteredDiaryPosts = selectedDiaryAuthor === 'all'
    ? allDiaryPosts
    : allDiaryPosts.filter(post => post.userName === selectedDiaryAuthor);

  // 필터링된 진료 기록 목록
  const filteredMedicalRecords = selectedMedicalAuthor === 'all'
    ? allMedicalRecords
    : allMedicalRecords.filter(record => record.userName === selectedMedicalAuthor);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '퍼피티칭': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case '안내견': return 'bg-green-100 text-green-800 border-green-300';
      case '은퇴견': return 'bg-gray-100 text-gray-800 border-gray-300';
      case '부모견': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  // 권한 체크 함수들
  const canViewPuppyTeacher = () => {
    if (!user) return false;
    // 관리자는 모든 정보 볼 수 있음
    if (user.role === 'admin') return true;
    // 퍼피티처만 퍼피티처 정보 볼 수 있음
    return user.role === 'puppyTeacher';
  };

  const canViewRetiredHomeCare = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.role === 'retiredHomeCare';
  };

  const canViewParentCaregiver = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.role === 'parentCaregiver';
  };

  const canViewPartner = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.role === 'partner';
  };

  // 활동 기간 계산 (년/개월)
  const calculateActivityDuration = (startDate: string, endDate: string | undefined) => {
    if (!startDate) return '-';

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const years = end.getFullYear() - start.getFullYear();
    const months = end.getMonth() - start.getMonth();

    let totalYears = years;
    let totalMonths = months;

    if (totalMonths < 0) {
      totalYears -= 1;
      totalMonths += 12;
    }

    if (totalYears === 0 && totalMonths === 0) {
      return '1개월 미만';
    }

    const parts = [];
    if (totalYears > 0) parts.push(`${totalYears}년`);
    if (totalMonths > 0) parts.push(`${totalMonths}개월`);

    return parts.join(' ');
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{item.guideDog.name}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${getCategoryColor(item.guideDog.category)}`}>
              {item.guideDog.category}
            </span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 font-semibold"
            aria-label="상세보기 닫기"
          >
            ✕ 닫기
          </button>
        </div>

        {/* 서브 메뉴 버튼 */}
        {!activeTab && (
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setActiveTab('diary')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              다이어리 ({allDiaryPosts.length})
            </button>
            <button
              onClick={() => setActiveTab('medical')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              진료 기록 ({allMedicalRecords.length})
            </button>
          </div>
        )}

        {/* 탭 컨텐츠 */}
        {!activeTab && (
          <>
        {/* 견 기본 정보 */}
        <section className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 text-white px-6 py-3">
            <h3 className="text-xl font-bold">🐕 견 기본 정보</h3>
          </div>
          <table className="w-full">
            <tbody>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700 w-1/4">분류</th>
                <td className="px-6 py-4">{item.guideDog.category || '-'}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">견명</th>
                <td className="px-6 py-4 font-semibold text-lg">{item.guideDog.name || '-'}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">생년월일</th>
                <td className="px-6 py-4">{formatDate(item.guideDog.birthDate)}</td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">나이</th>
                <td className="px-6 py-4 font-semibold text-blue-600">
                  {calculateAgeWithMonths(item.guideDog.birthDate) || '-'}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">성별</th>
                <td className="px-6 py-4">{item.guideDog.gender || '-'}</td>
              </tr>
              {item.guideDog.photo && (
                <tr>
                  <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">사진</th>
                  <td className="px-6 py-4">
                    <img
                      src={item.guideDog.photo}
                      alt={`${item.guideDog.name} 사진`}
                      className="max-w-xs rounded-lg border border-gray-300"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 퍼피티처 정보가 있으면 표시 (권한 체크) */}
          {canViewPuppyTeacher() && (item.guideDog.puppyTeacherName || item.guideDog.puppyTeacherPhone || item.guideDog.puppyTeacherAddress) && (
            <>
              <div className="bg-purple-100 px-6 py-2 border-t border-gray-200">
                <h4 className="font-semibold text-purple-900">👨‍🏫 퍼피티처 정보</h4>
              </div>
              <table className="w-full">
                <tbody>
                  {item.guideDog.puppyTeacherName && (
                    <tr className="border-b border-gray-200">
                      <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700 w-1/4">이름</th>
                      <td className="px-6 py-4">{item.guideDog.puppyTeacherName}</td>
                    </tr>
                  )}
                  {item.guideDog.puppyTeacherPhone && (
                    <tr className="border-b border-gray-200">
                      <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">연락처</th>
                      <td className="px-6 py-4">{item.guideDog.puppyTeacherPhone}</td>
                    </tr>
                  )}
                  {item.guideDog.puppyTeacherAddress && (
                    <tr>
                      <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">주소</th>
                      <td className="px-6 py-4">{item.guideDog.puppyTeacherAddress}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* 은퇴견 홈케어 정보가 있으면 표시 (권한 체크) */}
          {canViewRetiredHomeCare() && (item.guideDog.retiredHomeCareName || item.guideDog.retiredHomeCarePhone || item.guideDog.retiredHomeCareAddress) && (
            <>
              <div className="bg-orange-100 px-6 py-2 border-t border-gray-200">
                <h4 className="font-semibold text-orange-900">👴 은퇴견 홈케어 정보</h4>
              </div>
              <table className="w-full">
                <tbody>
                  {item.guideDog.retiredHomeCareName && (
                    <tr className="border-b border-gray-200">
                      <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700 w-1/4">이름</th>
                      <td className="px-6 py-4">{item.guideDog.retiredHomeCareName}</td>
                    </tr>
                  )}
                  {item.guideDog.retiredHomeCarePhone && (
                    <tr className="border-b border-gray-200">
                      <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">연락처</th>
                      <td className="px-6 py-4">{item.guideDog.retiredHomeCarePhone}</td>
                    </tr>
                  )}
                  {item.guideDog.retiredHomeCareAddress && (
                    <tr>
                      <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">주소</th>
                      <td className="px-6 py-4">{item.guideDog.retiredHomeCareAddress}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}

          {/* 부모견 홈케어 정보가 있으면 표시 (권한 체크) */}
          {canViewParentCaregiver() && (item.guideDog.parentCaregiverName || item.guideDog.parentCaregiverPhone || item.guideDog.parentCaregiverAddress) && (
            <>
              <div className="bg-green-100 px-6 py-2 border-t border-gray-200">
                <h4 className="font-semibold text-green-900">👨‍👩‍👧 부모견 홈케어 정보</h4>
              </div>
              <table className="w-full">
                <tbody>
                  {item.guideDog.parentCaregiverName && (
                    <tr className="border-b border-gray-200">
                      <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700 w-1/4">이름</th>
                      <td className="px-6 py-4">{item.guideDog.parentCaregiverName}</td>
                    </tr>
                  )}
                  {item.guideDog.parentCaregiverPhone && (
                    <tr className="border-b border-gray-200">
                      <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">연락처</th>
                      <td className="px-6 py-4">{item.guideDog.parentCaregiverPhone}</td>
                    </tr>
                  )}
                  {item.guideDog.parentCaregiverAddress && (
                    <tr>
                      <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">주소</th>
                      <td className="px-6 py-4">{item.guideDog.parentCaregiverAddress}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </section>

        {/* 파트너 정보 (권한 체크) */}
        {canViewPartner() && item.partner.name && (
          <section className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-green-600 text-white px-6 py-3">
              <h3 className="text-xl font-bold">👤 파트너 정보</h3>
            </div>
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700 w-1/4">성명</th>
                  <td className="px-6 py-4 font-semibold text-lg">{item.partner.name || '-'}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">연락처</th>
                  <td className="px-6 py-4">{item.partner.phone || '-'}</td>
                </tr>
                <tr>
                  <th className="bg-gray-50 px-6 py-4 text-left font-semibold text-gray-700">주소</th>
                  <td className="px-6 py-4">{item.partner.address || '-'}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-3 justify-end pt-6 border-t-2 border-gray-200">
          <button
            onClick={onEdit}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-semibold"
            aria-label={`${item.guideDog.name} 데이터 수정`}
          >
            ✏️ 수정
          </button>
          <button
            onClick={onDelete}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-semibold"
            aria-label={`${item.guideDog.name} 데이터 삭제`}
          >
            🗑️ 삭제
          </button>
        </div>
          </>
        )}

        {/* 다이어리 탭 */}
        {activeTab === 'diary' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">다이어리 목록</h3>
              <button
                onClick={() => setActiveTab(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                ← 뒤로
              </button>
            </div>

            {/* 작성자 필터 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                작성자 필터
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDiaryAuthor('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedDiaryAuthor === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  전체 ({allDiaryPosts.length})
                </button>
                {getDiaryAuthors().map((author) => (
                  <button
                    key={author.name}
                    onClick={() => setSelectedDiaryAuthor(author.name)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      selectedDiaryAuthor === author.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {author.fullLabel} ({allDiaryPosts.filter(p => p.userName === author.name).length})
                  </button>
                ))}
              </div>
            </div>

            {filteredDiaryPosts.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <p className="text-gray-500">작성된 다이어리가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDiaryPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                  >
                    <h4 className="text-xl font-bold text-gray-800 mb-2">
                      {post.title}
                    </h4>
                    <div className="flex items-center text-sm text-gray-600 mb-4 space-x-4">
                      <span className="font-semibold">{post.userName}</span>
                      {post.dogName && <span>{post.dogName}</span>}
                      <span>{formatDateTime(post.createdAt)}</span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {post.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 진료 기록 탭 */}
        {activeTab === 'medical' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">진료 기록 목록</h3>
              <button
                onClick={() => setActiveTab(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
              >
                ← 뒤로
              </button>
            </div>

            {/* 작성자 필터 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                작성자 필터
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedMedicalAuthor('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedMedicalAuthor === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  전체 ({allMedicalRecords.length})
                </button>
                {getMedicalAuthors().map((author) => (
                  <button
                    key={author.name}
                    onClick={() => setSelectedMedicalAuthor(author.name)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      selectedMedicalAuthor === author.name
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {author.fullLabel} ({allMedicalRecords.filter(r => r.userName === author.name).length})
                  </button>
                ))}
              </div>
            </div>

            {filteredMedicalRecords.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-12 text-center">
                <p className="text-gray-500">작성된 진료 기록이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMedicalRecords.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-gray-800">
                          {record.hospital}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(record.visitDate)} | {record.dogName} | <span className="font-semibold">{record.userName}</span>
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatCurrency(record.cost)}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          진단 내용
                        </label>
                        <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                          {record.diagnosis}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          치료 내용
                        </label>
                        <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                          {record.treatment}
                        </p>
                      </div>

                      {record.receiptPhotos.length > 0 && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            영수증 사진 ({record.receiptPhotos.length}장)
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            {record.receiptPhotos.map((photo, index) => (
                              <img
                                key={index}
                                src={photo}
                                alt={`영수증 ${index + 1}`}
                                className="w-full rounded-lg border border-gray-200"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 mt-4 pt-3 border-t">
                      작성일: {formatDateTime(record.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
