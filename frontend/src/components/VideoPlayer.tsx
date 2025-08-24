// frontend/src/components/VideoPlayer.tsx 
import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from "react-player";
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  useMediaQuery,
  Stack,
  Card,
  CardContent,
  Collapse,
  Fab
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  Edit,
  EditOff,
  Refresh,
  ExpandMore,
  ExpandLess,
  TouchApp,
  Smartphone,
  Computer
} from '@mui/icons-material';
import DraggableOverlay from './DraggableOverlay';
import { useOverlayPosition } from '../hooks/useOverlayPosition';

interface ResponsiveVideoPlayerProps {
  rtspUrl: string;
  onRtspUrlChange: (url: string) => void;
  overlays: Array<{
    _id: string;
    name: string;
    type: 'text' | 'logo';
    content: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    style?: Record<string, any>;
  }>;
  isMobile?: boolean;
  isTablet?: boolean;
}

interface ProgressState {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

const ResponsiveVideoPlayer: React.FC<ResponsiveVideoPlayerProps> = ({
  rtspUrl,
  onRtspUrlChange,
  overlays,
  isMobile = false,
  isTablet = false
}) => {
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [error, setError] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [isChangingPlayState, setIsChangingPlayState] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Mobile-specific states
  const [editMode, setEditMode] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 450 });
  const [showUrlInput, setShowUrlInput] = useState(!rtspUrl);
  const [controlsExpanded, setControlsExpanded] = useState(false);
  
  // Media queries for granular responsive control
  const isVerySmall = useMediaQuery('(max-width:480px)');
  const isTouchDevice = useMediaQuery('(hover: none)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const playerRef = useRef<ReactPlayer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the overlay position hook
  const { updatePosition, updateSize, isUpdating } = useOverlayPosition();

  // Mobile-optimized sample URLs
  const sampleUrls = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4'
  ];

  // Mobile-optimized container size update
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();
    
    // More frequent updates on mobile due to orientation changes
    const interval = isMobile ? 500 : 1000;
    const resizeInterval = setInterval(updateContainerSize, interval);
    
    window.addEventListener('resize', updateContainerSize);
    window.addEventListener('orientationchange', updateContainerSize);
    
    return () => {
      window.removeEventListener('resize', updateContainerSize);
      window.removeEventListener('orientationchange', updateContainerSize);
      clearInterval(resizeInterval);
    };
  }, [isMobile]);

  // Mobile-optimized controls auto-hide
  useEffect(() => {
    if (!isTouchDevice) return;
    
    const hideControls = () => {
      if (playing && !seeking && !isChangingPlayState) {
        setShowControls(false);
      }
    };

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    if (showControls) {
      controlsTimeoutRef.current = setTimeout(hideControls, isMobile ? 4000 : 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, playing, seeking, isChangingPlayState, isTouchDevice, isMobile]);

  // Reset player state when URL changes
  useEffect(() => {
    if (rtspUrl) {
      setError('');
      setPlaying(false);
      setPlayerReady(false);
      setPlayed(0);
      setDuration(0);
      setLoading(true);
      setShowUrlInput(false);
    }
  }, [rtspUrl]);

  const getInternalPlayer = () => {
    try {
      if (playerRef.current && typeof playerRef.current.getInternalPlayer === 'function') {
        return playerRef.current.getInternalPlayer();
      }
      return null;
    } catch (error) {
      console.warn('Could not access internal player:', error);
      return null;
    }
  };

  const handlePlayPause = async () => {
    if (isChangingPlayState || !playerReady) return;
    
    setIsChangingPlayState(true);
    
    // Show controls when user interacts
    setShowControls(true);
    
    try {
      const internalPlayer = getInternalPlayer();
      
      if (internalPlayer && internalPlayer.tagName === 'VIDEO') {
        if (playing) {
          internalPlayer.pause();
          setPlaying(false);
        } else {
          const playPromise = internalPlayer.play();
          if (playPromise !== undefined) {
            await playPromise;
            setPlaying(true);
          }
        }
      } else {
        setPlaying(!playing);
      }
    } catch (error) {
      console.log('Play/pause interrupted:', error);
      setPlaying(!playing);
    } finally {
      setTimeout(() => setIsChangingPlayState(false), 300);
    }
  };

  const handleVolumeChange = (_event: Event, newValue: number | number[]) => {
    setVolume(newValue as number);
    setShowControls(true);
  };

  const handleSeekChange = (_event: Event, newValue: number | number[]) => {
    setPlayed(newValue as number);
    setShowControls(true);
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
    setShowControls(true);
  };

  const handleSeekMouseUp = (_event: Event | React.SyntheticEvent, newValue: number | number[]) => {
    setSeeking(false);
    
    try {
      const internalPlayer = getInternalPlayer();
      if (internalPlayer && internalPlayer.currentTime !== undefined && duration > 0) {
        internalPlayer.currentTime = (newValue as number) * duration;
      } else if (playerRef.current) {
        playerRef.current.seekTo(newValue as number, 'fraction');
      }
    } catch (error) {
      console.log('Seeking not available:', error);
    }
  };

  const handleProgress = (progress: ProgressState) => {
    if (!seeking && progress && typeof progress.played === 'number') {
      setPlayed(progress.played);
      
      if (progress.loadedSeconds > 0 && progress.loadedSeconds !== duration) {
        setDuration(progress.loadedSeconds);
      }
      
      if (!playerReady && progress.loadedSeconds > 0) {
        setPlayerReady(true);
        setLoading(false);
        setError('');
      }
    }
  };

  const handleReady = () => {
    console.log('Player ready');
    setPlayerReady(true);
    setLoading(false);
    setError('');
    
    if (playerRef.current) {
      try {
        const dur = playerRef.current.getDuration();
        if (dur && !isNaN(dur)) {
          setDuration(dur);
        }
      } catch (error) {
        console.log('Could not get duration:', error);
      }
    }
  };

  const handleStart = () => {
    console.log('Playback started');
    setLoading(false);
  };

  const handleError = (error: any) => {
    console.error('Video player error:', error);
    setError('Failed to load video stream. Please check the URL and try a different source.');
    setPlaying(false);
    setPlayerReady(false);
    setLoading(false);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).mozRequestFullScreen) {
        (containerRef.current as any).mozRequestFullScreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
    }
  };

  const handleRefresh = () => {
    setError('');
    setPlaying(false);
    setPlayerReady(false);
    setPlayed(0);
    setDuration(0);
    setLoading(true);
    
    setTimeout(() => {
      if (playerRef.current) {
        const currentUrl = rtspUrl;
        onRtspUrlChange('');
        setTimeout(() => onRtspUrlChange(currentUrl), 100);
      }
    }, 100);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mobile-optimized overlay handlers
  const handlePositionChange = (overlayId: string, position: { x: number; y: number }) => {
    updatePosition(overlayId, position);
  };

  const handleSizeChange = (overlayId: string, size: { width: number; height: number }) => {
    updateSize(overlayId, size);
  };

  // Mobile-specific touch handlers
  const handleContainerTouch = () => {
    if (isTouchDevice) {
      setShowControls(true);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', p: isMobile ? 1 : 2 }}>
      {/* RTSP URL Input - Mobile Collapsible */}
      <Paper elevation={3} sx={{ p: isMobile ? 1.5 : 2, mb: isMobile ? 1.5 : 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant={isMobile ? "subtitle1" : "h6"}>
            {isMobile ? 'Stream Config' : 'Video Stream Configuration'}
          </Typography>
          {isMobile && (
            <IconButton
              onClick={() => setShowUrlInput(!showUrlInput)}
              size="small"
            >
              {showUrlInput ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          )}
        </Box>
        
        <Collapse in={!isMobile || showUrlInput}>
          <Box sx={{ display: 'flex', gap: isMobile ? 1 : 2, mb: isMobile ? 1.5 : 2, flexDirection: isMobile ? 'column' : 'row' }}>
            <TextField
              fullWidth
              value={rtspUrl}
              onChange={(e) => onRtspUrlChange(e.target.value)}
              placeholder={isMobile ? "Enter video URL" : "Enter video URL or select from samples below"}
              variant="outlined"
              disabled={loading}
              size={isMobile ? "medium" : "medium"}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: isMobile ? '16px' : '14px', // Prevent iOS zoom
                }
              }}
            />
            <Button 
              variant="contained"
              onClick={handleRefresh}
              disabled={!rtspUrl || loading}
              startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
              sx={{ 
                minWidth: isMobile ? '100%' : 'auto',
                minHeight: isMobile ? 48 : 'auto'
              }}
            >
              {loading ? 'Loading...' : isMobile ? 'Load' : 'Load Stream'}
            </Button>
          </Box>

          {/* Sample URLs - Mobile Optimized */}
          <Box sx={{ mb: isMobile ? 1 : 2 }}>
            <Typography variant={isMobile ? "caption" : "body2"} gutterBottom>
              {isMobile ? 'Sample URLs:' : 'Sample URLs for testing:'}
            </Typography>
            <Stack 
              direction={isMobile ? "column" : "row"} 
              spacing={1} 
              sx={{ flexWrap: 'wrap', gap: isMobile ? 0.5 : 1 }}
            >
              {sampleUrls.map((url, index) => (
                <Button 
                  key={index}
                  variant="outlined" 
                  size="small"
                  onClick={() => onRtspUrlChange(url)}
                  disabled={loading}
                  fullWidth={isMobile}
                  sx={{
                    fontSize: isMobile ? '0.75rem' : '0.8125rem',
                    minHeight: isMobile ? 36 : 'auto'
                  }}
                >
                  Sample {index + 1}
                </Button>
              ))}
            </Stack>
          </Box>
        </Collapse>

        {/* Edit Mode Toggle - Mobile Optimized */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={editMode}
                onChange={(e) => setEditMode(e.target.checked)}
                color="primary"
                size={isMobile ? "medium" : "medium"}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {editMode ? <Edit sx={{ fontSize: 18 }} /> : <EditOff sx={{ fontSize: 18 }} />}
                <Typography variant={isMobile ? "body2" : "body1"}>
                  {isMobile ? 'Edit Overlays' : 'Edit Overlays'}
                </Typography>
              </Box>
            }
          />
          
          {editMode && (
            <Chip 
              label={isMobile ? "Edit Mode" : "Edit Mode Active - Drag & Resize Overlays"}
              color="primary"
              size="small"
              icon={isMobile ? <TouchApp /> : undefined}
              sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
            />
          )}
        </Box>
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: isMobile ? 1.5 : 2,
            '& .MuiAlert-message': {
              fontSize: isMobile ? '0.8rem' : '0.875rem'
            }
          }}
          action={
            <Button color="inherit" size="small" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Video Player Container - Mobile Optimized */}
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          backgroundColor: '#000',
          borderRadius: isMobile ? 1 : 1,
          overflow: 'hidden',
          border: editMode ? '2px solid #1976d2' : 'none',
          touchAction: editMode ? 'none' : 'manipulation', // Prevent scrolling during overlay editing
        }}
        onMouseEnter={() => !isTouchDevice && setShowControls(true)}
        onMouseLeave={() => !isTouchDevice && setShowControls(false)}
        onTouchStart={handleContainerTouch}
        onClick={handleContainerTouch}
      >
        {rtspUrl && (
          <ReactPlayer
            ref={playerRef}
            url={rtspUrl}
            playing={playing}
            volume={volume}
            muted={muted}
            width="100%"
            height="100%"
            onProgress={handleProgress}
            onReady={handleReady}
            onStart={handleStart}
            onError={handleError}
            config={{
              file: {
                attributes: {
                  crossOrigin: 'anonymous',
                  playsInline: true,
                  preload: 'metadata',
                  // Mobile optimization
                  'webkit-playsinline': true,
                  'x5-playsinline': true,
                  'x5-video-player-type': 'h5'
                }
              }
            }}
            playsinline={true}
            controls={false}
            light={false}
            // Mobile-specific props
            pip={!isMobile} // Disable PiP on mobile
            stopOnUnmount={true}
          />
        )}

        {/* Loading Indicator */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CircularProgress sx={{ color: 'white' }} />
            <Typography variant="body2" sx={{ color: 'white', fontSize: isMobile ? '0.8rem' : '0.875rem' }}>
              Loading video...
            </Typography>
          </Box>
        )}

        {/* Draggable Overlays - Mobile Optimized */}
        {overlays.map((overlay) => (
          <DraggableOverlay
            key={overlay._id}
            overlay={overlay}
            containerSize={containerSize}
            onPositionChange={handlePositionChange}
            onSizeChange={handleSizeChange}
            isEditMode={editMode}
            isMobile={isMobile}
            isTouchDevice={isTouchDevice}
          />
        ))}

        {/* Video Controls - Mobile Optimized */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            p: isMobile ? 1.5 : 2,
            opacity: showControls ? 1 : 0,
            transition: prefersReducedMotion ? 'none' : 'opacity 0.3s ease',
            zIndex: 30
          }}
        >
          {/* Progress Bar - Mobile Optimized */}
          <Slider
            value={played}
            onChange={handleSeekChange}
            onMouseDown={handleSeekMouseDown}
            onChangeCommitted={handleSeekMouseUp}
            min={0}
            max={1}
            step={0.01}
            sx={{ 
              color: 'white', 
              mb: isMobile ? 1 : 1,
              height: isMobile ? 6 : 4,
              '& .MuiSlider-thumb': {
                width: isMobile ? 20 : 16,
                height: isMobile ? 20 : 16,
              },
              '& .MuiSlider-track': {
                height: isMobile ? 6 : 4,
              },
              '& .MuiSlider-rail': {
                height: isMobile ? 6 : 4,
              }
            }}
            disabled={!playerReady || duration === 0}
          />

          {/* Controls Layout - Mobile Responsive */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? 1 : 2
          }}>
            {/* Left Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 0.5 : 1, flex: 1 }}>
              <IconButton 
                onClick={handlePlayPause}
                sx={{ 
                  color: 'white',
                  padding: isMobile ? '8px' : '6px'
                }}
                disabled={!playerReady || isChangingPlayState}
                size={isMobile ? "medium" : "medium"}
              >
                {playing ? <Pause /> : <PlayArrow />}
              </IconButton>

              {/* Time Display - Responsive */}
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'white', 
                  minWidth: isMobile ? '100px' : '120px',
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}
              >
                {formatTime(played * duration)} / {formatTime(duration)}
              </Typography>

              {/* Player Status */}
              {!playerReady && rtspUrl && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'orange',
                    fontSize: isMobile ? '0.7rem' : '0.75rem'
                  }}
                >
                  {loading ? 'Loading...' : 'Buffering...'}
                </Typography>
              )}
            </Box>

            {/* Right Controls */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: isMobile ? 0.5 : 1,
              flexShrink: 0
            }}>
              {/* Volume Controls */}
              <IconButton 
                onClick={() => setMuted(!muted)}
                sx={{ 
                  color: 'white',
                  padding: isMobile ? '8px' : '6px'
                }}
                size={isMobile ? "medium" : "medium"}
              >
                {muted ? <VolumeOff /> : <VolumeUp />}
              </IconButton>

              {!isMobile && (
                <Slider
                  value={volume}
                  onChange={handleVolumeChange}
                  min={0}
                  max={1}
                  step={0.01}
                  sx={{ width: 80, color: 'white' }}
                />
              )}

              {/* Mobile Volume Slider */}
              {isMobile && (
                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                  <Slider
                    value={volume}
                    onChange={handleVolumeChange}
                    min={0}
                    max={1}
                    step={0.01}
                    sx={{ 
                      width: 60, 
                      color: 'white',
                      '& .MuiSlider-thumb': {
                        width: 16,
                        height: 16,
                      }
                    }}
                  />
                </Box>
              )}

              {/* Fullscreen Button */}
              <IconButton 
                onClick={handleFullscreen} 
                sx={{ 
                  color: 'white',
                  padding: isMobile ? '8px' : '6px'
                }}
                size={isMobile ? "medium" : "medium"}
              >
                <Fullscreen />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Loading/Error States */}
        {!rtspUrl && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 20,
              px: 2
            }}
          >
            <Typography 
              variant={isMobile ? "body1" : "h6"} 
              sx={{ 
                color: 'white',
                fontSize: isMobile ? '1rem' : '1.25rem'
              }}
            >
              {isMobile ? 'Enter a video URL to start' : 'Enter a video URL to start streaming'}
            </Typography>
          </Box>
        )}

        {/* Edit Mode Instructions */}
        {editMode && (
          <Box
            sx={{
              position: 'absolute',
              top: isMobile ? 8 : 10,
              left: isMobile ? 8 : 10,
              background: 'rgba(25, 118, 210, 0.9)',
              color: 'white',
              px: isMobile ? 1.5 : 2,
              py: isMobile ? 0.5 : 1,
              borderRadius: '4px',
              zIndex: 40,
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            <Typography variant="body2" sx={{ fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
              {isMobile ? '🎯 Touch to edit overlays' : '🎯 Edit Mode: Drag overlays to move • Resize from corners'}
            </Typography>
          </Box>
        )}

        {/* Updating Indicators */}
        {overlays.some(overlay => isUpdating(overlay._id)) && (
          <Box
            sx={{
              position: 'absolute',
              top: isMobile ? 8 : 10,
              right: isMobile ? 8 : 10,
              background: 'rgba(76, 175, 80, 0.9)',
              color: 'white',
              px: isMobile ? 1.5 : 2,
              py: isMobile ? 0.5 : 1,
              borderRadius: '4px',
              zIndex: 40
            }}
          >
            <Typography variant="body2" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
              💾 Saving changes...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Edit Mode Status Panel - Mobile Card */}
      {editMode && overlays.length > 0 && (
        <Card sx={{ mt: isMobile ? 1.5 : 2, backgroundColor: '#f8f9fa' }}>
          <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
            <Typography variant={isMobile ? "body2" : "subtitle2"} gutterBottom sx={{ fontWeight: 600 }}>
              📝 Overlay Edit Status
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {overlays.map((overlay) => (
                <Chip
                  key={overlay._id}
                  label={`${overlay.name} ${isUpdating(overlay._id) ? '(Saving...)' : '(Ready)'}`}
                  size="small"
                  color={isUpdating(overlay._id) ? 'warning' : 'success'}
                  variant="outlined"
                  sx={{ 
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    height: isMobile ? 24 : 32
                  }}
                />
              ))}
            </Stack>
            
            {/* Mobile Edit Tips */}
            {isMobile && (
              <Alert severity="info" sx={{ mt: 1.5, py: 0.5 }} icon={<TouchApp />}>
                <Typography variant="caption">
                  💡 <strong>Touch Tips:</strong> Tap and hold to drag overlays. Pinch to resize. Use two fingers for precision.
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ p: isMobile ? 1.5 : 2, mt: isMobile ? 1.5 : 2, backgroundColor: '#f0f0f0' }}>
          <Typography variant="caption" sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}>
            Debug: Ready={playerReady.toString()} | Playing={playing.toString()} | 
            Duration={duration.toFixed(2)}s | Error={error ? 'Yes' : 'No'} | 
            Loading={loading.toString()} | Mobile={isMobile.toString()}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default ResponsiveVideoPlayer;
