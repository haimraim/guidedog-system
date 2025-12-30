/**
 * 토스트 알림 컨텍스트
 * alert() 대신 사용할 토스트 알림 시스템
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    const id = `toast-${++toastIdRef.current}`;
    const newToast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev, newToast]);

    // 자동 제거
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => {
    showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast(message, 'error', duration ?? 5000); // 에러는 더 길게 표시
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast(message, 'warning', duration ?? 4000);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast(message, 'info', duration);
  }, [showToast]);

  const value: ToastContextType = {
    showToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// 토스트 컨테이너 컴포넌트
interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2"
      role="region"
      aria-label="알림"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

// 개별 토스트 컴포넌트
interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // 사라지기 전 애니메이션
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, toast.duration - 300);

    return () => clearTimeout(exitTimer);
  }, [toast.duration]);

  const getTypeStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-success-600 text-white border-success-700';
      case 'error':
        return 'bg-error-600 text-white border-error-700';
      case 'warning':
        return 'bg-warning-500 text-white border-warning-600';
      case 'info':
      default:
        return 'bg-primary-600 text-white border-primary-700';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      role="alert"
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border
        min-w-[280px] max-w-[400px]
        transform transition-all duration-300 ease-out
        ${getTypeStyles(toast.type)}
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
    >
      <span className="text-lg font-bold" aria-hidden="true">
        {getIcon(toast.type)}
      </span>
      <span className="flex-1 text-sm font-medium">
        {toast.message}
      </span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-white/80 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded"
        aria-label="알림 닫기"
      >
        ×
      </button>
    </div>
  );
};
