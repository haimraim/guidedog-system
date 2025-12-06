/**
 * 데이터 내보내기/백업/복원 유틸리티
 */

// @ts-nocheck
import * as XLSX from 'xlsx';
import type { CombinedData } from '../types/types';

/**
 * Excel 파일로 내보내기 (템플릿 형식)
 */
export const exportToExcel = (data: CombinedData[]) => {
  // 엑셀용 데이터 변환 (템플릿과 동일한 형식)
  const excelData = data.map((item) => ({
    '분류': item.guideDog.category,
    '견명*': item.guideDog.name,
    '견 생년월일*': item.guideDog.birthDate,
    '견 성별': item.guideDog.gender,
    '모견': item.guideDog.motherName || '',
    '부견': item.guideDog.fatherName || '',
    '부모견 홈케어자 이름': item.guideDog.parentCaregiverName || '',
    '부모견 홈케어자 연락처': item.guideDog.parentCaregiverPhone || '',
    '부모견 홈케어자 주소': item.guideDog.parentCaregiverAddress || '',
    '퍼피티칭 시작일': item.guideDog.puppyTeachingStartDate || '',
    '퍼피티칭 종료일': item.guideDog.puppyTeachingEndDate || '',
    '퍼피티처 이름': item.guideDog.puppyTeacherName || '',
    '퍼피티처 연락처': item.guideDog.puppyTeacherPhone || '',
    '퍼피티처 주소': item.guideDog.puppyTeacherAddress || '',
    '훈련 시작일': item.guideDog.trainingStartDate || '',
    '훈련 종료일': item.guideDog.trainingEndDate || '',
    '훈련사 이름': item.guideDog.trainerName || '',
    '은퇴견 홈케어 이름': item.guideDog.retiredHomeCareName || '',
    '은퇴견 홈케어 연락처': item.guideDog.retiredHomeCarePhone || '',
    '은퇴견 홈케어 주소': item.guideDog.retiredHomeCareAddress || '',
    '폐사일': item.guideDog.deathDate || '',
    '파트너 성명*': item.partner.name,
    '파트너 성별*': item.partner.gender,
    '연락처*': item.partner.phone,
    '파트너 생년월일*': item.partner.birthDate,
    '주소': item.partner.address || '',
    '직업 카테고리': item.partner.jobCategory,
    '직업 상세': item.partner.jobDetail || '',
    '활동 시작일': item.activity.startDate,
    '활동 종료일': item.activity.endDate || '',
  }));

  // 워크시트 생성
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // 컬럼 너비 설정 (템플릿과 동일)
  worksheet['!cols'] = [
    { wch: 12 }, // 분류
    { wch: 15 }, // 견명*
    { wch: 15 }, // 견 생년월일*
    { wch: 12 }, // 견 성별
    { wch: 15 }, // 모견
    { wch: 15 }, // 부견
    { wch: 20 }, // 부모견 홈케어자 이름
    { wch: 20 }, // 부모견 홈케어자 연락처
    { wch: 30 }, // 부모견 홈케어자 주소
    { wch: 16 }, // 퍼피티칭 시작일
    { wch: 16 }, // 퍼피티칭 종료일
    { wch: 18 }, // 퍼피티처 이름
    { wch: 16 }, // 퍼피티처 연락처
    { wch: 30 }, // 퍼피티처 주소
    { wch: 14 }, // 훈련 시작일
    { wch: 14 }, // 훈련 종료일
    { wch: 15 }, // 훈련사 이름
    { wch: 20 }, // 은퇴견 홈케어 이름
    { wch: 18 }, // 은퇴견 홈케어 연락처
    { wch: 30 }, // 은퇴견 홈케어 주소
    { wch: 14 }, // 폐사일
    { wch: 15 }, // 파트너 성명*
    { wch: 14 }, // 파트너 성별*
    { wch: 15 }, // 연락처*
    { wch: 18 }, // 파트너 생년월일*
    { wch: 30 }, // 주소
    { wch: 14 }, // 직업 카테고리
    { wch: 20 }, // 직업 상세
    { wch: 14 }, // 활동 시작일
    { wch: 14 }, // 활동 종료일
  ];

  // 데이터 유효성 검사 추가
  // 카테고리 목록
  const categoryList = '신생자견,퍼피티칭,훈련견,반려견,안내견,안내견/폐사,안내견/일반안내견/기타,은퇴견,시범견,견사/기타,부견,모견';
  // 직업 카테고리 목록
  const jobList = '학생,회사원,교직,자영업,주부,종교인,공무원,기타';

  // 데이터 유효성 검사 설정
  if (!worksheet['!dataValidation']) {
    worksheet['!dataValidation'] = [];
  }

  // 데이터가 있는 행 수 계산 (헤더 포함)
  const rowCount = excelData.length + 1;

  // 분류(A열) 유효성 검사 - 2행부터 데이터 마지막 행까지
  for (let i = 2; i <= rowCount; i++) {
    worksheet['!dataValidation'].push({
      sqref: `A${i}`,
      type: 'list',
      formula1: `"${categoryList}"`,
      showDropDown: true,
      allowBlank: false,
      error: '목록에 있는 값만 선택할 수 있습니다.',
      errorTitle: '유효하지 않은 값',
    });
  }

  // 직업 카테고리(AA열, 27번째 열) 유효성 검사
  for (let i = 2; i <= rowCount; i++) {
    worksheet['!dataValidation'].push({
      sqref: `AA${i}`,
      type: 'list',
      formula1: `"${jobList}"`,
      showDropDown: true,
      allowBlank: false,
      error: '목록에 있는 값만 선택할 수 있습니다.',
      errorTitle: '유효하지 않은 값',
    });
  }

  // 워크북 생성
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '안내견학교 데이터');

  // 파일 다운로드
  const fileName = `안내견학교_데이터_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * JSON 파일로 백업
 */
export const exportBackup = () => {
  const data = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    dogs: JSON.parse(localStorage.getItem('guidedog_dogs') || '[]'),
    partners: JSON.parse(localStorage.getItem('guidedog_partners') || '[]'),
    activities: JSON.parse(localStorage.getItem('guidedog_activities') || '[]'),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `안내견학교_백업_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * JSON 파일에서 복원
 */
