/**
 * 푸시 알림 서비스
 * Firebase Cloud Messaging을 사용한 웹 푸시 알림
 */

import { doc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, initMessaging, getToken, onMessage } from '../lib/firebase';

// VAPID 키 (Firebase Console > 프로젝트 설정 > 클라우드 메시징에서 발급)
const VAPID_KEY = 'BAjkdfIr-hzRO7PhP6igsle4f3Jmbejuwdqv2at5ET6sXbgEwjPkXYDo6aTbxvyGzpSm3Vm_r3iPCD5dR4J4eRI';

export interface PushSubscription {
  id: string; // 사용자 ID
  token: string; // FCM 토큰
  role: string; // 사용자 역할 (admin, partner, puppyTeacher 등)
  category?: string; // 담당 카테고리 (퍼피티칭, 안내견 등)
  userName: string; // 사용자 이름
  createdAt: string;
  updatedAt: string;
}

/**
 * 푸시 알림 권한 요청 및 토큰 발급
 */
export const requestPushPermission = async (): Promise<string | null> => {
  try {
    // 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('알림 권한이 거부되었습니다.');
      return null;
    }

    // FCM 초기화
    const messaging = await initMessaging();
    if (!messaging) {
      console.log('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return null;
    }

    // VAPID 키 확인
    if (!VAPID_KEY) {
      console.warn('VAPID 키가 설정되지 않았습니다. Firebase Console에서 발급받아 설정하세요.');
      return null;
    }

    // 토큰 발급
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log('FCM 토큰 발급 완료:', token);
    return token;
  } catch (error) {
    console.error('푸시 토큰 발급 실패:', error);
    return null;
  }
};

/**
 * 푸시 토큰을 Firestore에 저장
 */
export const savePushToken = async (
  userId: string,
  token: string,
  role: string,
  category: string | undefined,
  userName: string
): Promise<void> => {
  const subscription: PushSubscription = {
    id: userId,
    token,
    role,
    category,
    userName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'push_subscriptions', userId), subscription);
  console.log('푸시 구독 저장 완료');
};

/**
 * 푸시 구독 해제
 */
export const removePushToken = async (userId: string): Promise<void> => {
  await deleteDoc(doc(db, 'push_subscriptions', userId));
  console.log('푸시 구독 해제 완료');
};

/**
 * 특정 역할의 사용자들의 푸시 토큰 조회
 */
export const getTokensByRole = async (role: string): Promise<PushSubscription[]> => {
  const q = query(collection(db, 'push_subscriptions'), where('role', '==', role));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as PushSubscription);
};

/**
 * 특정 카테고리의 사용자들의 푸시 토큰 조회
 */
export const getTokensByCategory = async (category: string): Promise<PushSubscription[]> => {
  const q = query(collection(db, 'push_subscriptions'), where('category', '==', category));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as PushSubscription);
};

/**
 * 모든 관리자의 푸시 토큰 조회
 */
export const getAdminTokens = async (): Promise<PushSubscription[]> => {
  return getTokensByRole('admin');
};

/**
 * 포그라운드 메시지 리스너 설정
 */
export const setupForegroundMessageListener = async (
  callback: (payload: any) => void
): Promise<void> => {
  const messaging = await initMessaging();
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('포그라운드 메시지 수신:', payload);
    callback(payload);
  });
};

/**
 * 푸시 알림 지원 여부 확인
 */
export const isPushSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * 현재 알림 권한 상태 확인
 */
export const getNotificationPermission = (): NotificationPermission => {
  return Notification.permission;
};
