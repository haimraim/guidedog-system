import { vi } from 'vitest';

// Firebase Auth mocks
export const mockSignInWithEmailAndPassword = vi.fn();
export const mockSignOut = vi.fn();
export const mockCreateUserWithEmailAndPassword = vi.fn();
export const mockUpdateProfile = vi.fn();
export const mockOnAuthStateChanged = vi.fn();

// Firebase Firestore mocks
export const mockCollection = vi.fn();
export const mockDoc = vi.fn();
export const mockGetDocs = vi.fn();
export const mockGetDoc = vi.fn();
export const mockSetDoc = vi.fn();
export const mockDeleteDoc = vi.fn();
export const mockQuery = vi.fn();
export const mockOrderBy = vi.fn();
export const mockWhere = vi.fn();

// Mock Firebase Auth module
vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  signOut: mockSignOut,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  updateProfile: mockUpdateProfile,
  onAuthStateChanged: mockOnAuthStateChanged,
  getAuth: vi.fn(() => ({})),
}));

// Mock Firebase Firestore module
vi.mock('firebase/firestore', () => ({
  collection: mockCollection,
  doc: mockDoc,
  getDocs: mockGetDocs,
  getDoc: mockGetDoc,
  setDoc: mockSetDoc,
  deleteDoc: mockDeleteDoc,
  query: mockQuery,
  orderBy: mockOrderBy,
  where: mockWhere,
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
}));

// Mock Firebase app
vi.mock('../../lib/firebase', () => ({
  db: {},
  auth: {},
}));

// Helper to reset all mocks
export const resetFirebaseMocks = () => {
  mockSignInWithEmailAndPassword.mockReset();
  mockSignOut.mockReset();
  mockCreateUserWithEmailAndPassword.mockReset();
  mockUpdateProfile.mockReset();
  mockOnAuthStateChanged.mockReset();
  mockCollection.mockReset();
  mockDoc.mockReset();
  mockGetDocs.mockReset();
  mockGetDoc.mockReset();
  mockSetDoc.mockReset();
  mockDeleteDoc.mockReset();
  mockQuery.mockReset();
  mockOrderBy.mockReset();
  mockWhere.mockReset();
};
