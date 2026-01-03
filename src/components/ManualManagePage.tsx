/**
 * 매뉴얼 관리 페이지
 * RAG 기반 - PDF를 청크로 분할하고 벡터 DB에 저장
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  saveQnAManual,
  getQnAManuals,
  deleteQnAManual,
  type QnAManual,
  type ManualCategory,
} from '../services/firestoreService';
import { extractTextFromFile } from '../services/pdfService';
import { processAndStoreDocument, deleteManualChunks } from '../services/ragService';

const CATEGORIES: { value: ManualCategory; label: string }[] = [
  { value: '공통', label: '공통 (모든 사용자)' },
  { value: '퍼피티칭', label: '퍼피티칭' },
  { value: '훈련견', label: '훈련견' },
  { value: '안내견', label: '안내견' },
  { value: '은퇴견', label: '은퇴견' },
  { value: '부모견', label: '부모견' },
];

export const ManualManagePage = () => {
  const { user } = useAuth();
  const [manuals, setManuals] = useState<QnAManual[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ManualCategory>('공통');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 매뉴얼 목록 로드
  const loadManuals = async () => {
    try {
      const data = await getQnAManuals();
      setManuals(data);
    } catch (err) {
      console.error('매뉴얼 목록 로드 실패:', err);
      setError('매뉴얼 목록을 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    loadManuals();
  }, []);

  // 파일 업로드 처리 (RAG 방식)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setProgressPercent(0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // PDF, TXT만 지원 (RAG 처리 가능한 형식)
      const allowedTypes = ['application/pdf', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        setError(`${file.name}: PDF 또는 TXT 파일만 업로드 가능합니다.`);
        continue;
      }

      if (file.size > 20 * 1024 * 1024) {
        setError(`${file.name}: 파일 크기가 20MB를 초과합니다.`);
        continue;
      }

      try {
        // 1단계: 텍스트 추출
        setUploadProgress(`텍스트 추출 중: ${file.name}`);
        setProgressPercent(5);

        const text = await extractTextFromFile(file, (page, total) => {
          const progress = 5 + Math.floor((page / total) * 20);
          setProgressPercent(progress);
          setUploadProgress(`텍스트 추출 중: ${file.name} (${page}/${total} 페이지)`);
        });

        if (text.length < 100) {
          setError(`${file.name}: 추출된 텍스트가 너무 짧습니다.`);
          continue;
        }

        // 2단계: RAG 처리 (청킹 + 임베딩 + 저장)
        const manualId = `manual_${Date.now()}_${i}`;

        const chunkCount = await processAndStoreDocument(
          text,
          manualId,
          file.name,
          selectedCategory,
          (progress, message) => {
            setProgressPercent(25 + Math.floor(progress * 0.7));
            setUploadProgress(message);
          }
        );

        // 3단계: Firestore에 매뉴얼 메타데이터 저장
        const manual: QnAManual = {
          id: manualId,
          fileName: manualId,
          displayName: file.name,
          fileUri: '', // RAG 방식에서는 fileUri 불필요
          mimeType: file.type,
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user?.name || 'unknown',
          expiresAt: '', // RAG 방식에서는 만료 없음
          category: selectedCategory,
        };

        await saveQnAManual(manual);

        setUploadProgress(`완료: ${file.name} (${chunkCount}개 청크)`);
        setProgressPercent(100);

      } catch (err) {
        console.error('업로드 오류:', err);
        setError(`${file.name}: ${err instanceof Error ? err.message : '업로드 실패'}`);
      }
    }

    setIsUploading(false);
    setUploadProgress('');
    setProgressPercent(0);
    loadManuals();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 매뉴얼 삭제 (청크도 함께 삭제)
  const handleDelete = async (manual: QnAManual) => {
    if (!confirm(`"${manual.displayName}"을(를) 삭제하시겠습니까?\n연관된 모든 청크 데이터도 함께 삭제됩니다.`)) return;

    try {
      setUploadProgress('삭제 중...');

      // 벡터 DB에서 청크 삭제
      await deleteManualChunks(manual.id);

      // Firestore에서 매뉴얼 메타데이터 삭제
      await deleteQnAManual(manual.id);

      loadManuals();
      setUploadProgress('');
    } catch (err) {
      console.error('삭제 오류:', err);
      setError('삭제에 실패했습니다.');
      setUploadProgress('');
    }
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-neutral-800 mb-6">매뉴얼 관리</h2>

        {/* RAG 설명 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            <strong>RAG 기반 검색</strong>: 업로드된 매뉴얼은 자동으로 분석되어 벡터 데이터베이스에 저장됩니다.
            <br />
            챗봇이 질문과 관련된 내용만 찾아서 답변에 활용합니다.
            <br />
            <span className="text-green-600 font-semibold">
              ✓ 만료 없음 - 한 번 업로드하면 계속 사용 가능
            </span>
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 text-sm underline mt-1"
            >
              닫기
            </button>
          </div>
        )}

        {/* 카테고리 선택 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-neutral-700 mb-2">
            업로드할 매뉴얼의 카테고리
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ManualCategory)}
            className="w-full md:w-64 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* 업로드 영역 */}
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 mb-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            multiple
            onChange={handleFileUpload}
            disabled={isUploading}
            className="sr-only"
            id="pdf-upload"
            aria-label="매뉴얼 파일 선택"
          />
          <div className="text-4xl mb-2" aria-hidden="true">📄</div>
          <p className="text-lg font-semibold text-neutral-700 mb-1">
            {isUploading ? uploadProgress : '매뉴얼 파일 업로드'}
          </p>
          <p className="text-sm text-neutral-500 mb-4">
            PDF, TXT 지원 · 최대 20MB · 여러 파일 선택 가능
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-neutral-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-describedby="upload-help"
          >
            {isUploading ? '업로드 중...' : '파일 선택'}
          </button>
          <p id="upload-help" className="sr-only">
            PDF 또는 TXT 파일을 선택하면 자동으로 RAG 처리됩니다.
          </p>

          {/* 진행률 표시 */}
          {isUploading && (
            <div className="mt-4" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-neutral-600 mt-2">{progressPercent}%</p>
            </div>
          )}
        </div>

        {/* 업로드된 매뉴얼 목록 */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">
            업로드된 매뉴얼 ({manuals.length}개)
          </h3>

          {manuals.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">
              업로드된 매뉴얼이 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {manuals.map((manual) => (
                <div
                  key={manual.id}
                  className="border rounded-lg p-4 flex items-center justify-between bg-neutral-50 border-neutral-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-neutral-800">
                        {manual.displayName}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        manual.category === '공통' ? 'bg-gray-200 text-gray-700' :
                        manual.category === '퍼피티칭' ? 'bg-green-100 text-green-700' :
                        manual.category === '훈련견' ? 'bg-blue-100 text-blue-700' :
                        manual.category === '안내견' ? 'bg-purple-100 text-purple-700' :
                        manual.category === '은퇴견' ? 'bg-orange-100 text-orange-700' :
                        'bg-pink-100 text-pink-700'
                      }`}>
                        {manual.category || '공통'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        RAG
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500 space-x-4">
                      <span>{formatFileSize(manual.sizeBytes)}</span>
                      <span>업로드: {new Date(manual.uploadedAt).toLocaleString('ko-KR')}</span>
                      <span>by {manual.uploadedBy}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(manual)}
                    className="ml-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
