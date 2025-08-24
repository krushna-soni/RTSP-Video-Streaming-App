// frontend/src/components/ToastProvider.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  Stack,
  IconButton,
  LinearProgress,
  Box,
  Typography
} from '@mui/material';
import {
  Close,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Info,
  CloudUpload,
  CloudDone,
  Wifi,
  WifiOff,
  Refresh
} from '@mui/icons-material';
import { SlideProps } from '@mui/material/Slide';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: number;
  persistent?: boolean;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  showSuccess: (message: string, title?: string, options?: Partial<Toast>) => string;
  showError: (message: string, title?: string, options?: Partial<Toast>) => string;
  showWarning: (message: string, title?: string, options?: Partial<Toast>) => string;
  showInfo: (message: string, title?: string, options?: Partial<Toast>) => string;
  showProgress: (message: string, progress: number, title?: string) => string;
  showNetworkStatus: (isOnline: boolean) => string;
  showOperationStatus: (operation: string, status: 'loading' | 'success' | 'error', details?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new globalThis.Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const SlideTransition = (props: SlideProps) => {
  return <Slide {...props} direction="up" />;
};

const getToastIcon = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle />;
    case 'error':
      return <ErrorIcon />;
    case 'warning':
      return <Warning />;
    case 'info':
    default:
      return <Info />;
  }
};

const getToastColor = (type: Toast['type']) => {
  switch (type) {
    case 'success':
      return 'success';
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'info';
  }
};

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ 
  children, 
  maxToasts = 3 
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const showToast = useCallback((toastData: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: 6000,
      ...toastData
    };

    setToasts(prev => {
      // Remove oldest toasts if we exceed maxToasts
      const updatedToasts = prev.length >= maxToasts 
        ? prev.slice(-(maxToasts - 1))
        : prev;
      
      return [...updatedToasts, newToast];
    });

    // Auto-hide toast after duration (unless persistent)
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }

    return id;
  }, [maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  const showSuccess = useCallback((message: string, title?: string, options?: Partial<Toast>) => {
    return showToast({ 
      type: 'success', 
      message, 
      title,
      ...options 
    });
  }, [showToast]);

  const showError = useCallback((message: string, title?: string, options?: Partial<Toast>) => {
    return showToast({ 
      type: 'error', 
      message, 
      title,
      duration: 8000, // Errors stay longer
      ...options 
    });
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string, options?: Partial<Toast>) => {
    return showToast({ 
      type: 'warning', 
      message, 
      title,
      ...options 
    });
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string, options?: Partial<Toast>) => {
    return showToast({ 
      type: 'info', 
      message, 
      title,
      ...options 
    });
  }, [showToast]);

  const showProgress = useCallback((message: string, progress: number, title?: string) => {
    return showToast({
      type: 'info',
      message,
      title,
      progress,
      persistent: progress < 100,
      duration: progress >= 100 ? 3000 : 0
    });
  }, [showToast]);

  const showNetworkStatus = useCallback((isOnline: boolean) => {
    return showToast({
      type: isOnline ? 'success' : 'error',
      title: isOnline ? 'Connection Restored' : 'Connection Lost',
      message: isOnline 
        ? 'Internet connection has been restored' 
        : 'Please check your internet connection',
      duration: isOnline ? 4000 : 0,
      persistent: !isOnline
    });
  }, [showToast]);

  const showOperationStatus = useCallback((
    operation: string, 
    status: 'loading' | 'success' | 'error', 
    details?: string
  ) => {
    const getOperationMessage = () => {
      switch (status) {
        case 'loading':
          return `${operation} in progress...`;
        case 'success':
          return `${operation} completed successfully`;
        case 'error':
          return `${operation} failed`;
      }
    };

    return showToast({
      type: status === 'loading' ? 'info' : status === 'success' ? 'success' : 'error',
      title: getOperationMessage(),
      message: details || '',
      persistent: status === 'loading',
      duration: status === 'loading' ? 0 : status === 'success' ? 4000 : 8000
    });
  }, [showToast]);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    updateToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showProgress,
    showNetworkStatus,
    showOperationStatus
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Toast Container */}
      <Stack
        spacing={1}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          maxWidth: 400,
          width: '100%',
          '@media (max-width: 600px)': {
            left: 16,
            right: 16,
            bottom: 16,
            maxWidth: 'none'
          }
        }}
      >
        {toasts.map((toast) => (
          <Snackbar
            key={toast.id}
            open={true}
            TransitionComponent={SlideTransition}
            sx={{ position: 'static', transform: 'none' }}
          >
            <Alert
              severity={getToastColor(toast.type)}
              variant="filled"
              sx={{
                width: '100%',
                alignItems: 'flex-start',
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
              action={
                <Stack direction="row" spacing={1} alignItems="center">
                  {toast.action && (
                    <IconButton
                      size="small"
                      onClick={toast.action.onClick}
                      sx={{ color: 'inherit' }}
                      title={toast.action.label}
                    >
                      <Refresh />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => hideToast(toast.id)}
                    sx={{ color: 'inherit' }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <Box sx={{ width: '100%' }}>
                {toast.title && (
                  <AlertTitle sx={{ mb: 1 }}>{toast.title}</AlertTitle>
                )}
                <Typography variant="body2">{toast.message}</Typography>
                
                {/* Progress Bar */}
                {typeof toast.progress === 'number' && (
                  <Box sx={{ mt: 1, width: '100%' }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={toast.progress}
                      sx={{ 
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'rgba(255,255,255,0.8)'
                        }
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        display: 'block', 
                        textAlign: 'center', 
                        mt: 0.5,
                        opacity: 0.9
                      }}
                    >
                      {Math.round(toast.progress)}%
                    </Typography>
                  </Box>
                )}
              </Box>
            </Alert>
          </Snackbar>
        ))}
      </Stack>
    </ToastContext.Provider>
  );
};