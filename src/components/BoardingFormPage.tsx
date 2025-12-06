/**
 * 보딩 폼 페이지 컴포넌트
 * 구글 폼으로 연결
 */

interface BoardingFormPageProps {
  onNavigateHome?: () => void;
}

export const BoardingFormPage = ({ onNavigateHome }: BoardingFormPageProps) => {
  const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSd4yoUkZzEGRNgXAAFt4G9bnJy10cilDWhqoR9g_S4h4_zMbw/viewform';

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">보딩 폼 작성</h2>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-gray-500 outline-none"
            >
              🏠 홈으로
            </button>
          )}
        </div>
        <p className="text-gray-600 mb-4">
          안내견학교에 보딩할 때 사용하는 보딩 폼을 작성해주세요.
          아래 폼을 작성하시거나, 새 창에서 열어 작성하실 수 있습니다.
        </p>
        <a
          href={formUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 outline-none"
        >
          새 창에서 폼 열기
        </a>
      </div>

      {/* 구글 폼 임베드 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <iframe
          src={formUrl}
          width="100%"
          height="1200"
          frameBorder="0"
          marginHeight={0}
          marginWidth={0}
          title="안내견 보딩 폼"
          className="w-full"
        >
          로딩 중...
        </iframe>
      </div>
    </div>
  );
};
