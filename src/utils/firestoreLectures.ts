/**
 * Firestore 강의 관련 유틸리티 함수
 * 모든 PC에서 같은 강의 데이터를 공유하기 위해 Firestore 사용
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
import type { Lecture, LectureCategory, DiaryPost, BoardingForm, MedicalRecord, MedicationCheck, Product, ProductOrder } from '../types/types';

// ==================== 일반 강의실 (Public Lectures) ====================

const LECTURES_COLLECTION = 'lectures';

export const getPublicLectures = async (): Promise<Lecture[]> => {
  try {
    const lecturesRef = collection(db, LECTURES_COLLECTION);
    const q = query(lecturesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Lecture[];
  } catch (error) {
    console.error('강의 목록 로드 실패:', error);
    // Firestore 실패 시 localStorage 폴백
    const data = localStorage.getItem('guidedog_lectures');
    return data ? JSON.parse(data) : [];
  }
};

export const savePublicLecture = async (lecture: Lecture): Promise<void> => {
  try {
    const lectureRef = doc(db, LECTURES_COLLECTION, lecture.id);
    await setDoc(lectureRef, lecture);

    // localStorage에도 백업 (오프라인 대비)
    const lectures = await getPublicLectures();
    const existingIndex = lectures.findIndex(l => l.id === lecture.id);
    if (existingIndex >= 0) {
      lectures[existingIndex] = lecture;
    } else {
      lectures.unshift(lecture);
    }
    localStorage.setItem('guidedog_lectures', JSON.stringify(lectures));
  } catch (error) {
    console.error('강의 저장 실패:', error);
    throw error;
  }
};

export const deletePublicLecture = async (id: string): Promise<void> => {
  try {
    const lectureRef = doc(db, LECTURES_COLLECTION, id);
    await deleteDoc(lectureRef);

    // localStorage에서도 삭제
    const lectures = await getPublicLectures();
    const filtered = lectures.filter(l => l.id !== id);
    localStorage.setItem('guidedog_lectures', JSON.stringify(filtered));
  } catch (error) {
    console.error('강의 삭제 실패:', error);
    throw error;
  }
};

// ==================== 직원용 강의실 - 과목 (Staff Courses) ====================

const COURSES_COLLECTION = 'staff_courses';

export interface Course {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const getStaffCourses = async (): Promise<Course[]> => {
  try {
    const coursesRef = collection(db, COURSES_COLLECTION);
    const q = query(coursesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Course[];
  } catch (error) {
    console.error('과목 목록 로드 실패:', error);
    const data = localStorage.getItem('guidedog_staff_courses');
    return data ? JSON.parse(data) : [];
  }
};

export const saveStaffCourse = async (course: Course): Promise<void> => {
  try {
    const courseRef = doc(db, COURSES_COLLECTION, course.id);
    await setDoc(courseRef, course);

    const courses = await getStaffCourses();
    const existingIndex = courses.findIndex(c => c.id === course.id);
    if (existingIndex >= 0) {
      courses[existingIndex] = course;
    } else {
      courses.unshift(course);
    }
    localStorage.setItem('guidedog_staff_courses', JSON.stringify(courses));
  } catch (error) {
    console.error('과목 저장 실패:', error);
    throw error;
  }
};

export const deleteStaffCourse = async (id: string): Promise<void> => {
  try {
    // 과목 삭제
    const courseRef = doc(db, COURSES_COLLECTION, id);
    await deleteDoc(courseRef);

    // 해당 과목의 모든 강의도 Firestore에서 삭제
    const allLectures = await getStaffLectures();
    const lecturesToDelete = allLectures.filter(l => l.courseId === id);

    for (const lecture of lecturesToDelete) {
      const lectureRef = doc(db, STAFF_LECTURES_COLLECTION, lecture.id);
      await deleteDoc(lectureRef);
    }

    // localStorage 업데이트
    const courses = await getStaffCourses();
    const filteredCourses = courses.filter(c => c.id !== id);
    localStorage.setItem('guidedog_staff_courses', JSON.stringify(filteredCourses));

    const lectures = await getStaffLectures();
    const filteredLectures = lectures.filter(l => l.courseId !== id);
    localStorage.setItem('guidedog_staff_lectures', JSON.stringify(filteredLectures));
  } catch (error) {
    console.error('과목 삭제 실패:', error);
    throw error;
  }
};

// ==================== 직원용 강의실 - 강의 (Staff Lectures) ====================

const STAFF_LECTURES_COLLECTION = 'staff_lectures';

export interface StaffLecture {
  id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string; // IndexedDB: 'indexed' or NAS URL
  youtubeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const getStaffLectures = async (): Promise<StaffLecture[]> => {
  try {
    const lecturesRef = collection(db, STAFF_LECTURES_COLLECTION);
    const q = query(lecturesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as StaffLecture[];
  } catch (error) {
    console.error('직원용 강의 목록 로드 실패:', error);
    const data = localStorage.getItem('guidedog_staff_lectures');
    return data ? JSON.parse(data) : [];
  }
};

export const saveStaffLecture = async (lecture: StaffLecture): Promise<void> => {
  try {
    const lectureRef = doc(db, STAFF_LECTURES_COLLECTION, lecture.id);
    await setDoc(lectureRef, lecture);

    const lectures = await getStaffLectures();
    const existingIndex = lectures.findIndex(l => l.id === lecture.id);
    if (existingIndex >= 0) {
      lectures[existingIndex] = lecture;
    } else {
      lectures.unshift(lecture);
    }
    localStorage.setItem('guidedog_staff_lectures', JSON.stringify(lectures));
  } catch (error) {
    console.error('직원용 강의 저장 실패:', error);
    throw error;
  }
};

export const deleteStaffLecture = async (id: string): Promise<void> => {
  try {
    const lectureRef = doc(db, STAFF_LECTURES_COLLECTION, id);
    await deleteDoc(lectureRef);

    const lectures = await getStaffLectures();
    const filtered = lectures.filter(l => l.id !== id);
    localStorage.setItem('guidedog_staff_lectures', JSON.stringify(filtered));
  } catch (error) {
    console.error('직원용 강의 삭제 실패:', error);
    throw error;
  }
};

// ==================== 안내견학교 행사 영상 (Guide Dog School Videos) ====================

const SCHOOL_VIDEOS_COLLECTION = 'school_videos';

export interface SchoolVideo {
  id: string;
  title: string;
  content: string;
  videoUrl?: string; // IndexedDB: 'indexed' or NAS URL
  youtubeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const getSchoolVideos = async (): Promise<SchoolVideo[]> => {
  try {
    const videosRef = collection(db, SCHOOL_VIDEOS_COLLECTION);
    const q = query(videosRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as SchoolVideo[];
  } catch (error) {
    console.error('안내견학교 영상 목록 로드 실패:', error);
    const data = localStorage.getItem('guidedog_school_videos');
    return data ? JSON.parse(data) : [];
  }
};

export const saveSchoolVideo = async (video: SchoolVideo): Promise<void> => {
  try {
    const videoRef = doc(db, SCHOOL_VIDEOS_COLLECTION, video.id);
    await setDoc(videoRef, video);

    const videos = await getSchoolVideos();
    const existingIndex = videos.findIndex(v => v.id === video.id);
    if (existingIndex >= 0) {
      videos[existingIndex] = video;
    } else {
      videos.unshift(video);
    }
    localStorage.setItem('guidedog_school_videos', JSON.stringify(videos));
  } catch (error) {
    console.error('안내견학교 영상 저장 실패:', error);
    throw error;
  }
};

export const deleteSchoolVideo = async (id: string): Promise<void> => {
  try {
    const videoRef = doc(db, SCHOOL_VIDEOS_COLLECTION, id);
    await deleteDoc(videoRef);

    const videos = await getSchoolVideos();
    const filtered = videos.filter(v => v.id !== id);
    localStorage.setItem('guidedog_school_videos', JSON.stringify(filtered));
  } catch (error) {
    console.error('안내견학교 영상 삭제 실패:', error);
    throw error;
  }
};

// ==================== 다이어리 (Diary Posts) ====================

const DIARY_COLLECTION = 'diary_posts';

export const getDiaryPosts = async (): Promise<DiaryPost[]> => {
  try {
    const diaryRef = collection(db, DIARY_COLLECTION);
    const q = query(diaryRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as DiaryPost[];
  } catch (error) {
    console.error('다이어리 목록 로드 실패:', error);
    const data = localStorage.getItem('guidedog_diary');
    return data ? JSON.parse(data) : [];
  }
};

export const saveDiaryPost = async (post: DiaryPost): Promise<void> => {
  try {
    const postRef = doc(db, DIARY_COLLECTION, post.id);
    await setDoc(postRef, post);

    const posts = await getDiaryPosts();
    const existingIndex = posts.findIndex(p => p.id === post.id);
    if (existingIndex >= 0) {
      posts[existingIndex] = post;
    } else {
      posts.unshift(post);
    }
    localStorage.setItem('guidedog_diary', JSON.stringify(posts));
  } catch (error) {
    console.error('다이어리 저장 실패:', error);
    throw error;
  }
};

export const deleteDiaryPost = async (id: string): Promise<void> => {
  try {
    const postRef = doc(db, DIARY_COLLECTION, id);
    await deleteDoc(postRef);

    const posts = await getDiaryPosts();
    const filtered = posts.filter(p => p.id !== id);
    localStorage.setItem('guidedog_diary', JSON.stringify(filtered));
  } catch (error) {
    console.error('다이어리 삭제 실패:', error);
    throw error;
  }
};

// ==================== 보딩 폼 (Boarding Forms) ====================

const BOARDING_COLLECTION = 'boarding_forms';

export const getBoardingForms = async (): Promise<BoardingForm[]> => {
  try {
    const boardingRef = collection(db, BOARDING_COLLECTION);
    const q = query(boardingRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as BoardingForm[];
  } catch (error) {
    console.error('보딩 폼 목록 로드 실패:', error);
    const data = localStorage.getItem('guidedog_boarding_forms');
    return data ? JSON.parse(data) : [];
  }
};

export const saveBoardingForm = async (form: BoardingForm): Promise<void> => {
  try {
    const formRef = doc(db, BOARDING_COLLECTION, form.id);
    await setDoc(formRef, form);

    const forms = await getBoardingForms();
    const existingIndex = forms.findIndex(f => f.id === form.id);
    if (existingIndex >= 0) {
      forms[existingIndex] = form;
    } else {
      forms.unshift(form);
    }
    localStorage.setItem('guidedog_boarding_forms', JSON.stringify(forms));
  } catch (error) {
    console.error('보딩 폼 저장 실패:', error);
    throw error;
  }
};

export const deleteBoardingForm = async (id: string): Promise<void> => {
  try {
    const formRef = doc(db, BOARDING_COLLECTION, id);
    await deleteDoc(formRef);

    const forms = await getBoardingForms();
    const filtered = forms.filter(f => f.id !== id);
    localStorage.setItem('guidedog_boarding_forms', JSON.stringify(filtered));
  } catch (error) {
    console.error('보딩 폼 삭제 실패:', error);
    throw error;
  }
};

// ==================== 진료 기록 (Medical Records) ====================

const MEDICAL_COLLECTION = 'medical_records';

export const getMedicalRecords = async (): Promise<MedicalRecord[]> => {
  try {
    const medicalRef = collection(db, MEDICAL_COLLECTION);
    const q = query(medicalRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as MedicalRecord[];
  } catch (error) {
    console.error('진료 기록 목록 로드 실패:', error);
    const data = localStorage.getItem('guidedog_medical');
    return data ? JSON.parse(data) : [];
  }
};

export const saveMedicalRecord = async (record: MedicalRecord): Promise<void> => {
  try {
    const recordRef = doc(db, MEDICAL_COLLECTION, record.id);
    await setDoc(recordRef, record);

    const records = await getMedicalRecords();
    const existingIndex = records.findIndex(r => r.id === record.id);
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.unshift(record);
    }
    localStorage.setItem('guidedog_medical', JSON.stringify(records));
  } catch (error) {
    console.error('진료 기록 저장 실패:', error);
    throw error;
  }
};

export const deleteMedicalRecord = async (id: string): Promise<void> => {
  try {
    const recordRef = doc(db, MEDICAL_COLLECTION, id);
    await deleteDoc(recordRef);

    const records = await getMedicalRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem('guidedog_medical', JSON.stringify(filtered));
  } catch (error) {
    console.error('진료 기록 삭제 실패:', error);
    throw error;
  }
};

// ==================== 약품 체크 (Medication Checks) ====================

const MEDICATION_COLLECTION = 'medication_checks';

export const getMedicationChecks = async (): Promise<MedicationCheck[]> => {
  try {
    const medicationRef = collection(db, MEDICATION_COLLECTION);
    const q = query(medicationRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as MedicationCheck[];
  } catch (error) {
    console.error('약품 체크 목록 로드 실패:', error);
    const data = localStorage.getItem('guidedog_medication');
    return data ? JSON.parse(data) : [];
  }
};

export const saveMedicationCheck = async (check: MedicationCheck): Promise<void> => {
  try {
    const checkRef = doc(db, MEDICATION_COLLECTION, check.id);
    await setDoc(checkRef, check);

    const checks = await getMedicationChecks();
    const existingIndex = checks.findIndex(c => c.id === check.id);
    if (existingIndex >= 0) {
      checks[existingIndex] = check;
    } else {
      checks.unshift(check);
    }
    localStorage.setItem('guidedog_medication', JSON.stringify(checks));
  } catch (error) {
    console.error('약품 체크 저장 실패:', error);
    throw error;
  }
};

export const deleteMedicationCheck = async (id: string): Promise<void> => {
  try {
    const checkRef = doc(db, MEDICATION_COLLECTION, id);
    await deleteDoc(checkRef);

    const checks = await getMedicationChecks();
    const filtered = checks.filter(c => c.id !== id);
    localStorage.setItem('guidedog_medication', JSON.stringify(filtered));
  } catch (error) {
    console.error('약품 체크 삭제 실패:', error);
    throw error;
  }
};

// ==================== 물품 관리 (Products) ====================

const PRODUCTS_COLLECTION = 'products';

export const getProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Product[];
  } catch (error) {
    console.error('물품 목록 로드 실패:', error);
    const data = localStorage.getItem('guidedog_products');
    return data ? JSON.parse(data) : [];
  }
};

export const saveProduct = async (product: Product): Promise<void> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, product.id);
    await setDoc(productRef, product);

    const products = await getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    if (existingIndex >= 0) {
      products[existingIndex] = product;
    } else {
      products.unshift(product);
    }
    localStorage.setItem('guidedog_products', JSON.stringify(products));
  } catch (error) {
    console.error('물품 저장 실패:', error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(productRef);

    const products = await getProducts();
    const filtered = products.filter(p => p.id !== id);
    localStorage.setItem('guidedog_products', JSON.stringify(filtered));
  } catch (error) {
    console.error('물품 삭제 실패:', error);
    throw error;
  }
};

// ==================== 물품 신청 (Product Orders) ====================

const PRODUCT_ORDERS_COLLECTION = 'product_orders';

export const getProductOrders = async (): Promise<ProductOrder[]> => {
  try {
    const ordersRef = collection(db, PRODUCT_ORDERS_COLLECTION);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as ProductOrder[];
  } catch (error) {
    console.error('물품 신청 목록 로드 실패:', error);
    const data = localStorage.getItem('guidedog_orders');
    return data ? JSON.parse(data) : [];
  }
};

export const saveProductOrder = async (order: ProductOrder): Promise<void> => {
  try {
    const orderRef = doc(db, PRODUCT_ORDERS_COLLECTION, order.id);
    await setDoc(orderRef, order);

    const orders = await getProductOrders();
    const existingIndex = orders.findIndex(o => o.id === order.id);
    if (existingIndex >= 0) {
      orders[existingIndex] = order;
    } else {
      orders.unshift(order);
    }
    localStorage.setItem('guidedog_orders', JSON.stringify(orders));
  } catch (error) {
    console.error('물품 신청 저장 실패:', error);
    throw error;
  }
};

export const deleteProductOrder = async (id: string): Promise<void> => {
  try {
    const orderRef = doc(db, PRODUCT_ORDERS_COLLECTION, id);
    await deleteDoc(orderRef);

    const orders = await getProductOrders();
    const filtered = orders.filter(o => o.id !== id);
    localStorage.setItem('guidedog_orders', JSON.stringify(filtered));
  } catch (error) {
    console.error('물품 신청 삭제 실패:', error);
    throw error;
  }
};
