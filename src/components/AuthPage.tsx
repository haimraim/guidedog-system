/**
 * 인증 페이지 래퍼
 * 로그인과 회원가입 페이지를 전환
 */

import { useState } from 'react';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

export const AuthPage = () => {
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return <RegisterPage onBackToLogin={() => setShowRegister(false)} />;
  }

  return <LoginPage onShowRegister={() => setShowRegister(true)} />;
};
