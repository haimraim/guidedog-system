/**
 * 사용자 인증 컨텍스트
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types/types';
import { getGuideDogs, getActivities, getPartners, getUsers } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
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

  // 세션 스토리지에서 사용자 정보 복원
  useEffect(() => {
    const savedUser = sessionStorage.getItem('guidedog_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
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
      sessionStorage.setItem('guidedog_user', JSON.stringify(userSession));
      return true;
    }

    // 기존 방식: 비밀번호 확인 (통일: 8922)
    if (password !== '8922') {
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
      sessionStorage.setItem('guidedog_user', JSON.stringify(adminUser));
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
          sessionStorage.setItem('guidedog_user', JSON.stringify(puppyTeacherUser));
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
          sessionStorage.setItem('guidedog_user', JSON.stringify(trainerUser));
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
              sessionStorage.setItem('guidedog_user', JSON.stringify(partnerUser));
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
          sessionStorage.setItem('guidedog_user', JSON.stringify(retiredHomeCareUser));
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
          sessionStorage.setItem('guidedog_user', JSON.stringify(parentCaregiverUser));
          return true;
        }
      }
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('guidedog_user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
