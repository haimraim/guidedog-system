/**
 * 안내견학교 행사 영상 페이지
 * 안내견학교 행사 영상 관리 및 시청
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
import {
  getSchoolVideos,
  saveSchoolVideo,
  deleteSchoolVideo,
  type SchoolVideo,
} from '../utils/firestoreLectures';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export const GuideDogSchoolVideosPage = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<SchoolVideo[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [editingVideo, setEditingVideo] = useState<SchoolVideo | null>(null);
  const [viewingVideo, setViewingVideo] = useState<SchoolVideo | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);

  // 폼 필드
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [youtubeUrl, setYoutubeUrl] = useState<string>('');

  useEffect(() => {
    loadVideos();
  }, []);

  // 영상 상세보기 시 IndexedDB에서 영상 로드
  useEffect(() => {
    const loadVideo = async () => {
      if (viewingVideo?.videoUrl === 'indexed') {
        try {
          const videoBlob = await getVideoFromIndexedDB(viewingVideo.id);
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

    return () => {
      if (videoObjectUrl && videoObjectUrl.startsWith('blob:')) {
        revokeVideoObjectURL(videoObjectUrl);
        setVideoObjectUrl('');
      }
    };
  }, [viewingVideo]);

  // Video.js 초기화
  useEffect(() => {
    if (viewingVideo && videoRef.current && !playerRef.current) {
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
  }, [viewingVideo, videoObjectUrl]);

  const loadVideos = async () => {
    try {
      const allVideos = await getSchoolVideos();
      setVideos(allVideos);
    } catch (error) {
      console.error('영상 목록 로드 실패:', error);
      alert('영상 목록을 불러오는데 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    const videoId = editingVideo?.id || generateId();
    const videoFile = (window as any).tempVideoFile;

    if (videoFile) {
      try {
        await saveVideoToIndexedDB(videoId, videoFile);
        delete (window as any).tempVideoFile;
      } catch (error) {
        alert('영상 저장에 실패했습니다. 다시 시도해주세요.');
        console.error(error);
        return;
      }
    }

    const video: SchoolVideo = {
      id: videoId,
      title: title.trim(),
      content: content.trim(),
      createdAt: editingVideo?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // videoUrl과 youtubeUrl은 값이 있을 때만 추가 (undefined 방지)
    if (videoFile) {
      video.videoUrl = 'indexed';
    } else if (editingVideo?.videoUrl) {
      video.videoUrl = editingVideo.videoUrl;
    }

    if (youtubeUrl.trim()) {
      video.youtubeUrl = youtubeUrl.trim();
    }

    try {
      await saveSchoolVideo(video);

      if (videoUrl && videoUrl.startsWith('blob:')) {
        revokeVideoObjectURL(videoUrl);
      }

      resetForm();
      await loadVideos();
    } catch (error) {
      alert('영상 저장에 실패했습니다. 다시 시도해주세요.');
      console.error(error);
    }
  };

  const handleEdit = (video: SchoolVideo) => {
    setEditingVideo(video);
    setTitle(video.title);
    setContent(video.content);
    setVideoUrl(video.videoUrl || '');
    setYoutubeUrl(video.youtubeUrl || '');
    setIsWriting(true);
    setViewingVideo(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteVideoFromIndexedDB(id);
        await deleteSchoolVideo(id);
        await loadVideos();
        setViewingVideo(null);
      } catch (error) {
        alert('영상 삭제에 실패했습니다. 다시 시도해주세요.');
        console.error(error);
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setVideoUrl('');
    setYoutubeUrl('');
    setIsWriting(false);
    setEditingVideo(null);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        alert('영상 파일은 500MB 이하만 업로드 가능합니다.');
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

  // 영상 상세보기
  if (viewingVideo) {
    const hasVideo = (viewingVideo.videoUrl && videoObjectUrl) || viewingVideo.youtubeUrl;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-start mb-6">
            <button
              onClick={() => setViewingVideo(null)}
              className="text-primary-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              aria-label="영상 목록으로 돌아가기"
            >
              ← 목록으로
            </button>
            {user?.role === 'admin' && (
              <div className="space-x-2">
                <button
                  onClick={() => handleEdit(viewingVideo)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label="영상 수정"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(viewingVideo.id)}
                  className="bg-error-600 hover:bg-error-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
                  aria-label="영상 삭제"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {viewingVideo.title}
          </h1>

          <div className="text-sm text-neutral-600 mb-6">
            작성일: {formatDate(viewingVideo.createdAt)}
            {viewingVideo.createdAt !== viewingVideo.updatedAt && (
              <span className="ml-2">(수정됨)</span>
            )}
          </div>

          {hasVideo && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">영상</h3>

              {viewingVideo.youtubeUrl && isYouTubeUrl(viewingVideo.youtubeUrl) && (
                <div className="mb-4">
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={getYouTubeEmbedUrl(viewingVideo.youtubeUrl)}
                      className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={viewingVideo.title}
                      aria-label={`${viewingVideo.title} 유튜브 영상 플레이어`}
                    />
                  </div>
                  <p className="text-sm text-neutral-600 mt-2">
                    키보드 단축키: 스페이스바(재생/일시정지), ↑↓(볼륨), ←→(10초 이동)
                  </p>
                </div>
              )}

              {viewingVideo.youtubeUrl && !isYouTubeUrl(viewingVideo.youtubeUrl) && (
                <div data-vjs-player className="mb-4">
                  <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered"
                    onContextMenu={(e) => e.preventDefault()}
                    aria-label={`${viewingVideo.title} 영상`}
                  >
                    <source src={viewingVideo.youtubeUrl} type="video/mp4" />
                    <source src={viewingVideo.youtubeUrl} type="video/webm" />
                    <source src={viewingVideo.youtubeUrl} type="video/ogg" />
                    <p className="vjs-no-js">
                      JavaScript를 활성화하거나 HTML5 비디오를 지원하는 브라우저를 사용해주세요.
                    </p>
                  </video>
                  <p className="text-sm text-neutral-600 mt-2">
                    키보드 단축키: 스페이스바(재생/일시정지), M(음소거), F(전체화면), ←→(10초 이동)
                  </p>
                </div>
              )}

              {viewingVideo.videoUrl && videoObjectUrl && (
                <div data-vjs-player>
                  <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered"
                    onContextMenu={(e) => e.preventDefault()}
                    aria-label={`${viewingVideo.title} 영상`}
                  >
                    <source src={videoObjectUrl} type="video/mp4" />
                    <source src={videoObjectUrl} type="video/webm" />
                    <source src={videoObjectUrl} type="video/ogg" />
                    <p className="vjs-no-js">
                      JavaScript를 활성화하거나 HTML5 비디오를 지원하는 브라우저를 사용해주세요.
                    </p>
                  </video>
                  <p className="text-sm text-neutral-600 mt-2">
                    키보드 단축키: 스페이스바(재생/일시정지), M(음소거), F(전체화면), ←→(10초 이동)
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">영상 설명</h3>
            <div
              className="text-neutral-700 whitespace-pre-wrap leading-relaxed select-none"
              onContextMenu={(e) => e.preventDefault()}
              style={{ userSelect: 'none' }}
            >
              {viewingVideo.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 영상 작성/수정 폼 (관리자만)
  if (isWriting && user?.role === 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {editingVideo ? '영상 수정' : '영상 등록'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                제목 *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-blue-500 outline-none"
                placeholder="영상 제목을 입력하세요"
                required
                aria-label="영상 제목"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                설명 *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-blue-500 outline-none"
                rows={10}
                placeholder="영상 설명을 입력하세요"
                required
                aria-label="영상 설명"
              />
            </div>

            <div>
              <label
                htmlFor="youtubeUrl"
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                영상 링크 (유튜브 또는 NAS)
              </label>
              <input
                type="url"
                id="youtubeUrl"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-blue-500 outline-none"
                placeholder="https://www.youtube.com/watch?v=... 또는 https://dogjong.synology.me/..."
                aria-label="영상 링크"
              />
              <p className="text-sm text-gray-500 mt-1">
                <strong>유튜브 링크</strong> 또는 <strong>NAS 영상 URL</strong>을 입력하세요
              </p>
            </div>

            <div>
              <label
                htmlFor="video"
                className="block text-sm font-semibold text-neutral-700 mb-2"
              >
                영상 파일 첨부
              </label>
              <input
                type="file"
                id="video"
                accept="video/*"
                onChange={handleVideoChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-blue-500 outline-none"
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
                영상 파일은 500MB 이하만 업로드 가능합니다.
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                aria-label={editingVideo ? '영상 수정 완료' : '영상 등록 완료'}
              >
                {editingVideo ? '수정 완료' : '등록 완료'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label="영상 작성 취소"
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
        <h2 className="text-2xl font-bold text-gray-800">안내견학교 행사 영상 🎬</h2>
        {user?.role === 'admin' && (
          <button
            onClick={() => setIsWriting(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label="새 영상 등록"
          >
            영상 등록
          </button>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500">등록된 영상이 없습니다.</p>
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsWriting(true)}
              className="mt-4 text-primary-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
              aria-label="첫 영상 등록하기"
            >
              첫 영상 등록하기
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => setViewingVideo(video)}
              className="w-full text-left bg-gray-50 hover:bg-blue-50 border border-neutral-200 hover:border-blue-300 rounded-lg p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              aria-label={`${video.title} 영상 재생`}
            >
              <h3 className="text-lg font-bold text-primary-600 hover:text-blue-800 mb-2">
                {video.title}
              </h3>
              <p className="text-sm text-neutral-600">
                {formatDate(video.createdAt)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
