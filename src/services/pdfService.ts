/**
 * PDF 텍스트 추출 서비스
 */

import * as pdfjsLib from 'pdfjs-dist';

// PDF.js 워커 설정 - unpkg에서 mjs 버전 사용
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

/**
 * PDF 파일에서 텍스트 추출
 */
export const extractTextFromPDF = async (
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];
  const totalPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');

    if (pageText.trim()) {
      textParts.push(`[페이지 ${pageNum}]\n${pageText}`);
    }

    onProgress?.(pageNum, totalPages);
  }

  return textParts.join('\n\n');
};

/**
 * 텍스트 파일에서 텍스트 추출
 */
export const extractTextFromTXT = async (file: File): Promise<string> => {
  return await file.text();
};

/**
 * 파일에서 텍스트 추출 (타입에 따라 분기)
 */
export const extractTextFromFile = async (
  file: File,
  onProgress?: (page: number, total: number) => void
): Promise<string> => {
  if (file.type === 'application/pdf') {
    return extractTextFromPDF(file, onProgress);
  } else if (file.type === 'text/plain') {
    return extractTextFromTXT(file);
  } else {
    throw new Error('지원하지 않는 파일 형식입니다. PDF 또는 TXT 파일만 가능합니다.');
  }
};
