/**
 * Gemini API 서비스
 * RAG 기반 안내견 매뉴얼 Q&A 챗봇
 */

import { searchRelevantChunks, buildContextFromResults } from './ragService';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 시스템 프롬프트 - 매뉴얼 없을 때
const SYSTEM_PROMPT = `당신은 안내견학교의 전문 상담사입니다.

역할:
- 퍼피워커, 안내견 파트너, 훈련사들의 질문에 답변합니다.
- 안내견 훈련, 건강관리, 행동교정에 대한 전문 지식을 제공합니다.

답변 원칙:
1. 친절하고 이해하기 쉽게 설명합니다.
2. 강아지의 개월령에 맞는 맞춤 조언을 제공합니다.
3. 확실하지 않은 내용은 "담당 훈련사에게 문의해주세요"라고 안내합니다.
4. 응급 상황이 의심되면 즉시 병원 방문을 권유합니다.

답변 형식:
- 간결하고 핵심적인 답변을 제공합니다.
- 필요시 단계별로 설명합니다.
- 중요한 주의사항은 강조합니다.`;

// 시스템 프롬프트 - RAG 컨텍스트 있을 때
const SYSTEM_PROMPT_WITH_RAG = `당신은 안내견학교의 전문 상담사입니다.

역할:
- 퍼피워커, 안내견 파트너, 훈련사들의 질문에 답변합니다.
- 제공된 매뉴얼 내용을 기반으로 정확한 정보를 제공합니다.

중요한 규칙:
1. 반드시 아래 [참고 자료]의 내용을 우선적으로 참고하여 답변하세요.
2. 참고 자료에 있는 내용은 그대로 인용하거나 요약해서 전달하세요.
3. 참고 자료에 없는 내용은 "매뉴얼에서 해당 내용을 찾을 수 없습니다. 담당 훈련사에게 문의해주세요."라고 답변하세요.
4. 강아지의 개월령에 맞는 맞춤 조언을 제공합니다.
5. 응급 상황이 의심되면 즉시 병원 방문을 권유합니다.

답변 형식:
- 친절하고 이해하기 쉽게 설명합니다.
- 필요시 단계별로 설명합니다.
- 중요한 주의사항은 강조합니다.`;

export const sendMessageToGemini = async (
  userMessage: string,
  dogName?: string,
  dogAge?: string,
  chatHistory: ChatMessage[] = [],
  userCategory?: string
): Promise<string> => {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API 키가 설정되지 않았습니다.');
  }

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

  const hasContext = ragContext.length > 0;

  // 컨텍스트 구성
  let contextMessage = hasContext ? SYSTEM_PROMPT_WITH_RAG : SYSTEM_PROMPT;

  if (dogName && dogAge) {
    contextMessage += `\n\n현재 상담 중인 강아지 정보:
- 이름: ${dogName}
- 나이: ${dogAge}

이 강아지의 나이에 맞는 조언을 제공해주세요.`;
  }

  // RAG 컨텍스트 추가
  if (hasContext) {
    contextMessage += `\n\n[참고 자료]\n${ragContext}`;
  }

  // 대화 히스토리 구성
  const contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }> = [];

  // 시스템 프롬프트
  contents.push({
    role: 'user',
    parts: [{ text: contextMessage }],
  });

  contents.push({
    role: 'model',
    parts: [{ text: '네, 안내견학교 상담사로서 도움을 드리겠습니다. 매뉴얼을 참고하여 정확한 정보를 제공하겠습니다. 강아지에 대해 궁금한 점을 말씀해주세요.' }],
  });

  // 이전 대화 히스토리 추가
  for (const msg of chatHistory) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  // 현재 사용자 메시지 추가
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API 오류:', errorData);
      throw new Error(`API 오류: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data: GeminiResponse = await response.json();

    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }

    throw new Error('응답을 생성할 수 없습니다.');
  } catch (error) {
    console.error('Gemini API 호출 실패:', error);
    throw error;
  }
};
