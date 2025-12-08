/**
 * 보딩 폼 페이지 컴포넌트
 * 자체 양식으로 보딩 신청서 관리
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getGuideDogs } from '../utils/storage';
import type { BoardingForm, GuideDog, BoardingComment } from '../types/types';
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

// 코멘트 추가
const addComment = (formId: string, comment: BoardingComment): void => {
  const forms = getBoardingForms();
  const formIndex = forms.findIndex(f => f.id === formId);

  if (formIndex >= 0) {
    if (!forms[formIndex].comments) {
      forms[formIndex].comments = [];
    }
    forms[formIndex].comments!.unshift(comment);
    forms[formIndex].updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
  }
};

// 코멘트 읽음 처리
const markCommentsAsRead = (formId: string, userId: string): void => {
  const forms = getBoardingForms();
  const formIndex = forms.findIndex(f => f.id === formId);

  if (formIndex >= 0 && forms[formIndex].comments) {
    forms[formIndex].comments!.forEach(comment => {
      // 신청자가 보는 경우, 관리자가 작성한 코멘트를 읽음 처리
      if (comment.userId !== userId) {
        comment.isRead = true;
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
  }
};

// 읽지 않은 코멘트 개수
const getUnreadCommentCount = (form: BoardingForm, userId: string): number => {
  if (!form.comments) return 0;
  return form.comments.filter(c => c.userId !== userId && !c.isRead).length;
};

// 사료 종류 옵션
const FOOD_TYPES = [
  '내추럴발란스',
  '내추럴발란스퍼피',
  '퍼포먼스',
  'S&S',
  '로얄캐닌어덜트',
  '기타'
];

// 맡긴 물품 옵션
const ITEMS_OPTIONS = [
  '견줄',
  '목줄',
  '헤드컬러',
  '하네스',
  '인식표',
  '건강수첩',
  '견옷',
  '장난감',
  '이불',
  '하트가드',
  '프론트라인',
  '드론탈플러스'
];

// 백신 옵션
const VACCINE_OPTIONS = [
  'DHPPL(종합백신)',
  '광견병',
  '코로나',
  '켄넬코프',
  '인플루엔자',
  '없음'
];

interface BoardingFormPageProps {
  onNavigateHome?: () => void;
}

export const BoardingFormPage = ({ onNavigateHome }: BoardingFormPageProps) => {
  const { user } = useAuth();
  const [forms, setForms] = useState<BoardingForm[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingForm, setEditingForm] = useState<BoardingForm | null>(null);
  const [dogInfo, setDogInfo] = useState<GuideDog | null>(null);
  const [viewingForm, setViewingForm] = useState<BoardingForm | null>(null);
  const [newComment, setNewComment] = useState('');

  // 폼 입력 상태
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [foodType, setFoodType] = useState('');
  const [foodTypeOther, setFoodTypeOther] = useState('');
  const [feedingSchedule, setFeedingSchedule] = useState('');
  const [supplements, setSupplements] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [itemsEtc, setItemsEtc] = useState('');
  const [lastBathDate, setLastBathDate] = useState('');
  const [dewormingSchedule, setDewormingSchedule] = useState('');
  const [selectedVaccines, setSelectedVaccines] = useState<string[]>([]);
  const [boardingReason, setBoardingReason] = useState('개인 사정');
  const [medicalReason, setMedicalReason] = useState('');
  const [medicalDate, setMedicalDate] = useState('');
  const [aftercareTeacher, setAftercareTeacher] = useState('');
  const [tearsblanket, setTearsblanket] = useState('');
  const [usesDTBelt, setUsesDTBelt] = useState('');
  const [needsNailTrim, setNeedsNailTrim] = useState('');
  const [needsPadTrim, setNeedsPadTrim] = useState('');
  const [returnItems, setReturnItems] = useState('');
  const [notes, setNotes] = useState('');

  // 관리자용 필터 및 정렬
  const [filterStatus, setFilterStatus] = useState<'all' | BoardingForm['status']>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadForms();
    loadDogInfo();
  }, [user]);

  const loadDogInfo = () => {
    if (!user?.dogName) return;
    const allDogs = getGuideDogs();
    const dog = allDogs.find(d => d.name === user.dogName);
    setDogInfo(dog || null);
  };

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

  const handleItemToggle = (item: string) => {
    setSelectedItems(prev =>
      prev.includes(item)
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const handleVaccineToggle = (vaccine: string) => {
    if (vaccine === '없음') {
      setSelectedVaccines(['없음']);
    } else {
      setSelectedVaccines(prev => {
        const filtered = prev.filter(v => v !== '없음');
        return filtered.includes(vaccine)
          ? filtered.filter(v => v !== vaccine)
          : [...filtered, vaccine];
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.dogName && user?.role !== 'admin') {
      alert('안내견 정보가 없습니다.');
      return;
    }

    if (!dogInfo) {
      alert('안내견 정보를 찾을 수 없습니다.');
      return;
    }

    const finalFoodType = foodType === '기타' ? foodTypeOther : foodType;

    const form: BoardingForm = {
      id: editingForm?.id || generateId(),
      userId: user!.id,
      userName: user!.name,
      dogName: dogInfo.name,
      dogBirthDate: dogInfo.birthDate,
      dogGender: dogInfo.gender,
      dogCategory: dogInfo.category,
      startDate,
      endDate,
      foodType: finalFoodType,
      feedingSchedule,
      supplements: supplements || undefined,
      items: selectedItems,
      itemsEtc: itemsEtc || undefined,
      lastBathDate,
      dewormingSchedule: dewormingSchedule || undefined,
      vaccinations: selectedVaccines,
      boardingReason,
      medicalReason: (boardingReason === '진료' || boardingReason === '수술') ? medicalReason : undefined,
      medicalDate: (boardingReason === '진료' || boardingReason === '수술') ? medicalDate : undefined,
      aftercareTeacher: (dogInfo.category === '안내견' || dogInfo.category === '안내견/폐사' || dogInfo.category === '안내견/일반안내견/기타') ? aftercareTeacher : undefined,
      tearsblanket: (dogInfo.category === '안내견' || dogInfo.category === '안내견/폐사' || dogInfo.category === '안내견/일반안내견/기타') ? tearsblanket : undefined,
      usesDTBelt,
      needsNailTrim: dogInfo.category === '퍼피티칭' ? needsNailTrim : undefined,
      needsPadTrim: dogInfo.category === '퍼피티칭' ? needsPadTrim : undefined,
      returnItems: returnItems || undefined,
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

    if (FOOD_TYPES.includes(form.foodType)) {
      setFoodType(form.foodType);
      setFoodTypeOther('');
    } else {
      setFoodType('기타');
      setFoodTypeOther(form.foodType);
    }

    setFeedingSchedule(form.feedingSchedule);
    setSupplements(form.supplements || '');
    setSelectedItems(form.items);
    setItemsEtc(form.itemsEtc || '');
    setLastBathDate(form.lastBathDate);
    setDewormingSchedule(form.dewormingSchedule || '');
    setSelectedVaccines(form.vaccinations);
    setBoardingReason(form.boardingReason);
    setMedicalReason(form.medicalReason || '');
    setMedicalDate(form.medicalDate || '');
    setAftercareTeacher(form.aftercareTeacher || '');
    setTearsblanket(form.tearsblanket || '');
    setUsesDTBelt(form.usesDTBelt);
    setNeedsNailTrim(form.needsNailTrim || '');
    setNeedsPadTrim(form.needsPadTrim || '');
    setReturnItems(form.returnItems || '');
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
    setFoodType('');
    setFoodTypeOther('');
    setFeedingSchedule('');
    setSupplements('');
    setSelectedItems([]);
    setItemsEtc('');
    setLastBathDate('');
    setDewormingSchedule('');
    setSelectedVaccines([]);
    setBoardingReason('개인 사정');
    setMedicalReason('');
    setMedicalDate('');
    setAftercareTeacher('');
    setTearsblanket('');
    setUsesDTBelt('');
    setNeedsNailTrim('');
    setNeedsPadTrim('');
    setReturnItems('');
    setNotes('');
    setIsAdding(false);
  };

  // 상세 보기 열기
  const handleViewDetails = (form: BoardingForm) => {
    setViewingForm(form);
    // 사용자가 자신의 신청서를 볼 때 코멘트 읽음 처리
    if (user && form.userId === user.id) {
      markCommentsAsRead(form.id, user.id);
      loadForms(); // 읽음 처리 후 목록 새로고침
    }
  };

  // 상세 보기 닫기
  const handleCloseDetails = () => {
    setViewingForm(null);
    setNewComment('');
  };

  // 코멘트 작성
  const handleAddComment = () => {
    if (!newComment.trim() || !viewingForm || !user) return;

    const comment: BoardingComment = {
      id: generateId(),
      boardingFormId: viewingForm.id,
      userId: user.id,
      userName: user.name,
      content: newComment,
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addComment(viewingForm.id, comment);
    setNewComment('');
    loadForms();

    // 상세 보기 업데이트
    const updatedForms = getBoardingForms();
    const updatedForm = updatedForms.find(f => f.id === viewingForm.id);
    if (updatedForm) {
      setViewingForm(updatedForm);
    }
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

    if (filterStatus !== 'all') {
      filtered = filtered.filter(f => f.status === filterStatus);
    }

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

  const isGuideDog = dogInfo && (
    dogInfo.category === '안내견' ||
    dogInfo.category === '안내견/폐사' ||
    dogInfo.category === '안내견/일반안내견/기타'
  );

  const isPuppy = dogInfo && dogInfo.category === '퍼피티칭';

  // 신청서 작성 폼
  if (isAdding) {
    if (!dogInfo) {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">보딩 신청서</h2>
            <p className="text-red-600">안내견 정보를 찾을 수 없습니다.</p>
            <button
              onClick={resetForm}
              className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              돌아가기
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingForm ? '보딩 신청서 수정' : '보딩 신청서 작성'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 (자동 입력) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">기본 정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">견명:</span> {dogInfo.name}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">생년월일:</span> {formatDate(dogInfo.birthDate)}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">성별:</span> {dogInfo.gender}
                </div>
                <div>
                  <span className="font-semibold text-gray-700">담당자:</span> {user?.name}
                </div>
              </div>
            </div>

            {/* 보딩 기간 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">보딩 기간</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    보딩 시작일 *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    보딩 종료일 *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 사료 정보 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">사료 정보</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    사료 이름 *
                  </label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="">선택하세요</option>
                    {FOOD_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {foodType === '기타' && (
                    <input
                      type="text"
                      value={foodTypeOther}
                      onChange={(e) => setFoodTypeOther(e.target.value)}
                      placeholder="사료 이름을 입력하세요"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mt-2"
                      required
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    급여량과 급여 시기 *
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    급여량은 그램(g) 단위로, 현재 급식 시간과 급식량을 적어주세요.<br />
                    예: 오전8시 100g, 오후1시 30g, 오후6시 100g
                  </p>
                  <textarea
                    value={feedingSchedule}
                    onChange={(e) => setFeedingSchedule(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    먹이는 영양제 종류와 양, 시기
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    예: 오전 파이보 1스푼, 오후 코텍스 2알
                  </p>
                  <textarea
                    value={supplements}
                    onChange={(e) => setSupplements(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* 맡긴 물품 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">학교에 같이 맡긴 물품 *</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {ITEMS_OPTIONS.map(item => (
                  <label key={item} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item)}
                      onChange={() => handleItemToggle(item)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  기타
                </label>
                <input
                  type="text"
                  value={itemsEtc}
                  onChange={(e) => setItemsEtc(e.target.value)}
                  placeholder="기타 물품을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* 최근 목욕일 */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">최근 목욕일 *</h3>
              <p className="text-xs text-gray-600 mb-2">
                보딩 기간이 10일 이상인 경우에 한해 견사에서 목욕을 실시합니다.
              </p>
              <input
                type="date"
                value={lastBathDate}
                onChange={(e) => setLastBathDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            {/* 구충 시행 */}
            <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">보딩 기간 중 구충 시행</h3>
              <p className="text-xs text-gray-600 mb-2">
                시행을 원하는 경우, 반드시 제공된 해당 구충 약품을 가져와 주세요.<br />
                예: 하트가드 25년 1월 10일, 드론탈플러스 25년 3월 1일
              </p>
              <textarea
                value={dewormingSchedule}
                onChange={(e) => setDewormingSchedule(e.target.value)}
                placeholder="구충 약품과 날짜를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={2}
              />
            </div>

            {/* 백신접종 */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">보딩 기간 중 백신접종 *</h3>
              <p className="text-xs text-gray-600 mb-2">
                건강수첩을 참고하여 작성해 주시고, 백신접종 시 건강수첩 제출은 필수입니다.
              </p>
              <div className="space-y-2">
                {VACCINE_OPTIONS.map(vaccine => (
                  <label key={vaccine} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedVaccines.includes(vaccine)}
                      onChange={() => handleVaccineToggle(vaccine)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{vaccine}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 보딩 사유 */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">보딩 사유 *</h3>
              <select
                value={boardingReason}
                onChange={(e) => setBoardingReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-3"
                required
              >
                <option value="개인 사정">개인 사정</option>
                <option value="진료">진료(건강검진 포함)</option>
                <option value="수술">수술</option>
              </select>

              {(boardingReason === '진료' || boardingReason === '수술') && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {boardingReason} 사유 *
                    </label>
                    <input
                      type="text"
                      value={medicalReason}
                      onChange={(e) => setMedicalReason(e.target.value)}
                      placeholder={`${boardingReason} 사유를 입력하세요`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {boardingReason}일 (외부 병원에서 {boardingReason}받은 경우)
                    </label>
                    <input
                      type="date"
                      value={medicalDate}
                      onChange={(e) => setMedicalDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 안내견 전용 필드 */}
            {isGuideDog && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">안내견 전용 정보</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      담당 사후관리 선생님
                    </label>
                    <input
                      type="text"
                      value={aftercareTeacher}
                      onChange={(e) => setAftercareTeacher(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      바닥에 이불을 깔아주면 물어뜯나요?
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tearsblanket"
                          value="예"
                          checked={tearsblanket === '예'}
                          onChange={(e) => setTearsblanket(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">예</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tearsblanket"
                          value="아니오"
                          checked={tearsblanket === '아니오'}
                          onChange={(e) => setTearsblanket(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">아니오</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 배변 DT벨트 (모든 견) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                배변 시 DT밸트를 착용하나요? *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="usesDTBelt"
                    value="예"
                    checked={usesDTBelt === '예'}
                    onChange={(e) => setUsesDTBelt(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                    required
                  />
                  <span className="text-sm text-gray-700">예</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    name="usesDTBelt"
                    value="아니오"
                    checked={usesDTBelt === '아니오'}
                    onChange={(e) => setUsesDTBelt(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                    required
                  />
                  <span className="text-sm text-gray-700">아니오</span>
                </label>
              </div>
            </div>

            {/* 퍼피 전용 필드 */}
            {isPuppy && (
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">퍼피 전용 정보</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      발톱 정리가 필요한가요? *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="needsNailTrim"
                          value="예"
                          checked={needsNailTrim === '예'}
                          onChange={(e) => setNeedsNailTrim(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                          required
                        />
                        <span className="text-sm text-gray-700">예</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="needsNailTrim"
                          value="아니오"
                          checked={needsNailTrim === '아니오'}
                          onChange={(e) => setNeedsNailTrim(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                          required
                        />
                        <span className="text-sm text-gray-700">아니오</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      패드 털 정리가 필요한가요? *
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="needsPadTrim"
                          value="예"
                          checked={needsPadTrim === '예'}
                          onChange={(e) => setNeedsPadTrim(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                          required
                        />
                        <span className="text-sm text-gray-700">예</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="needsPadTrim"
                          value="아니오"
                          checked={needsPadTrim === '아니오'}
                          onChange={(e) => setNeedsPadTrim(e.target.value)}
                          className="w-4 h-4 text-blue-600"
                          required
                        />
                        <span className="text-sm text-gray-700">아니오</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 집으로 돌아갈 때 필요한 물품 */}
            <div className="bg-lime-50 border border-lime-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">집으로 돌아갈 때 필요한 물품</h3>
              <p className="text-xs text-gray-600 mb-2">
                {isPuppy
                  ? '* 퍼피코트, 트릿백, 견줄은 반드시 이전에 사용하던 것을 반납해야 교환됩니다.'
                  : isGuideDog
                  ? '* 견옷, 하네스, 견줄은 반드시 이전에 사용하던 것을 반납해야 교환됩니다.'
                  : '* 견옷, 견줄은 반드시 이전에 사용하던 것을 반납해야 교환됩니다.'
                }
              </p>
              <textarea
                value={returnItems}
                onChange={(e) => setReturnItems(e.target.value)}
                placeholder="필요한 물품을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                rows={2}
              />
            </div>

            {/* 기타 전달사항 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">기타 전달하고 싶은 내용</h3>
              <p className="text-xs text-gray-600 mb-2">
                예: 왼쪽 귀가 좋지 않으니 자주 봐주세요. 등
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="기타 전달사항을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                      {form.dogName} ({form.dogCategory}) - {form.userName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(form.startDate)} ~ {formatDate(form.endDate)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(form.status)}`}>
                    {getStatusText(form.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <div className="font-semibold text-gray-700">사료</div>
                    <div className="text-gray-600">{form.foodType}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">보딩 사유</div>
                    <div className="text-gray-600">{form.boardingReason}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">맡긴 물품</div>
                    <div className="text-gray-600">{form.items.join(', ')}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-700">백신접종</div>
                    <div className="text-gray-600">{form.vaccinations.join(', ')}</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetails(form)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors relative"
                  >
                    상세보기
                    {user && getUnreadCommentCount(form, user.id) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {getUnreadCommentCount(form, user.id)}
                      </span>
                    )}
                  </button>
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

      {/* 상세 보기 모달 */}
      {viewingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">보딩 신청서 상세보기</h2>
              <button
                onClick={handleCloseDetails}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">기본 정보</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">견명:</span> {viewingForm.dogName}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">생년월일:</span> {formatDate(viewingForm.dogBirthDate)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">성별:</span> {viewingForm.dogGender}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">카테고리:</span> {viewingForm.dogCategory}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">신청자:</span> {viewingForm.userName}
                  </div>
                  <div>
                    <span className={`font-semibold px-3 py-1 rounded-full text-sm border ${getStatusColor(viewingForm.status)}`}>
                      {getStatusText(viewingForm.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 보딩 기간 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">보딩 기간</h3>
                <div className="text-sm">
                  {formatDate(viewingForm.startDate)} ~ {formatDate(viewingForm.endDate)}
                </div>
              </div>

              {/* 사료 정보 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">사료 정보</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">사료 종류:</span> {viewingForm.foodType}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">급여량과 급여 시기:</span>
                    <div className="whitespace-pre-wrap mt-1">{viewingForm.feedingSchedule}</div>
                  </div>
                  {viewingForm.supplements && (
                    <div>
                      <span className="font-semibold text-gray-700">영양제:</span>
                      <div className="whitespace-pre-wrap mt-1">{viewingForm.supplements}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 맡긴 물품 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">학교에 같이 맡긴 물품</h3>
                <div className="text-sm">
                  {viewingForm.items.join(', ')}
                  {viewingForm.itemsEtc && `, ${viewingForm.itemsEtc}`}
                </div>
              </div>

              {/* 건강 정보 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">건강 정보</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">최근 목욕일:</span> {formatDate(viewingForm.lastBathDate)}
                  </div>
                  {viewingForm.dewormingSchedule && (
                    <div>
                      <span className="font-semibold text-gray-700">구충 시행:</span> {viewingForm.dewormingSchedule}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700">백신접종:</span> {viewingForm.vaccinations.join(', ')}
                  </div>
                </div>
              </div>

              {/* 보딩 사유 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">보딩 사유</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">사유:</span> {viewingForm.boardingReason}
                  </div>
                  {viewingForm.medicalReason && (
                    <div>
                      <span className="font-semibold text-gray-700">{viewingForm.boardingReason} 사유:</span> {viewingForm.medicalReason}
                    </div>
                  )}
                  {viewingForm.medicalDate && (
                    <div>
                      <span className="font-semibold text-gray-700">{viewingForm.boardingReason}일:</span> {formatDate(viewingForm.medicalDate)}
                    </div>
                  )}
                </div>
              </div>

              {/* 추가 정보 */}
              {(viewingForm.aftercareTeacher || viewingForm.tearsblanket || viewingForm.needsNailTrim || viewingForm.needsPadTrim || viewingForm.returnItems || viewingForm.notes) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">추가 정보</h3>
                  <div className="space-y-2 text-sm">
                    {viewingForm.aftercareTeacher && (
                      <div>
                        <span className="font-semibold text-gray-700">담당 사후관리 선생님:</span> {viewingForm.aftercareTeacher}
                      </div>
                    )}
                    {viewingForm.tearsblanket && (
                      <div>
                        <span className="font-semibold text-gray-700">이불 물어뜯음:</span> {viewingForm.tearsblanket}
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-gray-700">DT벨트 착용:</span> {viewingForm.usesDTBelt}
                    </div>
                    {viewingForm.needsNailTrim && (
                      <div>
                        <span className="font-semibold text-gray-700">발톱 정리:</span> {viewingForm.needsNailTrim}
                      </div>
                    )}
                    {viewingForm.needsPadTrim && (
                      <div>
                        <span className="font-semibold text-gray-700">패드 털 정리:</span> {viewingForm.needsPadTrim}
                      </div>
                    )}
                    {viewingForm.returnItems && (
                      <div>
                        <span className="font-semibold text-gray-700">집으로 돌아갈 때 필요한 물품:</span>
                        <div className="whitespace-pre-wrap mt-1">{viewingForm.returnItems}</div>
                      </div>
                    )}
                    {viewingForm.notes && (
                      <div>
                        <span className="font-semibold text-gray-700">기타 전달사항:</span>
                        <div className="whitespace-pre-wrap mt-1">{viewingForm.notes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 코멘트 섹션 */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">관리자 코멘트</h3>

                {/* 코멘트 목록 */}
                <div className="space-y-3 mb-4">
                  {(!viewingForm.comments || viewingForm.comments.length === 0) && (
                    <p className="text-sm text-gray-500">아직 코멘트가 없습니다.</p>
                  )}
                  {viewingForm.comments && viewingForm.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`p-3 rounded-lg ${
                        !comment.isRead && comment.userId !== user?.id
                          ? 'bg-yellow-100 border border-yellow-300'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-sm text-gray-800">{comment.userName}</span>
                          {!comment.isRead && comment.userId !== user?.id && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">새 코멘트</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>

                {/* 코멘트 작성 (관리자만) */}
                {user?.role === 'admin' && (
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      새 코멘트 작성
                    </label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="보딩 중 발생한 내용이나 특이사항을 작성하세요..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      rows={3}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                    >
                      코멘트 추가
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <button
                onClick={handleCloseDetails}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
