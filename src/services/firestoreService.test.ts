import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  mockCollection,
  mockDoc,
  mockGetDocs,
  mockSetDoc,
  mockDeleteDoc,
  mockQuery,
  mockWhere,
  mockOrderBy,
  resetFirebaseMocks,
} from '../test/mocks/firebase';

// Import after mocks are set up
import {
  saveDog,
  getDogs,
  deleteDog,
  savePartner,
  getPartners,
  deletePartner,
  saveDiaryPost,
  getDiaryPosts,
  deleteDiaryPost,
  getProductOrders,
} from './firestoreService';

describe('firestoreService', () => {
  beforeEach(() => {
    resetFirebaseMocks();

    // Default mock implementations
    mockCollection.mockReturnValue('collection-ref');
    mockDoc.mockReturnValue('doc-ref');
    mockQuery.mockReturnValue('query-ref');
    mockWhere.mockReturnValue('where-condition');
    mockOrderBy.mockReturnValue('orderBy-condition');
    mockSetDoc.mockResolvedValue(undefined);
    mockDeleteDoc.mockResolvedValue(undefined);
  });

  describe('Guide Dogs', () => {
    const mockDog = {
      id: 'dog-1',
      name: '바둑이',
      gender: '수컷',
      birthDate: '2020-01-15',
      category: '훈련견',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should save a dog to Firestore', async () => {
      await saveDog(mockDog);

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'guide_dogs', 'dog-1');
      expect(mockSetDoc).toHaveBeenCalledWith('doc-ref', mockDog);
    });

    it('should get all dogs when no userId provided', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [
          { data: () => mockDog },
        ],
      });

      const dogs = await getDogs();

      expect(mockQuery).toHaveBeenCalled();
      expect(dogs).toHaveLength(1);
      expect(dogs[0].name).toBe('바둑이');
    });

    it('should filter dogs by userId when provided', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => ({ ...mockDog, assignedUserId: 'user-1' }) }],
      });

      await getDogs('user-1');

      expect(mockWhere).toHaveBeenCalledWith('assignedUserId', '==', 'user-1');
    });

    it('should delete a dog from Firestore', async () => {
      await deleteDog('dog-1');

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'guide_dogs', 'dog-1');
      expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref');
    });
  });

  describe('Partners', () => {
    const mockPartner = {
      id: 'partner-1',
      name: '김철수',
      contact: '010-1234-5678',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    it('should save a partner to Firestore', async () => {
      await savePartner(mockPartner);

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'partners', 'partner-1');
      expect(mockSetDoc).toHaveBeenCalledWith('doc-ref', mockPartner);
    });

    it('should get all partners when no userId provided', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => mockPartner }],
      });

      const partners = await getPartners();

      expect(partners).toHaveLength(1);
      expect(partners[0].name).toBe('김철수');
    });

    it('should filter partners by userId when provided', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => ({ ...mockPartner, assignedUserId: 'user-1' }) }],
      });

      await getPartners('user-1');

      expect(mockWhere).toHaveBeenCalledWith('assignedUserId', '==', 'user-1');
    });

    it('should delete a partner from Firestore', async () => {
      await deletePartner('partner-1');

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'partners', 'partner-1');
      expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref');
    });
  });

  describe('Diary Posts', () => {
    const mockDiary = {
      id: 'diary-1',
      userId: 'user-1',
      title: '오늘의 훈련',
      content: '훈련 내용...',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    it('should save a diary post to Firestore', async () => {
      await saveDiaryPost(mockDiary);

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'diary_posts', 'diary-1');
      expect(mockSetDoc).toHaveBeenCalledWith('doc-ref', mockDiary);
    });

    it('should get all diary posts when no userId provided (admin)', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => mockDiary }],
      });

      const posts = await getDiaryPosts();

      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(posts).toHaveLength(1);
    });

    it('should filter diary posts by userId when provided', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => mockDiary }],
      });

      await getDiaryPosts('user-1');

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-1');
      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should delete a diary post from Firestore', async () => {
      await deleteDiaryPost('diary-1');

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'diary_posts', 'diary-1');
      expect(mockDeleteDoc).toHaveBeenCalledWith('doc-ref');
    });
  });

  describe('Product Orders', () => {
    const mockOrder = {
      id: 'order-1',
      userId: 'user-1',
      productId: 'product-1',
      quantity: 2,
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    it('should get all orders when no userId provided (admin)', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => mockOrder }],
      });

      const orders = await getProductOrders();

      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
      expect(orders).toHaveLength(1);
    });

    it('should filter orders by userId when provided', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ data: () => mockOrder }],
      });

      await getProductOrders('user-1');

      expect(mockWhere).toHaveBeenCalledWith('userId', '==', 'user-1');
    });
  });
});
