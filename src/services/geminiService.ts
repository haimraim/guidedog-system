/**
 * Gemini API 서비스
 * RAG 기반 안내견 매뉴얼 Q&A 챗봇
 *
 * 보안: API 키는 Vercel Serverless Function에서만 사용됩니다.
 */

import { searchRelevantChunks, buildContextFromResults } from './ragService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const sendMessageToGemini = async (
  userMessage: string,
  dogName?: string,
  dogAge?: string,
  chatHistory: ChatMessage[] = [],
  userCategory?: string
): Promise<string> => {
  // RAG: 관련 청크 검색
  let ragContext = '';
  try {
    const searchResults = await searchRelevantChunks(userMessage, userCategory, 5);
    if (searchResults.length > 0) {
      ragContext = buildContextFromResults(searchResults);
      console.log(`RAG 검색 완료: ${searchResults.length}개 청크 (유사도: ${searchResults[0].similarity.toFixed(3)})`);
    }
  } catch (err) {
    console.warn('RAG 검색 실패, 기본 모드로 진행:', err);
  }

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage,
        dogName,
        dogAge,
        chatHistory,
        ragContext,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Chat API 오류:', errorData);
      throw new Error(errorData.error || `API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Gemini API 호출 실패:', error);
    throw error;
  }
};
