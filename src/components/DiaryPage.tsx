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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const post: DiaryPost = {
      id: editingPost?.id || generateId(),
      userId: user!.id,
      userName: user!.name,
      dogName: user?.dogName,
      title: title.trim(),
      content: content.trim(),
      createdAt: editingPost?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveDiaryPost(post);
    resetForm();
    loadPosts();
  };

  const handleEdit = (post: DiaryPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
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
