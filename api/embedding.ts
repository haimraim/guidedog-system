import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'API 키가 설정되지 않았습니다.' });
  }

  try {
    const { text } = req.body as { text: string };

    if (!text) {
      return res.status(400).json({ error: '텍스트가 필요합니다.' });
    }

    const response = await fetch(`${EMBEDDING_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Embedding API 오류:', error);
      return res.status(response.status).json({ error: `임베딩 생성 실패: ${JSON.stringify(error)}` });
    }

    const data = await response.json();
    return res.status(200).json({
      embedding: data.embedding.values,
    });
  } catch (error) {
    console.error('Embedding API 오류:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
