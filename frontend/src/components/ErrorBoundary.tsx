// frontend/src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Stack
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh,
  BugReport,
  ExpandMore,
  ExpandLess,
  Home
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error caught by ErrorBoundary:', error);
    console.error('📍 Error Info:', errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service (in production)
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, send to error tracking service like Sentry, LogRocket, etc.
    console.log('📊 Would log to error tracking service:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount >= 3) {
      return; // Max retries exceeded
    }

    // Progressive retry delay: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000;
    
    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1
      });
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  private getErrorMessage = (error: Error): string => {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('network')) {
      return 'Network connection error. Please check your internet connection.';
    }
    if (errorMessage.includes('chunk')) {
      return 'Application loading error. Please refresh the page.';
    }
    if (errorMessage.includes('permission')) {
      return 'Permission error. Please check your browser settings.';
    }
    if (errorMessage.includes('cors')) {
      return 'Server connection error. Please contact support if this persists.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  };

  private getRecoveryActions = (error: Error) => {
    const errorMessage = error.message.toLowerCase();
    const { retryCount } = this.state;
    
    const actions = [];
    
    // Retry action (max 3 times)
    if (retryCount < 3) {
      actions.push({
        label: `Retry ${retryCount > 0 ? `(${retryCount}/3)` : ''}`,
        icon: <Refresh />,
        action: this.handleRetry,
        variant: 'contained' as const,
        color: 'primary' as const
      });
    }
    
    // Reload action
    actions.push({
      label: 'Reload Page',
      icon: <Refresh />,
      action: this.handleReload,
      variant: 'outlined' as const,
      color: 'primary' as const
    });
    
    // Go home action
    actions.push({
      label: 'Go Home',
      icon: <Home />,
      action: this.handleGoHome,
      variant: 'outlined' as const,
      color: 'secondary' as const
    });
    
    return actions;
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails, retryCount } = this.state;
      
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const userFriendlyMessage = error ? this.getErrorMessage(error) : 'An unexpected error occurred';
      const recoveryActions = error ? this.getRecoveryActions(error) : [];

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            p: 2
          }}
        >
          <Paper
            elevation={3}
            sx={{
              maxWidth: 600,
              width: '100%',
              p: 4,
              textAlign: 'center'
            }}
          >
            {/* Error Icon and Title */}
            <Box sx={{ mb: 3 }}>
              <ErrorIcon 
                sx={{ 
                  fontSize: 64, 
                  color: 'error.main',
                  mb: 2
                }} 
              />
              <Typography variant="h4" component="h1" gutterBottom>
                Oops! Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {userFriendlyMessage}
              </Typography>
            </Box>

            {/* Retry Information */}
            {retryCount > 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Retry Attempt {retryCount}/3</AlertTitle>
                {retryCount >= 3 
                  ? 'Maximum retry attempts reached. Please reload the page or contact support.'
                  : 'Automatically retrying... If the problem persists, try reloading the page.'
                }
              </Alert>
            )}

            {/* Recovery Actions */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
              {recoveryActions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  color={action.color}
                  startIcon={action.icon}
                  onClick={action.action}
                  size="large"
                  disabled={action.label.includes('Retry') && retryCount >= 3}
                >
                  {action.label}
                </Button>
              ))}
            </Stack>

            {/* Error Details Toggle */}
            <Box sx={{ textAlign: 'left' }}>
              <Button
                startIcon={<BugReport />}
                endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
                onClick={this.toggleDetails}
                size="small"
                color="inherit"
              >
                {showDetails ? 'Hide' : 'Show'} Technical Details
              </Button>

              <Collapse in={showDetails}>
                <Paper
                  variant="outlined"
                  sx={{
                    mt: 2,
                    p: 2,
                    backgroundColor: '#f8f8f8',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    maxHeight: 200,
                    overflow: 'auto'
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Error Details:
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {error?.toString()}
                  </Typography>
                  
                  {error?.stack && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Stack Trace:
                      </Typography>
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                        {error.stack}
                      </Typography>
                    </>
                  )}

                  {errorInfo?.componentStack && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                        Component Stack:
                      </Typography>
                      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                        {errorInfo.componentStack}
                      </Typography>
                    </>
                  )}
                </Paper>
              </Collapse>
            </Box>

            {/* Help Text */}
            <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block' }}>
              If this problem continues, please contact support with the error details above.
            </Typography>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;