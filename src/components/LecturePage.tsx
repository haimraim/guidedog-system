/**
 * 강의실 페이지 컴포넌트
 * 카테고리별 권한에 따른 강의 자료 열람
 * Video.js를 사용한 접근성 향상된 비디오 플레이어
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Lecture, LectureCategory } from '../types/types';
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

const STORAGE_KEY = 'guidedog_lectures';

// NAS 폴더 경로 매핑
const NAS_FOLDER_MAP: Record<LectureCategory, string> = {
  '공통': 'https://dogjong.synology.me/common',
  '부모견': 'https://dogjong.synology.me/Parent',
  '안내견': 'https://dogjong.synology.me/partner',
  '퍼피': 'https://dogjong.synology.me/puppy',
  '은퇴견': 'https://dogjong.synology.me/retire',
};

const getLectures = (): Lecture[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLecture = (lecture: Lecture): void => {
  const lectures = getLectures();
  const existingIndex = lectures.findIndex(l => l.id === lecture.id);

  if (existingIndex >= 0) {
    lectures[existingIndex] = { ...lecture, updatedAt: new Date().toISOString() };
  } else {
    lectures.unshift(lecture);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(lectures));
};

const deleteLecture = (id: string): void => {
  const lectures = getLectures().filter(l => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lectures));
};

export const LecturePage = () => {
  const { user } = useAuth();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [viewingLecture, setViewingLecture] = useState<Lecture | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);

  // 폼 필드
  const [category, setCategory] = useState<LectureCategory>('안내견');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');

  useEffect(() => {
    loadLectures();
  }, [user]);

  // 강의 상세보기 시 IndexedDB에서 영상 로드
  useEffect(() => {
    const loadVideo = async () => {
      if (viewingLecture?.videoUrl === 'indexed') {
        try {
          const videoBlob = await getVideoFromIndexedDB(viewingLecture.id);
          if (videoBlob) {
            const objectUrl = createVideoObjectURL(videoBlob);
            setVideoObjectUrl(objectUrl);
          }
        } catch (error) {
          console.error('영상 로드 실패:', error);
        }
      } else {
        setVideoObjectUrl('');
      }
    };

    loadVideo();

    // Cleanup: Object URL 해제
    return () => {
      if (videoObjectUrl && videoObjectUrl.startsWith('blob:')) {
        revokeVideoObjectURL(videoObjectUrl);
        setVideoObjectUrl('');
      }
    };
  }, [viewingLecture]);

  // Video.js 초기화 (상세보기 화면에서)
  useEffect(() => {
    if (viewingLecture && videoRef.current && !playerRef.current) {
      // Video.js 플레이어 초기화
      const player = videojs(videoRef.current, {
        controls: true,
        fluid: true,
        preload: 'metadata',
        controlBar: {
          pictureInPictureToggle: false,
        },
        userActions: {
          hotkeys: true, // 키보드 단축키 활성화
        },
      });

      playerRef.current = player;
    }

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [viewingLecture, videoObjectUrl]);

  const loadLectures = () => {
    const allLectures = getLectures();

    // 관리자는 모든 강의 볼 수 있음
    if (user?.role === 'admin') {
      setLectures(allLectures);
      return;
    }

    // 사용자 역할에 따라 필터링
    const filtered = allLectures.filter(lecture => {
      // '공통' 카테고리는 모든 사용자가 볼 수 있음
      if (lecture.category === '공통') {
        return true;
      }

      switch (lecture.category) {
        case '퍼피':
          return user?.role === 'puppyTeacher';
        case '안내견':
          return user?.role === 'partner';
        case '은퇴견':
          return user?.role === 'retiredHomeCare';
        case '부모견':
          return user?.role === 'parentCaregiver';
        default:
          return false;
      }
    });

    setLectures(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const lectureId = editingLecture?.id || generateId();
    const videoFile = (window as any).tempVideoFile;

    // IndexedDB에 영상 저장
    if (videoFile) {
      try {
        await saveVideoToIndexedDB(lectureId, videoFile);
        // 임시 파일 정리
        delete (window as any).tempVideoFile;
      } catch (error) {
        alert('영상 저장에 실패했습니다. 다시 시도해주세요.');
        console.error(error);
        return;
      }
    }

    const lecture: Lecture = {
      id: lectureId,
      category,
      title: title.trim(),
      content: content.trim(),
      attachments: [],
      // IndexedDB에 저장된 경우 'indexed' 플래그 사용
      videoUrl: videoFile ? 'indexed' : editingLecture?.videoUrl,
      youtubeUrl: youtubeUrl.trim() || undefined,
      createdAt: editingLecture?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveLecture(lecture);

    // Object URL 정리
    if (videoUrl && videoUrl.startsWith('blob:')) {
      revokeVideoObjectURL(videoUrl);
    }

    resetForm();
    loadLectures();
  };

  const handleEdit = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setCategory(lecture.category);
    setTitle(lecture.title);
    setContent(lecture.content);
    setVideoUrl(lecture.videoUrl || '');
    setYoutubeUrl(lecture.youtubeUrl || '');
    setIsWriting(true);
    setViewingLecture(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      // IndexedDB에서 영상 삭제
      await deleteVideoFromIndexedDB(id);
      // localStorage에서 강의 삭제
      deleteLecture(id);
      loadLectures();
      setViewingLecture(null);
    }
  };

  const resetForm = () => {
    setCategory('안내견');
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
      // 파일 크기 체크 (500MB)
      if (file.size > 500 * 1024 * 1024) {
        alert('영상 파일은 500MB 이하만 업로드 가능합니다.');
        return;
      }

      // 비디오 파일 타입 체크
      if (!file.type.startsWith('video/')) {
        alert('비디오 파일만 업로드 가능합니다.');
        return;
      }

      // File 객체를 직접 저장하기 위해 Object URL 생성
      const objectUrl = createVideoObjectURL(file);
      setVideoUrl(objectUrl);

      // 실제 파일은 나중에 저장할 수 있도록 임시 저장
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

  const getCategoryBadge = (cat: LectureCategory) => {
    const colors = {
      '퍼피': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      '안내견': 'bg-green-100 text-green-800 border-green-300',
      '은퇴견': 'bg-gray-100 text-gray-800 border-gray-300',
      '부모견': 'bg-cyan-100 text-cyan-800 border-cyan-300',
      '공통': 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[cat] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // URL이 유튜브 링크인지 확인
  const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  // YouTube URL을 embed URL로 변환 (최소한의 UI)
  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return '';

    let videoId = '';

    // 이미 embed URL인 경우
    if (url.includes('youtube.com/embed/')) {
      const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
      if (embedMatch && embedMatch[1]) {
        videoId = embedMatch[1];
      } else {
        return url;
      }
    } else {
      // 일반 YouTube URL 변환
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (videoIdMatch && videoIdMatch[1]) {
        videoId = videoIdMatch[1];
      } else {
        return url;
      }
    }

    // 깔끔한 플레이어: modestbranding으로 유튜브 로고 최소화, rel=0으로 관련 영상 숨김
    return `https://www.youtube.com/embed/${videoId}?controls=1&modestbranding=1&rel=0&fs=1&cc_load_policy=1&iv_load_policy=3`;
  };

  // 강의 상세보기
  if (viewingLecture) {
    const hasVideo = (viewingLecture.videoUrl && videoObjectUrl) || viewingLecture.youtubeUrl;

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

          <div className="mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getCategoryBadge(viewingLecture.category)}`}>
              {viewingLecture.category}
            </span>
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

          {hasVideo && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">강의 영상</h3>

              {/* YouTube 영상 (유튜브 URL인 경우만) */}
              {viewingLecture.youtubeUrl && isYouTubeUrl(viewingLecture.youtubeUrl) && (
                <div className="mb-4">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={getYouTubeEmbedUrl(viewingLecture.youtubeUrl)}
                      className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`${viewingLecture.title} - YouTube 영상`}
                      aria-label={`${viewingLecture.title} 유튜브 영상 플레이어`}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    키보드 단축키: 스페이스바(재생/일시정지), ↑↓(볼륨), ←→(10초 이동)
                  </p>
                </div>
              )}

              {/* NAS 영상 또는 직접 URL (Video.js) */}
              {viewingLecture.youtubeUrl && !isYouTubeUrl(viewingLecture.youtubeUrl) && (
                <div data-vjs-player className="mb-4">
                  <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered"
                    onContextMenu={(e) => e.preventDefault()}
                    aria-label={`${viewingLecture.title} 강의 영상`}
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

              {/* 업로드된 영상 (Video.js) */}
              {viewingLecture.videoUrl && videoObjectUrl && (
                <div data-vjs-player>
                  <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered"
                    onContextMenu={(e) => e.preventDefault()}
                    aria-label={`${viewingLecture.title} 강의 영상`}
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
            <h3 className="text-lg font-semibold text-gray-800 mb-3">강의 내용</h3>
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
                htmlFor="category"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                카테고리 *
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as LectureCategory)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
                aria-label="강의 카테고리 선택"
              >
                <option value="퍼피">퍼피</option>
                <option value="안내견">안내견</option>
                <option value="부모견">부모견</option>
                <option value="은퇴견">은퇴견</option>
                <option value="공통">공통 (모든 사용자)</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                '공통'을 선택하면 모든 사용자가 볼 수 있습니다. NAS 저장 위치: {NAS_FOLDER_MAP[category]}
              </p>
            </div>

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
                내용 *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                rows={15}
                placeholder="강의 내용을 입력하세요"
                required
                aria-label="강의 내용"
              />
            </div>

            <div>
              <label
                htmlFor="youtubeUrl"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                영상 링크 (유튜브 또는 NAS)
              </label>
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="https://www.youtube.com/watch?v=... 또는 https://dogjong.synology.me/..."
                aria-label="영상 링크 (유튜브 또는 NAS)"
              />
              <p className="text-sm text-gray-500 mt-1">
                <strong>유튜브 링크</strong>: 유튜브 영상 URL을 입력 (예: https://www.youtube.com/watch?v=...)<br/>
                <strong>NAS 영상</strong>: NAS 영상 직접 URL을 입력 (예: https://dogjong.synology.me/common/video.mp4)
              </p>
            </div>

            <div>
              <label
                htmlFor="video"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                영상 파일 첨부 (NAS 업로드용)
              </label>
              <input
                type="file"
                id="video"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                aria-label="영상 파일 첨부"
              />
              {videoUrl && (
                <div className="mt-3">
                  <p className="text-sm text-green-600 mb-2">영상이 업로드되었습니다.</p>
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
                영상 파일은 500MB 이하만 업로드 가능합니다. 수동으로 NAS 폴더에 업로드하는 것을 권장합니다.
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
        <h2 className="text-2xl font-bold text-gray-800">강의실</h2>
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
          {lectures.map((lecture) => (
            <button
              key={lecture.id}
              onClick={() => setViewingLecture(lecture)}
              className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`${lecture.title} 강의 재생. 카테고리: ${lecture.category}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-blue-600 hover:text-blue-800 flex-1">
                  {lecture.title}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryBadge(lecture.category)} ml-2`}
                  aria-label={`카테고리: ${lecture.category}`}
                >
                  {lecture.category}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {formatDate(lecture.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
