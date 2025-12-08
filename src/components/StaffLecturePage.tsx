/**
 * 직원용 강의 페이지
 * 직원용 강의 관리 및 시청
 * 강의실과 유사하지만 카테고리 없이 단일 목록으로 구성
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { generateId } from '../utils/storage';
import {
  saveVideoToIndexedDB,
  getVideoFromIndexedDB,
  deleteVideoFromIndexedDB,
  createVideoObjectURL,
  revokeVideoObjectURL,
} from '../utils/videoStorage';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface StaffLecture {
  id: string;
  title: string;
  content: string;
  videoUrl?: string; // IndexedDB: 'indexed' or NAS URL
  youtubeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'guidedog_staff_lectures';

const getLectures = (): StaffLecture[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLecture = (video: StaffLecture): void => {
  const lectures = getLectures();
  const existingIndex = lectures.findIndex(v => v.id === video.id);

  if (existingIndex >= 0) {
    lectures[existingIndex] = { ...video, updatedAt: new Date().toISOString() };
  } else {
    lectures.unshift(video);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(lectures));
};

const deleteLecture = (id: string): void => {
  const lectures = getLectures().filter(v => v.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lectures));
};

export const StaffLecturePage = () => {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<StaffLecture[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [editingLecture, setEditingLecture] = useState<StaffLecture | null>(null);
  const [viewingLecture, setViewingLecture] = useState<StaffLecture | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);

  // 폼 필드
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');

  useEffect(() => {
    loadLectures();
  }, []);

  // 강의 상세보기 시 IndexedDB에서 강의 로드
  useEffect(() => {
    const loadLecture = async () => {
      if (viewingLecture?.videoUrl === 'indexed') {
        try {
          const videoBlob = await getVideoFromIndexedDB(viewingLecture.id);
          if (videoBlob) {
            const objectUrl = createVideoObjectURL(videoBlob);
            setVideoObjectUrl(objectUrl);
          }
        } catch (error) {
          console.error('강의 로드 실패:', error);
        }
      } else {
        setVideoObjectUrl('');
      }
    };

    loadLecture();

    return () => {
      if (videoObjectUrl && videoObjectUrl.startsWith('blob:')) {
        revokeVideoObjectURL(videoObjectUrl);
        setVideoObjectUrl('');
      }
    };
  }, [viewingLecture]);

  // Video.js 초기화
  useEffect(() => {
    if (viewingLecture && videoRef.current && !playerRef.current) {
      const player = videojs(videoRef.current, {
        controls: true,
        autoplay: true,
        fluid: true,
        preload: 'metadata',
        controlBar: {
          pictureInPictureToggle: false,
        },
        userActions: {
          hotkeys: true,
        },
      });

      playerRef.current = player;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [viewingLecture, videoObjectUrl]);

  const loadLectures = () => {
    const allLectures = getLectures();
    setLectures(allLectures);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const videoId = editingLecture?.id || generateId();
    const videoFile = (window as any).tempVideoFile;

    if (videoFile) {
      try {
        await saveVideoToIndexedDB(videoId, videoFile);
        delete (window as any).tempVideoFile;
      } catch (error) {
        alert('강의 저장에 실패했습니다. 다시 시도해주세요.');
        console.error(error);
        return;
      }
    }

    const video: StaffLecture = {
      id: videoId,
      title: title.trim(),
      content: content.trim(),
      videoUrl: videoFile ? 'indexed' : editingLecture?.videoUrl,
      youtubeUrl: youtubeUrl.trim() || undefined,
      createdAt: editingLecture?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveLecture(video);

    if (videoUrl && videoUrl.startsWith('blob:')) {
      revokeVideoObjectURL(videoUrl);
    }

    resetForm();
    loadLectures();
  };

  const handleEdit = (video: StaffLecture) => {
    setEditingLecture(video);
    setTitle(video.title);
    setContent(video.content);
    setVideoUrl(video.videoUrl || '');
    setYoutubeUrl(video.youtubeUrl || '');
    setIsWriting(true);
    setViewingLecture(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      await deleteVideoFromIndexedDB(id);
      deleteLecture(id);
      loadLectures();
      setViewingLecture(null);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setVideoUrl('');
    setYoutubeUrl('');
    setIsWriting(false);
    setEditingLecture(null);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        alert('강의 파일은 500MB 이하만 업로드 가능합니다.');
        return;
      }

      if (!file.type.startsWith('video/')) {
        alert('비디오 파일만 업로드 가능합니다.');
        return;
      }

      const objectUrl = createVideoObjectURL(file);
      setVideoUrl(objectUrl);
      (window as any).tempVideoFile = file;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';

    let videoId = '';

    if (url.includes('youtube.com/embed/')) {
      const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
      if (embedMatch && embedMatch[1]) {
        videoId = embedMatch[1];
      } else {
        return url;
      }
    } else {
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (videoIdMatch && videoIdMatch[1]) {
        videoId = videoIdMatch[1];
      } else {
        return url;
      }
    }

    return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&fs=1&cc_load_policy=1&iv_load_policy=3`;
  };

  // 강의 상세보기
  if (viewingLecture) {
    const hasLecture = (viewingLecture.videoUrl && videoObjectUrl) || viewingLecture.youtubeUrl;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <button
              onClick={() => setViewingLecture(null)}
              className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label="강의 목록으로 돌아가기"
            >
              ← 목록으로
            </button>
            {user?.role === 'admin' && (
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(viewingLecture)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="강의 수정"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(viewingLecture.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="강의 삭제"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {viewingLecture.title}
          </h1>

          <div className="text-sm text-gray-600 mb-6">
            작성일: {formatDate(viewingLecture.createdAt)}
            {viewingLecture.createdAt !== viewingLecture.updatedAt && (
              <span className="ml-2">(수정됨)</span>
            )}
          </div>

          {hasLecture && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">강의</h3>

              {viewingLecture.youtubeUrl && isYouTubeUrl(viewingLecture.youtubeUrl) && (
                <div className="mb-4">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={getYouTubeEmbedUrl(viewingLecture.youtubeUrl)}
                      className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={viewingLecture.title}
                      aria-label={`${viewingLecture.title} 유튜브 강의 플레이어`}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    키보드 단축키: 스페이스바(재생/일시정지), ↑↓(볼륨), ←→(10초 이동)
                  </p>
                </div>
              )}

              {viewingLecture.youtubeUrl && !isYouTubeUrl(viewingLecture.youtubeUrl) && (
                <div data-vjs-player className="mb-4">
                  <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered"
                    onContextMenu={(e) => e.preventDefault()}
                    aria-label={`${viewingLecture.title} 강의`}
                  >
                    <source src={viewingLecture.youtubeUrl} type="video/mp4" />
                    <source src={viewingLecture.youtubeUrl} type="video/webm" />
                    <source src={viewingLecture.youtubeUrl} type="video/ogg" />
                    <p className="vjs-no-js">
                      JavaScript를 활성화하거나 HTML5 비디오를 지원하는 브라우저를 사용해주세요.
                    </p>
                  </video>
                  <p className="text-sm text-gray-600 mt-2">
                    키보드 단축키: 스페이스바(재생/일시정지), M(음소거), F(전체화면), ←→(10초 이동)
                  </p>
                </div>
              )}

              {viewingLecture.videoUrl && videoObjectUrl && (
                <div data-vjs-player>
                  <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered"
                    onContextMenu={(e) => e.preventDefault()}
                    aria-label={`${viewingLecture.title} 강의`}
                  >
                    <source src={videoObjectUrl} type="video/mp4" />
                    <source src={videoObjectUrl} type="video/webm" />
                    <source src={videoObjectUrl} type="video/ogg" />
                    <p className="vjs-no-js">
                      JavaScript를 활성화하거나 HTML5 비디오를 지원하는 브라우저를 사용해주세요.
                    </p>
                  </video>
                  <p className="text-sm text-gray-600 mt-2">
                    키보드 단축키: 스페이스바(재생/일시정지), M(음소거), F(전체화면), ←→(10초 이동)
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">강의 설명</h3>
            <div
              className="text-gray-700 whitespace-pre-wrap leading-relaxed select-none"
              onContextMenu={(e) => e.preventDefault()}
              style={{ userSelect: 'none' }}
            >
              {viewingLecture.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 강의 작성/수정 폼 (관리자만)
  if (isWriting && user?.role === 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingLecture ? '강의 수정' : '강의 등록'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                제목 *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="강의 제목을 입력하세요"
                required
                aria-label="강의 제목"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                설명 *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={10}
                placeholder="강의 설명을 입력하세요"
                required
                aria-label="강의 설명"
              />
            </div>

            <div>
              <label
                htmlFor="youtubeUrl"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                강의 링크 (유튜브 또는 NAS)
              </label>
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="https://www.youtube.com/watch?v=... 또는 https://dogjong.synology.me/..."
                aria-label="강의 링크"
              />
              <p className="text-sm text-gray-500 mt-1">
                <strong>유튜브 링크</strong> 또는 <strong>NAS 강의 URL</strong>을 입력하세요
              </p>
            </div>

            <div>
              <label
                htmlFor="video"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                강의 파일 첨부
              </label>
              <input
                type="file"
                id="video"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                aria-label="강의 파일 첨부"
              />
              {videoUrl && (
                <div className="mt-3">
                  <p className="text-sm text-green-600 mb-2">강의가 업로드되었습니다.</p>
                  <video
                    controls
                    controlsList="nodownload"
                    disablePictureInPicture
                    className="w-full max-w-md rounded-lg shadow-md"
                  >
                    <source src={videoUrl} />
                  </video>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                강의 파일은 500MB 이하만 업로드 가능합니다.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={editingLecture ? '강의 수정 완료' : '강의 등록 완료'}
              >
                {editingLecture ? '수정 완료' : '등록 완료'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="강의 작성 취소"
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
        <h2 className="text-2xl font-bold text-gray-800">직원용 강의 🎬</h2>
        {user?.role === 'admin' && (
          <button
            onClick={() => setIsWriting(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="새 강의 등록"
          >
            강의 등록
          </button>
        )}
      </div>

      {lectures.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">등록된 강의가 없습니다.</p>
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsWriting(true)}
              className="mt-4 text-blue-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              aria-label="첫 강의 등록하기"
            >
              첫 강의 등록하기
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {lectures.map((video) => (
            <button
              key={video.id}
              onClick={() => setViewingLecture(video)}
              className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`${video.title} 강의 재생`}
            >
              <h3 className="text-lg font-bold text-blue-600 hover:text-blue-800 mb-2">
                {video.title}
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(video.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
