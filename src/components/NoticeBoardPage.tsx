/**
 * 공지사항 게시판
 * - 관리자만 작성 가능
 * - 대상 그룹 선택 (전체, 관리자, 퍼피티처, 직원 등)
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getNotices, saveNotice, deleteNotice, type Notice } from '../utils/noticeStorage';
import { getCombinedData } from '../utils/storage';

export const NoticeBoardPage = () => {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [viewingNotice, setViewingNotice] = useState<Notice | null>(null);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);

  // 폼 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<string[]>(['all']);
  const [isPinned, setIsPinned] = useState(false);

  // 공지사항 로드
  useEffect(() => {
    loadNotices();
  }, []);

  const loadNotices = async () => {
    try {
      const allNotices = await getNotices();

      // 사용자의 안내견 카테고리 확인
      let userDogCategory: string | null = null;
      if (user?.dogName) {
        const allDogs = getCombinedData();
        const userDog = allDogs.find(item => item.guideDog.name === user.dogName);
        if (userDog) {
          // 한글 카테고리를 영어로 매핑
          const categoryMap: Record<string, string> = {
            '퍼피티칭': 'puppy',
            '안내견': 'guide',
            '은퇴견': 'retired',
            '부모견': 'parent',
          };
          userDogCategory = categoryMap[userDog.guideDog.category] || null;
        }
      }

      // 사용자 권한에 따라 필터링
      const visibleNotices = allNotices.filter(notice => {
        // 전체 공개 공지사항
        if (notice.targetAudience.includes('all')) {
          return true;
        }
        // 관리자는 모든 공지사항 볼 수 있음
        if (user?.role === 'admin') {
          return true;
        }
        // 사용자의 안내견 카테고리에 맞는 공지사항만
        if (userDogCategory && notice.targetAudience.includes(userDogCategory)) {
          return true;
        }
        return false;
      });

      // 고정 공지사항을 먼저, 그 다음 최신순
      const sorted = visibleNotices.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setNotices(sorted);
    } catch (error) {
      console.error('공지사항 로드 실패:', error);
      alert('공지사항을 불러오는데 실패했습니다.');
    }
  };

  const handleTargetAudienceToggle = (audience: string, checked: boolean) => {
    if (audience === 'all') {
      // '전체'를 선택하면 다른 것들은 모두 해제
      setTargetAudience(['all']);
    } else {
      // 다른 것을 선택하면 '전체'를 해제
      let newAudience = targetAudience.filter(a => a !== 'all');

      if (checked) {
        // 체크하면 추가
        newAudience = [...newAudience, audience];
      } else {
        // 체크 해제하면 제거
        newAudience = newAudience.filter(a => a !== audience);
      }

      // 아무것도 선택 안 하면 '전체'로
      setTargetAudience(newAudience.length > 0 ? newAudience : ['all']);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setTargetAudience(['all']);
    setIsPinned(false);
    setEditingNotice(null);
  };

  const openWriteForm = () => {
    resetForm();
    setIsWriting(true);
  };

  const openEditForm = (notice: Notice) => {
    setTitle(notice.title);
    setContent(notice.content);
    setTargetAudience(notice.targetAudience);
    setIsPinned(notice.isPinned);
    setEditingNotice(notice);
    setIsWriting(true);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 입력하세요.');
      return;
    }

    if (targetAudience.length === 0) {
      alert('공지 대상을 선택하세요.');
      return;
    }

    try {
      const noticeData: Omit<Notice, 'id' | 'createdAt'> = {
        title: title.trim(),
        content: content.trim(),
        author: user?.username || '관리자',
        targetAudience,
        isPinned,
      };

      if (editingNotice) {
        // 수정
        await saveNotice({
          ...noticeData,
          id: editingNotice.id,
          createdAt: editingNotice.createdAt,
        });
        alert('공지사항이 수정되었습니다.');
      } else {
        // 새로 작성
        await saveNotice({
          ...noticeData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        });
        alert('공지사항이 등록되었습니다.');
      }

      resetForm();
      setIsWriting(false);
      await loadNotices();
    } catch (error) {
      console.error('공지사항 저장 실패:', error);
      alert('공지사항 저장에 실패했습니다.');
    }
  };

  const handleDelete = async (noticeId: string) => {
    if (!confirm('이 공지사항을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteNotice(noticeId);
      alert('공지사항이 삭제되었습니다.');
      await loadNotices();
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      alert('공지사항 삭제에 실패했습니다.');
    }
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

  const getAudienceLabel = (audience: string[]) => {
    if (audience.includes('all')) {
      return '전체';
    }
    const labels = audience.map(a => {
      switch (a) {
        case 'puppy': return '퍼피티칭';
        case 'guide': return '안내견';
        case 'retired': return '은퇴견';
        case 'parent': return '부모견';
        default: return a;
      }
    });
    return labels.join(', ');
  };

  // 글쓰기 폼
  if (isWriting) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingNotice ? '공지사항 수정' : '공지사항 작성'}
          </h2>

          <div className="space-y-4">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="공지사항 제목을 입력하세요"
              />
            </div>

            {/* 내용 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={10}
                placeholder="공지사항 내용을 입력하세요"
              />
            </div>

            {/* 공지 대상 */}
            <div>
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-700 mb-3">
                  공지 대상 (다중 선택 가능)
                </legend>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="audience-all"
                      checked={targetAudience.includes('all')}
                      onChange={(e) => handleTargetAudienceToggle('all', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="audience-all" className="ml-3 text-base font-semibold text-gray-700 cursor-pointer">
                      전체
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="audience-puppy"
                      checked={targetAudience.includes('puppy')}
                      onChange={(e) => handleTargetAudienceToggle('puppy', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="audience-puppy" className="ml-3 text-base font-semibold text-gray-700 cursor-pointer">
                      퍼피티칭
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="audience-guide"
                      checked={targetAudience.includes('guide')}
                      onChange={(e) => handleTargetAudienceToggle('guide', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="audience-guide" className="ml-3 text-base font-semibold text-gray-700 cursor-pointer">
                      안내견
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="audience-retired"
                      checked={targetAudience.includes('retired')}
                      onChange={(e) => handleTargetAudienceToggle('retired', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="audience-retired" className="ml-3 text-base font-semibold text-gray-700 cursor-pointer">
                      은퇴견
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="audience-parent"
                      checked={targetAudience.includes('parent')}
                      onChange={(e) => handleTargetAudienceToggle('parent', e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="audience-parent" className="ml-3 text-base font-semibold text-gray-700 cursor-pointer">
                      부모견
                    </label>
                  </div>
                </div>
              </fieldset>
            </div>

            {/* 고정 여부 */}
            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-sm font-semibold text-gray-700">
                  상단 고정
                </span>
              </label>
            </div>

            {/* 버튼 */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {editingNotice ? '수정' : '등록'}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setIsWriting(false);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 상세보기
  if (viewingNotice) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                {viewingNotice.isPinned && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                    고정
                  </span>
                )}
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  {getAudienceLabel(viewingNotice.targetAudience)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {viewingNotice.title}
              </h2>
              <div className="text-sm text-gray-600 space-x-4">
                <span>작성자: {viewingNotice.author}</span>
                <span>작성일: {formatDate(viewingNotice.createdAt)}</span>
              </div>
            </div>
            <button
              onClick={() => setViewingNotice(null)}
              className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="prose max-w-none whitespace-pre-wrap text-gray-800">
              {viewingNotice.content}
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setViewingNotice(null);
                  openEditForm(viewingNotice);
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                수정
              </button>
              <button
                onClick={() => {
                  setViewingNotice(null);
                  handleDelete(viewingNotice.id);
                }}
                className="text-red-600 hover:text-red-800 font-semibold py-2 px-6"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 목록
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">공지사항</h2>
        {user?.role === 'admin' && (
          <button
            onClick={openWriteForm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            글쓰기
          </button>
        )}
      </div>

      {notices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">등록된 공지사항이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <div
              key={notice.id}
              className={`bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow ${
                notice.isPinned ? 'border-l-4 border-red-500' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-3">
                    {notice.isPinned && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                        고정
                      </span>
                    )}
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      {getAudienceLabel(notice.targetAudience)}
                    </span>
                  </div>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setViewingNotice(notice);
                    }}
                    className="text-xl font-bold text-blue-600 hover:text-blue-800 underline block mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {notice.title}
                  </a>
                  <div className="text-sm text-gray-600 space-x-4">
                    <span>작성자: {notice.author}</span>
                    <span>작성일: {formatDate(notice.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
