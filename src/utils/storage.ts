/**
 * 로컬스토리지 관리 유틸리티
 * 안내견학교 데이터를 브라우저 로컬스토리지에 저장/조회
 */

import type { GuideDog, Partner, Activity, CombinedData, User } from '../types/types';

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
 * @param birthDate YYYY-MM-DD 형식의 생년월일
 * @returns 만 나이
 */
export const calculateAge = (birthDate: string): number => {
  if (!birthDate || birthDate.trim() === '') return 0;

  const today = new Date();
  const birth = new Date(birthDate);

  // Invalid Date 체크
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
 * @param birthDate YYYY-MM-DD 형식의 생년월일
 * @returns 년/개월 형태 문자열 (예: "2살 3개월")
 */
export const calculateAgeWithMonths = (birthDate: string): string => {
  if (!birthDate || birthDate.trim() === '') return '';

  const today = new Date();
  const birth = new Date(birthDate);

  // Invalid Date 체크
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

/**
 * 안내견 저장
 */
export const saveGuideDog = (dog: GuideDog): void => {
  const dogs = getGuideDogs();
  const existingIndex = dogs.findIndex(d => d.id === dog.id);

  if (existingIndex >= 0) {
    dogs[existingIndex] = { ...dog, updatedAt: new Date().toISOString() };
  } else {
    dogs.push(dog);
  }

  localStorage.setItem(STORAGE_KEYS.GUIDE_DOGS, JSON.stringify(dogs));
};

/**
 * 안내견 목록 조회
 */
export const getGuideDogs = (): GuideDog[] => {
  const data = localStorage.getItem(STORAGE_KEYS.GUIDE_DOGS);
  return data ? JSON.parse(data) : [];
};

/**
 * 안내견 삭제
 */
export const deleteGuideDog = (id: string): void => {
  const dogs = getGuideDogs().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEYS.GUIDE_DOGS, JSON.stringify(dogs));
};

/**
 * 파트너 저장
 */
export const savePartner = (partner: Partner): void => {
  const partners = getPartners();
  const existingIndex = partners.findIndex(p => p.id === partner.id);

  if (existingIndex >= 0) {
    partners[existingIndex] = { ...partner, updatedAt: new Date().toISOString() };
  } else {
    partners.push(partner);
  }

  localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(partners));
};

/**
 * 파트너 목록 조회
 */
export const getPartners = (): Partner[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PARTNERS);
  return data ? JSON.parse(data) : [];
};

/**
 * 파트너 삭제
 */
export const deletePartner = (id: string): void => {
  const partners = getPartners().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PARTNERS, JSON.stringify(partners));
};

/**
 * 활동 저장
 */
export const saveActivity = (activity: Activity): void => {
  const activities = getActivities();
  const existingIndex = activities.findIndex(a => a.id === activity.id);

  if (existingIndex >= 0) {
    activities[existingIndex] = { ...activity, updatedAt: new Date().toISOString() };
  } else {
    activities.push(activity);
  }

  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
};

/**
 * 활동 목록 조회
 */
export const getActivities = (): Activity[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
  return data ? JSON.parse(data) : [];
};

/**
 * 활동 삭제
 */
export const deleteActivity = (id: string): void => {
  const activities = getActivities().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
};

/**
 * 통합 데이터 조회 (활동 + 안내견 + 파트너)
 */
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

/**
 * 모든 데이터 삭제 (개발/테스트용)
 */
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.GUIDE_DOGS);
  localStorage.removeItem(STORAGE_KEYS.PARTNERS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
};

/**
 * 사용자 목록 조회
 */
export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

/**
 * 사용자 저장
 */
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

/**
 * 사용자 삭제
 */
export const deleteUser = (id: string): void => {
  const users = getUsers().filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

