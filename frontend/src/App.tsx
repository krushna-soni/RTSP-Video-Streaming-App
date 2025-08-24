// frontend/src/App.tsx 
import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Alert, Chip, Stack, Typography, useMediaQuery, Drawer, IconButton, AppBar, Toolbar } from '@mui/material';
import { Wifi, WifiOff, Circle, Menu, Close } from '@mui/icons-material';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastProvider';
import LandingPage from './components/LandingPage';
import { healthCheck, testDatabase, APIResponse } from './services/api';
import { useNetworkStatus } from './hooks/useNetworkStatus';

// Enhanced responsive theme
const createResponsiveTheme = (isMobile: boolean) => createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    success: {
      main: '#2e7d32',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    // Responsive typography scaling
    h1: {
      fontSize: isMobile ? '2rem' : '3rem',
    },
    h2: {
      fontSize: isMobile ? '1.75rem' : '2.5rem',
    },
    h3: {
      fontSize: isMobile ? '1.5rem' : '2rem',
    },
    h4: {
      fontSize: isMobile ? '1.25rem' : '1.75rem',
    },
    h5: {
      fontSize: isMobile ? '1.125rem' : '1.5rem',
    },
    h6: {
      fontSize: isMobile ? '1rem' : '1.25rem',
    },
    body1: {
      fontSize: isMobile ? '0.875rem' : '1rem',
    },
    body2: {
      fontSize: isMobile ? '0.75rem' : '0.875rem',
    },
  },
  spacing: isMobile ? 4 : 8, // Tighter spacing on mobile
  components: {
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: isMobile ? '0.75rem' : '0.875rem',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          minHeight: isMobile ? 42 : 36, // Larger touch targets on mobile
          fontSize: isMobile ? '0.875rem' : '0.875rem',
          padding: isMobile ? '8px 16px' : '6px 16px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontSize: isMobile ? '0.75rem' : '0.8125rem',
          height: isMobile ? 28 : 32,
        },
        sizeSmall: {
          fontSize: isMobile ? '0.6875rem' : '0.75rem',
          height: isMobile ? 24 : 28,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          padding: isMobile ? 12 : 8, // Larger touch targets
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: isMobile ? '16px' : '14px', // Prevent zoom on iOS
            minHeight: isMobile ? 48 : 40,
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: isMobile ? 6 : 4,
          '& .MuiSlider-thumb': {
            width: isMobile ? 20 : 16,
            height: isMobile ? 20 : 16,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: isMobile ? '0.75rem' : '0.6875rem',
        },
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

// Mobile-optimized System Status Component
const MobileSystemStatusBar: React.FC<{
  backendStatus: 'loading' | 'connected' | 'error';
  dbStatus: 'loading' | 'connected' | 'error';
  networkStatus: ReturnType<typeof useNetworkStatus>;
  isMobile: boolean;
}> = ({ backendStatus, dbStatus, networkStatus, isMobile }) => {
  const systemReady = backendStatus === 'connected' && dbStatus === 'connected' && networkStatus.isOnline;

  const getStatusIcon = (status: string) => {
    const size = isMobile ? 10 : 12;
    switch (status) {
      case 'connected':
        return <Circle sx={{ color: 'success.main', fontSize: size }} />;
      case 'error':
        return <Circle sx={{ color: 'error.main', fontSize: size }} />;
      default:
        return <Circle sx={{ color: 'warning.main', fontSize: size }} />;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'info';
      case 'poor':
        return 'warning';
      default:
        return 'error';
    }
  };

  if (systemReady) {
    return (
      <Alert 
        severity="success" 
        sx={{ 
          mb: 0, 
          py: isMobile ? 0.5 : 1,
          '& .MuiAlert-message': {
            py: 0
          }
        }}
        icon={<Wifi sx={{ fontSize: isMobile ? 18 : 24 }} />}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? 1 : 2,
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          <Typography variant="body2" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            ✅ {isMobile ? 'System Ready' : 'System Ready - All services operational'}
          </Typography>
          {!isMobile && (
            <Stack direction="row" spacing={1}>
              <Chip 
                size="small" 
                label={`Connection: ${networkStatus.connectionQuality}`}
                color={getQualityColor(networkStatus.connectionQuality) as any}
                variant="outlined"
              />
            </Stack>
          )}
        </Box>
      </Alert>
    );
  }

  return (
    <Alert 
      severity={backendStatus === 'error' || dbStatus === 'error' || !networkStatus.isOnline ? 'error' : 'warning'}
      sx={{ 
        mb: 0, 
        py: isMobile ? 0.5 : 1,
        '& .MuiAlert-message': {
          py: 0
        }
      }}
      icon={networkStatus.isOnline ? <Wifi sx={{ fontSize: isMobile ? 18 : 24 }} /> : <WifiOff sx={{ fontSize: isMobile ? 18 : 24 }} />}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        width: '100%',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0
      }}>
        <Typography variant="body2" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
          {isMobile ? 'System Check' : 'System Status Check'}
        </Typography>
        
        <Stack direction="row" spacing={isMobile ? 0.5 : 1} alignItems="center" flexWrap="wrap">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getStatusIcon(backendStatus)}
            <Typography variant="caption" sx={{ fontSize: isMobile ? '0.625rem' : '0.75rem' }}>
              API
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getStatusIcon(dbStatus)}
            <Typography variant="caption" sx={{ fontSize: isMobile ? '0.625rem' : '0.75rem' }}>
              DB
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {networkStatus.isOnline ? (
              <Circle sx={{ color: 'success.main', fontSize: isMobile ? 10 : 12 }} />
            ) : (
              <Circle sx={{ color: 'error.main', fontSize: isMobile ? 10 : 12 }} />
            )}
            <Typography variant="caption" sx={{ fontSize: isMobile ? '0.625rem' : '0.75rem' }}>
              {networkStatus.isOnline ? 'Online' : 'Offline'}
            </Typography>
          </Box>
          
          {networkStatus.isChecking && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: isMobile ? '0.625rem' : '0.75rem' }}>
              Checking...
            </Typography>
          )}
        </Stack>
      </Box>
    </Alert>
  );
};

