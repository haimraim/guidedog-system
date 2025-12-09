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
import type { Lecture, LectureCategory, DiaryPost } from '../types/types';

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
