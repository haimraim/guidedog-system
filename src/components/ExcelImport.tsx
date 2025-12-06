/**
 * 엑셀 일괄 등록 컴포넌트
 * xlsx 라이브러리를 사용하여 엑셀 파일을 읽고 데이터를 일괄 등록
 */

import { useState } from 'react';
import * as XLSX from 'xlsx';
import type { DogCategory, Gender } from '../types/types';
import { generateId, saveGuideDog, savePartner, saveActivity } from '../utils/storage';

interface ExcelRow {
  분류?: string;
  '견명*'?: string;
  견명?: string;
  '견 생년월일*'?: string;
  '견 생년월일'?: string;
  '견 성별'?: string;
  '퍼피티처 이름'?: string;
  '퍼피티처 연락처'?: string;
  '퍼피티처 주소'?: string;
  '파트너 이름*'?: string;
  '파트너 이름'?: string;
  '파트너 연락처*'?: string;
  '파트너 연락처'?: string;
  '파트너 주소'?: string;
  '은퇴견홈케어 이름'?: string;
  '은퇴견홈케어 연락처'?: string;
  '은퇴견홈케어 주소'?: string;
  '부모견홈케어 이름'?: string;
  '부모견홈케어 연락처'?: string;
  '부모견홈케어 주소'?: string;
}

