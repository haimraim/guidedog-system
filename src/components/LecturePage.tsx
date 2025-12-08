/**
 * 강의실 메인 페이지
 * 일반 강의실과 직원용 강의실(관리자 전용) 서브메뉴로 구성
 */

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PublicLecturePage } from './PublicLecturePage';
import { StaffLecturePage } from './StaffLecturePage';

type SubMenu = 'main' | 'public' | 'staff';

export const LecturePage = () => {
  const { user } = useAuth();
  const [currentSubmenu, setCurrentSubmenu] = useState<SubMenu>('main');

  // 서브메뉴 선택 화면
  if (currentSubmenu === 'main') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">강의실 📚</h2>
          <p className="text-gray-600 mb-8">
            안내견 관련 강의 자료를 확인하실 수 있습니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 일반 강의실 */}
            <button
              onClick={() => setCurrentSubmenu('public')}
              className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 rounded-xl p-8 text-left transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="일반 강의실 보기"
            >
              <div className="flex items-center mb-4">
                <span className="text-5xl mr-4">📖</span>
                <h3 className="text-2xl font-bold text-blue-800">
                  일반 강의실
                </h3>
              </div>
            </button>

            {/* 직원용 강의실 (관리자만) */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setCurrentSubmenu('staff')}
                className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-300 rounded-xl p-8 text-left transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-offset-2"
                aria-label="직원용 강의실 보기"
              >
                <div className="flex items-center mb-4">
                  <span className="text-5xl mr-4">👨‍💼</span>
                  <h3 className="text-2xl font-bold text-purple-800">
                    직원용 강의실
                  </h3>
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 이용 안내</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• <strong>일반 강의실:</strong> 카테고리별 안내견 관련 강의 자료를 확인할 수 있습니다</li>
            {user?.role === 'admin' && (
              <li>• <strong>직원용 강의실:</strong> 직원 전용 교육 자료를 관리할 수 있습니다 (관리자 전용)</li>
            )}
            <li>• 모든 영상은 키보드로 조작 가능합니다 (스페이스바, 화살표 등)</li>
          </ul>
        </div>
      </div>
    );
  }

  // 일반 강의실 페이지
  if (currentSubmenu === 'public') {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setCurrentSubmenu('main')}
            className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-4 py-2"
            aria-label="강의실 메인으로 돌아가기"
          >
            ← 강의실
          </button>
        </div>
        <PublicLecturePage />
      </div>
    );
  }

  // 직원용 강의실 페이지
  if (currentSubmenu === 'staff') {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setCurrentSubmenu('main')}
            className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-4 py-2"
            aria-label="강의실 메인으로 돌아가기"
          >
            ← 강의실
          </button>
        </div>
        <StaffLecturePage />
      </div>
    );
  }

  return null;
};
