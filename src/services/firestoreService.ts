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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { GuideDog, Partner, Activity, DiaryPost, MedicalRecord, MedicationCheck, Product, ProductOrder, Lecture } from '../types/types';

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
};

// === 안내견 관련 ===
export const saveDog = async (dog: GuideDog) => {
  await setDoc(doc(db, COLLECTIONS.DOGS, dog.id), dog);
};

export const getDogs = async (): Promise<GuideDog[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.DOGS));
  return snapshot.docs.map(doc => doc.data() as GuideDog);
};

export const deleteDog = async (id: string) => {
  await deleteDoc(doc(db, COLLECTIONS.DOGS, id));
};

// === 파트너 관련 ===
export const savePartner = async (partner: Partner) => {
  await setDoc(doc(db, COLLECTIONS.PARTNERS, partner.id), partner);
};

export const getPartners = async (): Promise<Partner[]> => {
  const snapshot = await getDocs(collection(db, COLLECTIONS.PARTNERS));
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

export const getDiaryPosts = async (): Promise<DiaryPost[]> => {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.DIARY), orderBy('createdAt', 'desc'))
  );
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

export const getProductOrders = async (): Promise<ProductOrder[]> => {
  const snapshot = await getDocs(
    query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc'))
  );
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
