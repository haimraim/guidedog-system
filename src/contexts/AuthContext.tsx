/**
 * 사용자 인증 컨텍스트
 * Firebase Authentication 통합
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/types';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, userData: Partial<User>) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Firebase Auth 상태 변경 리스너
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        // Firestore에서 사용자 역할 정보 가져오기
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            setUser(userData);
            localStorage.setItem('guidedog_user', JSON.stringify(userData));
          } else {
            // Firestore에 사용자 데이터가 없으면 기본값 설정
            console.warn('Firestore에 사용자 데이터가 없습니다. 기본값으로 설정합니다.');
            const defaultUser: User = {
              id: firebaseUser.email || firebaseUser.uid,
              role: 'admin',
              name: firebaseUser.displayName || '사용자',
            };
            setUser(defaultUser);
            localStorage.setItem('guidedog_user', JSON.stringify(defaultUser));
          }
        } catch (error) {
          console.error('사용자 데이터 로드 실패:', error);
          // 오류 발생 시에도 기본 사용자로 설정
          const defaultUser: User = {
            id: firebaseUser.email || firebaseUser.uid,
            role: 'admin',
            name: firebaseUser.displayName || '사용자',
          };
          setUser(defaultUser);
          localStorage.setItem('guidedog_user', JSON.stringify(defaultUser));
        }
      } else {
        // Firebase 로그아웃 시 사용자 정보 초기화
        setUser(null);
        localStorage.removeItem('guidedog_user');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 회원가입 함수
  const register = async (email: string, password: string, userData: Partial<User>): Promise<boolean> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 사용자 프로필 업데이트
      if (userData.name) {
        await updateProfile(firebaseUser, {
          displayName: userData.name
        });
      }

      // Firestore에 사용자 역할 정보 저장
      const userDoc: User = {
        id: email,
        role: userData.role || 'admin',
        name: userData.name || '사용자',
        dogName: userData.dogName,
        category: userData.category,
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userDoc);
      return true;
    } catch (error) {
      console.error('회원가입 실패:', error);
      return false;
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Firebase Authentication 로그인
      // username을 이메일 형식으로 변환
      const email = username.includes('@') ? username : `${username}@guidedogsystem.com`;
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error('로그인 실패:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem('guidedog_user');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
