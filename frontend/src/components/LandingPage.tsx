// frontend/src/components/LandingPage.tsx - MOBILE RESPONSIVE VERSION
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Chip,
  AppBar,
  Toolbar,
  Skeleton,
  Stack,
  Drawer,
  IconButton,
  useMediaQuery,
  SwipeableDrawer,
  Fab,
  Collapse,
  Card,
  CardContent,
  CardActions,
  Divider
} from '@mui/material';
import {
  PlayCircle,
  Add,
  List,
  CleaningServices,
  Refresh,
  Warning,
  Menu,
  Close,
  Settings,
  ExpandMore,
  ExpandLess,
  TouchApp,
  Smartphone,
  Computer
} from '@mui/icons-material';
import VideoPlayer from './VideoPlayer';
import { overlayAPI, Overlay, APIError } from '../services/api';
import { useToast } from './ToastProvider';
import { useAPIErrorHandler } from '../hooks/useNetworkStatus';

// Define responsive props interface
interface ResponsiveLandingPageProps {
  isMobile?: boolean;
  isTablet?: boolean;
  isLargeScreen?: boolean;
}

// Define the processed overlay type for the VideoPlayer
interface ProcessedOverlay {
  _id: string;
  name: string;
  type: 'text' | 'logo';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: Record<string, any>;
}

// Mobile-optimized Loading skeleton component
const ResponsiveOverlaySkeleton: React.FC<{ isMobile: boolean }> = ({ isMobile }) => (
  <Stack spacing={isMobile ? 0.5 : 1}>
    {[1, 2, 3].map((i) => (
      <Box key={i} sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: isMobile ? 0.5 : 1,
        p: isMobile ? 1 : 0
      }}>
        <Skeleton variant="circular" width={isMobile ? 16 : 20} height={isMobile ? 16 : 20} />
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="rectangular" width={isMobile ? 50 : 60} height={isMobile ? 20 : 24} />
      </Box>
    ))}
  </Stack>
);

