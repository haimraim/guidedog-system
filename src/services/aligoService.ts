/**
 * 알리고 메시지 발송 서비스
 * 카카오 알림톡 & SMS 발송 API 연동
 */

import type { MessageRecipient } from '../types/types';

// 알리고 API 설정
const ALIGO_API_URL = 'https://apis.aligo.in/send/';
const ALIGO_KAKAO_API_URL = 'https://kakaoapi.aligo.in/akv10/alimtalk/send/';

// 환경 변수에서 API 키 가져오기 (추후 설정)
// .env 파일에 VITE_ALIGO_API_KEY, VITE_ALIGO_USER_ID, VITE_ALIGO_SENDER 추가 필요
const ALIGO_API_KEY = import.meta.env.VITE_ALIGO_API_KEY || '';
const ALIGO_USER_ID = import.meta.env.VITE_ALIGO_USER_ID || '';
const ALIGO_SENDER = import.meta.env.VITE_ALIGO_SENDER || '';

/**
 * SMS 발송 응답
 */
interface AligoSMSResponse {
  result_code: string; // '1' = 성공
  message: string;
  msg_id?: string;
  success_cnt?: number;
  error_cnt?: number;
  msg_type?: string;
}

/**
 * 카카오 알림톡 발송 응답
 */
interface AligoKakaoResponse {
  code: number; // 0 = 성공
  message: string;
  info?: {
    type: string;
    mid: string;
    current: string;
    unit: string;
    total: string;
    scnt: number;
    fcnt: number;
  };
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
interface KakaoParams {
  receivers: MessageRecipient[]; // 수신자 목록
  templateCode: string; // 알림톡 템플릿 코드
  message: string; // 메시지 내용
  failoverMessage?: string; // 실패 시 SMS 대체 메시지
}

/**
 * SMS 발송 (단문/장문)
 */
export const sendSMS = async (params: SMSParams): Promise<AligoSMSResponse> => {
  try {
    // API 키 확인
    if (!ALIGO_API_KEY || !ALIGO_USER_ID || !ALIGO_SENDER) {
      throw new Error('알리고 API 설정이 필요합니다. .env 파일을 확인해주세요.');
    }

    // 수신자 번호 목록 생성 (하이픈 제거)
    const receivers = params.receivers
      .map(r => r.phone.replace(/-/g, ''))
      .join(',');

    // 메시지 타입 결정 (90바이트 초과 시 LMS)
    const byteLength = new Blob([params.message]).size;
    const msgType = params.msgType || (byteLength > 90 ? 'LMS' : 'SMS');

    // FormData 생성
    const formData = new FormData();
    formData.append('key', ALIGO_API_KEY);
    formData.append('user_id', ALIGO_USER_ID);
    formData.append('sender', ALIGO_SENDER);
    formData.append('receiver', receivers);
    formData.append('msg', params.message);
    formData.append('msg_type', msgType);

    if (msgType === 'LMS' && params.subject) {
      formData.append('title', params.subject);
    }

    // API 호출
    const response = await fetch(ALIGO_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result: AligoSMSResponse = await response.json();

    if (result.result_code !== '1') {
      throw new Error(`SMS 발송 실패: ${result.message}`);
    }

    console.log('✅ SMS 발송 성공:', result);
    return result;
  } catch (error) {
    console.error('❌ SMS 발송 실패:', error);
    throw error;
  }
};

/**
 * 카카오 알림톡 발송
 */
export const sendKakaoAlimtalk = async (params: KakaoParams): Promise<AligoKakaoResponse> => {
  try {
    // API 키 확인
    if (!ALIGO_API_KEY || !ALIGO_USER_ID || !ALIGO_SENDER) {
      throw new Error('알리고 API 설정이 필요합니다. .env 파일을 확인해주세요.');
    }

    // 수신자 번호 목록 생성 (하이픈 제거)
    const receivers = params.receivers
      .map(r => r.phone.replace(/-/g, ''))
      .join(',');

    // FormData 생성
    const formData = new FormData();
    formData.append('apikey', ALIGO_API_KEY);
    formData.append('userid', ALIGO_USER_ID);
    formData.append('senderkey', ALIGO_SENDER); // 카카오 발신 프로필 키
    formData.append('tpl_code', params.templateCode); // 템플릿 코드
    formData.append('sender', ALIGO_SENDER);
    formData.append('receiver_1', receivers);
    formData.append('subject_1', '알림');
    formData.append('message_1', params.message);

    // 실패 시 SMS 대체 발송 설정
    if (params.failoverMessage) {
      formData.append('failover', 'Y');
      formData.append('fsubject_1', '알림');
      formData.append('fmessage_1', params.failoverMessage);
    }

    // API 호출
    const response = await fetch(ALIGO_KAKAO_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result: AligoKakaoResponse = await response.json();

    if (result.code !== 0) {
      throw new Error(`카카오 알림톡 발송 실패: ${result.message}`);
    }

    console.log('✅ 카카오 알림톡 발송 성공:', result);
    return result;
  } catch (error) {
    console.error('❌ 카카오 알림톡 발송 실패:', error);
    throw error;
  }
};

/**
 * 하이브리드 발송 (카카오 알림톡 → SMS 자동 대체)
 */
export const sendHybridMessage = async (
  receivers: MessageRecipient[],
  templateCode: string,
  message: string,
  smsMessage?: string
): Promise<{ kakaoSuccess: number; smsSuccess: number; failed: number }> => {
  try {
    // 1단계: 카카오 알림톡 발송 시도
    try {
      const kakaoResult = await sendKakaoAlimtalk({
        receivers,
        templateCode,
        message,
        failoverMessage: smsMessage || message,
      });

      return {
        kakaoSuccess: kakaoResult.info?.scnt || 0,
        smsSuccess: 0,
        failed: kakaoResult.info?.fcnt || 0,
      };
    } catch (kakaoError) {
      console.warn('카카오 알림톡 실패, SMS로 대체 발송:', kakaoError);

      // 2단계: 카카오 실패 시 SMS로 대체 발송
      const smsResult = await sendSMS({
        receivers,
        message: smsMessage || message,
      });

      return {
        kakaoSuccess: 0,
        smsSuccess: smsResult.success_cnt || 0,
        failed: smsResult.error_cnt || 0,
      };
    }
  } catch (error) {
    console.error('❌ 하이브리드 메시지 발송 실패:', error);
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
