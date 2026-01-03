// @ts-nocheck
/**
 * Firestore 데이터 서비스
 * LocalStorage를 Firestore로 대체
 */
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { GuideDog, Partner, Activity, DiaryPost, MedicalRecord, MedicationCheck, Product, ProductOrder, Lecture, Schedule } from '../types/types';

// 컬렉션 이름
const COLLECTIONS = {
  DOGS: 'guide_dogs',
  PARTNERS: 'partners',
  ACTIVITIES: 'activities',
  DIARY: 'diary_posts',
  MEDICAL: 'medical_records',
  MEDICATION: 'medication_checks',
  PRODUCTS: 'products',
  ORDERS: 'product_orders',
  LECTURES: 'lectures',
  SCHEDULES: 'schedules',
  QNA_MANUALS: 'qna_manuals',
};

// === 안내견 관련 ===
export const saveDog = async (dog: GuideDog) => {
  await setDoc(doc(db, COLLECTIONS.DOGS, dog.id), dog);
};

export const getDogs = async (userId?: string): Promise<GuideDog[]> => {
  let q;
  if (userId) {
    // 일반 사용자: 자기 담당만
    q = query(collection(db, COLLECTIONS.DOGS), where('assignedUserId', '==', userId));
  } else {
    // 관리자: 전체
    q = query(collection(db, COLLECTIONS.DOGS));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as GuideDog);
};

export const deleteDog = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.DOGS, id));
};

// === 파트너 관련 ===
export const savePartner = async (partner: Partner) => {
  await setDoc(doc(db, COLLECTIONS.PARTNERS, partner.id), partner);
};

export const getPartners = async (userId?: string): Promise<Partner[]> => {
  let q;
  if (userId) {
    // 일반 사용자: 자기 담당만
    q = query(collection(db, COLLECTIONS.PARTNERS), where('assignedUserId', '==', userId));
  } else {
    // 관리자: 전체
    q = query(collection(db, COLLECTIONS.PARTNERS));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as Partner);
};

export const deletePartner = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.PARTNERS, id));
};

// === 활동 관련 ===
export const saveActivity = async (activity: Activity) => {
  await setDoc(doc(db, COLLECTIONS.ACTIVITIES, activity.id), activity);
};

export const getActivities = async (): Promise<Activity[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.ACTIVITIES));
  return snapshot.docs.map(doc => doc.data() as Activity);
};

export const deleteActivity = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.ACTIVITIES, id));
};

// === 다이어리 관련 ===
export const saveDiaryPost = async (post: DiaryPost) => {
  await setDoc(doc(db, COLLECTIONS.DIARY, post.id), post);
};

export const getDiaryPosts = async (userId?: string): Promise<DiaryPost[]> => {
  let q;
  if (userId) {
    // 일반 사용자: 자기가 작성한 것만
    q = query(collection(db, COLLECTIONS.DIARY), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  } else {
    // 관리자: 전체
    q = query(collection(db, COLLECTIONS.DIARY), orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as DiaryPost);
};

export const deleteDiaryPost = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.DIARY, id));
};

// === 진료기록 관련 ===
export const saveMedicalRecord = async (record: MedicalRecord) => {
  await setDoc(doc(db, COLLECTIONS.MEDICAL, record.id), record);
};

export const getMedicalRecords = async (): Promise<MedicalRecord[]> => {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.MEDICAL), orderBy('visitDate', 'desc'))
  );
  return snapshot.docs.map(doc => doc.data() as MedicalRecord);
};

export const deleteMedicalRecord = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.MEDICAL, id));
};

// === 약품체크 관련 ===
export const saveMedicationCheck = async (check: MedicationCheck) => {
  await setDoc(doc(db, COLLECTIONS.MEDICATION, check.id), check);
};

export const getMedicationChecks = async (): Promise<MedicationCheck[]> => {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.MEDICATION), orderBy('checkDate', 'desc'))
  );
  return snapshot.docs.map(doc => doc.data() as MedicationCheck);
};

export const deleteMedicationCheck = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.MEDICATION, id));
};

// === 물품 관련 ===
export const saveProduct = async (product: Product) => {
  await setDoc(doc(db, COLLECTIONS.PRODUCTS, product.id), product);
};

