"use strict";
/**
 * Firebase Cloud Functions
 * 다이어리 작성 시 관리자에게 푸시 알림 전송
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onBoardingFormCreated = exports.onMonthlyReportCreated = exports.onDiaryCreated = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();
/**
 * 다이어리 작성 시 관리자에게 푸시 알림 전송
 */
exports.onDiaryCreated = functions
    .region('asia-northeast3') // 서울 리전
    .firestore
    .document('diary_posts/{diaryId}')
    .onCreate(async (snapshot, context) => {
    const diary = snapshot.data();
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
        const tokens = [];
        adminsSnapshot.forEach(doc => {
            const sub = doc.data();
            if (sub.token) {
                tokens.push(sub.token);
            }
        });
        if (tokens.length === 0) {
            console.log('유효한 푸시 토큰이 없습니다.');
            return null;
        }
        // 푸시 알림 메시지 구성
        const message = {
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
            const failedTokens = [];
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
    }
    catch (error) {
        console.error('푸시 알림 전송 실패:', error);
        return null;
    }
});
/**
 * 월간보고서 제출 시 관리자에게 푸시 알림 전송
 */
exports.onMonthlyReportCreated = functions
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
        const tokens = [];
        adminsSnapshot.forEach(doc => {
            const sub = doc.data();
            if (sub.token) {
                tokens.push(sub.token);
            }
        });
        if (tokens.length === 0) {
            return null;
        }
        const message = {
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
    }
    catch (error) {
        console.error('월간보고서 푸시 알림 실패:', error);
        return null;
    }
});
/**
 * 보딩 신청 시 관리자에게 푸시 알림 전송
 */
exports.onBoardingFormCreated = functions
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
        const tokens = [];
        adminsSnapshot.forEach(doc => {
            const sub = doc.data();
            if (sub.token) {
                tokens.push(sub.token);
            }
        });
        if (tokens.length === 0) {
            return null;
        }
        const message = {
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
    }
    catch (error) {
        console.error('보딩 신청 푸시 알림 실패:', error);
        return null;
    }
});
//# sourceMappingURL=index.js.map