/**
 * 스쿨오브안내견 YouTube 플레이리스트 페이지
 * YouTube Data API v3를 사용하여 플레이리스트 영상 자동 가져오기
 */

import { useState, useEffect } from 'react';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoId: string;
}

const PLAYLIST_ID = 'PLpNTjTrBrqfbZk7T0lFKfeND9b8obhe7f';
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const CACHE_KEY = 'youtube_playlist_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

export const SchoolOfGuideDogPage = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      // 캐시 확인
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = new Date().getTime();

        // 캐시가 24시간 이내면 캐시 사용
        if (now - timestamp < CACHE_DURATION) {
          setVideos(data);
          setLoading(false);
          return;
        }
      }

      // 캐시가 없거나 만료되었으면 API 호출
      await fetchFromYouTube();
    } catch (err) {
      console.error('영상 로드 실패:', err);
      setError('영상 목록을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const fetchFromYouTube = async () => {
    if (!API_KEY) {
      setError('YouTube API 키가 설정되지 않았습니다.');
      setLoading(false);
      return;
    }

    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${PLAYLIST_ID}&key=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`YouTube API 오류: ${response.status}`);
    }

    const data = await response.json();

    const videoList: YouTubeVideo[] = data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      videoId: item.snippet.resourceId.videoId,
    }));

    // localStorage에 캐시 저장
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: videoList,
      timestamp: new Date().getTime(),
    }));

    setVideos(videoList);
    setLoading(false);
  };

  const handleVideoClick = (video: YouTubeVideo) => {
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    setSelectedVideo(null);
  };

  // 영상 재생 화면
  if (selectedVideo) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={handleCloseVideo}
              className="text-primary-600 hover:text-primary-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded px-4 py-2"
              aria-label="영상 목록으로 돌아가기"
            >
              ← 목록으로
            </button>
          </div>

          <h2 className="text-2xl font-bold text-neutral-800 mb-4">
            {selectedVideo.title}
          </h2>

          <div className="relative w-full mb-4" style={{ paddingBottom: '56.25%' }}>
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&fs=1&cc_load_policy=1&iv_load_policy=3`}
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={selectedVideo.title}
              aria-label={`${selectedVideo.title} 유튜브 영상 플레이어`}
            />
          </div>

          <p className="text-sm text-neutral-600 mb-4">
            키보드 단축키: 스페이스바(재생/일시정지), ↑↓(볼륨), ←→(10초 이동)
          </p>

          {selectedVideo.description && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">영상 설명</h3>
              <p className="text-neutral-700 whitespace-pre-wrap">
                {selectedVideo.description}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 목록 화면
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-3xl font-bold text-neutral-800 mb-2">
          스쿨오브안내견 🐾
        </h2>
        <p className="text-neutral-600 mb-4">
          삼성화재 공식 채널 - 안내견 교육 영상 모음
        </p>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-neutral-600">영상 목록을 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-4">
            <p className="text-error-600">{error}</p>
            <button
              onClick={loadVideos}
              className="mt-2 text-primary-600 hover:text-primary-800 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {!loading && !error && videos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-600">영상이 없습니다.</p>
          </div>
        )}

        {!loading && !error && videos.length > 0 && (
          <div>
            <p className="text-sm text-neutral-500 mb-4">
              총 {videos.length}개의 영상 (24시간마다 자동 업데이트)
            </p>
            <div className="space-y-3">
              {videos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className="w-full text-left bg-neutral-50 hover:bg-primary-50 border border-neutral-200 hover:border-primary-300 rounded-lg p-4 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-label={`${video.title} 영상 재생`}
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-32 h-24 object-cover rounded-md flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-primary-600 hover:text-primary-800 mb-2">
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className="text-sm text-neutral-600 line-clamp-2">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">💡 안내</h3>
        <ul className="text-sm text-neutral-700 space-y-1">
          <li>• 제목을 클릭하면 영상이 바로 재생됩니다</li>
          <li>• 영상 목록은 24시간마다 자동으로 업데이트됩니다</li>
          <li>• 키보드 단축키: 스페이스바(재생/일시정지), ↑↓(볼륨), ←→(10초 이동)</li>
        </ul>
      </div>
    </div>
  );
};
