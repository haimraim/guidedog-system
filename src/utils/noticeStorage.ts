/**
 * 공지사항 Firestore 저장 관리
 */

import { db } from '../lib/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  targetAudience: string[]; // 'all', 'admin', 'puppyTeacher', 'staff', 'moderator' 등
  isPinned: boolean;
  createdAt: string;
}

const COLLECTION_NAME = 'notices';

/**
 * 모든 공지사항 가져오기
 */
export const getNotices = async (): Promise<Notice[]> => {
  try {
    const noticesRef = collection(db, COLLECTION_NAME);
    const q = query(noticesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Notice));
  } catch (error) {
    console.error('공지사항 로드 실패:', error);
    throw error;
  }
};

/**
 * 공지사항 저장 (생성 또는 수정)
 */
export const saveNotice = async (notice: Notice): Promise<void> => {
  try {
    const noticeRef = doc(db, COLLECTION_NAME, notice.id);
    await setDoc(noticeRef, notice);
  } catch (error) {
    console.error('공지사항 저장 실패:', error);
    throw error;
  }
};

/**
 * 공지사항 삭제
 */
export const deleteNotice = async (noticeId: string): Promise<void> => {
  try {
    const noticeRef = doc(db, COLLECTION_NAME, noticeId);
    await deleteDoc(noticeRef);
  } catch (error) {
    console.error('공지사항 삭제 실패:', error);
    throw error;
  }
};
