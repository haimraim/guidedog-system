/**
 * 묻고답하기 페이지
 * Gemini AI 기반 안내견 관련 Q&A 챗봇
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getCombinedData, calculateAgeWithMonths } from '../utils/storage';
import { sendMessageToGemini } from '../services/geminiService';
import type { CombinedData } from '../types/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 복사 버튼 컴포넌트
const CopyButton = ({ content, messageIndex }: { content: string; messageIndex: number }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  }, [content]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopy();
    }
  };

  return (
    <button
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
      className="ml-2 p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
      aria-label={copied ? '복사됨' : '답변 복사'}
      title={copied ? '복사됨!' : '클립보드에 복사'}
      tabIndex={0}
      data-message-index={messageIndex}
    >
      {copied ? (
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
};

export const QnAPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [myDogInfo, setMyDogInfo] = useState<CombinedData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 담당 안내견 정보 로드
  useEffect(() => {
    if (user && user.dogName) {
      const allData = getCombinedData();
      const myDog = allData.find(item => item.guideDog.name === user.dogName);
      setMyDogInfo(myDog || null);
    }
  }, [user]);

  // 메시지 목록 하단으로 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 초기 환영 메시지
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: myDogInfo
        ? `안녕하세요! ${user?.name}님, ${myDogInfo.guideDog.name}(${calculateAgeWithMonths(myDogInfo.guideDog.birthDate)})에 대해 궁금한 점이 있으시면 편하게 질문해주세요.`
        : `안녕하세요! ${user?.name}님, 안내견에 대해 궁금한 점이 있으시면 편하게 질문해주세요.`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [myDogInfo, user]);

  // 메시지 전송
  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 이전 대화 히스토리 구성 (최근 10개만)
      const chatHistory = messages
        .filter(m => m.role !== 'assistant' || messages.indexOf(m) !== 0) // 첫 환영 메시지 제외
        .slice(-10)
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      // Gemini API 호출 (사용자 카테고리 전달)
      const response = await sendMessageToGemini(
        trimmedInput,
        myDogInfo?.guideDog.name,
        myDogInfo ? calculateAgeWithMonths(myDogInfo.guideDog.birthDate) : undefined,
        chatHistory,
        user?.role
      );

      // AI 응답 추가
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('메시지 전송 실패:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Enter 키로 전송 (Shift+Enter는 줄바꿈)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 대화 초기화
  const handleClearChat = () => {
    if (confirm('대화 내용을 모두 삭제하시겠습니까?')) {
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        content: myDogInfo
          ? `안녕하세요! ${user?.name}님, ${myDogInfo.guideDog.name}(${calculateAgeWithMonths(myDogInfo.guideDog.birthDate)})에 대해 궁금한 점이 있으시면 편하게 질문해주세요.`
          : `안녕하세요! ${user?.name}님, 안내견에 대해 궁금한 점이 있으시면 편하게 질문해주세요.`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* 헤더 - 강아지 정보 */}
      <div className="bg-white rounded-t-lg shadow-md p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🐕</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-800">묻고답하기</h2>
              {myDogInfo ? (
                <p className="text-sm text-neutral-600">
                  {myDogInfo.guideDog.name} · {calculateAgeWithMonths(myDogInfo.guideDog.birthDate)} · {myDogInfo.guideDog.gender}
                </p>
              ) : (
                <p className="text-sm text-neutral-600">안내견 관련 질문을 해주세요</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            대화 초기화
          </button>
        </div>
      </div>

      {/* 채팅 메시지 영역 */}
      <div className="flex-1 overflow-y-auto bg-neutral-50 p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white shadow-sm border border-neutral-200'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.content}
              </p>
              <div className="flex items-center justify-between mt-1">
                <p
                  className={`text-xs ${
                    message.role === 'user' ? 'text-primary-200' : 'text-neutral-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {message.role === 'assistant' && (
                  <CopyButton content={message.content} messageIndex={index} />
                )}
              </div>
            </div>
          </div>
        ))}

        {/* 로딩 표시 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white shadow-sm border border-neutral-200 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="bg-white rounded-b-lg shadow-md p-4 border-t">
        <div className="flex space-x-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문을 입력하세요... (Shift+Enter로 줄바꿈)"
            className="flex-1 resize-none border border-neutral-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={2}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '전송 중...' : '전송'}
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-2">
          AI가 제공하는 정보는 참고용이며, 중요한 사항은 담당 훈련사에게 문의해주세요.
        </p>
      </div>
    </div>
  );
};
