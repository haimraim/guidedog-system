/**
 * Firebase Cloud Functions
 * 다이어리 작성 시 관리자에게 푸시 알림 전송
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

interface PushSubscription {
  id: string;
  token: string;
  role: string;
  category?: string;
  userName: string;
}

interface DiaryPost {
  id: string;
  userId: string;
  userName: string;
  dogName?: string;
  dogCategory?: string;
  title: string;
  createdAt: string;
}

/**
 * 다이어리 작성 시 관리자에게 푸시 알림 전송
 */
export const onDiaryCreated = functions
  .region('asia-northeast3') // 서울 리전
  .firestore
  .document('diary_posts/{diaryId}')
  .onCreate(async (snapshot, context) => {
    const diary = snapshot.data() as DiaryPost;

    console.log('새 다이어리 작성:', diary);

    try {
      // 관리자들의 푸시 토큰 조회
      const adminsSnapshot = await db
        .collection('push_subscriptions')
        .where('role', '==', 'admin')
        .get();

      if (adminsSnapshot.empty) {
        console.log('알림을 받을 관리자가 없습니다.');
        return null;
      }

      const tokens: string[] = [];
      adminsSnapshot.forEach(doc => {
        const sub = doc.data() as PushSubscription;
        if (sub.token) {
          tokens.push(sub.token);
        }
      });

      if (tokens.length === 0) {
        console.log('유효한 푸시 토큰이 없습니다.');
        return null;
      }

      // 푸시 알림 메시지 구성
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: '새 다이어리가 작성되었습니다',
          body: `${diary.userName}님이 ${diary.dogName || ''} 다이어리를 작성했습니다.`,
        },
        data: {
          type: 'diary',
          diaryId: context.params.diaryId,
          url: `/?page=diary`,
        },
        tokens,
      };

      // 푸시 알림 전송
      const response = await messaging.sendEachForMulticast(message);
      console.log(`푸시 알림 전송 완료: 성공 ${response.successCount}, 실패 ${response.failureCount}`);

      // 실패한 토큰 처리 (만료된 토큰 삭제)
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
            console.error(`토큰 전송 실패: ${tokens[idx]}`, resp.error);
          }
        });

        // 만료된 토큰 삭제
        for (const token of failedTokens) {
          const tokenDocs = await db
            .collection('push_subscriptions')
            .where('token', '==', token)
            .get();

          tokenDocs.forEach(async (doc) => {
            await doc.ref.delete();
            console.log(`만료된 토큰 삭제: ${token}`);
          });
        }
      }

      return null;
    } catch (error) {
      console.error('푸시 알림 전송 실패:', error);
      return null;
    }
  });

/**
 * 월간보고서 제출 시 관리자에게 푸시 알림 전송
 */
export const onMonthlyReportCreated = functions
  .region('asia-northeast3')
  .firestore
  .document('monthly_reports/{reportId}')
  .onCreate(async (snapshot, context) => {
    const report = snapshot.data();

    console.log('새 월간보고서 제출:', report);

    try {
      const adminsSnapshot = await db
        .collection('push_subscriptions')
        .where('role', '==', 'admin')
        .get();

      if (adminsSnapshot.empty) {
        return null;
      }

      const tokens: string[] = [];
      adminsSnapshot.forEach(doc => {
        const sub = doc.data() as PushSubscription;
        if (sub.token) {
          tokens.push(sub.token);
        }
      });

      if (tokens.length === 0) {
        return null;
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: '새 월간보고서가 제출되었습니다',
          body: `${report.userName}님이 ${report.reportMonth} 월간보고서를 제출했습니다.`,
        },
        data: {
          type: 'monthlyReport',
          reportId: context.params.reportId,
          url: `/?page=monthlyReport`,
        },
        tokens,
      };

      const response = await messaging.sendEachForMulticast(message);
      console.log(`월간보고서 푸시 알림: 성공 ${response.successCount}, 실패 ${response.failureCount}`);

      return null;
    } catch (error) {
      console.error('월간보고서 푸시 알림 실패:', error);
      return null;
    }
  });

/**
 * 보딩 신청 시 관리자에게 푸시 알림 전송
 */
export const onBoardingFormCreated = functions
  .region('asia-northeast3')
  .firestore
  .document('boarding_forms/{formId}')
  .onCreate(async (snapshot, context) => {
    const form = snapshot.data();

    console.log('새 보딩 신청:', form);

    try {
      const adminsSnapshot = await db
        .collection('push_subscriptions')
        .where('role', '==', 'admin')
        .get();

      if (adminsSnapshot.empty) {
        return null;
      }

      const tokens: string[] = [];
      adminsSnapshot.forEach(doc => {
        const sub = doc.data() as PushSubscription;
        if (sub.token) {
          tokens.push(sub.token);
        }
      });

      if (tokens.length === 0) {
        return null;
      }

      const message: admin.messaging.MulticastMessage = {
        notification: {
          title: '새 보딩 신청이 접수되었습니다',
          body: `${form.userName}님이 ${form.dogName} 보딩을 신청했습니다. (${form.startDate} ~ ${form.endDate})`,
        },
        data: {
          type: 'boarding',
          formId: context.params.formId,
          url: `/?page=boarding`,
        },
        tokens,
      };

      const response = await messaging.sendEachForMulticast(message);
      console.log(`보딩 신청 푸시 알림: 성공 ${response.successCount}, 실패 ${response.failureCount}`);

      return null;
    } catch (error) {
      console.error('보딩 신청 푸시 알림 실패:', error);
      return null;
    }
  });
