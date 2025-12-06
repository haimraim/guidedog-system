/**
 * 안내견학교 데이터 관리 시스템
 * NVDA 스크린리더 접근성 최우선 고려
 */

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { MainLayout } from './components/MainLayout';

function AppContent() {
  const { isAuthenticated } = useAuth();

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