export const ExcelImport = ({ onSuccess }: { onSuccess: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ExcelRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

        setPreview(jsonData.slice(0, 5)); // 처음 5개만 미리보기
      } catch (err) {
        setError('엑셀 파일을 읽는 중 오류가 발생했습니다.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const validateRow = (row: ExcelRow, index: number): string | null => {
    const rowNum = index + 2; // 엑셀 행 번호 (헤더 포함)

    // 필드 값 가져오기 (* 표시 있거나 없는 경우 모두 처리)
    const 분류 = row.분류;
    const 견명 = row['견명*'] || row.견명;
    const 견성별 = row['견 성별'];

    // 필수 필드 검증 - 견명만 필수
    if (!견명 || String(견명).trim() === '')
      return `${rowNum}행: 견명이 누락되었습니다. (필수)`;

    // 분류 검증 (값이 있을 때만)
    if (분류 && String(분류).trim() !== '') {
      const validCategories: DogCategory[] = ['퍼피티칭', '안내견', '은퇴견', '부모견'];
      const 분류Str = String(분류).trim();
      if (!validCategories.includes(분류Str as DogCategory)) {
        return `${rowNum}행: 잘못된 분류입니다.\n입력값: "${분류Str}"\n허용값: 퍼피티칭, 안내견, 은퇴견, 부모견`;
      }
    }

    // 견 성별 검증 (값이 있을 때만)
    if (견성별 && String(견성별).trim() !== '') {
      const 견성별Str = String(견성별).trim();
      if (견성별Str !== '수컷' && 견성별Str !== '암컷') {
        return `${rowNum}행: 견 성별이 잘못되었습니다.\n입력값: "${견성별Str}"\n허용값: 수컷, 암컷`;
      }
    }

    return null;
  };

  const parseDate = (dateValue: any): string => {
    if (typeof dateValue === 'number') {
      // 엑셀 날짜 (일련번호)
      const date = XLSX.SSF.parse_date_code(dateValue);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    return String(dateValue);
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

          if (jsonData.length === 0) {
            setError('엑셀 파일에 데이터가 없습니다.');
            setImporting(false);
            return;
          }

          // 검증
          for (let i = 0; i < jsonData.length; i++) {
            const validationError = validateRow(jsonData[i], i);
            if (validationError) {
              setError(`등록 실패\n\n${validationError}\n\n엑셀 파일을 수정한 후 다시 시도해주세요.`);
              setImporting(false);
              return;
            }
          }

          // 데이터 저장
          let successCount = 0;
          for (const row of jsonData) {
            try {
              const now = new Date().toISOString();

              // 필드 값 가져오기 (* 표시 있거나 없는 경우 모두 처리)
              const 분류 = row.분류;
              const 견명 = (row['견명*'] || row.견명) as string;
              const 견생년월일 = row['견 생년월일*'] || row['견 생년월일'];
              const 견성별 = row['견 성별'];
              const 퍼피티처이름 = row['퍼피티처 이름'];
              const 퍼피티처연락처 = row['퍼피티처 연락처'];
              const 퍼피티처주소 = row['퍼피티처 주소'];
              const 파트너이름 = row['파트너 이름*'] || row['파트너 이름'];
              const 파트너연락처 = row['파트너 연락처*'] || row['파트너 연락처'];
              const 파트너주소 = row['파트너 주소'];
              const 은퇴견홈케어이름 = row['은퇴견홈케어 이름'];
              const 은퇴견홈케어연락처 = row['은퇴견홈케어 연락처'];
              const 은퇴견홈케어주소 = row['은퇴견홈케어 주소'];
              const 부모견홈케어이름 = row['부모견홈케어 이름'];
              const 부모견홈케어연락처 = row['부모견홈케어 연락처'];
              const 부모견홈케어주소 = row['부모견홈케어 주소'];

              // 안내견 저장
              const guideDogId = generateId();
              saveGuideDog({
                id: guideDogId,
                category: (분류 && String(분류).trim()) ? String(분류).trim() as DogCategory : '안내견',
                name: 견명.trim(),
                birthDate: 견생년월일 ? parseDate(견생년월일) : '',
                gender: (견성별 && String(견성별).trim()) ? String(견성별).trim() as Gender : '수컷',
                puppyTeacherName: 퍼피티처이름 ? String(퍼피티처이름).trim() : '',
                puppyTeacherPhone: 퍼피티처연락처 ? String(퍼피티처연락처).trim() : '',
                puppyTeacherAddress: 퍼피티처주소 ? String(퍼피티처주소).trim() : '',
                retiredHomeCareName: 은퇴견홈케어이름 ? String(은퇴견홈케어이름).trim() : '',
                retiredHomeCarePhone: 은퇴견홈케어연락처 ? String(은퇴견홈케어연락처).trim() : '',
                retiredHomeCareAddress: 은퇴견홈케어주소 ? String(은퇴견홈케어주소).trim() : '',
                parentCaregiverName: 부모견홈케어이름 ? String(부모견홈케어이름).trim() : '',
                parentCaregiverPhone: 부모견홈케어연락처 ? String(부모견홈케어연락처).trim() : '',
                parentCaregiverAddress: 부모견홈케어주소 ? String(부모견홈케어주소).trim() : '',
                createdAt: now,
                updatedAt: now,
              });

              // 파트너 저장
              const partnerId = generateId();
              savePartner({
                id: partnerId,
                name: 파트너이름 ? String(파트너이름).trim() : '',
                phone: 파트너연락처 ? String(파트너연락처).trim() : '',
                address: 파트너주소 ? String(파트너주소).trim() : '',
                createdAt: now,
                updatedAt: now,
              });

              // 활동 저장
              saveActivity({
                id: generateId(),
                guideDogId,
                partnerId,
                createdAt: now,
                updatedAt: now,
              });

              successCount++;
            } catch (rowError) {
              const errorMsg = rowError instanceof Error ? rowError.message : '알 수 없는 오류';
              const 견명 = row['견명*'] || row.견명 || '(없음)';
              setError(`${successCount + 1}번째 데이터 저장 실패\n\n오류: ${errorMsg}\n\n견명: ${견명}`);
              setImporting(false);
              return;
            }
          }

          alert(`등록 완료\n\n총 ${successCount}건의 데이터가 성공적으로 등록되었습니다.`);
          onSuccess();
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
          setError(`데이터 처리 중 오류 발생\n\n${errorMsg}\n\n엑셀 파일 형식을 확인해주세요.`);
          console.error('Excel import error:', err);
        } finally {
          setImporting(false);
        }
      };

      reader.onerror = () => {
        setError('파일 읽기 실패\n\n파일이 손상되었거나 열려있을 수 있습니다.\n파일을 닫고 다시 시도해주세요.');
        setImporting(false);
      };

      reader.readAsBinaryString(file);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`파일 읽기 중 오류 발생\n\n${errorMsg}`);
      console.error('File read error:', err);
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    // 템플릿 데이터 생성 (필수 필드에 * 표시)
    const headers = [
      '분류',
      '견명*',
      '견 생년월일*',
      '견 성별',
      '퍼피티처 이름',
      '퍼피티처 연락처',
      '퍼피티처 주소',
      '파트너 이름*',
      '파트너 연락처*',
      '파트너 주소',
      '은퇴견홈케어 이름',
      '은퇴견홈케어 연락처',
      '은퇴견홈케어 주소',
      '부모견홈케어 이름',
      '부모견홈케어 연락처',
      '부모견홈케어 주소',
    ];

    const sampleData = [
      [
        '안내견',
        '예시견',
        '2020-01-15',
        '수컷',
        '',
        '',
        '',
        '홍길동',
        '010-1234-5678',
        '서울시 강남구',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
      [
        '퍼피티칭',
        '샘플견',
        '2023-05-10',
        '암컷',
        '박퍼피티처',
        '010-1111-2222',
        '서울시 종로구',
        '김영희',
        '010-9876-5432',
        '부산시 해운대구',
        '',
        '',
        '',
        '',
        '',
        '',
      ],
      [
        '은퇴견',
        '은퇴견1',
        '2018-03-20',
        '수컷',
        '',
        '',
        '',
        '이철수',
        '010-3333-4444',
        '대구시 수성구',
        '최은퇴홈케어',
        '010-5555-6666',
        '대구시 달서구',
        '',
        '',
        '',
      ],
      [
        '부모견',
        '부모견1',
        '2017-08-10',
        '암컷',
        '',
        '',
        '',
        '박민수',
        '010-7777-8888',
        '인천시 남동구',
        '',
        '',
        '',
        '정부모케어',
        '010-9999-0000',
        '인천시 부평구',
      ],
    ];

    // 워크시트 생성
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '안내견 데이터');

    // 열 너비 설정
    worksheet['!cols'] = [
      { wch: 12 }, // 분류
      { wch: 15 }, // 견명*
      { wch: 15 }, // 견 생년월일*
      { wch: 12 }, // 견 성별
      { wch: 18 }, // 퍼피티처 이름
      { wch: 16 }, // 퍼피티처 연락처
      { wch: 30 }, // 퍼피티처 주소
      { wch: 15 }, // 파트너 이름*
      { wch: 15 }, // 파트너 연락처*
      { wch: 30 }, // 파트너 주소
      { wch: 20 }, // 은퇴견홈케어 이름
      { wch: 18 }, // 은퇴견홈케어 연락처
      { wch: 30 }, // 은퇴견홈케어 주소
      { wch: 20 }, // 부모견홈케어 이름
      { wch: 18 }, // 부모견홈케어 연락처
      { wch: 30 }, // 부모견홈케어 주소
    ];

    // 참조용 시트 생성 (드롭다운 목록)
    const validationSheet = XLSX.utils.aoa_to_sheet([
      ['분류 목록', '견 성별 목록'],
      ['퍼피티칭', '수컷'],
      ['안내견', '암컷'],
      ['은퇴견', ''],
      ['부모견', ''],
    ]);
    XLSX.utils.book_append_sheet(workbook, validationSheet, '입력 가이드');

    // 파일 다운로드
    XLSX.writeFile(workbook, '안내견_데이터_등록_템플릿.xlsx', {
      bookType: 'xlsx',
      type: 'binary',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">엑셀 일괄 등록</h3>

      {/* 템플릿 다운로드 안내 */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
        <h4 className="font-semibold mb-2 text-green-800">템플릿 다운로드</h4>
        <p className="text-sm mb-3">
          아래 버튼을 클릭하여 <strong>엑셀 템플릿 파일</strong>을 다운로드하세요.
          템플릿에는 예시 데이터 4개가 포함되어 있습니다.
        </p>
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-semibold"
        >
          템플릿 다운로드
        </button>
      </div>

      {/* 사용 안내 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold mb-2">작성 안내</h4>
        <p className="text-sm mb-2">다운로드한 템플릿에 데이터를 입력한 후 업로드하세요:</p>
        <ul className="text-sm list-disc list-inside space-y-1">
          <li><strong>필수 항목</strong>: 견명, 견 생년월일, 파트너 이름, 파트너 연락처</li>
          <li><strong>선택 항목</strong>: 분류, 견 성별, 각 케어담당자 정보</li>
          <li><strong>날짜 형식</strong>: 반드시 YYYY-MM-DD 형식 (예: 2023-01-15)</li>
          <li><strong>"입력 가이드" 시트</strong>: 분류, 성별 등 유효한 값 목록이 포함되어 있습니다. 참조하여 정확하게 입력하세요</li>
          <li><strong>분류</strong>: 퍼피티칭, 안내견, 은퇴견, 부모견</li>
          <li><strong>견 성별</strong>: 수컷, 암컷</li>
        </ul>
        <p className="text-sm mt-3 text-blue-700">
          <strong>팁</strong>: "입력 가이드" 시트의 목록을 참조하여 정확하게 입력하면 오류를 방지할 수 있습니다
        </p>
      </div>

      {/* 파일 선택 */}
      <div className="mb-6">
        <label htmlFor="excelFile" className="block text-sm font-medium mb-2">
          엑셀 파일 선택
        </label>
        <input
          type="file"
          id="excelFile"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="whitespace-pre-line font-semibold">{error}</div>
        </div>
      )}

      {/* 미리보기 */}
      {preview.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold mb-2">데이터 미리보기 (처음 5개)</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-2 py-1">분류</th>
                  <th className="border border-gray-300 px-2 py-1">견명</th>
                  <th className="border border-gray-300 px-2 py-1">파트너명</th>
                  <th className="border border-gray-300 px-2 py-1">연락처</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 py-1">{row.분류}</td>
                    <td className="border border-gray-300 px-2 py-1">{row['견명*'] || row.견명}</td>
                    <td className="border border-gray-300 px-2 py-1">{row['파트너 이름*'] || row['파트너 이름']}</td>
                    <td className="border border-gray-300 px-2 py-1">{row['파트너 연락처*'] || row['파트너 연락처']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
        >
          {importing ? '등록 중...' : '등록하기'}
        </button>
      </div>
    </div>
  );
};
