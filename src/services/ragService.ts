/**
 * RAG (Retrieval-Augmented Generation) 서비스
 * PDF 매뉴얼을 청크로 분할하고 벡터 검색 지원
 */

import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const EMBEDDING_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

// 청크 인터페이스
export interface DocumentChunk {
  id?: string;
  manualId: string;
  manualName: string;
  category: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
  pageNumber?: number;
  createdAt: string;
}

// 검색 결과 인터페이스
export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
}

/**
 * 텍스트를 청크로 분할
 */
export const splitTextIntoChunks = (
  text: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] => {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // 문장 끝에서 자르기 (마침표, 물음표, 느낌표)
    if (endIndex < text.length) {
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastQuestion = text.lastIndexOf('?', endIndex);
      const lastExclaim = text.lastIndexOf('!', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);

      const bestBreak = Math.max(lastPeriod, lastQuestion, lastExclaim, lastNewline);

      if (bestBreak > startIndex + chunkSize / 2) {
        endIndex = bestBreak + 1;
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length > 50) { // 너무 짧은 청크는 무시
      chunks.push(chunk);
    }

    startIndex = endIndex - overlap;
    if (startIndex >= text.length) break;
  }

  return chunks;
};

/**
 * Gemini 임베딩 API 호출
 */
export const getEmbedding = async (text: string): Promise<number[]> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API 키가 설정되지 않았습니다.');
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
    throw new Error(`임베딩 생성 실패: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.embedding.values;
};

/**
 * 코사인 유사도 계산
 */
export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * PDF 텍스트를 청크로 분할하고 임베딩 생성 후 Firestore에 저장
 */
export const processAndStoreDocument = async (
  text: string,
  manualId: string,
  manualName: string,
  category: string,
  onProgress?: (progress: number, message: string) => void
): Promise<number> => {
  // 1. 텍스트를 청크로 분할
  onProgress?.(10, '텍스트 분할 중...');
  const chunks = splitTextIntoChunks(text, 500, 100);

  if (chunks.length === 0) {
    throw new Error('문서에서 청크를 생성할 수 없습니다.');
  }

  onProgress?.(20, `${chunks.length}개 청크 생성됨. 임베딩 생성 중...`);

  // 2. 각 청크에 대해 임베딩 생성 및 저장
  const chunksCollection = collection(db, 'qna_chunks');
  let savedCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    try {
      // 임베딩 생성 (API 레이트 리밋 고려하여 약간의 딜레이)
      const embedding = await getEmbedding(chunk);

      // Firestore에 저장
      const docData: Omit<DocumentChunk, 'id'> = {
        manualId,
        manualName,
        category,
        content: chunk,
        embedding,
        chunkIndex: i,
        createdAt: new Date().toISOString(),
      };

      await addDoc(chunksCollection, docData);
      savedCount++;

      const progress = 20 + Math.floor((i / chunks.length) * 70);
      onProgress?.(progress, `청크 ${i + 1}/${chunks.length} 처리 중...`);

      // API 레이트 리밋 방지를 위한 딜레이
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`청크 ${i} 처리 실패:`, error);
      // 개별 청크 실패해도 계속 진행
    }
  }

  onProgress?.(100, `완료! ${savedCount}개 청크 저장됨`);
  return savedCount;
};

/**
 * 매뉴얼의 모든 청크 삭제
 */
export const deleteManualChunks = async (manualId: string): Promise<void> => {
  const chunksCollection = collection(db, 'qna_chunks');
  const q = query(chunksCollection, where('manualId', '==', manualId));
  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map(docSnap =>
    deleteDoc(doc(db, 'qna_chunks', docSnap.id))
  );

  await Promise.all(deletePromises);
};

/**
 * 질문과 관련된 청크 검색
 */
export const searchRelevantChunks = async (
  question: string,
  category?: string,
  topK: number = 5
): Promise<SearchResult[]> => {
  // 1. 질문의 임베딩 생성
  const questionEmbedding = await getEmbedding(question);

  // 2. 모든 청크 가져오기 (카테고리 필터링)
  const chunksCollection = collection(db, 'qna_chunks');
  let q;

  if (category && category !== '공통') {
    // 해당 카테고리와 공통 카테고리 모두 검색
    q = query(chunksCollection, where('category', 'in', [category, '공통']));
  } else {
    q = query(chunksCollection);
  }

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return [];
  }

  // 3. 코사인 유사도 계산
  const results: SearchResult[] = [];

  snapshot.docs.forEach(docSnap => {
    const chunk = { id: docSnap.id, ...docSnap.data() } as DocumentChunk;
    const similarity = cosineSimilarity(questionEmbedding, chunk.embedding);
    results.push({ chunk, similarity });
  });

  // 4. 유사도 순으로 정렬하고 상위 K개 반환
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, topK);
};

/**
 * 검색 결과를 컨텍스트 문자열로 변환
 */
export const buildContextFromResults = (results: SearchResult[]): string => {
  if (results.length === 0) {
    return '';
  }

  const contextParts = results.map((result, index) => {
    return `[참고 ${index + 1} - ${result.chunk.manualName}]\n${result.chunk.content}`;
  });

  return contextParts.join('\n\n---\n\n');
};