export const importBackup = (file: File): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // 데이터 검증
        if (!data.dogs || !data.partners || !data.activities) {
          throw new Error('유효하지 않은 백업 파일입니다.');
        }

        // 사용자 확인
        const confirmation = window.confirm(
          '기존 데이터를 모두 삭제하고 백업 파일로 복원하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
        );

        if (!confirmation) {
          resolve(false);
          return;
        }

        // 로컬스토리지에 복원
        localStorage.setItem('guidedog_dogs', JSON.stringify(data.dogs));
        localStorage.setItem('guidedog_partners', JSON.stringify(data.partners));
        localStorage.setItem('guidedog_activities', JSON.stringify(data.activities));

        resolve(true);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file);
  });
};

/**
 * 프린트용 HTML 생성
 */
export const printData = (data: CombinedData[]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>안내견학교 데이터</title>
      <style>
        body {
          font-family: 'Malgun Gothic', sans-serif;
          padding: 20px;
        }
        h1 {
          text-align: center;
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .print-date {
          text-align: right;
          margin-bottom: 10px;
          font-size: 14px;
        }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="print-date">출력일: ${new Date().toLocaleDateString('ko-KR')}</div>
      <h1>안내견학교 데이터 목록</h1>
      <table>
        <thead>
          <tr>
            <th>번호</th>
            <th>견명</th>
            <th>견 성별</th>
            <th>견 생년월일</th>
            <th>파트너 성명</th>
            <th>파트너 성별</th>
            <th>나이</th>
            <th>연락처</th>
            <th>주소</th>
            <th>직업</th>
            <th>활동 시작일</th>
          </tr>
        </thead>
        <tbody>
          ${data.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.guideDog.name}</td>
              <td>${item.guideDog.gender}</td>
              <td>${item.guideDog.birthDate}</td>
              <td>${item.partner.name}</td>
              <td>${item.partner.gender}</td>
              <td>${item.partner.age}세</td>
              <td>${item.partner.phone}</td>
              <td>${item.partner.address}</td>
              <td>${item.partner.jobCategory}</td>
              <td>${item.activity.startDate}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="text-align: center; margin-top: 30px;">총 ${data.length}건</p>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  // 프린트 다이얼로그 자동 호출
  setTimeout(() => {
    printWindow.print();
  }, 250);
};
