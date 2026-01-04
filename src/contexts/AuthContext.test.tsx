import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import {
  mockSignInWithEmailAndPassword,
  mockSignOut,
  mockOnAuthStateChanged,
  resetFirebaseMocks,
} from '../test/mocks/firebase';

// Mock storage utility
vi.mock('../utils/storage', () => ({
  getGuideDogs: vi.fn(() => []),
  getActivities: vi.fn(() => []),
  getPartners: vi.fn(() => []),
  getUsers: vi.fn(() => []),
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'logged-in' : 'logged-out'}
      </div>
      {user && <div data-testid="user-name">{user.name}</div>}
      {user && <div data-testid="user-role">{user.role}</div>}
      <button
        data-testid="login-btn"
        onClick={() => login('guidedog', '8922')}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    resetFirebaseMocks();
    localStorage.clear();

    // Default: no Firebase user logged in
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null);
      return vi.fn(); // unsubscribe function
    });
  });

  it('should start with logged out state', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
    });
  });

  it('should login with local admin credentials', async () => {
    // Mock Firebase login failure to trigger local auth fallback
    mockSignInWithEmailAndPassword.mockRejectedValue(
      new Error('Firebase login failed')
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
    });

    const loginBtn = screen.getByTestId('login-btn');
    await act(async () => {
      await userEvent.click(loginBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in');
      expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
    });
  });

  it('should logout successfully', async () => {
    mockSignOut.mockResolvedValue(undefined);

    // Start with logged in state
    localStorage.setItem(
      'guidedog_user',
      JSON.stringify({ id: 'guidedog', role: 'admin', name: '관리자' })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in');
    });

    const logoutBtn = screen.getByTestId('logout-btn');
    await act(async () => {
      await userEvent.click(logoutBtn);
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-out');
    });
  });

  it('should restore session from localStorage', async () => {
    localStorage.setItem(
      'guidedog_user',
      JSON.stringify({ id: 'test-user', role: 'partner', name: '테스트' })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('logged-in');
      expect(screen.getByTestId('user-name')).toHaveTextContent('테스트');
      expect(screen.getByTestId('user-role')).toHaveTextContent('partner');
    });
  });

  it('should throw error when useAuth is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });
});
