// frontend/src/hooks/useNetworkStatus.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { overlayAPI, APIError } from '../services/api';
import { useToast } from '../components/ToastProvider';

interface NetworkStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  retryCount: number;
}

interface UseNetworkStatusOptions {
  checkInterval?: number;
  enableToasts?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export const useNetworkStatus = (options: UseNetworkStatusOptions = {}) => {
  const {
    checkInterval = 30000, // Check every 30 seconds
    enableToasts = true,
    enableRetry = true,
    maxRetries = 3,
    retryDelay = 5000
  } = options;

  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isChecking: false,
    lastChecked: null,
    connectionQuality: 'excellent',
    retryCount: 0
  });

  const toast = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastToastIdRef = useRef<string | null>(null);

  const checkConnection = useCallback(async (): Promise<{
    isOnline: boolean;
    responseTime: number;
    quality: NetworkStatus['connectionQuality'];
  }> => {
    const startTime = Date.now();
    
    try {
      setStatus(prev => ({ ...prev, isChecking: true }));
      
      const response = await overlayAPI.healthCheck({
        timeout: 5000,
        retries: 0 // Don't retry in the hook, we'll handle it
      });
      
      const responseTime = Date.now() - startTime;
      const isOnline = response.success;
      
      // Determine connection quality based on response time
      let quality: NetworkStatus['connectionQuality'];
      if (!isOnline) {
        quality = 'offline';
      } else if (responseTime < 200) {
        quality = 'excellent';
      } else if (responseTime < 1000) {
        quality = 'good';
      } else {
        quality = 'poor';
      }

      return { isOnline, responseTime, quality };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.warn('Network check failed:', error);
      return { 
        isOnline: false, 
        responseTime,
        quality: 'offline' 
      };
    } finally {
      setStatus(prev => ({ ...prev, isChecking: false }));
    }
  }, []);

  const handleConnectionChange = useCallback((
    isOnline: boolean,
    quality: NetworkStatus['connectionQuality']
  ) => {
    const wasOnline = status.isOnline;
    
    setStatus(prev => ({
      ...prev,
      isOnline,
      connectionQuality: quality,
      lastChecked: new Date(),
      retryCount: isOnline ? 0 : prev.retryCount
    }));

    // Show toast notifications for connection changes
    if (enableToasts && wasOnline !== isOnline) {
      // Hide previous toast if exists
      if (lastToastIdRef.current) {
        toast.hideToast(lastToastIdRef.current);
      }

      if (isOnline && !wasOnline) {
        lastToastIdRef.current = toast.showSuccess(
          'Connection restored! All features are now available.',
          'Back Online',
          { duration: 4000 }
        );
      } else if (!isOnline && wasOnline) {
        lastToastIdRef.current = toast.showError(
          'Some features may not work properly while offline.',
          'Connection Lost',
          { 
            persistent: true,
            action: {
              label: 'Retry',
              onClick: () => checkAndRetry()
            }
          }
        );
      }
    }
  }, [status.isOnline, enableToasts, toast]);

  const checkAndRetry = useCallback(async () => {
    if (status.isChecking) return;

    const result = await checkConnection();
    handleConnectionChange(result.isOnline, result.quality);

    // If still offline and retry is enabled, schedule retry
    if (!result.isOnline && enableRetry && status.retryCount < maxRetries) {
      setStatus(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));
      
      retryTimeoutRef.current = setTimeout(() => {
        checkAndRetry();
      }, retryDelay * Math.pow(2, status.retryCount)); // Exponential backoff
    }
  }, [status.isChecking, status.retryCount, checkConnection, handleConnectionChange, enableRetry, maxRetries, retryDelay]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) return;

    // Initial check
    checkAndRetry();

    // Set up periodic checks
    intervalRef.current = setInterval(checkAndRetry, checkInterval);
  }, [checkAndRetry, checkInterval]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Manual retry
  const retry = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    checkAndRetry();
  }, [checkAndRetry]);

  // Browser online/offline event handlers
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Browser reports: Online');
      checkAndRetry();
    };

    const handleOffline = () => {
      console.log('🌐 Browser reports: Offline');
      handleConnectionChange(false, 'offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkAndRetry, handleConnectionChange]);

  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lastToastIdRef.current) {
        toast.hideToast(lastToastIdRef.current);
      }
    };
  }, [toast]);

  return {
    ...status,
    checkConnection: checkAndRetry,
    startMonitoring,
    stopMonitoring,
    retry
  };
};

// Hook for API error handling with network awareness
export const useAPIErrorHandler = () => {
  const toast = useToast();
  const { isOnline, connectionQuality } = useNetworkStatus({ enableToasts: false });

  const handleAPIError = useCallback((error: APIError | Error, context?: string) => {
    console.error('🚨 API Error:', error);

    let title = 'Operation Failed';
    let message = 'An unexpected error occurred';
    let isRetryable = false;

    if ('code' in error && error.code) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          title = 'Network Error';
          message = isOnline 
            ? 'Unable to connect to server. Please try again.'
            : 'You appear to be offline. Please check your connection.';
          isRetryable = true;
          break;
        
        case 'TIMEOUT_ERROR':
          title = 'Request Timeout';
          message = connectionQuality === 'poor'
            ? 'Request timed out due to slow connection. Please try again.'
            : 'Request timed out. Please try again.';
          isRetryable = true;
          break;
        
        case 'SERVER_ERROR':
          title = 'Server Error';
          message = 'Server is experiencing issues. Please try again in a few moments.';
          isRetryable = true;
          break;
        
        case 'CLIENT_ERROR':
          title = 'Request Error';
          message = error.message || 'Invalid request. Please check your input and try again.';
          isRetryable = false;
          break;
        
        default:
          message = error.message || 'Unknown error occurred';
      }
    } else {
      message = error.message || 'Unknown error occurred';
    }

    if (context) {
      message = `${context}: ${message}`;
    }

    return toast.showError(message, title, {
      action: isRetryable ? {
        label: 'Retry',
        onClick: () => {
          // This will be overridden by the calling component
          console.log('Retry clicked');
        }
      } : undefined
    });
  }, [toast, isOnline, connectionQuality]);

  return { handleAPIError };
};