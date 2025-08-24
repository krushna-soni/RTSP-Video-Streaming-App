// frontend/src/hooks/useOverlayPosition.ts
import { useState, useCallback, useRef } from 'react';
import { overlayAPI } from '../services/api';

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

export const useOverlayPosition = () => {
  const [updating, setUpdating] = useState<string[]>([]);
  const updateTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const updatePosition = useCallback(async (
    overlayId: string, 
    position: Position,
    immediate: boolean = false
  ) => {
    // Clear existing timeout for this overlay
    const existingTimeout = updateTimeouts.current.get(overlayId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add to updating list
    setUpdating(prev => [...prev.filter(id => id !== overlayId), overlayId]);

    const performUpdate = async () => {
      try {
        await overlayAPI.update(overlayId, { position });
        console.log(`Position updated for overlay ${overlayId}:`, position);
      } catch (error) {
        console.error(`Failed to update position for overlay ${overlayId}:`, error);
      } finally {
        // Remove from updating list
        setUpdating(prev => prev.filter(id => id !== overlayId));
        updateTimeouts.current.delete(overlayId);
      }
    };

    if (immediate) {
      await performUpdate();
    } else {
      // Debounced update
      const timeout = setTimeout(performUpdate, 500);
      updateTimeouts.current.set(overlayId, timeout);
    }
  }, []);

  const updateSize = useCallback(async (
    overlayId: string, 
    size: Size,
    immediate: boolean = false
  ) => {
    // Clear existing timeout for this overlay
    const existingTimeout = updateTimeouts.current.get(overlayId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add to updating list
    setUpdating(prev => [...prev.filter(id => id !== overlayId), overlayId]);

    const performUpdate = async () => {
      try {
        await overlayAPI.update(overlayId, { size });
        console.log(`Size updated for overlay ${overlayId}:`, size);
      } catch (error) {
        console.error(`Failed to update size for overlay ${overlayId}:`, error);
      } finally {
        // Remove from updating list
        setUpdating(prev => prev.filter(id => id !== overlayId));
        updateTimeouts.current.delete(overlayId);
      }
    };

    if (immediate) {
      await performUpdate();
    } else {
      // Debounced update
      const timeout = setTimeout(performUpdate, 500);
      updateTimeouts.current.set(overlayId, timeout);
    }
  }, []);

  const updatePositionAndSize = useCallback(async (
    overlayId: string,
    updates: { position?: Position; size?: Size },
    immediate: boolean = false
  ) => {
    // Clear existing timeout for this overlay
    const existingTimeout = updateTimeouts.current.get(overlayId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Add to updating list
    setUpdating(prev => [...prev.filter(id => id !== overlayId), overlayId]);

    const performUpdate = async () => {
      try {
        await overlayAPI.update(overlayId, updates);
        console.log(`Overlay ${overlayId} updated:`, updates);
      } catch (error) {
        console.error(`Failed to update overlay ${overlayId}:`, error);
      } finally {
        // Remove from updating list
        setUpdating(prev => prev.filter(id => id !== overlayId));
        updateTimeouts.current.delete(overlayId);
      }
    };

    if (immediate) {
      await performUpdate();
    } else {
      // Debounced update
      const timeout = setTimeout(performUpdate, 500);
      updateTimeouts.current.set(overlayId, timeout);
    }
  }, []);

  const isUpdating = useCallback((overlayId: string) => {
    return updating.includes(overlayId);
  }, [updating]);

  // Cleanup function
  const cleanup = useCallback(() => {
    updateTimeouts.current.forEach(timeout => clearTimeout(timeout));
    updateTimeouts.current.clear();
    setUpdating([]);
  }, []);

  return {
    updatePosition,
    updateSize,
    updatePositionAndSize,
    isUpdating,
    cleanup
  };
};