/**
 * 회원가입 페이지 컴포넌트
 * NVDA 스크린리더 접근성 최우선 고려
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterPageProps {
  onBackToLogin: () => void;
}

export const RegisterPage = ({ onBackToLogin }: RegisterPageProps) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'puppyTeacher' | 'trainer' | 'partner' | 'retiredHomeCare' | 'parentCaregiver'>('admin');
  const [dogName, setDogName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // 유효성 검사
    if (!email || !password || !name) {
      setError('이메일, 비밀번호, 이름을 모두 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsRegistering(true);
    try {
      const userData = {
        name,
        role,
        dogName: dogName || undefined,
      };

      const registerSuccess = await register(email, password, userData);
      if (registerSuccess) {
        setSuccess(true);
        setError('');
        // 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          onBackToLogin();
        }, 3000);
      } else {
        setError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col">
      {/* 헤더 */}
      <header className="bg-blue-600 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">안내견 관리 시스템</h1>
          <p className="text-blue-100 text-lg">회원가입</p>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* 회원가입 카드 */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              회원가입
            </h2>

            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center">
                <p className="font-semibold mb-2">회원가입이 완료되었습니다!</p>
                <p className="text-sm">3초 후 로그인 페이지로 이동합니다...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 이메일 입력 */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="example@guidedogsystem.com"
                    aria-required="true"
                  />
                </div>

                {/* 이름 입력 */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="이름을 입력하세요"
                    aria-required="true"
                  />
                </div>

                {/* 역할 선택 */}
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    역할
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="admin">관리자</option>
                    <option value="puppyTeacher">퍼피티처</option>
                    <option value="trainer">훈련사</option>
                    <option value="partner">파트너</option>
                    <option value="retiredHomeCare">은퇴견 홈케어</option>
                    <option value="parentCaregiver">부모견 홈케어</option>
                  </select>
                </div>

                {/* 견명 입력 (옵션) */}
                {role !== 'admin' && (
                  <div>
                    <label
                      htmlFor="dogName"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      견명 (선택사항)
                    </label>
                    <input
                      type="text"
                      id="dogName"
                      value={dogName}
                      onChange={(e) => setDogName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="담당하는 견명을 입력하세요"
                    />
                  </div>
                )}

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
                    placeholder="비밀번호 (최소 6자)"
                    aria-required="true"
                  />
                </div>

                {/* 비밀번호 확인 */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="비밀번호를 다시 입력하세요"
                    aria-required="true"
                  />
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <div
                    role="alert"
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
                    aria-live="polite"
                  >
                    {error}
                  </div>
                )}

                {/* 회원가입 버튼 */}
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:ring-4 focus:ring-blue-300 outline-none flex items-center justify-center"
                >
                  {isRegistering ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      회원가입 중...
                    </>
                  ) : (
                    '회원가입'
                  )}
                </button>

                {/* 로그인 페이지로 돌아가기 */}
                <button
                  type="button"
                  onClick={onBackToLogin}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors focus:ring-4 focus:ring-gray-300 outline-none"
                >
                  로그인 페이지로 돌아가기
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            안내견학교 &copy; 2025. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
