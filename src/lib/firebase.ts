// Firebase 설정 및 초기화
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDFpZyTGYzi2N8SrK8JmWJi-iSRSZZ0NHk",
  authDomain: "guidedogsystem.firebaseapp.com",
  projectId: "guidedogsystem",
  storageBucket: "guidedogsystem.firebasestorage.app",
  messagingSenderId: "757099883206",
  appId: "1:757099883206:web:dfd3a2e290594e1106c5c7"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 인스턴스
export const db = getFirestore(app);

// Firebase Authentication 인스턴스
export const auth = getAuth(app);

// Firebase Cloud Messaging 인스턴스 (브라우저 지원 확인 후)
let messaging: Messaging | null = null;

export const initMessaging = async (): Promise<Messaging | null> => {
  if (messaging) return messaging;

  const supported = await isSupported();
  if (supported) {
    messaging = getMessaging(app);
  }
  return messaging;
};

export { getToken, onMessage };
