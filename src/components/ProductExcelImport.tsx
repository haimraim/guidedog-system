/**
 * 물품 엑셀 일괄 등록 컴포넌트
 */

import { useState } from 'react';
import * as XLSX from 'xlsx';
import type { Product, ProductCategory, ProductOption, ProductOptionValue } from '../types/types';
import { generateId } from '../utils/storage';
import { saveProduct } from './ProductManagementPage';

interface ProductExcelRow {
  '카테고리*'?: string;
  카테고리?: string;
  '물품명*'?: string;
  물품명?: string;
  '재고수량*'?: number | string;
  재고수량?: number | string;
  '설명'?: string;
  '옵션1-명'?: string;
  '옵션1-값1'?: string;
  '옵션1-재고1'?: number | string;
  '옵션1-값2'?: string;
  '옵션1-재고2'?: number | string;
  '옵션1-값3'?: string;
  '옵션1-재고3'?: number | string;
  '옵션1-값4'?: string;
  '옵션1-재고4'?: number | string;
  '옵션1-값5'?: string;
  '옵션1-재고5'?: number | string;
  '옵션2-명'?: string;
  '옵션2-값1'?: string;
  '옵션2-재고1'?: number | string;
  '옵션2-값2'?: string;
  '옵션2-재고2'?: number | string;
  '옵션2-값3'?: string;
  '옵션2-재고3'?: number | string;
  '옵션2-값4'?: string;
  '옵션2-재고4'?: number | string;
  '옵션2-값5'?: string;
  '옵션2-재고5'?: number | string;
  [key: string]: any; // 추가 옵션 컬럼을 위한 인덱스 시그니처
}

