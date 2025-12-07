/**
 * 로그인 페이지 컴포넌트
 * NVDA 스크린리더 접근성 최우선 고려
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onShowRegister?: () => void;
}

export const LoginPage = ({ onShowRegister }: LoginPageProps) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const success = await login(username, password);
      if (!success) {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      {/* 헤더 */}
      <header className="bg-blue-600 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">안내견 관리 시스템</h1>
          <p className="text-blue-100 text-lg">Guide Dog Management System</p>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* 로그인 카드 */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              로그인
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 아이디 입력 */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  아이디
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="아이디를 입력하세요"
                  aria-required="true"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>

              {/* 비밀번호 입력 */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  비밀번호
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="비밀번호를 입력하세요"
                  aria-required="true"
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div
                  id="login-error"
                  role="alert"
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:ring-4 focus:ring-blue-300 outline-none flex items-center justify-center"
              >
                {isLoggingIn ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    로그인 중...
                  </>
                ) : (
                  '로그인'
                )}
              </button>
            </form>

            {/* 회원가입 링크 */}
            {onShowRegister && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  계정이 없으신가요?{' '}
                  <button
                    type="button"
                    onClick={onShowRegister}
                    className="text-blue-600 hover:text-blue-700 font-semibold focus:outline-none focus:underline"
                  >
                    회원가입
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* 안내견학교 정보 */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              안내견학교 정보
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <span className="font-semibold">주소:</span> 경기도 용인시 처인구 포곡읍 에버랜드로376번길 1-27
              </p>
              <p>
                <span className="font-semibold">연락처:</span> 031-320-8922
              </p>
              <p>
                <span className="font-semibold">팩스:</span> 031-320-9233
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            안내견학교 &copy; 2025. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            <a href="#privacy" className="hover:text-white transition-colors">
              개인정보 처리방침
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};
