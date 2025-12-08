/**
 * 메인 레이아웃 컴포넌트
 * 로그인 후 표시되는 메인 화면
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DiaryPage } from './DiaryPage';
import { BoardingFormPage } from './BoardingFormPage';
import { ProductOrderPage } from './ProductOrderPage';
import { MedicalRecordPage } from './MedicalRecordPage';
import { MedicationCheckPage } from './MedicationCheckPage';
import { DataTableEnhanced } from './DataTableEnhanced';
import { LecturePage } from './LecturePage';
import { SchoolOfGuideDogPage } from './SchoolOfGuideDogPage';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';
import { TermsOfServicePage } from './TermsOfServicePage';
import { getCombinedData, calculateAgeWithMonths } from '../utils/storage';
import type { CombinedData } from '../types/types';

type MenuItem = 'home' | 'diary' | 'lecture' | 'schoolofguidedog' | 'boarding' | 'products' | 'medical' | 'medication' | 'admin' | 'privacy' | 'terms';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<MenuItem>('home');
  const [myDogInfo, setMyDogInfo] = useState<CombinedData | null>(null);

  // URL에서 현재 페이지 파라미터 읽기 및 초기 히스토리 설정
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') as MenuItem;

    if (page && page !== currentPage) {
      // URL에 페이지 파라미터가 있으면 해당 페이지로 이동
      setCurrentPage(page);
      // 현재 상태를 히스토리에 등록
      window.history.replaceState({ page }, '', `?page=${page}`);
    } else {
      // URL에 페이지 파라미터가 없으면 홈으로 설정
      window.history.replaceState({ page: 'home' }, '', '?page=home');
    }
  }, []);

  // 브라우저 뒤로가기/앞으로가기 이벤트 처리
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const page = event.state?.page as MenuItem;
      if (page) {
        setCurrentPage(page);
      } else {
        setCurrentPage('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
    }
  };

  const navigateToPage = (page: MenuItem) => {
    if (page !== currentPage) {
      // 브라우저 히스토리에 추가
      window.history.pushState({ page }, '', `?page=${page}`);
      setCurrentPage(page);
    }
  };

  const navigateBack = () => {
    // 브라우저의 뒤로가기 사용
    window.history.back();
  };

  const navigateHome = () => {
    // 홈으로 이동 시 히스토리 교체
    window.history.pushState({ page: 'home' }, '', '?page=home');
    setCurrentPage('home');
  };

  // 담당 안내견 정보 로드 (일반 회원만)
  useEffect(() => {
    if (user && user.role !== 'admin' && user.dogName) {
      const allData = getCombinedData();
      const myDog = allData.find(item => item.guideDog.name === user.dogName);
      setMyDogInfo(myDog || null);
    } else {
      setMyDogInfo(null);
    }
  }, [user]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">환영합니다!</h2>
              <div className="space-y-4 text-gray-700">
                <p className="text-lg">
                  <strong>{user?.name}</strong>님, 안내견 관리 시스템에 오신 것을 환영합니다.
                  {user?.dogName && (
                    <span className="block mt-2 text-blue-600">
                      담당 안내견: <strong>{user.dogName}</strong>
                    </span>
                  )}
                </p>
                <div className="mt-8 bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">메뉴 안내</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li><strong>다이어리:</strong> 안내견과의 생활 경험을 기록합니다</li>
                    <li><strong>강의실:</strong> 교육 자료 및 영상을 열람합니다</li>
                    <li><strong>스쿨오브안내견 🐾:</strong> 삼성화재 유튜브 교육 영상을 시청합니다</li>
                    <li><strong>보딩 폼:</strong> 안내견 위탁 신청서를 작성합니다</li>
                    <li><strong>물품 신청:</strong> 필요한 물품을 신청합니다</li>
                    <li><strong>진료 기록:</strong> 안내견의 진료 내역을 관리합니다</li>
                    <li><strong>약품 체크:</strong> 매월 약품 복용/도포 여부를 체크합니다</li>
                    {user?.role === 'admin' && (
                      <>
                        <li><strong>안내견 관리:</strong> 전체 안내견 데이터를 관리합니다</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
      case 'diary':
        return <DiaryPage />;
      case 'lecture':
        return <LecturePage />;
      case 'schoolofguidedog':
        return <SchoolOfGuideDogPage />;
      case 'boarding':
        return <BoardingFormPage onNavigateHome={() => setCurrentPage('home')} />;
      case 'products':
        return <ProductOrderPage />;
      case 'medical':
        return <MedicalRecordPage />;
      case 'medication':
        return <MedicationCheckPage />;
      case 'admin':
        return <DataTableEnhanced />;
      case 'privacy':
        return <PrivacyPolicyPage />;
      case 'terms':
        return <TermsOfServicePage />;
      default:
        return <DiaryPage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 헤더 */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">안내견 관리 시스템</h1>
              <p className="text-sm text-blue-100 mt-1">
                {user?.role === 'admin' ? '관리자' : user?.name}님 환영합니다
                {user?.dogName && ` (${user.dogName})`}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg transition-colors focus:ring-2 focus:ring-blue-300 outline-none"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 담당 안내견 정보 고정 표시 (일반 회원만) */}
      {user && user.role !== 'admin' && myDogInfo && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200 shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-600">견명:</span>
                  <span className="text-lg font-bold text-blue-700">{myDogInfo.guideDog.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-600">성별:</span>
                  <span className="text-base font-semibold text-gray-800">{myDogInfo.guideDog.gender}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-600">생년월일:</span>
                  <span className="text-base font-semibold text-gray-800">
                    {new Date(myDogInfo.guideDog.birthDate).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-gray-600">나이:</span>
                  <span className="text-base font-bold text-indigo-600">
                    {calculateAgeWithMonths(myDogInfo.guideDog.birthDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 서브페이지 네비게이션 - 홈이 아닐 때 표시 */}
      {currentPage !== 'home' && (
        <nav className="bg-white shadow-md border-b-2 border-gray-200">
          <div className="container mx-auto px-4 py-3 flex items-center space-x-4">
            <button
              onClick={navigateBack}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 outline-none"
              aria-label="이전 페이지로 돌아가기 (Alt + 왼쪽 화살표)"
            >
              <span>← 뒤로</span>
            </button>
            <button
              onClick={navigateHome}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:ring-2 focus:ring-blue-300 outline-none"
            >
              <span>🏠 홈</span>
            </button>
            <div className="flex-1 text-center">
              <span className="text-lg font-bold text-gray-800">
                {currentPage === 'diary' && '다이어리'}
                {currentPage === 'lecture' && '강의실'}
                {currentPage === 'schoolofguidedog' && '스쿨오브안내견 🐾'}
                {currentPage === 'boarding' && '보딩 폼 작성'}
                {currentPage === 'products' && (user?.role === 'admin' ? '물품 확인' : '물품 신청')}
                {currentPage === 'medical' && '진료 기록'}
                {currentPage === 'medication' && '약품 체크'}
                {currentPage === 'admin' && '안내견 관리'}
                {currentPage === 'privacy' && '개인정보 처리방침'}
                {currentPage === 'terms' && '이용약관'}
              </span>
            </div>
          </div>
        </nav>
      )}

      {/* 네비게이션 메뉴 - 홈 화면에서만 표시 */}
      {currentPage === 'home' && (
        <nav className="bg-white shadow-md">
          <div className="container mx-auto px-4">
            <ul className="flex space-x-1 overflow-x-auto">
              <li>
                <button
                  onClick={() => navigateToPage('home')}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap focus:ring-2 focus:ring-blue-500 outline-none ${
                    currentPage === 'home'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={currentPage === 'home' ? 'page' : undefined}
                >
                  🏠 홈
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage('diary')}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap focus:ring-2 focus:ring-blue-500 outline-none ${
                    currentPage === 'diary'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={currentPage === 'diary' ? 'page' : undefined}
                >
                  다이어리
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage('lecture')}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap focus:ring-2 focus:ring-blue-500 outline-none ${
                    currentPage === 'lecture'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={currentPage === 'lecture' ? 'page' : undefined}
                >
                  강의실
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage('schoolofguidedog')}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap focus:ring-2 focus:ring-blue-500 outline-none ${
                    currentPage === 'schoolofguidedog'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={currentPage === 'schoolofguidedog' ? 'page' : undefined}
                >
                  스쿨오브안내견 🐾
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage('boarding')}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap focus:ring-2 focus:ring-blue-500 outline-none ${
                    currentPage === 'boarding'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={currentPage === 'boarding' ? 'page' : undefined}
                >
                  보딩 폼 작성
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage('products')}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap focus:ring-2 focus:ring-blue-500 outline-none ${
                    currentPage === 'products'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={currentPage === 'products' ? 'page' : undefined}
                >
                  {user?.role === 'admin' ? '물품 확인' : '물품 신청'}
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage('medical')}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap focus:ring-2 focus:ring-blue-500 outline-none ${
                    currentPage === 'medical'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={currentPage === 'medical' ? 'page' : undefined}
                >
                  진료 기록
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateToPage('medication')}
                  className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap focus:ring-2 focus:ring-blue-500 outline-none ${
                    currentPage === 'medication'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  aria-current={currentPage === 'medication' ? 'page' : undefined}
                >
                  약품 체크
                </button>
              </li>
              {user?.role === 'admin' && (
                <li>
                  <button
                    onClick={() => navigateToPage('admin')}
                    className={`px-6 py-4 font-semibold transition-colors whitespace-nowrap focus:ring-2 focus:ring-blue-500 outline-none ${
                      currentPage === 'admin'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-current={currentPage === 'admin' ? 'page' : undefined}
                  >
                    안내견 관리
                  </button>
                </li>
              )}
            </ul>
          </div>
        </nav>
      )}

      {/* 메인 콘텐츠 */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {renderPage()}
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-2">
            <p className="text-sm">안내견학교 &copy; 2025. All rights reserved.</p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>주소: 경기도 용인시 처인구 포곡읍 에버랜드로376번길 1-27</p>
              <p>연락처: 031-320-8922 | 팩스: 031-320-9233</p>
              <p className="space-x-4">
                <button
                  onClick={() => navigateToPage('privacy')}
                  className="hover:text-white transition-colors underline focus:ring-2 focus:ring-white outline-none"
                >
                  개인정보 처리방침
                </button>
                <span>|</span>
                <button
                  onClick={() => navigateToPage('terms')}
                  className="hover:text-white transition-colors underline focus:ring-2 focus:ring-white outline-none"
                >
                  이용약관
                </button>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
