// frontend/src/components/DraggableOverlay.tsx 
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Typography } from '@mui/material';

interface TouchOptimizedDraggableOverlayProps {
  overlay: {
    _id: string;
    name: string;
    type: 'text' | 'logo';
    content: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    style?: Record<string, any>;
  };
  containerSize: { width: number; height: number };
  onPositionChange: (id: string, position: { x: number; y: number }) => void;
  onSizeChange: (id: string, size: { width: number; height: number }) => void;
  isEditMode: boolean;
  isMobile?: boolean;
  isTouchDevice?: boolean;
}

interface TouchInfo {
  identifier: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: string;
  startPosition: { x: number; y: number };
  startSize: { width: number; height: number };
  startTouch: { x: number; y: number };
  initialDistance?: number;
  initialSize?: { width: number; height: number };
}

const TouchOptimizedDraggableOverlay: React.FC<TouchOptimizedDraggableOverlayProps> = ({
  overlay,
  containerSize,
  onPositionChange,
  onSizeChange,
  isEditMode,
  isMobile = false,
  isTouchDevice = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    resizeHandle: '',
    startPosition: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 },
    startTouch: { x: 0, y: 0 }
  });
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchesRef = useRef<Map<number, TouchInfo>>(new Map());
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const doubleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  // Create reliable fallback SVG for failed logo images
  const createFallbackSvg = useCallback((text: string = 'LOGO') => {
    const svg = `
      <svg width="120" height="40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#1976d2;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1565c0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="120" height="40" fill="url(#grad1)" stroke="#0d47a1" stroke-width="1" rx="6"/>
        <text x="60" y="25" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="white" font-weight="bold">${text}</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }, []);

  // Calculate distance between two touches
  const getDistance = useCallback((touch1: TouchInfo, touch2: TouchInfo): number => {
    const dx = touch1.currentX - touch2.currentX;
    const dy = touch1.currentY - touch2.currentY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Convert touch to position relative to container - Fixed to accept React.Touch
  const getTouchPosition = useCallback((touch: React.Touch, containerRect: DOMRect) => {
    return {
      x: ((touch.clientX - containerRect.left) / containerRect.width) * 100,
      y: ((touch.clientY - containerRect.top) / containerRect.height) * 100
    };
  }, []);

  // Clear timers
  const clearTimers = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (doubleTapTimerRef.current) {
      clearTimeout(doubleTapTimerRef.current);
      doubleTapTimerRef.current = null;
    }
  }, []);

  // Touch start handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isEditMode || !overlayRef.current) return;

    e.preventDefault();
    e.stopPropagation();
    
    const containerRect = overlayRef.current.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    const touches = Array.from(e.touches);
    const newTouches = new Map<number, TouchInfo>();

    // Process all touches
    touches.forEach(touch => {
      const pos = getTouchPosition(touch, containerRect);
      newTouches.set(touch.identifier, {
        identifier: touch.identifier,
        startX: pos.x,
        startY: pos.y,
        currentX: pos.x,
        currentY: pos.y
      });
    });

    touchesRef.current = newTouches;
    setIsSelected(true);

    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (touches.length === 1) {
      // Single touch - potential drag or double tap
      const touch = touches[0];
      
      // Check for double tap (within 300ms)
      if (timeSinceLastTap < 300) {
        clearTimers();
        // Double tap - toggle selection/edit mode
        setIsSelected(prev => !prev);
        lastTapTimeRef.current = 0;
        return;
      }

      lastTapTimeRef.current = now;

      // Start long press timer for drag mode
      longPressTimerRef.current = setTimeout(() => {
        setDragState(prev => ({
          ...prev,
          isDragging: true,
          startPosition: overlay.position,
          startTouch: getTouchPosition(touch, containerRect)
        }));
        
        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, isMobile ? 200 : 150); // Shorter delay on mobile

    } else if (touches.length === 2 && isSelected) {
      // Two touches - pinch to resize
      clearTimers();
      const [touch1, touch2] = touches;
      const distance = getDistance(newTouches.get(touch1.identifier)!, newTouches.get(touch2.identifier)!);
      
      setDragState(prev => ({
        ...prev,
        isResizing: true,
        initialDistance: distance,
        initialSize: overlay.size,
        startSize: overlay.size
      }));

      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([25, 25, 25]);
      }
    }
  }, [isEditMode, overlay.position, overlay.size, getTouchPosition, getDistance, isMobile, isSelected]);

  // Touch move handler
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isEditMode || !overlayRef.current || touchesRef.current.size === 0) return;

    e.preventDefault();
    e.stopPropagation();

    const containerRect = overlayRef.current.parentElement?.getBoundingClientRect();
    if (!containerRect) return;

    const touches = Array.from(e.touches);
    const updatedTouches = new Map(touchesRef.current);

    // Update touch positions
    touches.forEach(touch => {
      const existing = updatedTouches.get(touch.identifier);
      if (existing) {
        const pos = getTouchPosition(touch, containerRect);
        updatedTouches.set(touch.identifier, {
          ...existing,
          currentX: pos.x,
          currentY: pos.y
        });
      }
    });

    touchesRef.current = updatedTouches;

    if (dragState.isDragging && touches.length === 1) {
      // Single touch dragging
      const touch = touches[0];
      const currentPos = getTouchPosition(touch, containerRect);
      const startTouch = dragState.startTouch;
      
      const deltaX = currentPos.x - startTouch.x;
      const deltaY = currentPos.y - startTouch.y;
      
      const newX = Math.max(0, Math.min(90, dragState.startPosition.x + deltaX));
      const newY = Math.max(0, Math.min(90, dragState.startPosition.y + deltaY));
      
      onPositionChange(overlay._id, { x: newX, y: newY });

    } else if (dragState.isResizing && touches.length === 2) {
      // Two touch pinch resize
      const [touch1, touch2] = touches;
      const touchInfo1 = updatedTouches.get(touch1.identifier);
      const touchInfo2 = updatedTouches.get(touch2.identifier);
      
      if (touchInfo1 && touchInfo2 && dragState.initialDistance && dragState.initialSize) {
        const currentDistance = getDistance(touchInfo1, touchInfo2);
        const scale = currentDistance / dragState.initialDistance;
        
        // Apply scale with constraints
        const newWidth = Math.max(5, Math.min(50, dragState.initialSize.width * scale));
        const newHeight = Math.max(3, Math.min(30, dragState.initialSize.height * scale));
        
        onSizeChange(overlay._id, { width: newWidth, height: newHeight });
      }
    }
  }, [isEditMode, dragState, overlay._id, onPositionChange, onSizeChange, getTouchPosition, getDistance]);

  // Touch end handler
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isEditMode) return;

    e.preventDefault();
    e.stopPropagation();

    clearTimers();

    const remainingTouches = Array.from(e.touches);
    
    // Update touches map
    const updatedTouches = new Map<number, TouchInfo>();
    remainingTouches.forEach(touch => {
      const existing = touchesRef.current.get(touch.identifier);
      if (existing) {
        updatedTouches.set(touch.identifier, existing);
      }
    });
    touchesRef.current = updatedTouches;

    // End drag or resize operations
    if (remainingTouches.length === 0) {
      setDragState(prev => ({
        ...prev,
        isDragging: false,
        isResizing: false,
        resizeHandle: ''
      }));
      
      // Auto-deselect after a delay if not actively editing
      setTimeout(() => {
        if (!dragState.isDragging && !dragState.isResizing) {
          setIsSelected(false);
        }
      }, 3000);
    }
  }, [isEditMode, dragState.isDragging, dragState.isResizing, clearTimers]);

  // Mouse handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditMode || isTouchDevice) return;
    
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsSelected(true);
    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startPosition: overlay.position,
      startTouch: { x: 0, y: 0 } // Not used for mouse
    }));
  }, [isEditMode, isTouchDevice, overlay.position]);

  // Global mouse event handling for desktop
  useEffect(() => {
    if (isTouchDevice) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging || !overlayRef.current) return;
      
      e.preventDefault();
      
      const containerRect = overlayRef.current.parentElement?.getBoundingClientRect();
      if (!containerRect) return;
      
      const currentPos = {
        x: ((e.clientX - containerRect.left) / containerRect.width) * 100,
        y: ((e.clientY - containerRect.top) / containerRect.height) * 100
      };
      
      const newX = Math.max(0, Math.min(90, currentPos.x - overlay.size.width / 2));
      const newY = Math.max(0, Math.min(90, currentPos.y - overlay.size.height / 2));
      
      onPositionChange(overlay._id, { x: newX, y: newY });
    };

    const handleGlobalMouseUp = () => {
      if (dragState.isDragging) {
        setDragState(prev => ({ ...prev, isDragging: false }));
      }
    };

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = 'move';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      if (dragState.isDragging) {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
  }, [dragState.isDragging, isTouchDevice, overlay._id, overlay.size, onPositionChange]);

  // Resize handle mouse down for desktop
  const handleResizeMouseDown = useCallback((handle: string) => (e: React.MouseEvent) => {
    if (!isEditMode || isTouchDevice) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setDragState(prev => ({
      ...prev,
      isResizing: true,
      resizeHandle: handle,
      startSize: overlay.size,
      startTouch: { x: e.clientX, y: e.clientY }
    }));
  }, [isEditMode, isTouchDevice, overlay.size]);

  // Convert style properties
  const convertStyleProperties = useCallback((style: Record<string, any> = {}) => {
    const converted = Object.entries(style).reduce((acc, [key, value]) => {
      const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      acc[camelKey] = value;
      return acc;
    }, {} as Record<string, any>);
    
    const {
      width: _width,
      height: _height,
      position: _position,
      left: _left,
      top: _top,
      ...safeStyles
    } = converted;
    
    return safeStyles;
  }, []);

  // Render overlay content with mobile optimizations
  const renderOverlayContent = useCallback(() => {
    if (overlay.type === 'text') {
      const textStyles = convertStyleProperties(overlay.style || {});
      
      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: textStyles.padding || (isMobile ? '6px' : '4px'),
            boxSizing: 'border-box',
            backgroundColor: textStyles.backgroundColor || 'transparent',
            borderRadius: textStyles.borderRadius || '0px',
            border: textStyles.border || 'none',
            overflow: 'hidden'
          }}
        >
          <Typography 
            variant="body1" 
            sx={{ 
              color: textStyles.color || 'white',
              fontWeight: textStyles.fontWeight || 'bold',
              fontSize: textStyles.fontSize || (isMobile ? '14px' : '16px'),
              fontStyle: textStyles.fontStyle || 'normal',
              textShadow: textStyles.textShadow || 'none',
              userSelect: 'none',
              pointerEvents: 'none',
              wordBreak: 'break-word',
              lineHeight: isMobile ? 1.1 : 1.2,
              margin: 0,
              ...Object.fromEntries(
                Object.entries(textStyles).filter(([key]) => 
                  !['padding', 'backgroundColor', 'borderRadius', 'border', 'color', 'fontWeight', 'fontSize', 'fontStyle', 'textShadow'].includes(key)
                )
              )
            }}
          >
            {overlay.content || 'Sample Text'}
          </Typography>
        </Box>
      );
    } else {
      // Logo handling with mobile optimization
      const isProblematicUrl = !overlay.content || 
                               overlay.content.trim() === '' ||
                               overlay.content.includes('via.placeholder.com') || 
                               overlay.content.includes('picsum.photos') ||
                               overlay.content.includes('httpbin.org');
      
      const imageSource = isProblematicUrl ? 
        createFallbackSvg(overlay.name || 'LOGO') : 
        overlay.content;

      const logoStyles = convertStyleProperties(overlay.style || {});

      return (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: logoStyles.backgroundColor || 'transparent',
            borderRadius: logoStyles.borderRadius || '2px',
            border: logoStyles.border || 'none',
            boxShadow: logoStyles.boxShadow || 'none',
            overflow: 'hidden'
          }}
        >
          <img 
            src={imageSource}
            alt={overlay.name}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none',
              display: 'block'
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.dataset.fallbackApplied) {
                target.dataset.fallbackApplied = 'true';
                target.src = createFallbackSvg(overlay.name || 'LOGO');
              }
            }}
          />
        </Box>
      );
    }
  }, [overlay, convertStyleProperties, createFallbackSvg, isMobile]);

  // Calculate overlay styles with mobile optimizations
  const overlayStyles = {
    position: 'absolute' as const,
    left: `${overlay.position.x}%`,
    top: `${overlay.position.y}%`,
    width: `${overlay.size.width}%`,
    height: `${overlay.size.height}%`,
    minWidth: isMobile ? '40px' : '30px',
    minHeight: isMobile ? '25px' : '20px',
    maxWidth: isMobile ? '70%' : '50%',
    maxHeight: isMobile ? '40%' : '30%',
    zIndex: dragState.isDragging || dragState.isResizing ? 1000 : isSelected ? 100 : 10,
    border: (dragState.isDragging || dragState.isResizing || (isSelected && isEditMode))
      ? `${isMobile ? '3px' : '2px'} dashed #1976d2`
      : (isHovered && isEditMode && !isTouchDevice) 
        ? `${isMobile ? '2px' : '1px'} solid #1976d2`
        : '1px solid transparent',
    borderRadius: '4px',
    cursor: isEditMode ? (dragState.isDragging ? 'move' : isTouchDevice ? 'pointer' : 'move') : 'default',
    transition: (dragState.isDragging || dragState.isResizing) ? 'none' : 'all 0.2s ease',
    overflow: 'visible',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box' as const,
    backgroundColor: (dragState.isDragging || dragState.isResizing || isSelected) 
      ? 'rgba(25, 118, 210, 0.1)' 
      : 'transparent',
    // Mobile touch optimization
    touchAction: isEditMode ? 'none' : 'auto',
    WebkitUserSelect: 'none',
    userSelect: 'none'
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return (
    <Box
      ref={overlayRef}
      sx={overlayStyles}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => !isTouchDevice && setIsHovered(true)}
      onMouseLeave={() => !isTouchDevice && setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {renderOverlayContent()}

      {/* Desktop Resize Handles */}
      {isEditMode && !isTouchDevice && (isHovered || isSelected) && !dragState.isDragging && !dragState.isResizing && (
        <>
          {/* Bottom-right resize handle */}
          <Box
            className="resize-handle"
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 12,
              height: 12,
              backgroundColor: '#1976d2',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'se-resize',
              zIndex: 1002,
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              '&:hover': {
                backgroundColor: '#1565c0',
                transform: 'scale(1.2)'
              }
            }}
            onMouseDown={handleResizeMouseDown('bottom-right')}
          />
          
          <Box
            className="resize-handle"
            sx={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 12,
              height: 8,
              backgroundColor: '#1976d2',
              border: '1px solid white',
              borderRadius: '4px',
              cursor: 's-resize',
              zIndex: 1002,
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
            onMouseDown={handleResizeMouseDown('bottom')}
          />

          <Box
            className="resize-handle"
            sx={{
              position: 'absolute',
              right: -4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 8,
              height: 12,
              backgroundColor: '#1976d2',
              border: '1px solid white',
              borderRadius: '4px',
              cursor: 'e-resize',
              zIndex: 1002,
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
            onMouseDown={handleResizeMouseDown('right')}
          />
        </>
      )}

      {/* Mobile Touch Indicators */}
      {isTouchDevice && isEditMode && isSelected && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            left: -8,
            right: -8,
            bottom: -8,
            border: '2px dashed rgba(25, 118, 210, 0.6)',
            borderRadius: '8px',
            pointerEvents: 'none',
            zIndex: 999
          }}
        />
      )}

      {/* Status Indicators */}
      {isEditMode && (dragState.isDragging || dragState.isResizing || isSelected) && (
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            left: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: '4px',
            fontSize: isMobile ? '10px' : '11px',
            whiteSpace: 'nowrap',
            zIndex: 1001,
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {dragState.isDragging && `Moving ${overlay.name}...`}
          {dragState.isResizing && `Resizing ${overlay.name}...`}
          {!dragState.isDragging && !dragState.isResizing && isSelected && (
            <>
              {overlay.name} • 
              {isTouchDevice ? ' Touch & hold to move • Pinch to resize' : ' Drag to move • Drag corners to resize'}
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TouchOptimizedDraggableOverlay;
