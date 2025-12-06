/**
 * 데이터베이스 연결 설정
 */
import mysql from 'mysql2/promise';

// 데이터베이스 연결 설정
export const dbConfig = {
  host: process.env.DB_HOST || 'dsm.dogjong.synology.me',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'guidedog_user',
  password: process.env.DB_PASSWORD || 'Guidedog2024!',
  database: process.env.DB_NAME || 'guidedog_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// 연결 풀 생성
let pool: mysql.Pool | null = null;

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
};

// 데이터베이스 연결 테스트
export const testConnection = async () => {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    return { success: true, message: '데이터베이스 연결 성공' };
  } catch (error) {
    console.error('DB 연결 오류:', error);
    return {
      success: false,
      message: '데이터베이스 연결 실패',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
};
