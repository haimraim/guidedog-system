/**
 * 영상 시청실 메인 페이지
 * 2개의 서브메뉴로 구성
 */

import { useState } from 'react';
import { GuideDogSchoolVideosPage } from './GuideDogSchoolVideosPage';
import { SchoolOfGuideDogPage } from './SchoolOfGuideDogPage';

type SubMenu = 'main' | 'schoolvideos' | 'samsung';

export const VideoRoomPage = () => {
  const [currentSubmenu, setCurrentSubmenu] = useState<SubMenu>('main');

  // 서브메뉴 선택 화면
  if (currentSubmenu === 'main') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">영상 시청실 📹</h2>
          <p className="text-gray-600 mb-8">
            안내견 관련 교육 영상을 시청하실 수 있습니다.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 안내견학교 영상 */}
            <button
              onClick={() => setCurrentSubmenu('schoolvideos')}
              className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 rounded-xl p-8 text-left transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="안내견학교 자체 제작 영상 보기"
            >
              <div className="flex items-center mb-4">
                <span className="text-5xl mr-4">🎬</span>
                <h3 className="text-2xl font-bold text-blue-800">
                  안내견학교 영상
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                안내견학교에서 직접 제작한 교육 영상입니다.
                <br />
                실제 훈련 과정과 안내견 생활을 확인하세요.
              </p>
            </button>

            {/* 스쿨오브안내견 */}
            <button
              onClick={() => setCurrentSubmenu('samsung')}
              className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-300 rounded-xl p-8 text-left transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2"
              aria-label="삼성화재 스쿨오브안내견 유튜브 영상 보기"
            >
              <div className="flex items-center mb-4">
                <span className="text-5xl mr-4">🐾</span>
                <h3 className="text-2xl font-bold text-green-800">
                  스쿨오브안내견
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                삼성화재 공식 채널의 안내견 교육 영상입니다.
                <br />
                다양한 교육 콘텐츠를 시청하세요.
              </p>
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 이용 안내</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>• <strong>안내견학교 영상:</strong> 안내견학교 자체 제작 영상을 시청할 수 있습니다</li>
            <li>• <strong>스쿨오브안내견:</strong> 삼성화재 유튜브 채널의 교육 영상을 시청할 수 있습니다</li>
            <li>• 모든 영상은 키보드로 조작 가능합니다 (스페이스바, 화살표 등)</li>
          </ul>
        </div>
      </div>
    );
  }

  // 안내견학교 영상 페이지
  if (currentSubmenu === 'schoolvideos') {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setCurrentSubmenu('main')}
            className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-4 py-2"
            aria-label="영상 시청실 메인으로 돌아가기"
          >
            ← 영상 시청실
          </button>
        </div>
        <GuideDogSchoolVideosPage />
      </div>
    );
  }

  // 스쿨오브안내견 페이지
  if (currentSubmenu === 'samsung') {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setCurrentSubmenu('main')}
            className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-4 py-2"
            aria-label="영상 시청실 메인으로 돌아가기"
          >
            ← 영상 시청실
          </button>
        </div>
        <SchoolOfGuideDogPage />
      </div>
    );
  }

  return null;
};
