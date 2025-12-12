/**
 * 푸시 알림 구독 버튼 컴포넌트
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  isPushSupported,
  getNotificationPermission,
  requestPushPermission,
  savePushToken,
  removePushToken,
  setupForegroundMessageListener,
} from '../services/pushService';

export const PushNotificationButton = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 지원 여부 확인
    setIsSupported(isPushSupported());
    setPermission(getNotificationPermission());

    // 이미 구독되어 있는지 확인 (로컬 스토리지)
    const subscribed = localStorage.getItem('pushSubscribed') === 'true';
    setIsSubscribed(subscribed);

    // 포그라운드 메시지 리스너 설정
    if (subscribed) {
      setupForegroundMessageListener((payload) => {
        // 포그라운드에서 메시지 수신 시 토스트 알림 표시
        const title = payload.notification?.title || '새 알림';
        const body = payload.notification?.body || '';

        // 브라우저 알림 표시 (포그라운드)
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/logo.svg',
          });
        }
      });
    }
  }, []);

  const handleSubscribe = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const token = await requestPushPermission();
      if (token) {
        await savePushToken(
          user.id,
          token,
          user.role,
          user.category,
          user.name
        );
        setIsSubscribed(true);
        setPermission('granted');
        localStorage.setItem('pushSubscribed', 'true');
        alert('알림이 활성화되었습니다.');

        // 포그라운드 메시지 리스너 설정
        setupForegroundMessageListener((payload) => {
          const title = payload.notification?.title || '새 알림';
          const body = payload.notification?.body || '';
          if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/logo.svg' });
          }
        });
      } else {
        if (Notification.permission === 'denied') {
          alert('알림이 차단되어 있습니다. 브라우저 설정에서 알림을 허용해주세요.');
        } else {
          alert('알림 설정에 실패했습니다. VAPID 키가 설정되어 있는지 확인하세요.');
        }
      }
    } catch (error) {
      console.error('알림 구독 실패:', error);
      alert('알림 구독에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await removePushToken(user.id);
      setIsSubscribed(false);
      localStorage.removeItem('pushSubscribed');
      alert('알림이 해제되었습니다.');
    } catch (error) {
      console.error('알림 해제 실패:', error);
      alert('알림 해제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 지원하지 않으면 표시 안 함
  if (!isSupported) {
    return null;
  }

  // 권한이 거부된 경우
  if (permission === 'denied') {
    return (
      <button
        disabled
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
        title="브라우저 설정에서 알림을 허용해주세요"
      >
        <span>🔕</span>
        <span>알림 차단됨</span>
      </button>
    );
  }

  return (
    <button
      onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
      disabled={isLoading}
      className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
        isSubscribed
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isSubscribed ? '알림 해제' : '알림 받기'}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>처리 중...</span>
        </>
      ) : isSubscribed ? (
        <>
          <span>🔔</span>
          <span>알림 켜짐</span>
        </>
      ) : (
        <>
          <span>🔕</span>
          <span>알림 받기</span>
        </>
      )}
    </button>
  );
};
