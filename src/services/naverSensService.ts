/**
 * 네이버 클라우드 SENS 메시지 발송 서비스
 * SMS/LMS/카카오 알림톡 발송 API 연동
 */

import type { MessageRecipient } from '../types/types';

// SENS API 설정
const SENS_SERVICE_ID = import.meta.env.VITE_NAVER_SENS_SERVICE_ID || '';
const SENS_ACCESS_KEY = import.meta.env.VITE_NAVER_SENS_ACCESS_KEY || '';
const SENS_SECRET_KEY = import.meta.env.VITE_NAVER_SENS_SECRET_KEY || '';
const SENS_CALLING_NUMBER = import.meta.env.VITE_NAVER_SENS_CALLING_NUMBER || '';

// SENS API URL
const SMS_API_URL = `https://sens.apigw.ntruss.com/sms/v2/services/${SENS_SERVICE_ID}/messages`;
const ALIMTALK_API_URL = `https://sens.apigw.ntruss.com/alimtalk/v2/services/${SENS_SERVICE_ID}/messages`;

/**
 * HMAC SHA256 시그니처 생성
 */
const makeSignature = (method: string, url: string, timestamp: string): string => {
  const space = ' ';
  const newLine = '\n';
  const hmac = `${method}${space}${url}${newLine}${timestamp}${newLine}${SENS_ACCESS_KEY}`;

  // CryptoJS 사용 (브라우저 환경)
  // 주의: 보안상 서버사이드에서 호출하는 것을 권장
  const CryptoJS = window.crypto ? null : require('crypto-js');

  if (CryptoJS) {
    return CryptoJS.HmacSHA256(hmac, SENS_SECRET_KEY).toString(CryptoJS.enc.Base64);
  } else {
    // 브라우저 환경에서는 서버를 통해 호출해야 함
    throw new Error('SENS API는 보안상 서버사이드에서 호출해야 합니다.');
  }
};

/**
 * SMS/LMS 발송 응답
 */
interface SENSResponse {
  statusCode: string; // '202' = 성공
  statusName: string;
  requestId: string;
  requestTime: string;
}

/**
 * SMS 발송 파라미터
 */
interface SMSParams {
  receivers: MessageRecipient[]; // 수신자 목록
  message: string; // 메시지 내용
  subject?: string; // 제목 (LMS인 경우)
  msgType?: 'SMS' | 'LMS'; // 메시지 타입 (기본: SMS)
}

/**
 * 카카오 알림톡 발송 파라미터
 */
interface AlimtalkParams {
  receivers: MessageRecipient[]; // 수신자 목록
  templateCode: string; // 알림톡 템플릿 코드
  content: string; // 메시지 내용
  buttons?: Array<{
    type: 'WL' | 'AL' | 'DS' | 'BK' | 'MD' | 'BC' | 'BT' | 'AC';
    name: string;
    linkMobile?: string;
    linkPc?: string;
  }>;
}

/**
 * SMS/LMS 발송 (네이버 클라우드 SENS)
 */
export const sendSMS = async (params: SMSParams): Promise<SENSResponse> => {
  try {
    // API 키 확인
    if (!SENS_SERVICE_ID || !SENS_ACCESS_KEY || !SENS_SECRET_KEY || !SENS_CALLING_NUMBER) {
      throw new Error('네이버 클라우드 SENS API 설정이 필요합니다. .env 파일을 확인해주세요.');
    }

    // 메시지 타입 결정
    const type = params.msgType || (params.message.length > 90 ? 'LMS' : 'SMS');

    // 수신자 목록 생성
    const messages = params.receivers.map(receiver => ({
      to: receiver.phone.replace(/-/g, ''),
    }));

    // 요청 본문
    const requestBody = {
      type,
      contentType: 'COMM',
      countryCode: '82',
      from: SENS_CALLING_NUMBER.replace(/-/g, ''),
      subject: type === 'LMS' ? params.subject : undefined,
      content: params.message,
      messages,
    };

    // 타임스탬프 생성
    const timestamp = Date.now().toString();
    const url = `/sms/v2/services/${SENS_SERVICE_ID}/messages`;

    // 시그니처 생성
    const signature = makeSignature('POST', url, timestamp);

    // API 호출
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': SENS_ACCESS_KEY,
        'x-ncp-apigw-signature-v2': signature,
      },
      body: JSON.stringify(requestBody),
    });

    const result: SENSResponse = await response.json();

    if (result.statusCode !== '202') {
      throw new Error(`SMS 발송 실패: ${result.statusName}`);
    }

    console.log('✅ SMS 발송 성공:', result);
    return result;
  } catch (error) {
    console.error('❌ SMS 발송 실패:', error);
    throw error;
  }
};

/**
 * 카카오 알림톡 발송 (네이버 클라우드 SENS)
 */
export const sendAlimtalk = async (params: AlimtalkParams): Promise<SENSResponse> => {
  try {
    // API 키 확인
    if (!SENS_SERVICE_ID || !SENS_ACCESS_KEY || !SENS_SECRET_KEY) {
      throw new Error('네이버 클라우드 SENS API 설정이 필요합니다. .env 파일을 확인해주세요.');
    }

    // 수신자 목록 생성
    const messages = params.receivers.map(receiver => ({
      to: receiver.phone.replace(/-/g, ''),
      content: params.content,
    }));

    // 요청 본문
    const requestBody = {
      plusFriendId: '@안내견학교', // 카카오톡 채널 아이디
      templateCode: params.templateCode,
      messages,
      buttons: params.buttons,
    };

    // 타임스탬프 생성
    const timestamp = Date.now().toString();
    const url = `/alimtalk/v2/services/${SENS_SERVICE_ID}/messages`;

    // 시그니처 생성
    const signature = makeSignature('POST', url, timestamp);

    // API 호출
    const response = await fetch(ALIMTALK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': SENS_ACCESS_KEY,
        'x-ncp-apigw-signature-v2': signature,
      },
      body: JSON.stringify(requestBody),
    });

    const result: SENSResponse = await response.json();

    if (result.statusCode !== '202') {
      throw new Error(`알림톡 발송 실패: ${result.statusName}`);
    }

    console.log('✅ 알림톡 발송 성공:', result);
    return result;
  } catch (error) {
    console.error('❌ 알림톡 발송 실패:', error);
    throw error;
  }
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
