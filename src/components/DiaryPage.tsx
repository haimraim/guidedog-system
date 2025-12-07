/**
 * 다이어리 페이지 컴포넌트
 * 안내견과의 생활 경험을 기록하는 게시판
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { DiaryPost } from '../types/types';
import { generateId } from '../utils/storage';

const STORAGE_KEY = 'guidedog_diary';

const getDiaryPosts = (): DiaryPost[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveDiaryPost = (post: DiaryPost): void => {
  const posts = getDiaryPosts();
  const existingIndex = posts.findIndex(p => p.id === post.id);

  if (existingIndex >= 0) {
    posts[existingIndex] = { ...post, updatedAt: new Date().toISOString() };
  } else {
    posts.unshift(post); // 최신 글이 위로
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
};

const deleteDiaryPost = (id: string): void => {
  const posts = getDiaryPosts().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
};

export const DiaryPage = () => {
  const { user } = useAuth();
  const [allPosts, setAllPosts] = useState<DiaryPost[]>([]);
  const [posts, setPosts] = useState<DiaryPost[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [editingPost, setEditingPost] = useState<DiaryPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [viewingPost, setViewingPost] = useState<DiaryPost | null>(null);
  const [selectedDog, setSelectedDog] = useState<string>('all');

  // 퍼피티칭 전용 필드
  const [diaryDate, setDiaryDate] = useState('');
  const [foodType, setFoodType] = useState('');
  const [usePreviousFoodType, setUsePreviousFoodType] = useState(false);
  const [feedingTime, setFeedingTime] = useState('');
  const [feedingAmount, setFeedingAmount] = useState('');
  const [feedingNotes, setFeedingNotes] = useState('');
  const [dt1Time, setDt1Time] = useState('');
  const [dt1Place, setDt1Place] = useState('');
  const [dt1Success, setDt1Success] = useState('');
  const [dt1Accident, setDt1Accident] = useState('');
  const [dt1Notes, setDt1Notes] = useState('');
  const [dt2Time, setDt2Time] = useState('');
  const [dt2Place, setDt2Place] = useState('');
  const [dt2Success, setDt2Success] = useState('');
  const [dt2Accident, setDt2Accident] = useState('');
  const [dt2Notes, setDt2Notes] = useState('');
  const [outingPlace, setOutingPlace] = useState('');
  const [outingDuration, setOutingDuration] = useState('');
  const [outingNotes, setOutingNotes] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // 아코디언 섹션 상태 (기본적으로 모두 열림)
  const [isFeedingOpen, setIsFeedingOpen] = useState(true);
  const [isDt1Open, setIsDt1Open] = useState(true);
  const [isDt2Open, setIsDt2Open] = useState(true);
  const [isOutingOpen, setIsOutingOpen] = useState(true);
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    // 퍼피티칭 사용자가 이전 사료 타입 체크 시 불러오기
    if (user?.role === 'puppyTeacher' && usePreviousFoodType) {
      const userPosts = getDiaryPosts().filter(p => p.userId === user.id && p.foodType);
      if (userPosts.length > 0) {
        setFoodType(userPosts[0].foodType || '');
      }
    }
  }, [usePreviousFoodType, user]);

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

  const loadPosts = () => {
    const loadedPosts = getDiaryPosts();

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
  };

  // 안내견 목록 가져오기 (관리자용 필터)
  const getDogNames = (): string[] => {
    const uniqueDogs = new Set<string>();
    allPosts.forEach(post => {
      if (post.dogName) uniqueDogs.add(post.dogName);
    });
    return Array.from(uniqueDogs).sort();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 퍼피티칭 사용자 검증
    if (user?.role === 'puppyTeacher') {
      if (!diaryDate) {
        alert('날짜를 입력해주세요.');
        return;
      }
    } else {
      if (!title.trim() || !content.trim()) {
        alert('제목과 내용을 모두 입력해주세요.');
        return;
      }
    }

    const post: DiaryPost = {
      id: editingPost?.id || generateId(),
      userId: user!.id,
      userName: user!.name,
      dogName: user?.dogName,
      title: user?.role === 'puppyTeacher' ? `${diaryDate} 일지` : title.trim(),
      content: user?.role === 'puppyTeacher' ? '퍼피티칭 일지' : content.trim(),
      createdAt: editingPost?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // 퍼피티칭 전용 필드
      ...(user?.role === 'puppyTeacher' && {
        diaryDate,
        foodType: foodType || undefined,
        feedingTime: feedingTime || undefined,
        feedingAmount: feedingAmount || undefined,
        feedingNotes: feedingNotes || undefined,
        dt1Time: dt1Time || undefined,
        dt1Place: dt1Place || undefined,
        dt1Success: dt1Success || undefined,
        dt1Accident: dt1Accident || undefined,
        dt1Notes: dt1Notes || undefined,
        dt2Time: dt2Time || undefined,
        dt2Place: dt2Place || undefined,
        dt2Success: dt2Success || undefined,
        dt2Accident: dt2Accident || undefined,
        dt2Notes: dt2Notes || undefined,
        outingPlace: outingPlace || undefined,
        outingDuration: outingDuration || undefined,
        outingNotes: outingNotes || undefined,
        additionalNotes: additionalNotes || undefined,
      }),
    };

    saveDiaryPost(post);
    resetForm();
    loadPosts();
  };

  const handleEdit = (post: DiaryPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);

    // 퍼피티칭 데이터 로드
    if (post.diaryDate) {
      setDiaryDate(post.diaryDate);
      setFoodType(post.foodType || '');
      setFeedingTime(post.feedingTime || '');
      setFeedingAmount(post.feedingAmount || '');
      setFeedingNotes(post.feedingNotes || '');
      setDt1Time(post.dt1Time || '');
      setDt1Place(post.dt1Place || '');
      setDt1Success(post.dt1Success || '');
      setDt1Accident(post.dt1Accident || '');
      setDt1Notes(post.dt1Notes || '');
      setDt2Time(post.dt2Time || '');
      setDt2Place(post.dt2Place || '');
      setDt2Success(post.dt2Success || '');
      setDt2Accident(post.dt2Accident || '');
      setDt2Notes(post.dt2Notes || '');
      setOutingPlace(post.outingPlace || '');
      setOutingDuration(post.outingDuration || '');
      setOutingNotes(post.outingNotes || '');
      setAdditionalNotes(post.additionalNotes || '');
    }

    setIsWriting(true);
    setViewingPost(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteDiaryPost(id);
      loadPosts();
      setViewingPost(null);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsWriting(false);
    setEditingPost(null);

    // 퍼피티칭 필드 초기화
    setDiaryDate('');
    setFoodType('');
    setUsePreviousFoodType(false);
    setFeedingTime('');
    setFeedingAmount('');
    setFeedingNotes('');
    setDt1Time('');
    setDt1Place('');
    setDt1Success('');
    setDt1Accident('');
    setDt1Notes('');
    setDt2Time('');
    setDt2Place('');
    setDt2Success('');
    setDt2Accident('');
    setDt2Notes('');
    setOutingPlace('');
    setOutingDuration('');
    setOutingNotes('');
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

  // 글 상세보기
  if (viewingPost) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <button
              onClick={() => setViewingPost(null)}
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
            <span>작성일: {formatDate(viewingPost.createdAt)}</span>
            {viewingPost.createdAt !== viewingPost.updatedAt && (
              <span>(수정됨)</span>
            )}
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {viewingPost.content}
            </p>
          </div>
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
                  <div className="space-y-4">
                  <div>
                    <label className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={usePreviousFoodType}
                        onChange={(e) => setUsePreviousFoodType(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">이전과 동일한 사료 사용</span>
                    </label>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      사료 종류
                    </label>
                    <input
                      type="text"
                      value={foodType}
                      onChange={(e) => setFoodType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="사료 종류를 입력하세요"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      급식 시간
                    </label>
                    <input
                      type="time"
                      value={feedingTime}
                      onChange={(e) => setFeedingTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      급식량 (그램)
                    </label>
                    <input
                      type="number"
                      value={feedingAmount}
                      onChange={(e) => setFeedingAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="그램 단위로 입력"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      추가 내용
                    </label>
                    <textarea
                      value={feedingNotes}
                      onChange={(e) => setFeedingNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="급식 관련 추가 내용"
                    />
                  </div>
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
                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      시간
                    </label>
                    <input
                      type="time"
                      value={dt1Time}
                      onChange={(e) => setDt1Time(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      장소
                    </label>
                    <input
                      type="text"
                      value={dt1Place}
                      onChange={(e) => setDt1Place(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="배변 장소"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      기회를 줄 때 얼마나 잘 해주었는지
                    </label>
                    <input
                      type="text"
                      value={dt1Success}
                      onChange={(e) => setDt1Success(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="예: 잘함, 보통, 실패 등"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      실수 여부
                    </label>
                    <input
                      type="text"
                      value={dt1Accident}
                      onChange={(e) => setDt1Accident(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="예: 없음, 1회 등"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      관련 사항 추가
                    </label>
                    <textarea
                      value={dt1Notes}
                      onChange={(e) => setDt1Notes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="DT1 관련 추가 내용"
                    />
                  </div>
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
                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      시간
                    </label>
                    <input
                      type="time"
                      value={dt2Time}
                      onChange={(e) => setDt2Time(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      장소
                    </label>
                    <input
                      type="text"
                      value={dt2Place}
                      onChange={(e) => setDt2Place(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="배변 장소"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      기회를 줄 때 얼마나 잘 해주었는지
                    </label>
                    <input
                      type="text"
                      value={dt2Success}
                      onChange={(e) => setDt2Success(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="예: 잘함, 보통, 실패 등"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      실수 여부
                    </label>
                    <input
                      type="text"
                      value={dt2Accident}
                      onChange={(e) => setDt2Accident(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="예: 없음, 1회 등"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      관련 사항 추가
                    </label>
                    <textarea
                      value={dt2Notes}
                      onChange={(e) => setDt2Notes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="DT2 관련 추가 내용"
                    />
                  </div>
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
                  <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      장소
                    </label>
                    <input
                      type="text"
                      value={outingPlace}
                      onChange={(e) => setOutingPlace(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="어디로 나갔는지"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      외출 시간
                    </label>
                    <input
                      type="text"
                      value={outingDuration}
                      onChange={(e) => setOutingDuration(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="예: 2시간 30분"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      특이사항
                    </label>
                    <textarea
                      value={outingNotes}
                      onChange={(e) => setOutingNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      placeholder="외출 중 특이사항"
                    />
                  </div>
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
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">다이어리</h2>
        {user?.role !== 'admin' && (
          <button
            onClick={() => setIsWriting(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            글쓰기
          </button>
        )}
      </div>

      {/* 관리자용 필터 */}
      {user?.role === 'admin' && getDogNames().length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-md p-4">
          <label htmlFor="dogFilter" className="block text-sm font-semibold text-gray-700 mb-2">
            안내견별 보기
          </label>
          <select
            id="dogFilter"
            value={selectedDog}
            onChange={(e) => setSelectedDog(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">전체 ({allPosts.length})</option>
            {getDogNames().map(dogName => {
              const count = allPosts.filter(p => p.dogName === dogName).length;
              return (
                <option key={dogName} value={dogName}>
                  {dogName} ({count})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">작성된 다이어리가 없습니다.</p>
          {user?.role !== 'admin' && (
            <button
              onClick={() => setIsWriting(true)}
              className="mt-4 text-blue-600 hover:text-blue-800 font-semibold"
            >
              첫 다이어리 작성하기
            </button>
          )}
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
    </div>
  );
};
