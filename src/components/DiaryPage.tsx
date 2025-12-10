/**
 * 다이어리 페이지 컴포넌트
 * 안내견과의 생활 경험을 기록하는 게시판
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { DiaryPost, DogCategory } from '../types/types';
import { generateId, getGuideDogs } from '../utils/storage';
import {
  getDiaryPosts,
  saveDiaryPost,
  deleteDiaryPost,
} from '../utils/firestoreLectures';
import { MonthlyReportPage } from './MonthlyReportPage';

export const DiaryPage = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'daily' | 'monthly'>('daily');
  const [allPosts, setAllPosts] = useState<DiaryPost[]>([]);
  const [posts, setPosts] = useState<DiaryPost[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [editingPost, setEditingPost] = useState<DiaryPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [viewingPost, setViewingPost] = useState<DiaryPost | null>(null);
  const [selectedDog, setSelectedDog] = useState<string>('all');

  // 퍼피티칭 전용 필드 (배열 기반)
  const [diaryDate, setDiaryDate] = useState('');
  const [feedings, setFeedings] = useState([{ foodType: '', time: '', amount: '', notes: '' }]);
  const [dt1Records, setDt1Records] = useState([{ time: '', place: '', success: '', accident: '', notes: '' }]);
  const [dt2Records, setDt2Records] = useState([{ time: '', place: '', success: '', accident: '', notes: '' }]);
  const [outings, setOutings] = useState([{ place: '', duration: '', notes: '' }]);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // 아코디언 섹션 상태 (기본적으로 모두 열림)
  const [isFeedingOpen, setIsFeedingOpen] = useState(true);
  const [isDt1Open, setIsDt1Open] = useState(true);
  const [isDt2Open, setIsDt2Open] = useState(true);
  const [isOutingOpen, setIsOutingOpen] = useState(true);
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(true);

  // 관리자 필터 상태
  const [adminCategory, setAdminCategory] = useState<DogCategory | 'all'>('퍼피티칭');
  const [periodFilter, setPeriodFilter] = useState<'today' | '3days' | 'week' | 'month' | '3months' | 'custom' | 'all'>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showOtherRecords, setShowOtherRecords] = useState(false);
  const [selectedDogForOther, setSelectedDogForOther] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DogCategory | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    // 필터 적용
    if (user?.role === 'admin') {
      if (selectedDog === 'all') {
        setPosts(allPosts);
      } else {
        setPosts(allPosts.filter(p => p.dogName === selectedDog));
      }
    }
  }, [selectedDog, allPosts, user?.role]);

  const loadPosts = async () => {
    try {
      const loadedPosts = await getDiaryPosts();

      // 관리자는 모든 글 로드 후 필터 가능
      if (user?.role === 'admin') {
        setAllPosts(loadedPosts);
        setPosts(loadedPosts);
        return;
      }

      // 일반 담당자는 자신이 작성한 글만 표시 (자기 안내견에 대해 다른 담당자가 쓴 글은 보이지 않음)
      const filteredPosts = loadedPosts.filter(p => p.userId === user?.id);
      setAllPosts(filteredPosts);
      setPosts(filteredPosts);
    } catch (error) {
      console.error('다이어리 로드 실패:', error);
      alert('다이어리를 불러오는데 실패했습니다.');
    }
  };

  // 안내견 목록 가져오기 (관리자용 필터)
  const getDogNames = (): string[] => {
    const uniqueDogs = new Set<string>();
    allPosts.forEach(post => {
      if (post.dogName) uniqueDogs.add(post.dogName);
    });
    return Array.from(uniqueDogs).sort();
  };

  // 관리자: 카테고리별 개 목록 가져오기
  const getDogsByAdminCategory = () => {
    const allDogs = getGuideDogs();
    if (adminCategory === 'all') return allDogs;
    return allDogs.filter(dog => dog.category === adminCategory);
  };

  // 관리자: 특정 개가 다른 카테고리에 기록이 있는지 확인
  const getAvailableCategories = (dogName: string): DogCategory[] => {
    const categories: DogCategory[] = [];
    const dogPosts = allPosts.filter(post => post.dogName === dogName);

    // 퍼피티칭 기록 확인 (현재 카테고리가 퍼피티칭이 아닐 때만)
    if (adminCategory !== '퍼피티칭') {
      const hasPuppyRecords = dogPosts.some(post => {
        // 퍼피티칭 전용 필드가 있거나 dogCategory가 퍼피티칭인 경우
        return post.feedings || post.dt1Records || post.dt2Records ||
               post.outings || post.dogCategory === '퍼피티칭';
      });
      if (hasPuppyRecords) {
        categories.push('퍼피티칭');
      }
    }

    // 다른 카테고리 확인 (dogCategory가 명시적으로 설정된 경우만)
    const otherCategories: DogCategory[] = ['안내견', '은퇴견', '부모견'];
    otherCategories.forEach(category => {
      // 현재 선택된 카테고리는 제외
      if (category === adminCategory) return;

      // 해당 카테고리로 명시적으로 작성된 글이 있는지 확인
      const hasRecordsInCategory = dogPosts.some(post => {
        return post.dogCategory === category; // 정확히 일치하는 경우만
      });

      if (hasRecordsInCategory) {
        categories.push(category);
      }
    });

    return categories;
  };

  // 관리자: 기간 필터링
  const getDateRange = (): { start: Date; end: Date } => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    switch (periodFilter) {
      case 'today':
        return { start, end };
      case '3days':
        start.setDate(start.getDate() - 2);
        return { start, end };
      case 'week':
        start.setDate(start.getDate() - 6);
        return { start, end };
      case 'month':
        start.setMonth(start.getMonth() - 1);
        return { start, end };
      case '3months':
        start.setMonth(start.getMonth() - 3);
        return { start, end };
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate),
            end: new Date(customEndDate + 'T23:59:59'),
          };
        }
        return { start, end };
      case 'all':
        return { start: new Date(0), end };
      default:
        return { start, end };
    }
  };

  // 관리자: 특정 개의 특정 날짜 다이어리 찾기
  const getDiaryForDogAndDate = (dogName: string, date: string): DiaryPost | null => {
    if (adminCategory === '퍼피티칭') {
      // 퍼피티칭: diaryDate 필드가 있는 다이어리만 표시
      return allPosts.find(
        post => post.dogName === dogName && post.diaryDate === date
      ) || null;
    } else if (adminCategory === 'all') {
      // 전체: 모든 다이어리 표시
      return allPosts.find(post => {
        if (post.dogName !== dogName) return false;
        // diaryDate가 있으면 diaryDate로 매칭
        if (post.diaryDate) {
          return post.diaryDate === date;
        }
        // 없으면 createdAt으로 로컬 시간대로 매칭
        const createdDate = new Date(post.createdAt);
        const year = createdDate.getFullYear();
        const month = String(createdDate.getMonth() + 1).padStart(2, '0');
        const day = String(createdDate.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        return localDateStr === date;
      }) || null;
    } else {
      // 안내견/은퇴견/부모견: 현재 개의 카테고리로 필터링하고 날짜로 매칭
      return allPosts.find(post => {
        if (post.dogName !== dogName) return false;

        // 현재 개의 카테고리를 실시간으로 확인하여 필터링
        const currentDog = getGuideDogs().find(d => d.name === post.dogName);
        if (currentDog && currentDog.category !== adminCategory) return false;

        // diaryDate가 있으면 diaryDate로 매칭 (새 형식)
        if (post.diaryDate) {
          return post.diaryDate === date;
        }

        // 없으면 createdAt으로 로컬 시간대로 매칭 (구 형식)
        const createdDate = new Date(post.createdAt);
        const year = createdDate.getFullYear();
        const month = String(createdDate.getMonth() + 1).padStart(2, '0');
        const day = String(createdDate.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;

        return localDateStr === date;
      }) || null;
    }
  };

  // 날짜 설정 함수 (퍼피티칭용)
  const setTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    setDiaryDate(`${year}-${month}-${day}`);
  };

  const setYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const year = yesterday.getFullYear();
    const month = String(yesterday.getMonth() + 1).padStart(2, '0');
    const day = String(yesterday.getDate()).padStart(2, '0');
    setDiaryDate(`${year}-${month}-${day}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 모든 사용자 공통 검증
    if (!diaryDate) {
      alert('날짜를 입력해주세요.');
      return;
    }

    // 퍼피티칭 사용자 검증
    if (user?.role === 'puppyTeacher') {
      // 퍼피티칭은 제목/내용 자동 생성되므로 추가 검증 불필요
    } else {
      if (!title.trim() || !content.trim()) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
      }
    }

    // 개의 현재 카테고리 정보 가져오기
    const dogCategory = user?.dogName
      ? getGuideDogs().find(dog => dog.name === user.dogName)?.category
      : undefined;

    const post: DiaryPost = {
      id: editingPost?.id || generateId(),
      userId: user!.id,
      userName: user!.name,
      dogName: user?.dogName,
      dogCategory: dogCategory,
      title: user?.role === 'puppyTeacher' ? `${diaryDate} 일지` : title.trim(),
      content: user?.role === 'puppyTeacher' ? '퍼피티칭 일지' : content.trim(),
      createdAt: editingPost?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      diaryDate, // 모든 사용자에게 diaryDate 저장
      // 퍼피티칭 전용 필드 (배열 기반)
      ...(user?.role === 'puppyTeacher' && {
        feedings: feedings.filter(f => f.time || f.foodType || f.amount || f.notes),
        dt1Records: dt1Records.filter(d => d.time || d.place || d.success || d.accident || d.notes),
        dt2Records: dt2Records.filter(d => d.time || d.place || d.success || d.accident || d.notes),
        outings: outings.filter(o => o.place || o.duration || o.notes),
        additionalNotes: additionalNotes || undefined,
      }),
    };

    try {
      await saveDiaryPost(post);
      resetForm();
      await loadPosts();
    } catch (error) {
      console.error('다이어리 저장 실패:', error);
      alert('다이어리 저장에 실패했습니다.');
    }
  };

  const handleEdit = (post: DiaryPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);

    // 퍼피티칭 데이터 로드 (배열 기반)
    if (post.diaryDate) {
      setDiaryDate(post.diaryDate);

      // 새 형식(배열)이 있으면 사용, 없으면 기존 형식에서 변환
      if (post.feedings && post.feedings.length > 0) {
        setFeedings(post.feedings);
      } else if (post.feedingTime || post.foodType) {
        setFeedings([{
          foodType: post.foodType || '',
          time: post.feedingTime || '',
          amount: post.feedingAmount || '',
          notes: post.feedingNotes || ''
        }]);
      }

      if (post.dt1Records && post.dt1Records.length > 0) {
        setDt1Records(post.dt1Records);
      } else if (post.dt1Time) {
        setDt1Records([{
          time: post.dt1Time || '',
          place: post.dt1Place || '',
          success: post.dt1Success || '',
          accident: post.dt1Accident || '',
          notes: post.dt1Notes || ''
        }]);
      }

      if (post.dt2Records && post.dt2Records.length > 0) {
        setDt2Records(post.dt2Records);
      } else if (post.dt2Time) {
        setDt2Records([{
          time: post.dt2Time || '',
          place: post.dt2Place || '',
          success: post.dt2Success || '',
          accident: post.dt2Accident || '',
          notes: post.dt2Notes || ''
        }]);
      }

      if (post.outings && post.outings.length > 0) {
        setOutings(post.outings);
      } else if (post.outingPlace) {
        setOutings([{
          place: post.outingPlace || '',
          duration: post.outingDuration || '',
          notes: post.outingNotes || ''
        }]);
      }

      setAdditionalNotes(post.additionalNotes || '');
    }

    setIsWriting(true);
    setViewingPost(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteDiaryPost(id);
        await loadPosts();
        setViewingPost(null);
      } catch (error) {
        console.error('다이어리 삭제 실패:', error);
        alert('다이어리 삭제에 실패했습니다.');
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsWriting(false);
    setEditingPost(null);

    // 퍼피티칭 필드 초기화 (배열 기반)
    setDiaryDate('');
    setFeedings([{ foodType: '', time: '', amount: '', notes: '' }]);
    setDt1Records([{ time: '', place: '', success: '', accident: '', notes: '' }]);
    setDt2Records([{ time: '', place: '', success: '', accident: '', notes: '' }]);
    setOutings([{ place: '', duration: '', notes: '' }]);
    setAdditionalNotes('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 다른 카테고리 기록 모달
  if (showOtherRecords && selectedDogForOther && selectedCategory) {
    const categoryPosts = allPosts.filter(post => {
      if (post.dogName !== selectedDogForOther) return false;

      // 퍼피티칭 기록
      if (selectedCategory === '퍼피티칭') {
        return post.diaryDate !== undefined;
      }

      // 일반 다이어리 (안내견/은퇴견/부모견) - dogCategory로 확인
      return post.dogCategory === selectedCategory;
    }).sort((a, b) => {
      // 퍼피티칭은 diaryDate로 정렬
      if (selectedCategory === '퍼피티칭' && a.diaryDate && b.diaryDate) {
        return new Date(b.diaryDate).getTime() - new Date(a.diaryDate).getTime();
      }
      // 일반 다이어리는 createdAt으로 정렬
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedDogForOther} - {selectedCategory} 기록
            </h2>
            <button
              onClick={() => {
                setShowOtherRecords(false);
                setSelectedDogForOther(null);
                setSelectedCategory(null);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              닫기
            </button>
          </div>

          {categoryPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">{selectedCategory} 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryPosts.map((post) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <button
                      onClick={() => setViewingPost(post)}
                      className="text-lg font-bold text-blue-600 hover:text-blue-800 underline text-left"
                    >
                      {post.title}
                    </button>
                    <span className="text-sm text-gray-600">
                      작성: {post.userName}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    {post.diaryDate ? (
                      <span>날짜: {post.diaryDate}</span>
                    ) : (
                      <span>작성일: {formatDate(post.createdAt)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 글 상세보기
  if (viewingPost) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <button
              onClick={() => {
                setViewingPost(null);
                // 다른 카테고리 기록 모달에서 왔으면 다시 모달로 돌아가기
                if (!showOtherRecords || !selectedDogForOther || !selectedCategory) {
                  // 모달이 아니면 모달 상태 초기화
                  setShowOtherRecords(false);
                  setSelectedDogForOther(null);
                  setSelectedCategory(null);
                }
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              ← 목록으로
            </button>
            {viewingPost.userId === user?.id && (
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(viewingPost)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(viewingPost.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {viewingPost.title}
          </h1>

          <div className="flex items-center text-sm text-gray-600 mb-6 space-x-4">
            <span>작성자: {viewingPost.userName}</span>
            {viewingPost.dogName && <span>안내견: {viewingPost.dogName}</span>}
            {viewingPost.diaryDate && <span>날짜: {viewingPost.diaryDate}</span>}
            <span>작성일: {formatDate(viewingPost.createdAt)}</span>
            {viewingPost.createdAt !== viewingPost.updatedAt && (
              <span>(수정됨)</span>
            )}
          </div>

          {/* 퍼피티칭 다이어리 상세보기 */}
          {viewingPost.diaryDate ? (
            <div className="space-y-6">
              {/* 급식 */}
              {((viewingPost.feedings && viewingPost.feedings.length > 0) || viewingPost.feedingTime) && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">급식</h3>
                  {viewingPost.feedings && viewingPost.feedings.length > 0 ? (
                    <div className="space-y-4">
                      {viewingPost.feedings.map((feeding, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">급식 #{index + 1}</h4>
                          <div className="space-y-1 text-gray-700">
                            {feeding.time && <p><span className="font-semibold">시간:</span> {feeding.time}</p>}
                            {feeding.foodType && <p><span className="font-semibold">사료 종류:</span> {feeding.foodType}</p>}
                            {feeding.amount && <p><span className="font-semibold">급식량:</span> {feeding.amount}g</p>}
                            {feeding.notes && <p><span className="font-semibold">추가 내용:</span> {feeding.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 text-gray-700">
                      {viewingPost.foodType && <p><span className="font-semibold">사료 종류:</span> {viewingPost.foodType}</p>}
                      {viewingPost.feedingTime && <p><span className="font-semibold">급식 시간:</span> {viewingPost.feedingTime}</p>}
                      {viewingPost.feedingAmount && <p><span className="font-semibold">급식량:</span> {viewingPost.feedingAmount}g</p>}
                      {viewingPost.feedingNotes && <p><span className="font-semibold">추가 내용:</span> {viewingPost.feedingNotes}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* DT1 (소변) */}
              {((viewingPost.dt1Records && viewingPost.dt1Records.length > 0) || viewingPost.dt1Time || viewingPost.dt1Place || viewingPost.dt1Success || viewingPost.dt1Accident || viewingPost.dt1Notes) && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">배변 - DT1 (소변)</h3>
                  {viewingPost.dt1Records && viewingPost.dt1Records.length > 0 ? (
                    <div className="space-y-4">
                      {viewingPost.dt1Records.map((dt1, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">DT1 #{index + 1}</h4>
                          <div className="space-y-1 text-gray-700">
                            {dt1.time && <p><span className="font-semibold">시간:</span> {dt1.time}</p>}
                            {dt1.place && <p><span className="font-semibold">장소:</span> {dt1.place}</p>}
                            {dt1.success && <p><span className="font-semibold">성공 정도:</span> {dt1.success}</p>}
                            {dt1.accident && <p><span className="font-semibold">실수 여부:</span> {dt1.accident}</p>}
                            {dt1.notes && <p><span className="font-semibold">관련 사항:</span> {dt1.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 text-gray-700">
                      {viewingPost.dt1Time && (
                        <p><span className="font-semibold">시간:</span> {viewingPost.dt1Time}</p>
                      )}
                      {viewingPost.dt1Place && (
                        <p><span className="font-semibold">장소:</span> {viewingPost.dt1Place}</p>
                      )}
                      {viewingPost.dt1Success && (
                        <p><span className="font-semibold">성공 정도:</span> {viewingPost.dt1Success}</p>
                      )}
                      {viewingPost.dt1Accident && (
                        <p><span className="font-semibold">실수 여부:</span> {viewingPost.dt1Accident}</p>
                      )}
                      {viewingPost.dt1Notes && (
                        <p><span className="font-semibold">관련 사항:</span> {viewingPost.dt1Notes}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* DT2 (대변) */}
              {((viewingPost.dt2Records && viewingPost.dt2Records.length > 0) || viewingPost.dt2Time || viewingPost.dt2Place || viewingPost.dt2Success || viewingPost.dt2Accident || viewingPost.dt2Notes) && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">배변 - DT2 (대변)</h3>
                  {viewingPost.dt2Records && viewingPost.dt2Records.length > 0 ? (
                    <div className="space-y-4">
                      {viewingPost.dt2Records.map((dt2, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">DT2 #{index + 1}</h4>
                          <div className="space-y-1 text-gray-700">
                            {dt2.time && <p><span className="font-semibold">시간:</span> {dt2.time}</p>}
                            {dt2.place && <p><span className="font-semibold">장소:</span> {dt2.place}</p>}
                            {dt2.success && <p><span className="font-semibold">성공 정도:</span> {dt2.success}</p>}
                            {dt2.accident && <p><span className="font-semibold">실수 여부:</span> {dt2.accident}</p>}
                            {dt2.notes && <p><span className="font-semibold">관련 사항:</span> {dt2.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 text-gray-700">
                      {viewingPost.dt2Time && (
                        <p><span className="font-semibold">시간:</span> {viewingPost.dt2Time}</p>
                      )}
                      {viewingPost.dt2Place && (
                        <p><span className="font-semibold">장소:</span> {viewingPost.dt2Place}</p>
                      )}
                      {viewingPost.dt2Success && (
                        <p><span className="font-semibold">성공 정도:</span> {viewingPost.dt2Success}</p>
                      )}
                      {viewingPost.dt2Accident && (
                        <p><span className="font-semibold">실수 여부:</span> {viewingPost.dt2Accident}</p>
                      )}
                      {viewingPost.dt2Notes && (
                        <p><span className="font-semibold">관련 사항:</span> {viewingPost.dt2Notes}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 외출 */}
              {((viewingPost.outings && viewingPost.outings.length > 0) || viewingPost.outingPlace || viewingPost.outingDuration || viewingPost.outingNotes) && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">외출</h3>
                  {viewingPost.outings && viewingPost.outings.length > 0 ? (
                    <div className="space-y-4">
                      {viewingPost.outings.map((outing, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">외출 #{index + 1}</h4>
                          <div className="space-y-1 text-gray-700">
                            {outing.place && <p><span className="font-semibold">장소:</span> {outing.place}</p>}
                            {outing.duration && <p><span className="font-semibold">외출 시간:</span> {outing.duration}</p>}
                            {outing.notes && <p><span className="font-semibold">특이사항:</span> {outing.notes}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2 text-gray-700">
                      {viewingPost.outingPlace && (
                        <p><span className="font-semibold">장소:</span> {viewingPost.outingPlace}</p>
                      )}
                      {viewingPost.outingDuration && (
                        <p><span className="font-semibold">외출 시간:</span> {viewingPost.outingDuration}</p>
                      )}
                      {viewingPost.outingNotes && (
                        <p><span className="font-semibold">특이사항:</span> {viewingPost.outingNotes}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 그 밖에 오늘 하고 싶은 말 */}
              {viewingPost.additionalNotes && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">그 밖에 오늘 하고 싶은 말</h3>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {viewingPost.additionalNotes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* 일반 다이어리 */
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {viewingPost.content}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 글쓰기/수정 폼
  if (isWriting) {
    // 퍼피티칭 전용 폼
    if (user?.role === 'puppyTeacher') {
      return (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingPost ? '일지 수정' : '일지 작성'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 날짜 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  날짜 *
                </label>
                <div className="flex gap-3 mb-2">
                  <button
                    type="button"
                    onClick={setTodayDate}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold transition-colors"
                  >
                    오늘
                  </button>
                  <button
                    type="button"
                    onClick={setYesterdayDate}
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold transition-colors"
                  >
                    어제
                  </button>
                </div>
                <input
                  type="date"
                  value={diaryDate}
                  onChange={(e) => setDiaryDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              {/* 급식 */}
              <div className="border-t pt-6">
                <button
                  type="button"
                  onClick={() => setIsFeedingOpen(!isFeedingOpen)}
                  className="w-full flex items-center justify-between text-lg font-bold text-gray-800 mb-4 hover:text-blue-600 transition-colors"
                >
                  <span>급식</span>
                  <svg
                    className={`w-6 h-6 transform transition-transform ${isFeedingOpen ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {isFeedingOpen && (
                  <div className="space-y-6">
                    {feedings.map((feeding, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-700">급식 #{index + 1}</h4>
                          {feedings.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setFeedings(feedings.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            급식 시간
                          </label>
                          <input
                            type="time"
                            value={feeding.time}
                            onChange={(e) => {
                              const newFeedings = [...feedings];
                              newFeedings[index].time = e.target.value;
                              setFeedings(newFeedings);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            사료 종류
                          </label>
                          <input
                            type="text"
                            value={feeding.foodType}
                            onChange={(e) => {
                              const newFeedings = [...feedings];
                              newFeedings[index].foodType = e.target.value;
                              setFeedings(newFeedings);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="사료 종류"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            급식량 (그램)
                          </label>
                          <input
                            type="number"
                            value={feeding.amount}
                            onChange={(e) => {
                              const newFeedings = [...feedings];
                              newFeedings[index].amount = e.target.value;
                              setFeedings(newFeedings);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="그램"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            추가 내용
                          </label>
                          <textarea
                            value={feeding.notes}
                            onChange={(e) => {
                              const newFeedings = [...feedings];
                              newFeedings[index].notes = e.target.value;
                              setFeedings(newFeedings);
                            }}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            placeholder="추가 내용"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFeedings([...feedings, { foodType: '', time: '', amount: '', notes: '' }])}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      + 급식 시간 추가
                    </button>
                  </div>
                )}
              </div>

              {/* 배변 - DT1 (소변) */}
              <div className="border-t pt-6">
                <button
                  type="button"
                  onClick={() => setIsDt1Open(!isDt1Open)}
                  className="w-full flex items-center justify-between text-lg font-bold text-gray-800 mb-4 hover:text-blue-600 transition-colors"
                >
                  <span>배변 - DT1 (소변)</span>
                  <svg
                    className={`w-6 h-6 transform transition-transform ${isDt1Open ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {isDt1Open && (
                  <div className="space-y-6">
                    {dt1Records.map((record, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-700">DT1 #{index + 1}</h4>
                          {dt1Records.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setDt1Records(dt1Records.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">시간</label>
                          <input
                            type="time"
                            value={record.time}
                            onChange={(e) => {
                              const newRecords = [...dt1Records];
                              newRecords[index].time = e.target.value;
                              setDt1Records(newRecords);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">장소</label>
                          <input
                            type="text"
                            value={record.place}
                            onChange={(e) => {
                              const newRecords = [...dt1Records];
                              newRecords[index].place = e.target.value;
                              setDt1Records(newRecords);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="배변 장소"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">성공 정도</label>
                          <input
                            type="text"
                            value={record.success}
                            onChange={(e) => {
                              const newRecords = [...dt1Records];
                              newRecords[index].success = e.target.value;
                              setDt1Records(newRecords);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="예: 잘함, 보통"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">실수 여부</label>
                          <input
                            type="text"
                            value={record.accident}
                            onChange={(e) => {
                              const newRecords = [...dt1Records];
                              newRecords[index].accident = e.target.value;
                              setDt1Records(newRecords);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="예: 없음, 1회"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">관련 사항</label>
                          <textarea
                            value={record.notes}
                            onChange={(e) => {
                              const newRecords = [...dt1Records];
                              newRecords[index].notes = e.target.value;
                              setDt1Records(newRecords);
                            }}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            placeholder="추가 내용"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDt1Records([...dt1Records, { time: '', place: '', success: '', accident: '', notes: '' }])}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      + DT1 시간 추가
                    </button>
                  </div>
                )}
              </div>

              {/* 배변 - DT2 (대변) */}
              <div className="border-t pt-6">
                <button
                  type="button"
                  onClick={() => setIsDt2Open(!isDt2Open)}
                  className="w-full flex items-center justify-between text-lg font-bold text-gray-800 mb-4 hover:text-blue-600 transition-colors"
                >
                  <span>배변 - DT2 (대변)</span>
                  <svg
                    className={`w-6 h-6 transform transition-transform ${isDt2Open ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {isDt2Open && (
                  <div className="space-y-6">
                    {dt2Records.map((record, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-700">DT2 #{index + 1}</h4>
                          {dt2Records.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setDt2Records(dt2Records.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">시간</label>
                          <input
                            type="time"
                            value={record.time}
                            onChange={(e) => {
                              const newRecords = [...dt2Records];
                              newRecords[index].time = e.target.value;
                              setDt2Records(newRecords);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">장소</label>
                          <input
                            type="text"
                            value={record.place}
                            onChange={(e) => {
                              const newRecords = [...dt2Records];
                              newRecords[index].place = e.target.value;
                              setDt2Records(newRecords);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="배변 장소"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">성공 정도</label>
                          <input
                            type="text"
                            value={record.success}
                            onChange={(e) => {
                              const newRecords = [...dt2Records];
                              newRecords[index].success = e.target.value;
                              setDt2Records(newRecords);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="예: 잘함, 보통"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">실수 여부</label>
                          <input
                            type="text"
                            value={record.accident}
                            onChange={(e) => {
                              const newRecords = [...dt2Records];
                              newRecords[index].accident = e.target.value;
                              setDt2Records(newRecords);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="예: 없음, 1회"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">관련 사항</label>
                          <textarea
                            value={record.notes}
                            onChange={(e) => {
                              const newRecords = [...dt2Records];
                              newRecords[index].notes = e.target.value;
                              setDt2Records(newRecords);
                            }}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            placeholder="추가 내용"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDt2Records([...dt2Records, { time: '', place: '', success: '', accident: '', notes: '' }])}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      + DT2 시간 추가
                    </button>
                  </div>
                )}
              </div>

              {/* 외출 */}
              <div className="border-t pt-6">
                <button
                  type="button"
                  onClick={() => setIsOutingOpen(!isOutingOpen)}
                  className="w-full flex items-center justify-between text-lg font-bold text-gray-800 mb-4 hover:text-blue-600 transition-colors"
                >
                  <span>외출</span>
                  <svg
                    className={`w-6 h-6 transform transition-transform ${isOutingOpen ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {isOutingOpen && (
                  <div className="space-y-6">
                    {outings.map((outing, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold text-gray-700">외출 #{index + 1}</h4>
                          {outings.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setOutings(outings.filter((_, i) => i !== index))}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">장소</label>
                          <input
                            type="text"
                            value={outing.place}
                            onChange={(e) => {
                              const newOutings = [...outings];
                              newOutings[index].place = e.target.value;
                              setOutings(newOutings);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="어디로 나갔는지"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">외출 시간</label>
                          <input
                            type="text"
                            value={outing.duration}
                            onChange={(e) => {
                              const newOutings = [...outings];
                              newOutings[index].duration = e.target.value;
                              setOutings(newOutings);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="예: 2시간 30분"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">특이사항</label>
                          <textarea
                            value={outing.notes}
                            onChange={(e) => {
                              const newOutings = [...outings];
                              newOutings[index].notes = e.target.value;
                              setOutings(newOutings);
                            }}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                            placeholder="특이사항"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setOutings([...outings, { place: '', duration: '', notes: '' }])}
                      className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      + 외출 시간 추가
                    </button>
                  </div>
                )}
              </div>

              {/* 그 밖에 오늘 하고 싶은 말 */}
              <div className="border-t pt-6">
                <button
                  type="button"
                  onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
                  className="w-full flex items-center justify-between text-lg font-bold text-gray-800 mb-4 hover:text-blue-600 transition-colors"
                >
                  <span>그 밖에 오늘 하고 싶은 말</span>
                  <svg
                    className={`w-6 h-6 transform transition-transform ${isAdditionalOpen ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {isAdditionalOpen && (
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="자유롭게 작성하세요"
                  />
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {editingPost ? '수정 완료' : '작성 완료'}
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

    // 일반 사용자 폼
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingPost ? '다이어리 수정' : '다이어리 작성'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="diaryDate"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                다이어리 날짜
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  id="diaryDate"
                  value={diaryDate}
                  onChange={(e) => setDiaryDate(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={setTodayDate}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  오늘
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                제목
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="제목을 입력하세요"
                required
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                내용
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={15}
                placeholder="안내견과의 생활 경험을 자유롭게 작성해주세요"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {editingPost ? '수정 완료' : '작성 완료'}
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

  // 목록 보기
  // 관리자 뷰
  if (user?.role === 'admin') {
    const dogs = getDogsByAdminCategory();
    const { start, end } = getDateRange();

    // 기간 내 날짜 목록 생성
    const dates: string[] = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return (
      <div className="max-w-full mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">다이어리 관리</h2>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                카테고리
              </label>
              <select
                value={adminCategory}
                onChange={(e) => setAdminCategory(e.target.value as DogCategory | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="퍼피티칭">퍼피티칭</option>
                <option value="안내견">안내견</option>
                <option value="은퇴견">은퇴견</option>
                <option value="부모견">부모견</option>
                <option value="all">전체</option>
              </select>
            </div>

            {/* 기간 선택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                기간
              </label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="today">오늘</option>
                <option value="3days">3일 이전</option>
                <option value="week">일주일</option>
                <option value="month">1개월</option>
                <option value="3months">3개월</option>
                <option value="custom">기간 설정</option>
                <option value="all">전체</option>
              </select>
            </div>

            {/* 사용자 정의 기간 */}
            {periodFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 다이어리 목록 */}
        {dogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500">선택한 카테고리에 해당하는 개가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 border-b sticky left-0 bg-gray-100 z-10">
                      견명
                    </th>
                    {dates.slice().reverse().map(date => (
                      <th key={date} className="px-4 py-3 text-center text-sm font-semibold text-gray-800 border-b whitespace-nowrap min-w-[120px]">
                        {new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dogs.map(dog => {
                    const availableCategories = getAvailableCategories(dog.name);
                    return (
                      <tr key={dog.id} className="hover:bg-gray-50 border-b">
                        <td className="px-4 py-3 sticky left-0 bg-white z-10">
                          <div className="flex flex-col gap-2">
                            <span className="font-semibold text-gray-800">{dog.name}</span>
                            {availableCategories.length > 0 && (
                              <div className="flex flex-col gap-1">
                                {availableCategories.map(category => (
                                  <button
                                    key={category}
                                    onClick={() => {
                                      setSelectedDogForOther(dog.name);
                                      setSelectedCategory(category);
                                      setShowOtherRecords(true);
                                    }}
                                    className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                                  >
                                    {category} 기록 보기
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        {dates.slice().reverse().map(date => {
                          const diary = getDiaryForDogAndDate(dog.name, date);
                          return (
                            <td key={date} className="px-4 py-3 text-center">
                              {diary ? (
                                <button
                                  onClick={() => setViewingPost(diary)}
                                  className="text-blue-600 hover:text-blue-800 font-semibold underline"
                                  aria-label={`${dog.name} ${date} 다이어리: ${diary.title}`}
                                >
                                  {diary.title}
                                </button>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 일반 사용자 뷰
  return (
    <div className="max-w-4xl mx-auto">
      {/* 탭 메뉴 (퍼피티칭만) */}
      {user?.role === 'puppyTeacher' && (
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setCurrentTab('daily')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                currentTab === 'daily'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              1일 다이어리
            </button>
            <button
              onClick={() => setCurrentTab('monthly')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                currentTab === 'monthly'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              월간 보고서
            </button>
          </div>
        </div>
      )}

      {/* 월간 보고서 */}
      {currentTab === 'monthly' && user?.role === 'puppyTeacher' ? (
        <MonthlyReportPage />
      ) : (
        <>
          {/* 1일 다이어리 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {user?.role === 'puppyTeacher' ? '1일 다이어리' : '다이어리'}
            </h2>
            <button
              onClick={() => setIsWriting(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              글쓰기
            </button>
          </div>

          {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">작성된 다이어리가 없습니다.</p>
          <button
            onClick={() => setIsWriting(true)}
            className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
          >
            첫 다이어리 작성하기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <button
                onClick={() => setViewingPost(post)}
                className="text-xl font-bold text-blue-600 hover:text-blue-800 underline mb-2 text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                {post.title}
              </button>
              <div className="flex items-center text-sm text-gray-600 space-x-4">
                <span>{post.userName}</span>
                {post.dogName && <span>{post.dogName}</span>}
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
};
