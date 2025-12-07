/**
 * 보딩 폼 페이지 컴포넌트
 * 자체 양식으로 보딩 신청서 관리
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { BoardingForm } from '../types/types';
import { generateId } from '../utils/storage';

const STORAGE_KEY = 'guidedog_boarding';

const getBoardingForms = (): BoardingForm[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveBoardingForm = (form: BoardingForm): void => {
  const forms = getBoardingForms();
  const existingIndex = forms.findIndex(f => f.id === form.id);

  if (existingIndex >= 0) {
    forms[existingIndex] = { ...form, updatedAt: new Date().toISOString() };
  } else {
    forms.unshift(form);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
};

const deleteBoardingForm = (id: string): void => {
  const forms = getBoardingForms().filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
};

interface BoardingFormPageProps {
  onNavigateHome?: () => void;
}

export const BoardingFormPage = ({ onNavigateHome }: BoardingFormPageProps) => {
  const { user } = useAuth();
  const [forms, setForms] = useState<BoardingForm[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingForm, setEditingForm] = useState<BoardingForm | null>(null);

  // 폼 입력 상태
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [healthStatus, setHealthStatus] = useState('좋음');
  const [medications, setMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [feedingSchedule, setFeedingSchedule] = useState('');
  const [foodType, setFoodType] = useState('');
  const [foodAmount, setFoodAmount] = useState('');
  const [notes, setNotes] = useState('');

  // 관리자용 필터 및 정렬
  const [filterStatus, setFilterStatus] = useState<'all' | BoardingForm['status']>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadForms();
  }, []);

  useEffect(() => {
    if (user && !user.dogName && user.role !== 'admin') {
      setContactName(user.name);
    } else if (user && user.dogName) {
      setContactName(user.name);
    }
  }, [user]);

  const loadForms = () => {
    const allForms = getBoardingForms();

    // 관리자는 모든 신청서 표시
    if (user?.role === 'admin') {
      setForms(allForms);
      return;
    }

    // 일반 사용자는 자신의 신청서만 표시
    const filteredForms = allForms.filter(f => f.userId === user?.id);
    setForms(filteredForms);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.dogName && user?.role !== 'admin') {
      alert('안내견 정보가 없습니다.');
      return;
    }

    const form: BoardingForm = {
      id: editingForm?.id || generateId(),
      userId: user!.id,
      userName: user!.name,
      dogName: user!.dogName || '',
      startDate,
      endDate,
      contactName,
      contactPhone,
      emergencyContact,
      healthStatus,
      medications: medications || undefined,
      allergies: allergies || undefined,
      specialNeeds: specialNeeds || undefined,
      feedingSchedule,
      foodType,
      foodAmount,
      notes: notes || undefined,
      status: editingForm?.status || 'pending',
      createdAt: editingForm?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveBoardingForm(form);
    resetForm();
    loadForms();
    alert(editingForm ? '수정되었습니다.' : '신청되었습니다.');
  };

  const handleEdit = (form: BoardingForm) => {
    setEditingForm(form);
    setStartDate(form.startDate);
    setEndDate(form.endDate);
    setContactName(form.contactName);
    setContactPhone(form.contactPhone);
    setEmergencyContact(form.emergencyContact);
    setHealthStatus(form.healthStatus);
    setMedications(form.medications || '');
    setAllergies(form.allergies || '');
    setSpecialNeeds(form.specialNeeds || '');
    setFeedingSchedule(form.feedingSchedule);
    setFoodType(form.foodType);
    setFoodAmount(form.foodAmount);
    setNotes(form.notes || '');
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteBoardingForm(id);
      loadForms();
    }
  };

  const handleStatusChange = (id: string, newStatus: BoardingForm['status']) => {
    const form = forms.find(f => f.id === id);
    if (!form) return;

    const updatedForm = { ...form, status: newStatus, updatedAt: new Date().toISOString() };
    saveBoardingForm(updatedForm);
    loadForms();
  };

  const resetForm = () => {
    setEditingForm(null);
    setStartDate('');
    setEndDate('');
    setContactName(user?.name || '');
    setContactPhone('');
    setEmergencyContact('');
    setHealthStatus('좋음');
    setMedications('');
    setAllergies('');
    setSpecialNeeds('');
    setFeedingSchedule('');
    setFoodType('');
    setFoodAmount('');
    setNotes('');
    setIsAdding(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const getStatusText = (status: BoardingForm['status']) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'approved': return '승인됨';
      case 'rejected': return '거부됨';
      case 'completed': return '완료됨';
    }
  };

  const getStatusColor = (status: BoardingForm['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // 관리자용 필터링 및 정렬
  const getFilteredAndSortedForms = () => {
    let filtered = forms;

    // 상태 필터링
    if (filterStatus !== 'all') {
      filtered = filtered.filter(f => f.status === filterStatus);
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case 'name':
          comparison = a.dogName.localeCompare(b.dogName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  };

  // 신청서 작성 폼
  if (isAdding) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingForm ? '보딩 신청서 수정' : '보딩 신청서 작성'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 보딩 기간 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">보딩 기간</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    시작일 *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    종료일 *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 담당자 정보 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">담당자 정보</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    담당자 이름 *
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    연락처 *
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    비상 연락처 *
                  </label>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 건강 상태 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">건강 상태</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    현재 건강 상태 *
                  </label>
                  <select
                    value={healthStatus}
                    onChange={(e) => setHealthStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="좋음">좋음</option>
                    <option value="보통">보통</option>
                    <option value="나쁨">나쁨</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    복용 중인 약 (선택)
                  </label>
                  <textarea
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    placeholder="현재 복용 중인 약이 있다면 입력해주세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    알레르기 정보 (선택)
                  </label>
                  <textarea
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="알레르기가 있다면 입력해주세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    특이사항 (선택)
                  </label>
                  <textarea
                    value={specialNeeds}
                    onChange={(e) => setSpecialNeeds(e.target.value)}
                    placeholder="건강과 관련된 특이사항이 있다면 입력해주세요"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* 식사 정보 */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">식사 정보</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    급여 시간 및 횟수 *
                  </label>
                  <input
                    type="text"
                    value={feedingSchedule}
                    onChange={(e) => setFeedingSchedule(e.target.value)}
                    placeholder="예: 오전 8시, 오후 6시 (하루 2회)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    사료 종류 *
                  </label>
                  <input
                    type="text"
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                    placeholder="예: 로얄캐닌 어덜트"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    1회 급여량 *
                  </label>
                  <input
                    type="text"
                    value={foodAmount}
                    onChange={(e) => setFoodAmount(e.target.value)}
                    placeholder="예: 200g"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 추가 메모 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                추가 메모 (선택)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="기타 전달사항이 있다면 입력해주세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={3}
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {editingForm ? '수정하기' : '신청하기'}
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

  const filteredAndSortedForms = user?.role === 'admin' ? getFilteredAndSortedForms() : forms;

  // 메인 화면
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          보딩 신청 관리{user?.role === 'admin' && ' (관리자)'}
        </h2>
        {user?.role !== 'admin' && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            신청서 작성
          </button>
        )}
      </div>

      {/* 관리자 필터 및 정렬 */}
      {user?.role === 'admin' && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">필터 및 정렬</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                상태 필터
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="all">전체</option>
                <option value="pending">대기중</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거부됨</option>
                <option value="completed">완료됨</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                정렬 기준
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="date">날짜</option>
                <option value="name">견명</option>
                <option value="status">상태</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                정렬 순서
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 신청서 목록 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">신청서 목록</h3>
        {filteredAndSortedForms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>신청서가 없습니다.</p>
            {user?.role !== 'admin' && (
              <button
                onClick={() => setIsAdding(true)}
                className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
              >
                첫 신청서 작성하기
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedForms.map((form) => (
              <div
                key={form.id}
                className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 mb-1">
                      {form.dogName} - {form.userName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(form.startDate)} ~ {formatDate(form.endDate)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(form.status)}`}>
                    {getStatusText(form.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-700">담당자</div>
                    <div className="text-sm text-gray-600">{form.contactName} / {form.contactPhone}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">비상 연락처</div>
                    <div className="text-sm text-gray-600">{form.emergencyContact}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">건강 상태</div>
                    <div className="text-sm text-gray-600">{form.healthStatus}</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">사료</div>
                    <div className="text-sm text-gray-600">{form.foodType} ({form.foodAmount})</div>
                  </div>
                </div>

                {(form.medications || form.allergies || form.specialNeeds || form.notes) && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                    {form.medications && (
                      <div className="text-sm">
                        <span className="font-semibold text-gray-700">복용 약:</span> {form.medications}
                      </div>
                    )}
                    {form.allergies && (
                      <div className="text-sm">
                        <span className="font-semibold text-gray-700">알레르기:</span> {form.allergies}
                      </div>
                    )}
                    {form.specialNeeds && (
                      <div className="text-sm">
                        <span className="font-semibold text-gray-700">특이사항:</span> {form.specialNeeds}
                      </div>
                    )}
                    {form.notes && (
                      <div className="text-sm">
                        <span className="font-semibold text-gray-700">추가 메모:</span> {form.notes}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-2">
                  {user?.role === 'admin' && (
                    <>
                      {form.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(form.id, 'approved')}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleStatusChange(form.id, 'rejected')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            거부
                          </button>
                        </>
                      )}
                      {form.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(form.id, 'completed')}
                          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          완료 처리
                        </button>
                      )}
                    </>
                  )}
                  {form.userId === user?.id && form.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleEdit(form)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(form.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
