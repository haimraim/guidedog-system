/**
 * 데이터 저장소 유틸리티
 * LocalStorage (로컬 캐시) + Firestore (클라우드 동기화)
 */

import type { GuideDog, Partner, Activity, CombinedData, User } from '../types/types';
import * as firestoreService from '../services/firestoreService';

const STORAGE_KEYS = {
  GUIDE_DOGS: 'guidedog_dogs',
  PARTNERS: 'guidedog_partners',
  ACTIVITIES: 'guidedog_activities',
  USERS: 'guidedog_users',
} as const;

/**
 * UUID 생성
 */
export const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * 생년월일로부터 나이 계산
 */
export const calculateAge = (birthDate: string): number => {
  if (!birthDate || birthDate.trim() === '') return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return 0;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age < 0 ? 0 : age;
};

/**
 * 생년월일로부터 나이를 년/개월 형태로 계산
 */
export const calculateAgeWithMonths = (birthDate: string): string => {
  if (!birthDate || birthDate.trim() === '') return '';
  const today = new Date();
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return '';
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  let totalYears = years;
  let totalMonths = months;
  if (totalMonths < 0) {
    totalYears -= 1;
    totalMonths += 12;
  }
  if (totalYears < 0) return '';
  if (totalYears === 0 && totalMonths === 0) {
    return '1개월 미만';
  }
  const parts = [];
  if (totalYears > 0) parts.push(`${totalYears}살`);
  if (totalMonths > 0) parts.push(`${totalMonths}개월`);
  return parts.join(' ');
};

// ===== 안내견 관련 =====

export const saveGuideDog = (dog: GuideDog): void => {
  const dogs = getGuideDogs();
  const existingIndex = dogs.findIndex(d => d.id === dog.id);
  if (existingIndex >= 0) {
    dogs[existingIndex] = { ...dog, updatedAt: new Date().toISOString() };
  } else {
    dogs.push(dog);
  }
  localStorage.setItem(STORAGE_KEYS.GUIDE_DOGS, JSON.stringify(dogs));
  // Firestore에도 저장 (백그라운드)
  firestoreService.saveDog(dog).catch(console.error);
};

export const getGuideDogs = (): GuideDog[] => {
  const data = localStorage.getItem(STORAGE_KEYS.GUIDE_DOGS);
  return data ? JSON.parse(data) : [];
};

export const deleteGuideDog = (id: string): void => {
  const dogs = getGuideDogs().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEYS.GUIDE_DOGS, JSON.stringify(dogs));
  // Firestore에서도 삭제 (백그라운드)
  firestoreService.deleteDog(id).catch(console.error);
};

// ===== 파트너 관련 =====

export const savePartner = (partner: Partner): void => {
  const partners = getPartners();
  const existingIndex = partners.findIndex(p => p.id === partner.id);
  if (existingIndex >= 0) {
    partners[existingIndex] = { ...partner, updatedAt: new Date().toISOString() };
  } else {
    partners.push(partner);
  }
  localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(partners));
  // Firestore에도 저장 (백그라운드)
  firestoreService.savePartner(partner).catch(console.error);
};

export const getPartners = (): Partner[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PARTNERS);
  return data ? JSON.parse(data) : [];
};

export const deletePartner = (id: string): void => {
  const partners = getPartners().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(partners));
  // Firestore에서도 삭제 (백그라운드)
  firestoreService.deletePartner(id).catch(console.error);
};

// ===== 활동 관련 =====

export const saveActivity = (activity: Activity): void => {
  const activities = getActivities();
  const existingIndex = activities.findIndex(a => a.id === activity.id);
  if (existingIndex >= 0) {
    activities[existingIndex] = { ...activity, updatedAt: new Date().toISOString() };
  } else {
    activities.push(activity);
  }
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  // Firestore에도 저장 (백그라운드)
  firestoreService.saveActivity(activity).catch(console.error);
};

export const getActivities = (): Activity[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
  return data ? JSON.parse(data) : [];
};

export const deleteActivity = (id: string): void => {
  const activities = getActivities().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
  // Firestore에서도 삭제 (백그라운드)
  firestoreService.deleteActivity(id).catch(console.error);
};

// ===== 통합 데이터 =====

export const getCombinedData = (): CombinedData[] => {
  const activities = getActivities();
  const dogs = getGuideDogs();
  const partners = getPartners();

  return activities.map(activity => {
    const guideDog = dogs.find(d => d.id === activity.guideDogId);
    const partner = partners.find(p => p.id === activity.partnerId);
    return {
      activity,
      guideDog: guideDog || ({} as GuideDog),
      partner: partner || ({} as Partner),
    };
  });
};

// ===== Firestore 동기화 =====

/**
 * Firestore에서 데이터를 가져와 LocalStorage에 저장
 */
export const syncFromFirestore = async (): Promise<void> => {
  try {
    const [dogs, partners, activities] = await Promise.all([
      firestoreService.getDogs(),
      firestoreService.getPartners(),
      firestoreService.getActivities(),
    ]);

    localStorage.setItem(STORAGE_KEYS.GUIDE_DOGS, JSON.stringify(dogs));
    localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(partners));
    localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));

    console.log('✅ Firestore 동기화 완료');
  } catch (error) {
    console.error('❌ Firestore 동기화 실패:', error);
  }
};

/**
 * LocalStorage 데이터를 Firestore에 업로드
 */
export const syncToFirestore = async (): Promise<void> => {
  try {
    const dogs = getGuideDogs();
    const partners = getPartners();
    const activities = getActivities();

    await Promise.all([
      ...dogs.map(dog => firestoreService.saveDog(dog)),
      ...partners.map(partner => firestoreService.savePartner(partner)),
      ...activities.map(activity => firestoreService.saveActivity(activity)),
    ]);

    console.log('✅ Firestore 업로드 완료');
  } catch (error) {
    console.error('❌ Firestore 업로드 실패:', error);
  }
};

// ===== 사용자 관련 (LocalStorage만 사용) =====

export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = { ...user, updatedAt: new Date().toISOString() };
  } else {
    users.push({ ...user, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const deleteUser = (id: string): void => {
  const users = getUsers().filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const clearAllData = async (): Promise<void> => {
  // localStorage 삭제
  localStorage.removeItem(STORAGE_KEYS.GUIDE_DOGS);
  localStorage.removeItem(STORAGE_KEYS.PARTNERS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);

  // Firestore에서도 삭제
  try {
    await firestoreService.clearAllData();
    console.log('✅ Firestore 데이터 삭제 완료');
  } catch (error) {
    console.error('❌ Firestore 데이터 삭제 실패:', error);
    throw error;
  }
};
