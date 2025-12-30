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
import { getGuideDogs, getActivities, getPartners, getUsers } from '../utils/storage';

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
        // Firebase 로그아웃 시 로컬 스토리지도 확인
        const savedUser = localStorage.getItem('guidedog_user');
        if (savedUser) {
          // 로컬 로그인 사용자가 있으면 유지
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch {
            setUser(null);
            localStorage.removeItem('guidedog_user');
          }
        } else {
          setUser(null);
        }
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
      // Firebase Authentication 로그인 시도
      // username을 이메일 형식으로 변환
      const email = username.includes('@') ? username : `${username}@guidedogsystem.com`;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        return true;
      } catch (firebaseError) {
        console.log('Firebase 로그인 실패, 로컬 인증 시도:', firebaseError);
        // Firebase 로그인 실패 시 기존 로컬 인증으로 폴백
        return localLogin(username, password);
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      return false;
    }
  };

  // 기존 로컬 인증 로직 (폴백용)
  const localLogin = (username: string, password: string): boolean => {
    // 먼저 로컬스토리지에 저장된 사용자 계정 확인
    const users = getUsers();
    const foundUser = users.find(u => u.id === username && u.password === password);

    if (foundUser) {
      // 로그인 성공 - 비밀번호 정보는 세션에 저장하지 않음
      const userSession: User = {
        id: foundUser.id,
        role: foundUser.role,
        name: foundUser.name,
        dogName: foundUser.dogName,
        category: foundUser.category,
      };
      setUser(userSession);
      localStorage.setItem('guidedog_user', JSON.stringify(userSession));
      return true;
    }

    // 환경변수에서 로컬 인증 비밀번호 가져오기 (없으면 기본값 사용)
    const localAuthPassword = import.meta.env.VITE_LOCAL_AUTH_PASSWORD || '8922';
    if (password !== localAuthPassword) {
      return false;
    }

    // 관리자 로그인
    if (username === 'guidedog') {
      const adminUser: User = {
        id: 'guidedog',
        role: 'admin',
        name: '관리자',
      };
      setUser(adminUser);
      localStorage.setItem('guidedog_user', JSON.stringify(adminUser));
      return true;
    }

    // 준관리자 로그인
    if (username === '박태진') {
      const moderatorUser: User = {
        id: '박태진',
        role: 'moderator',
        name: '박태진',
      };
      setUser(moderatorUser);
      localStorage.setItem('guidedog_user', JSON.stringify(moderatorUser));
      return true;
    }

    // 담당자 로그인 (견명.담당자성명 형식)
    // 견명.퍼피티처, 견명.훈련사, 견명.파트너, 견명.은퇴견홈케어, 견명.부모견홈케어 등 모두 가능
    const dogs = getGuideDogs();
    const activities = getActivities();
    const partners = getPartners();

    for (const dog of dogs) {
      // 1. 퍼피티처 로그인 체크 (퍼피티칭 카테고리)
      if (dog.category === '퍼피티칭' && dog.puppyTeacherName) {
        const expectedUsername = `${dog.name}.${dog.puppyTeacherName}`;
        if (username === expectedUsername) {
          const puppyTeacherUser: User = {
            id: username,
            role: 'puppyTeacher',
            name: dog.puppyTeacherName,
            dogName: dog.name,
            category: '퍼피티칭',
          };
          setUser(puppyTeacherUser);
          localStorage.setItem('guidedog_user', JSON.stringify(puppyTeacherUser));
          return true;
        }
      }

      // 2. 훈련사 로그인 체크 (훈련견 카테고리)
      if (dog.category === '훈련견' && dog.trainerName) {
        const expectedUsername = `${dog.name}.${dog.trainerName}`;
        if (username === expectedUsername) {
          const trainerUser: User = {
            id: username,
            role: 'trainer',
            name: dog.trainerName,
            dogName: dog.name,
            category: '훈련견',
          };
          setUser(trainerUser);
          localStorage.setItem('guidedog_user', JSON.stringify(trainerUser));
          return true;
        }
      }

      // 3. 파트너 로그인 체크 (안내견 관련 카테고리)
      if (
        (dog.category === '안내견' ||
         dog.category === '안내견/폐사' ||
         dog.category === '안내견/일반안내견/기타')
      ) {
        const activity = activities.find(a => a.guideDogId === dog.id);
        if (activity) {
          const partner = partners.find(p => p.id === activity.partnerId);
          if (partner) {
            const expectedUsername = `${dog.name}.${partner.name}`;
            if (username === expectedUsername) {
              const partnerUser: User = {
                id: username,
                role: 'partner',
                name: partner.name,
                dogName: dog.name,
                category: dog.category,
              };
              setUser(partnerUser);
              localStorage.setItem('guidedog_user', JSON.stringify(partnerUser));
              return true;
            }
          }
        }
      }

      // 4. 은퇴견 홈케어 로그인 체크 (은퇴견 카테고리)
      if (dog.category === '은퇴견' && dog.retiredHomeCareName) {
        const expectedUsername = `${dog.name}.${dog.retiredHomeCareName}`;
        if (username === expectedUsername) {
          const retiredHomeCareUser: User = {
            id: username,
            role: 'retiredHomeCare',
            name: dog.retiredHomeCareName,
            dogName: dog.name,
            category: '은퇴견',
          };
          setUser(retiredHomeCareUser);
          localStorage.setItem('guidedog_user', JSON.stringify(retiredHomeCareUser));
          return true;
        }
      }

      // 5. 부모견 홈케어 로그인 체크 (부견/모견 카테고리)
      if ((dog.category === '부견' || dog.category === '모견') && dog.parentCaregiverName) {
        const expectedUsername = `${dog.name}.${dog.parentCaregiverName}`;
        if (username === expectedUsername) {
          const parentCaregiverUser: User = {
            id: username,
            role: 'parentCaregiver',
            name: dog.parentCaregiverName,
            dogName: dog.name,
            category: dog.category,
          };
          setUser(parentCaregiverUser);
          localStorage.setItem('guidedog_user', JSON.stringify(parentCaregiverUser));
          return true;
        }
      }
    }

    return false;
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
