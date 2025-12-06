/**
 * Vercel Serverless Function - 데이터베이스 연결 테스트
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import mysql from 'mysql2/promise';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 데이터베이스 연결 설정
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'dsm.dogjong.synology.me',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'guidedog_user',
      password: process.env.DB_PASSWORD || 'Guidedog2024!',
      database: process.env.DB_NAME || 'guidedog_db',
    });

    // 연결 테스트
    await connection.ping();

    // 테이블 목록 조회
    const [tables] = await connection.query('SHOW TABLES');

    // 연결 종료
    await connection.end();

    return res.status(200).json({
      success: true,
      message: '데이터베이스 연결 성공',
      tables: tables,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('DB 연결 오류:', error);
    return res.status(500).json({
      success: false,
      message: '데이터베이스 연결 실패',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    });
  }
}
