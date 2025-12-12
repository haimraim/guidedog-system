/**
 * Aligo SMS 발송 서비스
 * https://smartsms.aligo.in/admin/api/spec.html
 *
 * 무료 300건 제공 (회원가입 시)
 * SMS 건당 8.4원 / LMS 건당 25원
 */

import type { MessageRecipient } from '../types/types';

// Aligo API 설정 (환경변수에서 로드)
const ALIGO_API_KEY = import.meta.env.VITE_ALIGO_API_KEY || '';
const ALIGO_USER_ID = import.meta.env.VITE_ALIGO_USER_ID || '';
const ALIGO_SENDER = import.meta.env.VITE_ALIGO_SENDER || '';

// Aligo API URL
const ALIGO_API_URL = 'https://apis.aligo.in/send/';

/**
 * Aligo API 응답
 */
interface AligoResponse {
  result_code: string;      // 결과코드 (1: 성공)
  message: string;          // 결과메시지
  msg_id?: string;          // 메시지 고유 ID
  success_cnt?: number;     // 성공 건수
  error_cnt?: number;       // 실패 건수
  msg_type?: string;        // 메시지 타입 (SMS/LMS)
}

/**
 * SMS 발송 파라미터
 */
interface SMSParams {
  receivers: MessageRecipient[];  // 수신자 목록
  message: string;                // 메시지 내용
  subject?: string;               // 제목 (LMS인 경우)
  msgType?: 'SMS' | 'LMS';        // 메시지 타입
  testMode?: boolean;             // 테스트 모드 (Y: 실제 발송 안함)
}

/**
 * 연락처 형식 정리 (하이픈 제거)
 */
const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/-/g, '');
};

/**
 * SMS/LMS 발송 (Aligo)
 */
export const sendSMS = async (params: SMSParams): Promise<AligoResponse> => {
  try {
    // API 키 확인
    if (!ALIGO_API_KEY || !ALIGO_USER_ID || !ALIGO_SENDER) {
      throw new Error('Aligo API 설정이 필요합니다. .env 파일을 확인해주세요.\n필요한 키: VITE_ALIGO_API_KEY, VITE_ALIGO_USER_ID, VITE_ALIGO_SENDER');
    }

    // 메시지 길이에 따른 타입 자동 결정
    const msgType = params.msgType || (params.message.length > 90 ? 'LMS' : 'SMS');

    // 수신자 번호 목록 (쉼표로 구분)
    const receivers = params.receivers
      .map(r => cleanPhoneNumber(r.phone))
      .join(',');

    // FormData 생성 (Aligo는 form-data 방식)
    const formData = new FormData();
    formData.append('key', ALIGO_API_KEY);
    formData.append('user_id', ALIGO_USER_ID);
    formData.append('sender', cleanPhoneNumber(ALIGO_SENDER));
    formData.append('receiver', receivers);
    formData.append('msg', params.message);
    formData.append('msg_type', msgType);

    // LMS인 경우 제목 추가
    if (msgType === 'LMS' && params.subject) {
      formData.append('title', params.subject);
    }

    // 테스트 모드 (실제 발송하지 않고 테스트만)
    if (params.testMode) {
      formData.append('testmode_yn', 'Y');
    }

    // API 호출
    const response = await fetch(ALIGO_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result: AligoResponse = await response.json();

    // 결과 확인 (result_code가 1이면 성공)
    if (result.result_code !== '1') {
      throw new Error(`SMS 발송 실패: ${result.message} (코드: ${result.result_code})`);
    }

    console.log('SMS 발송 성공:', result);
    return result;
  } catch (error) {
    console.error('SMS 발송 실패:', error);
    throw error;
  }
};

/**
 * 대량 발송 (개인별 다른 메시지)
 * 각 수신자에게 변수 치환된 메시지를 개별 발송
 */
export const sendBulkSMS = async (
  receivers: MessageRecipient[],
  messageTemplate: string,
  subject?: string,
  testMode?: boolean
): Promise<{ success: number; fail: number; results: AligoResponse[] }> => {
  const results: AligoResponse[] = [];
  let success = 0;
  let fail = 0;

  for (const receiver of receivers) {
    try {
      // 변수 치환
      const personalMessage = replaceMessageVariables(messageTemplate, {
        name: receiver.userName,
        dogName: receiver.dogName || '안내견',
        date: new Date().toLocaleDateString('ko-KR'),
      });

      const result = await sendSMS({
        receivers: [receiver],
        message: personalMessage,
        subject,
        testMode,
      });

      results.push(result);
      success++;
    } catch (error) {
      fail++;
      console.error(`${receiver.userName} 발송 실패:`, error);
    }
  }

  return { success, fail, results };
};

/**
 * 메시지 내용에 변수 치환
 * 예: "{name}님, {dogName} 보딩 알림입니다." → "홍길동님, 해피 보딩 알림입니다."
 */
export const replaceMessageVariables = (
  template: string,
  variables: { [key: string]: string }
): string => {
  let result = template;

  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, variables[key]);
  });

  return result;
};

/**
 * 연락처 형식 검증 (010-1234-5678 또는 01012345678)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/-/g, '');
  const regex = /^01[016789]\d{7,8}$/;
  return regex.test(cleaned);
};

/**
 * 남은 발송 건수 조회
 */
export const getRemainingCount = async (): Promise<number> => {
  try {
    if (!ALIGO_API_KEY || !ALIGO_USER_ID) {
      return 0;
    }

    const formData = new FormData();
    formData.append('key', ALIGO_API_KEY);
    formData.append('user_id', ALIGO_USER_ID);

    const response = await fetch('https://apis.aligo.in/remain/', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.result_code === '1') {
      return parseInt(result.SMS_CNT || '0', 10);
    }

    return 0;
  } catch (error) {
    console.error('잔여 건수 조회 실패:', error);
    return 0;
  }
};
