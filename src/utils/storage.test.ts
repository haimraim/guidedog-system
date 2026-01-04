import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateId,
  calculateAge,
  calculateAgeWithMonths,
  getGuideDogs,
  saveGuideDog,
  deleteGuideDog,
  getPartners,
  savePartner,
  deletePartner,
  getActivities,
  saveActivity,
  deleteActivity,
  getCombinedData,
  getUsers,
  saveUser,
  deleteUser,
} from './storage';
import type { GuideDog, Partner, Activity } from '../types/types';

// Mock firestoreService
vi.mock('../services/firestoreService', () => ({
  saveDog: vi.fn().mockResolvedValue(undefined),
  deleteDog: vi.fn().mockResolvedValue(undefined),
  savePartner: vi.fn().mockResolvedValue(undefined),
  deletePartner: vi.fn().mockResolvedValue(undefined),
  saveActivity: vi.fn().mockResolvedValue(undefined),
  deleteActivity: vi.fn().mockResolvedValue(undefined),
  getDogs: vi.fn().mockResolvedValue([]),
  getPartners: vi.fn().mockResolvedValue([]),
  getActivities: vi.fn().mockResolvedValue([]),
}));

describe('generateId', () => {
  it('should generate a unique ID', () => {
    const id1 = generateId();
    const id2 = generateId();

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
  });
});

describe('calculateAge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return 0 for empty birthDate', () => {
    expect(calculateAge('')).toBe(0);
    expect(calculateAge('   ')).toBe(0);
  });

  it('should return 0 for invalid birthDate', () => {
    expect(calculateAge('invalid-date')).toBe(0);
  });

  it('should calculate age correctly', () => {
    expect(calculateAge('2020-06-15')).toBe(4);
    expect(calculateAge('2020-06-16')).toBe(3); // birthday not yet
    expect(calculateAge('2020-01-01')).toBe(4);
  });

  it('should return 0 for future birthDate', () => {
    expect(calculateAge('2025-01-01')).toBe(0);
  });
});

describe('calculateAgeWithMonths', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return empty string for empty birthDate', () => {
    expect(calculateAgeWithMonths('')).toBe('');
    expect(calculateAgeWithMonths('   ')).toBe('');
  });

  it('should return empty string for invalid birthDate', () => {
    expect(calculateAgeWithMonths('invalid-date')).toBe('');
  });

  it('should return "1개월 미만" for very recent birth', () => {
    expect(calculateAgeWithMonths('2024-06-01')).toBe('1개월 미만');
  });

  it('should calculate age with months correctly', () => {
    expect(calculateAgeWithMonths('2023-06-15')).toBe('1살');
    expect(calculateAgeWithMonths('2024-03-15')).toBe('3개월');
    expect(calculateAgeWithMonths('2022-03-15')).toBe('2살 3개월');
  });
});

describe('GuideDogs CRUD', () => {
  const mockDog: GuideDog = {
    id: 'dog-1',
    name: '바둑이',
    gender: '수컷',
    birthDate: '2020-01-15',
    category: '훈련견',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('should return empty array when no dogs exist', () => {
    expect(getGuideDogs()).toEqual([]);
  });

  it('should save and retrieve a guide dog', () => {
    saveGuideDog(mockDog);
    const dogs = getGuideDogs();

    expect(dogs).toHaveLength(1);
    expect(dogs[0].name).toBe('바둑이');
  });

  it('should update existing dog', () => {
    saveGuideDog(mockDog);
    saveGuideDog({ ...mockDog, name: '흰둥이' });

    const dogs = getGuideDogs();
    expect(dogs).toHaveLength(1);
    expect(dogs[0].name).toBe('흰둥이');
  });

  it('should delete a guide dog', () => {
    saveGuideDog(mockDog);
    deleteGuideDog('dog-1');

    expect(getGuideDogs()).toHaveLength(0);
  });
});

describe('Partners CRUD', () => {
  const mockPartner: Partner = {
    id: 'partner-1',
    name: '김철수',
    contact: '010-1234-5678',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('should return empty array when no partners exist', () => {
    expect(getPartners()).toEqual([]);
  });

  it('should save and retrieve a partner', () => {
    savePartner(mockPartner);
    const partners = getPartners();

    expect(partners).toHaveLength(1);
    expect(partners[0].name).toBe('김철수');
  });

  it('should delete a partner', () => {
    savePartner(mockPartner);
    deletePartner('partner-1');

    expect(getPartners()).toHaveLength(0);
  });
});

describe('Activities CRUD', () => {
  const mockActivity: Activity = {
    id: 'activity-1',
    guideDogId: 'dog-1',
    partnerId: 'partner-1',
    matchDate: '2024-01-15',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('should return empty array when no activities exist', () => {
    expect(getActivities()).toEqual([]);
  });

  it('should save and retrieve an activity', () => {
    saveActivity(mockActivity);
    const activities = getActivities();

    expect(activities).toHaveLength(1);
    expect(activities[0].guideDogId).toBe('dog-1');
  });

  it('should delete an activity', () => {
    saveActivity(mockActivity);
    deleteActivity('activity-1');

    expect(getActivities()).toHaveLength(0);
  });
});

describe('getCombinedData', () => {
  it('should return empty array when no data exists', () => {
    expect(getCombinedData()).toEqual([]);
  });

  it('should combine activities with dogs and partners', () => {
    const dog: GuideDog = {
      id: 'dog-1',
      name: '바둑이',
      gender: '수컷',
      birthDate: '2020-01-15',
      category: '안내견',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const partner: Partner = {
      id: 'partner-1',
      name: '김철수',
      contact: '010-1234-5678',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const activity: Activity = {
      id: 'activity-1',
      guideDogId: 'dog-1',
      partnerId: 'partner-1',
      matchDate: '2024-01-15',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    saveGuideDog(dog);
    savePartner(partner);
    saveActivity(activity);

    const combined = getCombinedData();

    expect(combined).toHaveLength(1);
    expect(combined[0].guideDog.name).toBe('바둑이');
    expect(combined[0].partner.name).toBe('김철수');
    expect(combined[0].activity.matchDate).toBe('2024-01-15');
  });
});

describe('Users CRUD', () => {
  const mockUser = {
    id: 'user-1',
    name: '홍길동',
    role: 'admin' as const,
    password: 'test1234',
  };

  it('should return empty array when no users exist', () => {
    expect(getUsers()).toEqual([]);
  });

  it('should save and retrieve a user', () => {
    saveUser(mockUser);
    const users = getUsers();

    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('홍길동');
  });

  it('should delete a user', () => {
    saveUser(mockUser);
    deleteUser('user-1');

    expect(getUsers()).toHaveLength(0);
  });
});
