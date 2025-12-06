/**
 * 안내견학교 데이터 관리 시스템
 * NVDA 스크린리더 접근성 최우선 고려
 */

import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';
import { MainLayout } from './components/MainLayout';
import { syncFromFirestore } from './utils/storage';

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  // 앱 시작 시 Firestore에서 데이터 동기화
  useEffect(() => {
    if (isAuthenticated) {
      syncFromFirestore();
    }
  }, [isAuthenticated]);

  // 로딩 중에는 로딩 화면 표시
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <MainLayout /> : <AuthPage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