export const ProductExcelImport = ({ onSuccess }: { onSuccess: () => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ProductExcelRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const categories: ProductCategory[] = ['사료', '장난감', '샴푸/린스', '매트', '견옷'];

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
        const jsonData = XLSX.utils.sheet_to_json<ProductExcelRow>(worksheet);

        setPreview(jsonData.slice(0, 5)); // 처음 5개만 미리보기
      } catch (err) {
        setError('엑셀 파일을 읽는 중 오류가 발생했습니다.');
        console.error(err);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const validateRow = (row: ProductExcelRow, index: number): string | null => {
    const rowNum = index + 2; // 엑셀 행 번호 (헤더 포함)

    // 필드 값 가져오기
    const 카테고리 = row['카테고리*'] || row.카테고리;
    const 물품명 = row['물품명*'] || row.물품명;
    const 재고수량 = row['재고수량*'] || row.재고수량;

    // 필수 필드 검증
    if (!카테고리 || String(카테고리).trim() === '')
      return `${rowNum}행: 카테고리가 누락되었습니다. (필수)`;

    if (!물품명 || String(물품명).trim() === '')
      return `${rowNum}행: 물품명이 누락되었습니다. (필수)`;

    // 카테고리 검증
    const 카테고리Str = String(카테고리).trim();
    if (!categories.includes(카테고리Str as ProductCategory)) {
      return `${rowNum}행: 잘못된 카테고리입니다.\n입력값: "${카테고리Str}"\n허용값: 사료, 장난감, 샴푸/린스, 매트, 견옷`;
    }

    // 옵션 확인
    const 옵션1명 = row['옵션1-명'] ? String(row['옵션1-명']).trim() : '';
    const hasOptions = !!옵션1명;

    // 옵션이 없는 경우에만 재고수량 필수
    if (!hasOptions) {
      if (재고수량 === undefined || 재고수량 === null || String(재고수량).trim() === '')
        return `${rowNum}행: 옵션이 없는 물품은 재고수량이 필수입니다.`;

      // 재고수량 검증
      const 재고수량Num = Number(재고수량);
      if (isNaN(재고수량Num) || 재고수량Num < 0 || !Number.isInteger(재고수량Num)) {
        return `${rowNum}행: 재고수량은 0 이상의 정수여야 합니다.\n입력값: "${재고수량}"`;
      }
    }

    return null;
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
          const jsonData = XLSX.utils.sheet_to_json<ProductExcelRow>(worksheet);

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
          const now = new Date().toISOString();

          for (const row of jsonData) {
            try {
              const 카테고리 = String(row['카테고리*'] || row.카테고리).trim() as ProductCategory;
              const 물품명 = String(row['물품명*'] || row.물품명).trim();
              const 재고수량Raw = row['재고수량*'] || row['재고수량'];
              const 재고수량 = 재고수량Raw !== undefined && 재고수량Raw !== null && String(재고수량Raw).trim() !== ''
                ? Number(재고수량Raw)
                : 0;
              const 설명 = row['설명'] ? String(row['설명']).trim() : undefined;

              // 옵션 처리
              let options: ProductOption[] | undefined = undefined;
              const optionGroups: ProductOption[] = [];

              // 옵션1 처리
              const 옵션1명 = row['옵션1-명'] ? String(row['옵션1-명']).trim() : '';
              if (옵션1명) {
                const values: ProductOptionValue[] = [];
                for (let i = 1; i <= 5; i++) {
                  const 값 = row[`옵션1-값${i}`] ? String(row[`옵션1-값${i}`]).trim() : '';
                  const 재고 = row[`옵션1-재고${i}`];

                  if (값) {
                    values.push({
                      value: 값,
                      stock: 재고 !== undefined && 재고 !== null && String(재고).trim() !== '' ? Number(재고) : 0
                    });
                  }
                }

                if (values.length > 0) {
                  optionGroups.push({ name: 옵션1명, values });
                }
              }

              // 옵션2 처리
              const 옵션2명 = row['옵션2-명'] ? String(row['옵션2-명']).trim() : '';
              if (옵션2명) {
                const values: ProductOptionValue[] = [];
                for (let i = 1; i <= 5; i++) {
                  const 값 = row[`옵션2-값${i}`] ? String(row[`옵션2-값${i}`]).trim() : '';
                  const 재고 = row[`옵션2-재고${i}`];

                  if (값) {
                    values.push({
                      value: 값,
                      stock: 재고 !== undefined && 재고 !== null && String(재고).trim() !== '' ? Number(재고) : 0
                    });
                  }
                }

                if (values.length > 0) {
                  optionGroups.push({ name: 옵션2명, values });
                }
              }

              if (optionGroups.length > 0) {
                options = optionGroups;
              }

              // 물품 저장
              const product: Product = {
                id: generateId(),
                category: 카테고리,
                name: 물품명,
                stock: options ? 0 : 재고수량, // 옵션이 있으면 전체 재고는 0
                options,
                description: 설명,
                createdAt: now,
                updatedAt: now,
              };

              saveProduct(product);
              successCount++;
            } catch (rowError) {
              const errorMsg = rowError instanceof Error ? rowError.message : '알 수 없는 오류';
              const 물품명 = row['물품명*'] || row.물품명 || '(없음)';
              setError(`"${물품명}" 저장 실패\n\n오류: ${errorMsg}`);
              setImporting(false);
              return;
            }
          }

          alert(`등록 완료\n\n총 ${successCount}건의 물품이 성공적으로 등록되었습니다.`);
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
    // 템플릿 데이터 생성
    const headers = [
      '카테고리*', '물품명*', '재고수량', '설명',
      '옵션1-명', '옵션1-값1', '옵션1-재고1', '옵션1-값2', '옵션1-재고2', '옵션1-값3', '옵션1-재고3', '옵션1-값4', '옵션1-재고4', '옵션1-값5', '옵션1-재고5',
      '옵션2-명', '옵션2-값1', '옵션2-재고1', '옵션2-값2', '옵션2-재고2', '옵션2-값3', '옵션2-재고3', '옵션2-값4', '옵션2-재고4', '옵션2-값5', '옵션2-재고5'
    ];

    const sampleData = [
      // 옵션 없는 물품 예시
      ['사료', '로얄캐닌 어덜트', 50, '성견용 사료'],
      ['장난감', '노즈워크 장난감', 30, '후각 훈련용'],
      [],

      // 옵션 1개 - 샴푸 (용량 2가지)
      ['샴푸/린스', '저자극 샴푸', '', '민감한 피부용', '용량', '500ml', 15, '1L', 8],
      [],

      // 옵션 1개 - 쿨매트 (사이즈 3가지)
      ['매트', '쿨매트', '', '여름용 쿨매트', '사이즈', '소형', 20, '중형', 15, '대형', 10],
      [],

      // 옵션 1개 - 하네스 (사이즈 3가지, 재고 각각 다름)
      ['견옷', '하네스', '', '안내견용 하네스', '사이즈', '1호', 200, '2호', 34, '3호', 22],
      [],

      // 옵션 2개 - 티셔츠 (사이즈 3가지 + 색상 3가지)
      ['견옷', '티셔츠', '', '사계절용 티셔츠', '사이즈', 'S', 10, 'M', 15, 'L', 8, '', '', '', '', '', '', '색상', '빨강', 12, '파랑', 18, '노랑', 5],
      [],

      // 옵션 1개 - 목줄 (길이 4가지)
      ['견옷', '목줄', '', '고급 가죽 목줄', '길이', '1m', 25, '1.5m', 30, '2m', 20, '2.5m', 15],
    ];

    // 워크시트 생성
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '물품 데이터');

    // 열 너비 설정
    const colWidths = [
      { wch: 12 }, // 카테고리*
      { wch: 20 }, // 물품명*
      { wch: 10 }, // 재고수량*
      { wch: 20 }, // 설명
    ];

    // 옵션1 컬럼 너비
    colWidths.push({ wch: 12 }); // 옵션1-명
    for (let i = 0; i < 5; i++) {
      colWidths.push({ wch: 12 }); // 옵션1-값N
      colWidths.push({ wch: 10 }); // 옵션1-재고N
    }

    // 옵션2 컬럼 너비
    colWidths.push({ wch: 12 }); // 옵션2-명
    for (let i = 0; i < 5; i++) {
      colWidths.push({ wch: 12 }); // 옵션2-값N
      colWidths.push({ wch: 10 }); // 옵션2-재고N
    }

    worksheet['!cols'] = colWidths;

    // 데이터 유효성 검사 설정 (카테고리 드롭다운)
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let row = 1; row <= 100; row++) { // 최대 100행까지 유효성 검사 적용
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 }); // A열 (카테고리)
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 's', v: '' };
      }
      // 드롭다운 유효성 검사 (Excel에서 적용됨)
      worksheet[cellAddress].dataValidation = {
        type: 'list',
        formula1: '"사료,장난감,샴푸/린스,매트,견옷"',
        showErrorMessage: true,
        errorTitle: '입력 오류',
        error: '목록에서 선택해주세요: 사료, 장난감, 샴푸/린스, 매트, 견옷',
      };
    }

    // 재고수량 열 숫자 유효성 검사
    for (let row = 1; row <= 100; row++) { // 최대 100행까지
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 }); // C열 (재고수량)
      if (!worksheet[cellAddress]) {
        worksheet[cellAddress] = { t: 'n', v: 0 };
      }
      // 숫자 유효성 검사
      worksheet[cellAddress].dataValidation = {
        type: 'whole',
        operator: 'greaterThanOrEqual',
        formula1: '0',
        showErrorMessage: true,
        errorTitle: '입력 오류',
        error: '0 이상의 정수를 입력해주세요.',
      };
    }

    // 참조용 시트 생성
    const validationSheet = XLSX.utils.aoa_to_sheet([
      ['■ 카테고리 목록'],
      ['사료 / 장난감 / 샴푸/린스 / 매트 / 견옷'],
      [''],
      ['■ 컬럼 구성'],
      ['A: 카테고리* (필수)'],
      ['B: 물품명* (필수)'],
      ['C: 재고수량* (필수 - 옵션 없으면 재고수량, 옵션 있으면 0)'],
      ['D: 설명 (선택)'],
      ['E~S: 옵션1 (옵션1-명, 옵션1-값1, 옵션1-재고1, 옵션1-값2, 옵션1-재고2, ...)'],
      ['T~AH: 옵션2 (옵션2-명, 옵션2-값1, 옵션2-재고1, 옵션2-값2, 옵션2-재고2, ...)'],
      [''],
      ['■ 입력 방법'],
      [''],
      ['【 옵션 없는 물품 】'],
      ['- 카테고리, 물품명, 재고수량만 입력'],
      ['- 옵션 컬럼은 비워두기'],
      ['예) 사료 | 로얄캐닌 어덜트 | 50 | 성견용 사료'],
      [''],
      ['【 옵션 1개인 물품 】'],
      ['- 재고수량*은 0으로 입력'],
      ['- 옵션1-명에 옵션 이름 입력 (예: 사이즈)'],
      ['- 옵션1-값1, 값2, 값3... 에 옵션값 가로로 입력'],
      ['- 옵션1-재고1, 재고2, 재고3... 에 각 옵션값의 재고 입력'],
      [''],
      ['예) 하네스 - 사이즈 옵션 (1호 200개 / 2호 34개 / 3호 22개)'],
      ['견옷 | 하네스 | 0 | 안내견용 | 사이즈 | 1호 | 200 | 2호 | 34 | 3호 | 22'],
      ['→ 한 행에 모든 옵션값과 재고를 가로로 입력!'],
      [''],
      ['예) 쿨매트 - 사이즈 옵션 (소형 20개 / 중형 15개 / 대형 10개)'],
      ['매트 | 쿨매트 | 0 | 여름용 | 사이즈 | 소형 | 20 | 중형 | 15 | 대형 | 10'],
      [''],
      ['【 옵션 2개인 물품 】'],
      ['- 옵션1에 첫 번째 옵션 입력'],
      ['- 옵션2에 두 번째 옵션 입력'],
      [''],
      ['예) 티셔츠 - 사이즈(S/M/L) + 색상(빨강/파랑/노랑)'],
      ['견옷 | 티셔츠 | 0 | 사계절용 | 사이즈 | S | 10 | M | 15 | L | 8 | (빈칸들) | 색상 | 빨강 | 12 | 파랑 | 18 | 노랑 | 5'],
      ['→ 사용자는 사이즈와 색상을 각각 선택'],
      [''],
      ['■ 핵심 포인트'],
      ['✓ 한 물품 = 한 행! (같은 물품을 여러 행에 반복하지 않음)'],
      ['✓ 옵션값은 가로로 나열! (값1-재고1, 값2-재고2, 값3-재고3...)'],
      ['✓ 옵션이 있으면 재고수량*은 반드시 0!'],
      ['✓ 각 옵션은 최대 5개 값까지 입력 가능'],
      ['✓ 옵션이 2개까지 가능 (옵션1, 옵션2)'],
    ]);
    XLSX.utils.book_append_sheet(workbook, validationSheet, '입력 가이드');

    // 파일 다운로드
    XLSX.writeFile(workbook, '물품_일괄등록_템플릿.xlsx', {
      bookType: 'xlsx',
      type: 'binary',
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">물품 엑셀 일괄 등록</h3>

      {/* 템플릿 다운로드 안내 */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
        <h4 className="font-semibold mb-2 text-green-800">템플릿 다운로드</h4>
        <p className="text-sm mb-3">
          아래 버튼을 클릭하여 <strong>엑셀 템플릿 파일</strong>을 다운로드하세요.
          템플릿에는 예시 데이터 5개가 포함되어 있습니다.
        </p>
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-semibold"
        >
          📥 템플릿 다운로드
        </button>
      </div>

      {/* 사용 안내 */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold mb-2">작성 안내</h4>
        <div className="bg-green-50 p-3 rounded border border-green-300 mb-3">
          <p className="text-sm font-bold text-green-900 mb-2">✨ 새로운 가로 입력 방식!</p>
          <p className="text-xs text-gray-700 mb-1">• <strong>한 물품 = 한 행</strong>으로 관리</p>
          <p className="text-xs text-gray-700 mb-1">• 옵션값과 재고를 가로로 나란히 입력</p>
          <p className="text-xs text-gray-700">• 더 이상 같은 물품을 여러 행에 반복하지 않아도 됩니다!</p>
        </div>

        <div className="bg-white p-3 rounded border border-blue-300 mb-3">
          <p className="text-xs font-bold text-blue-900 mb-2">✓ 옵션 없는 물품</p>
          <p className="text-xs text-gray-700">• 카테고리, 물품명, 재고수량, 설명 입력</p>
          <p className="text-xs text-gray-700">• 옵션 컬럼은 비워두기</p>
        </div>

        <div className="bg-white p-3 rounded border border-blue-300 mb-3">
          <p className="text-xs font-bold text-blue-900 mb-2">✓ 옵션 있는 물품</p>
          <p className="text-xs text-gray-700 mb-1">• <strong className="text-red-600">재고수량*은 반드시 0으로!</strong></p>
          <p className="text-xs text-gray-700 mb-1">• 옵션1-명에 옵션 이름 입력 (예: 사이즈)</p>
          <p className="text-xs text-gray-700">• 옵션1-값1, 값2, 값3... 가로로 입력하고 바로 아래에 재고 입력</p>
        </div>

        <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
          <p className="text-xs font-bold mb-2">📌 예시: 하네스 (사이즈: 1호 200개 / 2호 34개 / 3호 22개)</p>
          <table className="text-xs w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-1 py-0.5 text-xs">카테고리*</th>
                <th className="border border-gray-300 px-1 py-0.5 text-xs">물품명*</th>
                <th className="border border-gray-300 px-1 py-0.5 text-xs">재고*</th>
                <th className="border border-gray-300 px-1 py-0.5 text-xs">설명</th>
                <th className="border border-gray-300 px-1 py-0.5 text-xs">옵션1-명</th>
                <th className="border border-gray-300 px-1 py-0.5 text-xs">값1</th>
                <th className="border border-gray-300 px-1 py-0.5 text-xs">재고1</th>
                <th className="border border-gray-300 px-1 py-0.5 text-xs">값2</th>
                <th className="border border-gray-300 px-1 py-0.5 text-xs">재고2</th>
                <th className="border border-gray-300 px-1 py-0.5 text-xs">값3</th>
                <th className="border border-gray-300 px-1 py-0.5 text-xs">재고3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-1 py-0.5">견옷</td>
                <td className="border border-gray-300 px-1 py-0.5">하네스</td>
                <td className="border border-gray-300 px-1 py-0.5 text-red-600 font-bold">0</td>
                <td className="border border-gray-300 px-1 py-0.5">안내견용</td>
                <td className="border border-gray-300 px-1 py-0.5 bg-blue-50 font-bold">사이즈</td>
                <td className="border border-gray-300 px-1 py-0.5 bg-green-50">1호</td>
                <td className="border border-gray-300 px-1 py-0.5 bg-green-50">200</td>
                <td className="border border-gray-300 px-1 py-0.5 bg-green-50">2호</td>
                <td className="border border-gray-300 px-1 py-0.5 bg-green-50">34</td>
                <td className="border border-gray-300 px-1 py-0.5 bg-green-50">3호</td>
                <td className="border border-gray-300 px-1 py-0.5 bg-green-50">22</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-600 mt-2">→ 한 행에 모든 옵션값과 재고를 가로로 입력!</p>
        </div>
      </div>

      {/* 파일 선택 */}
      <div className="mb-6">
        <label htmlFor="productExcelFile" className="block text-sm font-medium mb-2">
          엑셀 파일 선택
        </label>
        <input
          type="file"
          id="productExcelFile"
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
                  <th className="border border-gray-300 px-2 py-1">카테고리</th>
                  <th className="border border-gray-300 px-2 py-1">물품명</th>
                  <th className="border border-gray-300 px-2 py-1">재고수량</th>
                  <th className="border border-gray-300 px-2 py-1">옵션명</th>
                  <th className="border border-gray-300 px-2 py-1">옵션값</th>
                  <th className="border border-gray-300 px-2 py-1">옵션재고</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 py-1">{row['카테고리*'] || row.카테고리}</td>
                    <td className="border border-gray-300 px-2 py-1">{row['물품명*'] || row.물품명}</td>
                    <td className="border border-gray-300 px-2 py-1">{row['재고수량*'] || row.재고수량}</td>
                    <td className="border border-gray-300 px-2 py-1">{row['옵션명'] || ''}</td>
                    <td className="border border-gray-300 px-2 py-1">{row['옵션값'] || ''}</td>
                    <td className="border border-gray-300 px-2 py-1">{row['옵션재고'] || ''}</td>
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
          {importing ? '등록 중...' : '📤 일괄 등록하기'}
        </button>
      </div>
    </div>
  );
};