// Mobile Control Panel Component
const MobileControlPanel: React.FC<{
  open: boolean;
  onClose: () => void;
  overlays: Overlay[];
  loading: boolean;
  problematicOverlaysCount: number;
  onCreateTestOverlay: () => void;
  onCreateTestLogoOverlay: () => void;
  onInitSampleData: () => void;
  onRefreshOverlays: () => void;
  onCleanupProblematicOverlays: () => void;
  onToggleOverlaysVisibility: () => void;
  overlaysVisible: boolean;
  rtspUrl: string;
  retryCount: number;
}> = ({ 
  open, 
  onClose, 
  overlays, 
  loading, 
  problematicOverlaysCount,
  onCreateTestOverlay,
  onCreateTestLogoOverlay,
  onInitSampleData,
  onRefreshOverlays,
  onCleanupProblematicOverlays,
  onToggleOverlaysVisibility,
  overlaysVisible,
  rtspUrl,
  retryCount
}) => {
  const [expandedSection, setExpandedSection] = useState<'overlays' | 'actions' | 'stats' | null>('overlays');

  const toggleSection = (section: 'overlays' | 'actions' | 'stats') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen={false}
      PaperProps={{
        sx: {
          maxHeight: '80vh',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        }
      }}
    >
      <Box sx={{ 
        width: '100%', 
        p: 2,
        overflow: 'auto'
      }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Settings />
            <Typography variant="h6">
              Stream Controls
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Overlays Section */}
        <Card elevation={0} sx={{ mb: 2, backgroundColor: '#f8f9fa' }}>
          <CardContent sx={{ pb: 1 }}>
            <Box 
              onClick={() => toggleSection('overlays')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Active Overlays ({overlays.length})
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleOverlaysVisibility();
                  }}
                  sx={{ minWidth: 60 }}
                >
                  {overlaysVisible ? 'Hide' : 'Show'}
                </Button>
                {expandedSection === 'overlays' ? <ExpandLess /> : <ExpandMore />}
              </Box>
            </Box>
            
            <Collapse in={expandedSection === 'overlays'}>
              <Box sx={{ mt: 2 }}>
                {loading ? (
                  <ResponsiveOverlaySkeleton isMobile={true} />
                ) : overlays.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No overlays created yet
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {overlays.map((overlay) => {
                      const isProblematic = overlay.content && (
                        overlay.content.includes('via.placeholder.com') ||
                        overlay.content.includes('picsum.photos') ||
                        overlay.content.includes('httpbin.org')
                      );
                      
                      return (
                        <Chip
                          key={overlay._id}
                          label={`${overlay.name} (${overlay.type})`}
                          variant="outlined"
                          size="small"
                          color={
                            isProblematic 
                              ? 'error' 
                              : overlay.type === 'text' 
                                ? 'primary' 
                                : 'secondary'
                          }
                          sx={{ 
                            justifyContent: 'flex-start',
                            width: '100%',
                            maxWidth: '100%'
                          }}
                          icon={isProblematic ? <Warning /> : undefined}
                        />
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>

        {/* Quick Actions Section */}
        <Card elevation={0} sx={{ mb: 2, backgroundColor: '#f0f4f8' }}>
          <CardContent sx={{ pb: 1 }}>
            <Box 
              onClick={() => toggleSection('actions')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
              {expandedSection === 'actions' ? <ExpandLess /> : <ExpandMore />}
            </Box>
            
            <Collapse in={expandedSection === 'actions'}>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={onCreateTestOverlay}
                  fullWidth
                  disabled={loading}
                  size="large"
                >
                  Add Text Overlay
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={onCreateTestLogoOverlay}
                  fullWidth
                  disabled={loading}
                  size="large"
                >
                  Add Logo Overlay
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={onInitSampleData}
                    fullWidth
                    disabled={loading}
                    size="medium"
                  >
                    Sample Data
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
                    onClick={onRefreshOverlays}
                    fullWidth
                    disabled={loading}
                    size="medium"
                  >
                    Refresh
                  </Button>
                </Box>

                {problematicOverlaysCount > 0 && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<CleaningServices />}
                    onClick={onCleanupProblematicOverlays}
                    fullWidth
                    disabled={loading}
                    size="large"
                  >
                    Fix Issues ({problematicOverlaysCount})
                  </Button>
                )}
              </Stack>
            </Collapse>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <Card elevation={0} sx={{ backgroundColor: '#f5f5f5' }}>
          <CardContent sx={{ pb: 1 }}>
            <Box 
              onClick={() => toggleSection('stats')}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Stream Status
              </Typography>
              {expandedSection === 'stats' ? <ExpandLess /> : <ExpandMore />}
            </Box>
            
            <Collapse in={expandedSection === 'stats'}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  URL: {rtspUrl ? 'Set' : 'Not set'}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overlays: {overlays.length} active
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Status: {rtspUrl ? 'Ready' : 'Waiting for URL'}
                </Typography>
                {problematicOverlaysCount > 0 && (
                  <Typography variant="body2" color="error" gutterBottom>
                    Issues: {problematicOverlaysCount} problematic overlays
                  </Typography>
                )}
                {retryCount > 0 && (
                  <Typography variant="body2" color="warning.main">
                    Retrying: Attempt {retryCount}
                  </Typography>
                )}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    </SwipeableDrawer>
  );
};

const LandingPage: React.FC<ResponsiveLandingPageProps> = ({ 
  isMobile = false, 
  isTablet = false, 
  isLargeScreen = false 
}) => {
  const [rtspUrl, setRtspUrl] = useState('');
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [loading, setLoading] = useState(false);
  const [overlaysVisible, setOverlaysVisible] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [lastOperation, setLastOperation] = useState<string>('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Use media queries for more granular responsive design
  const isVerySmall = useMediaQuery('(max-width:480px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const toast = useToast();
  const { handleAPIError } = useAPIErrorHandler();

  // Enhanced error handling wrapper with mobile optimization
  const withErrorHandling = useCallback(async <T,>(
    operation: () => Promise<T>,
    operationName: string,
    showSuccessToast: boolean = false
  ): Promise<T | null> => {
    try {
      setLastOperation(operationName);
      const result = await operation();
      
      if (showSuccessToast) {
        toast.showSuccess(
          `${operationName} completed successfully`,
          undefined,
          { duration: isMobile ? 3000 : 4000 }
        );
      }
      
      setRetryCount(0);
      return result;
    } catch (error) {
      console.error(`${operationName} failed:`, error);
      
      const toastId = handleAPIError(error as APIError, operationName);
      
      if (error instanceof Error && 'retryable' in error && error.retryable) {
        toast.updateToast(toastId, {
          action: {
            label: 'Retry',
            onClick: () => {
              setRetryCount(prev => prev + 1);
            }
          }
        });
      }
      
      return null;
    }
  }, [handleAPIError, toast, isMobile]);

  // Load overlays with mobile optimization
  const loadOverlays = useCallback(async () => {
    setLoading(true);
    
    const result = await withErrorHandling(
      async () => {
        const response = await overlayAPI.getAll({
          timeout: isMobile ? 10000 : 7000, // Longer timeout on mobile
          retries: isMobile ? 2 : 3
        });
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to load overlays');
      },
      'Loading overlays'
    );
    
    if (result) {
      setOverlays(result);
    }
    
    setLoading(false);
  }, [withErrorHandling, isMobile]);

  // Create test text overlay with mobile optimization
  const handleCreateTestOverlay = useCallback(async () => {
    const progressToastId = toast.showOperationStatus('Creating text overlay', 'loading');
    
    const result = await withErrorHandling(
      async () => {
        const response = await overlayAPI.create({
          name: `Welcome Text ${Date.now()}`,
          type: 'text',
          content: 'Welcome to RTSP Stream!',
          position: { x: isMobile ? 5 : 10, y: isMobile ? 5 : 10 },
          size: { 
            width: isMobile ? 35 : 25, 
            height: isMobile ? 12 : 8 
          },
          style: {
            color: '#ffffff',
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: isMobile ? '8px' : '10px',
            borderRadius: '5px'
          }
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to create overlay');
        }
        
        return response.data;
      },
      'Creating text overlay',
      true
    );
    
    toast.hideToast(progressToastId);
    
    if (result) {
      toast.showOperationStatus('Creating text overlay', 'success', 'Text overlay added to stream');
      await loadOverlays();
      if (isMobile) setMobileDrawerOpen(false);
    } else {
      toast.showOperationStatus('Creating text overlay', 'error', 'Please try again');
    }
  }, [withErrorHandling, toast, loadOverlays, isMobile]);

  // Create test logo overlay with mobile optimization
  const handleCreateTestLogoOverlay = useCallback(async () => {
    const progressToastId = toast.showOperationStatus('Creating logo overlay', 'loading');
    
    const result = await withErrorHandling(
      async () => {
        const logoSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
          <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#1976d2;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#1565c0;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="120" height="40" fill="url(#grad1)" stroke="#0d47a1" stroke-width="1" rx="6"/>
            <text x="60" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="white" font-weight="bold">LOGO</text>
          </svg>
        `)}`;
        
        const response = await overlayAPI.create({
          name: `Logo ${Date.now()}`,
          type: 'logo',
          content: logoSvg,
          position: { x: isMobile ? 60 : 75, y: 5 },
          size: { 
            width: isMobile ? 20 : 15, 
            height: isMobile ? 8 : 5 
          },
          style: {
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }
        });
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to create overlay');
        }
        
        return response.data;
      },
      'Creating logo overlay',
      true
    );
    
    toast.hideToast(progressToastId);
    
    if (result) {
      toast.showOperationStatus('Creating logo overlay', 'success', 'Logo overlay added to stream');
      await loadOverlays();
      if (isMobile) setMobileDrawerOpen(false);
    } else {
      toast.showOperationStatus('Creating logo overlay', 'error', 'Please try again');
    }
  }, [withErrorHandling, toast, loadOverlays, isMobile]);

  // Initialize sample data with mobile feedback
  const handleInitSampleData = useCallback(async () => {
    const progressToastId = toast.showOperationStatus('Initializing sample data', 'loading');
    
    const result = await withErrorHandling(
      async () => {
        const response = await overlayAPI.initSampleData({
          timeout: isMobile ? 20000 : 15000 // Longer timeout on mobile
        });
        if (!response.success) {
          throw new Error(response.error || 'Failed to initialize sample data');
        }
        return response.data;
      },
      'Initializing sample data',
      true
    );
    
    toast.hideToast(progressToastId);
    
    if (result) {
      toast.showOperationStatus(
        'Initializing sample data', 
        'success', 
        `Created ${result.inserted_count} sample overlays`
      );
      await loadOverlays();
      if (isMobile) setMobileDrawerOpen(false);
    } else {
      toast.showOperationStatus('Initializing sample data', 'error', 'Please try again');
    }
  }, [withErrorHandling, toast, loadOverlays, isMobile]);

  // Cleanup problematic overlays
  const handleCleanupProblematicOverlays = useCallback(async () => {
    const progressToastId = toast.showOperationStatus('Cleaning up overlays', 'loading');
    
    const result = await withErrorHandling(
      async () => {
        const response = await overlayAPI.cleanupOverlays({
          timeout: isMobile ? 20000 : 15000
        });
        if (!response.success) {
          throw new Error(response.error || 'Failed to cleanup overlays');
        }
        return response.data;
      },
      'Cleaning up problematic overlays',
      true
    );
    
    toast.hideToast(progressToastId);
    
    if (result) {
      toast.showOperationStatus(
        'Cleaning up overlays', 
        'success', 
        `Removed ${result.deleted_count} problematic overlays`
      );
      await loadOverlays();
      if (isMobile) setMobileDrawerOpen(false);
    } else {
      toast.showOperationStatus('Cleaning up overlays', 'error', 'Please try again');
    }
  }, [withErrorHandling, toast, loadOverlays, isMobile]);

  // Refresh overlays with mobile feedback
  const handleRefreshOverlays = useCallback(async () => {
    toast.showInfo(
      'Refreshing overlays...', 
      'Updating', 
      { duration: isMobile ? 1500 : 2000 }
    );
    await loadOverlays();
    if (isMobile) setMobileDrawerOpen(false);
  }, [loadOverlays, toast, isMobile]);

  // Load overlays on component mount
  useEffect(() => {
    loadOverlays();
  }, [loadOverlays]);

  // Retry mechanism when retryCount changes
  useEffect(() => {
    if (retryCount > 0 && lastOperation) {
      toast.showInfo(`Retrying ${lastOperation}... (Attempt ${retryCount})`, 'Retrying');
      
      switch (lastOperation) {
        case 'Loading overlays':
          loadOverlays();
          break;
        case 'Creating text overlay':
          handleCreateTestOverlay();
          break;
        case 'Creating logo overlay':
          handleCreateTestLogoOverlay();
          break;
        case 'Initializing sample data':
          handleInitSampleData();
          break;
        case 'Cleaning up problematic overlays':
          handleCleanupProblematicOverlays();
          break;
      }
    }
  }, [retryCount, lastOperation, loadOverlays, handleCreateTestOverlay, handleCreateTestLogoOverlay, handleInitSampleData, handleCleanupProblematicOverlays, toast]);

  // Process overlays for video player
  const processedOverlays: ProcessedOverlay[] = overlays
    .filter((overlay): overlay is Overlay & { _id: string } => overlay._id !== undefined)
    .map(overlay => ({
      ...overlay,
      _id: overlay._id as string
    }));

  // Count problematic overlays
  const problematicOverlaysCount = overlays.filter(overlay => 
    overlay.content && (
      overlay.content.includes('via.placeholder.com') ||
      overlay.content.includes('picsum.photos') ||
      overlay.content.includes('httpbin.org')
    )
  ).length;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Responsive App Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar sx={{ minHeight: isMobile ? 56 : 64 }}>
          <PlayCircle sx={{ mr: isMobile ? 1 : 2, fontSize: isMobile ? 20 : 24 }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: isMobile ? '1rem' : '1.25rem',
              fontWeight: isMobile ? 500 : 400
            }}
          >
            {isMobile ? 'RTSP Stream' : 'RTSP Streaming Application'}
          </Typography>
          
          {/* Mobile: Menu Button */}
          {isMobile ? (
            <IconButton 
              color="inherit" 
              onClick={() => setMobileDrawerOpen(true)}
              size="large"
            >
              <Menu />
            </IconButton>
          ) : (
            /* Desktop: Status Indicators */
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {retryCount > 0 && (
                <Chip 
                  size="small" 
                  label={`Retrying (${retryCount})`} 
                  color="warning" 
                  variant="outlined"
                />
              )}
              <Chip 
                size="small" 
                label={overlays.length > 0 ? `${overlays.length} Overlays` : 'No Overlays'} 
                color="primary" 
                variant="outlined"
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container 
        maxWidth={isMobile ? "sm" : "xl"} 
        sx={{ 
          py: isMobile ? 2 : 4,
          px: isMobile ? 1 : 3
        }}
      >
        {/* Responsive Header Section */}
        <Box sx={{ textAlign: 'center', mb: isMobile ? 2 : 4 }}>
          <Typography 
            variant={isMobile ? "h4" : "h3"} 
            component="h1" 
            gutterBottom
            sx={{ fontWeight: isMobile ? 600 : 400 }}
          >
            {isMobile ? 'Live RTSP Stream' : 'Live RTSP Video Streaming'}
          </Typography>
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            color="text.secondary" 
            paragraph
          >
            {isMobile 
              ? 'Stream with custom overlays'
              : 'Stream RTSP video with custom overlays and controls'
            }
          </Typography>
          
          {/* Mobile Status Chips */}
          {isMobile && (
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
              <Chip 
                size="small" 
                label={overlays.length > 0 ? `${overlays.length} Overlays` : 'No Overlays'} 
                color="primary" 
                variant="outlined"
              />
              {retryCount > 0 && (
                <Chip 
                  size="small" 
                  label={`Retrying (${retryCount})`} 
                  color="warning" 
                  variant="outlined"
                />
              )}
            </Stack>
          )}
        </Box>

        {/* Show warning if problematic overlays exist */}
        {problematicOverlaysCount > 0 && (
          <Alert 
            severity="warning" 
            sx={{ 
              mb: isMobile ? 2 : 3,
              '& .MuiAlert-message': {
                fontSize: isMobile ? '0.8rem' : '0.875rem'
              }
            }}
            icon={<Warning sx={{ fontSize: isMobile ? 18 : 24 }} />}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={handleCleanupProblematicOverlays}
                startIcon={<CleaningServices />}
                sx={{ fontSize: isMobile ? '0.75rem' : '0.8125rem' }}
              >
                Fix Now
              </Button>
            }
          >
            Found {problematicOverlaysCount} overlay(s) with problematic URLs that may cause network errors.
          </Alert>
        )}

        {/* Responsive Main Layout */}
        <Box sx={{ 
          display: 'flex', 
          gap: isMobile ? 0 : isTablet ? 3 : 4, 
          flexDirection: isMobile ? 'column' : isTablet ? 'column' : 'row'
        }}>
          {/* Main Video Player Section */}
          <Box sx={{ 
            flex: isMobile ? '1 1 auto' : isTablet ? '1 1 auto' : '2 1 0%', 
            minWidth: 0,
            mb: isMobile ? 2 : 0
          }}>
            <VideoPlayer
              rtspUrl={rtspUrl}
              onRtspUrlChange={setRtspUrl}
              overlays={overlaysVisible ? processedOverlays : []}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </Box>

          {/* Desktop: Overlay Management Panel */}
          {!isMobile && !isTablet && (
            <Box sx={{ flex: '1 1 0%', minWidth: '300px' }}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <List sx={{ mr: 1 }} />
                  <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                    Overlay Management
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setOverlaysVisible(!overlaysVisible)}
                  >
                    {overlaysVisible ? 'Hide' : 'Show'}
                  </Button>
                </Box>

                {/* Overlay List */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Active Overlays ({overlays.length})
                  </Typography>
                  
                  {loading ? (
                    <ResponsiveOverlaySkeleton isMobile={false} />
                  ) : overlays.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No overlays created yet
                    </Typography>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {overlays.map((overlay) => {
                        const isProblematic = overlay.content && (
                          overlay.content.includes('via.placeholder.com') ||
                          overlay.content.includes('picsum.photos') ||
                          overlay.content.includes('httpbin.org')
                        );
                        
                        return (
                          <Chip
                            key={overlay._id}
                            label={`${overlay.name} (${overlay.type})`}
                            variant="outlined"
                            color={
                              isProblematic 
                                ? 'error' 
                                : overlay.type === 'text' 
                                  ? 'primary' 
                                  : 'secondary'
                            }
                            sx={{ justifyContent: 'flex-start' }}
                            icon={isProblematic ? <Warning /> : undefined}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Box>

                {/* Quick Actions */}
                <Stack spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={handleCreateTestOverlay}
                    fullWidth
                    disabled={loading}
                  >
                    Add Test Text Overlay
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleCreateTestLogoOverlay}
                    fullWidth
                    disabled={loading}
                  >
                    Add Test Logo Overlay
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleInitSampleData}
                    fullWidth
                    disabled={loading}
                  >
                    Initialize Sample Data
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
                    onClick={handleRefreshOverlays}
                    fullWidth
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Refresh Overlays'}
                  </Button>

                  {problematicOverlaysCount > 0 && (
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<CleaningServices />}
                      onClick={handleCleanupProblematicOverlays}
                      fullWidth
                      disabled={loading}
                    >
                      Clean Up Problem Overlays ({problematicOverlaysCount})
                    </Button>
                  )}
                </Stack>

                {/* Stats */}
                <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Stream Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    URL: {rtspUrl ? 'Set' : 'No URL set'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overlays: {overlays.length} active
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {rtspUrl ? 'Ready' : 'Waiting for URL'}
                  </Typography>
                  {problematicOverlaysCount > 0 && (
                    <Typography variant="body2" color="error">
                      Issues: {problematicOverlaysCount} problematic overlays
                    </Typography>
                  )}
                  {retryCount > 0 && (
                    <Typography variant="body2" color="warning.main">
                      Retrying: Attempt {retryCount}
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Box>
          )}
        </Box>

        {/* Mobile/Tablet: Floating Action Button */}
        {(isMobile || isTablet) && (
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 1000
            }}
            onClick={() => setMobileDrawerOpen(true)}
          >
            <Settings />
          </Fab>
        )}

        {/* Mobile Control Panel */}
        <MobileControlPanel
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          overlays={overlays}
          loading={loading}
          problematicOverlaysCount={problematicOverlaysCount}
          onCreateTestOverlay={handleCreateTestOverlay}
          onCreateTestLogoOverlay={handleCreateTestLogoOverlay}
          onInitSampleData={handleInitSampleData}
          onRefreshOverlays={handleRefreshOverlays}
          onCleanupProblematicOverlays={handleCleanupProblematicOverlays}
          onToggleOverlaysVisibility={() => setOverlaysVisible(!overlaysVisible)}
          overlaysVisible={overlaysVisible}
          rtspUrl={rtspUrl}
          retryCount={retryCount}
        />

        {/* Instructions Section - Responsive */}
        <Paper sx={{ p: isMobile ? 2 : 3, mt: isMobile ? 3 : 4 }}>
          <Typography variant={isMobile ? "h6" : "h6"} gutterBottom>
            How to Use
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : isTablet ? 'column' : 'row',
            gap: isMobile ? 2 : 2
          }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {isMobile && <Computer />}
                <Typography variant="subtitle2">
                  1. Set RTSP URL
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Enter your RTSP stream URL or use one of the sample URLs provided for testing.
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {isMobile && <PlayCircle />}
                <Typography variant="subtitle2">
                  2. Control Playback
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Use the video controls to play, pause, adjust volume, and go fullscreen.
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {isMobile && <TouchApp />}
                <Typography variant="subtitle2">
                  3. Manage Overlays
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {isMobile 
                  ? 'Tap the settings button to add overlays. Use edit mode to drag and resize them.'
                  : 'Add custom text or logo overlays that appear on top of your video stream. Drag and resize in edit mode.'
                }
              </Typography>
            </Box>
          </Box>
          
          {/* Mobile specific tip */}
          {isMobile && (
            <Alert severity="info" sx={{ mt: 2 }} icon={<Smartphone />}>
              <Typography variant="body2">
                💡 <strong>Mobile Tip:</strong> Use the floating settings button to access overlay controls, 
                and enable edit mode for touch-friendly overlay positioning.
              </Typography>
            </Alert>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default LandingPage;