import type { VercelRequest, VercelResponse } from '@vercel/node';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoId: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY is not set');
    return res.status(500).json({ error: 'YouTube API 키가 설정되지 않았습니다.' });
  }

  try {
    const { playlistId } = req.query;

    if (!playlistId || typeof playlistId !== 'string') {
      return res.status(400).json({ error: 'playlistId가 필요합니다.' });
    }

    const url = `${YOUTUBE_API_URL}?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('YouTube API 오류:', errorData);
      return res.status(response.status).json({ error: `YouTube API 오류: ${response.status}` });
    }

    const data = await response.json();

    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
      videoId: item.snippet.resourceId.videoId,
    }));

    return res.status(200).json({ videos });
  } catch (error) {
    console.error('YouTube API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