export const getProducts = async (): Promise<Product[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
  return snapshot.docs.map(doc => doc.data() as Product);
};

export const deleteProduct = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
};

// === 물품신청 관련 ===
export const saveProductOrder = async (order: ProductOrder) => {
  await setDoc(doc(db, COLLECTIONS.ORDERS, order.id), order);
};

export const getProductOrders = async (userId?: string): Promise<ProductOrder[]> => {
  let q;
  if (userId) {
    // 일반 사용자: 자기 주문만
    q = query(collection(db, COLLECTIONS.ORDERS), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  } else {
    // 관리자: 전체
    q = query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ProductOrder);
};

export const deleteProductOrder = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.ORDERS, id));
};

// === 강의자료 관련 ===
export const saveLecture = async (lecture: Lecture) => {
  await setDoc(doc(db, COLLECTIONS.LECTURES, lecture.id), lecture);
};

export const getLectures = async (): Promise<Lecture[]> => {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.LECTURES), orderBy('createdAt', 'desc'))
  );
  return snapshot.docs.map(doc => doc.data() as Lecture);
};

export const deleteLecture = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.LECTURES, id));
};

// === 일정 관련 ===
export const saveSchedule = async (schedule: Schedule) => {
  await setDoc(doc(db, COLLECTIONS.SCHEDULES, schedule.id), schedule);
};

export const getSchedules = async (): Promise<Schedule[]> => {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.SCHEDULES), orderBy('date', 'desc'))
  );
  return snapshot.docs.map(doc => doc.data() as Schedule);
};

export const deleteSchedule = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.SCHEDULES, id));
};

// === 전체 데이터 삭제 (모든 개인정보 포함) ===
export const clearAllData = async () => {
  // ⚠️ 모든 컬렉션 이름 (개인정보 보호법 준수)
  const allCollections = [
    COLLECTIONS.DOGS,              // guide_dogs
    COLLECTIONS.PARTNERS,          // partners
    COLLECTIONS.ACTIVITIES,        // activities
    COLLECTIONS.DIARY,             // diary_posts
    COLLECTIONS.MEDICAL,           // medical_records (민감!)
    COLLECTIONS.MEDICATION,        // medication_checks
    COLLECTIONS.PRODUCTS,          // products
    COLLECTIONS.ORDERS,            // product_orders
    COLLECTIONS.LECTURES,          // lectures
    COLLECTIONS.SCHEDULES,         // schedules (일정)
    'staff_courses',               // 직원 과정
    'staff_lectures',              // 직원 강의
    'school_videos',               // 학교 영상
    'boarding_forms',              // 보딩 폼
    'monthly_reports',             // 월간 보고서
    'notices',                     // 공지사항
    'users',                       // 사용자 (매우 민감!)
  ];

  // 모든 컬렉션에서 데이터 가져오기
  const snapshots = await Promise.all(
    allCollections.map(collectionName =>
      getDocs(collection(db, collectionName)).catch(() => ({ docs: [] }))
    )
  );

  // 모든 문서 삭제
  const deletePromises = snapshots.flatMap(snapshot =>
    snapshot.docs.map(doc => deleteDoc(doc.ref))
  );

  await Promise.all(deletePromises);
  console.log(`✅ 모든 Firestore 데이터 완전 삭제 완료 (${deletePromises.length}개 문서, 개인정보 포함)`);
};

// === Q&A 매뉴얼 관련 ===
export type ManualCategory = '퍼피티칭' | '훈련견' | '안내견' | '은퇴견' | '부모견' | '공통';

export interface QnAManual {
  id: string;
  fileName: string;
  displayName: string;
  fileUri: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
  expiresAt: string;
  category: ManualCategory;
}

export const saveQnAManual = async (manual: QnAManual) => {
  await setDoc(doc(db, COLLECTIONS.QNA_MANUALS, manual.id), manual);
};

export const getQnAManuals = async (): Promise<QnAManual[]> => {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.QNA_MANUALS), orderBy('uploadedAt', 'desc'))
  );
  return snapshot.docs.map(doc => doc.data() as QnAManual);
};

export const deleteQnAManual = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.QNA_MANUALS, id));
};
