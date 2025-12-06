/**
 * 안내견학교 데이터 관리 시스템
 * NVDA 스크린리더 접근성 최우선 고려
 */

import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { MainLayout } from './components/MainLayout';
import { syncFromFirestore } from './utils/storage';

function AppContent() {
  const { isAuthenticated } = useAuth();

  // 앱 시작 시 Firestore에서 데이터 동기화
  useEffect(() => {
    if (isAuthenticated) {
      syncFromFirestore();
    }
  }, [isAuthenticated]);

  return isAuthenticated ? <MainLayout /> : <LoginPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