// Main App Component with responsive wrapper
const AppContent: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [dbStatus, setDbStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);

  // Responsive detection
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:900px)');
  const isLargeScreen = useMediaQuery('(min-width:1200px)');

  // Use network status hook with mobile-optimized settings
  const networkStatus = useNetworkStatus({
    checkInterval: isMobile ? 45000 : 30000, // Less frequent checks on mobile to save battery
    enableToasts: true,
    enableRetry: true
  });

  // System health check
  useEffect(() => {
    const performHealthCheck = async () => {
      try {
        // Backend health check with mobile-optimized timeout
        const healthResponse = await healthCheck({ 
          timeout: isMobile ? 8000 : 5000, 
          retries: isMobile ? 2 : 1 
        });
        if (healthResponse.success) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (error) {
        console.error('Backend health check failed:', error);
        setBackendStatus('error');
      }

      try {
        // Database test with mobile-optimized timeout
        const dbResponse = await testDatabase({ 
          timeout: isMobile ? 8000 : 5000, 
          retries: isMobile ? 2 : 1 
        });
        if (dbResponse.success) {
          setDbStatus('connected');
        } else {
          setDbStatus('error');
        }
      } catch (error) {
        console.error('Database test failed:', error);
        setDbStatus('error');
      } finally {
        setInitialCheckComplete(true);
      }
    };

    performHealthCheck();
  }, [isMobile]);

  // Show mobile-optimized loading state
  if (!initialCheckComplete) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: isMobile ? 2 : 3
      }}>
        <Alert severity="info">
          <Typography variant="body2" sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
            🔍 {isMobile ? 'Checking status...' : 'Checking system status...'}
          </Typography>
        </Alert>
      </Box>
    );
  }

  const theme = createResponsiveTheme(isMobile);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh' }}>
        {/* Mobile-optimized System Status Bar */}
        <MobileSystemStatusBar 
          backendStatus={backendStatus}
          dbStatus={dbStatus}
          networkStatus={networkStatus}
          isMobile={isMobile}
        />
        
        {/* Main Application with responsive context */}
        <LandingPage 
          isMobile={isMobile}
          isTablet={isTablet}
          isLargeScreen={isLargeScreen}
        />
      </Box>
    </ThemeProvider>
  );
};

function App() {
  // Mobile-specific error handling
  const isMobile = useMediaQuery('(max-width:600px)');

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to external service in production
    console.error('🚨 Global Error:', error, errorInfo);
    
    // Mobile-specific error tracking
    if (isMobile) {
      console.log('📱 Mobile error context:', {
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        orientation: window.screen?.orientation?.type || 'unknown',
        touchSupport: 'ontouchstart' in window,
        userAgent: navigator.userAgent
      });
    }
    
    // You could send to error tracking service here
    // Example: Sentry.captureException(error, { 
    //   contexts: { react: errorInfo, mobile: { isMobile, viewport: ... } } 
    // });
  };

  return (
    <ErrorBoundary onError={handleError}>
      <CssBaseline />
      <ToastProvider maxToasts={isMobile ? 2 : 4}>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
