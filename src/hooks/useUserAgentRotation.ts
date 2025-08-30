// src/hooks/useUserAgentRotation.ts
import { useState, useEffect, useCallback } from 'react';
import {
  initializeUserAgentRotation,
  checkAndRotateUserAgent,
  forceRotateUserAgent,
  getTimeUntilNextRotation,
  resetUserAgentRotation,
  getAllUserAgents,
  UserAgentInfo,
} from '../utils/userAgentRotation';

interface UseUserAgentRotationReturn {
  userAgent: string;
  userAgentInfo: UserAgentInfo | null;
  loading: boolean;
  timeUntilNextRotation: {
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  } | null;
  forceRotate: () => Promise<void>;
  resetRotation: () => Promise<void>;
  refreshRotation: () => Promise<void>;
  allUserAgents: Array<{userAgent: string; deviceInfo: string; index: number}>;
}

export const useUserAgentRotation = (): UseUserAgentRotationReturn => {
  const [userAgentInfo, setUserAgentInfo] = useState<UserAgentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeUntilNext, setTimeUntilNext] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  } | null>(null);

  // Initialize user agent rotation on mount
  const initializeRotation = useCallback(async () => {
    try {
      setLoading(true);
      const info = await checkAndRotateUserAgent(); // This checks if rotation is needed
      setUserAgentInfo(info);
      
      // Calculate time until next rotation
      const timeRemaining = getTimeUntilNextRotation(info.nextRotation);
      setTimeUntilNext(timeRemaining);
      
      console.log('[useUserAgentRotation] Initialized:', {
        device: info.deviceInfo,
        nextRotationIn: `${timeRemaining.hours}h ${timeRemaining.minutes}m`,
      });
    } catch (error) {
      console.error('[useUserAgentRotation] Initialization error:', error);
      
      // Fallback to basic initialization
      try {
        const fallbackInfo = await initializeUserAgentRotation();
        setUserAgentInfo(fallbackInfo);
        const timeRemaining = getTimeUntilNextRotation(fallbackInfo.nextRotation);
        setTimeUntilNext(timeRemaining);
      } catch (fallbackError) {
        console.error('[useUserAgentRotation] Fallback initialization error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Force rotate to next user agent
  const forceRotate = useCallback(async () => {
    try {
      setLoading(true);
      const newInfo = await forceRotateUserAgent();
      setUserAgentInfo(newInfo);
      
      const timeRemaining = getTimeUntilNextRotation(newInfo.nextRotation);
      setTimeUntilNext(timeRemaining);
      
      console.log('[useUserAgentRotation] Force rotated to:', newInfo.deviceInfo);
    } catch (error) {
      console.error('[useUserAgentRotation] Force rotation error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset rotation system
  const resetRotation = useCallback(async () => {
    try {
      setLoading(true);
      await resetUserAgentRotation();
      
      // Re-initialize after reset
      const newInfo = await initializeUserAgentRotation();
      setUserAgentInfo(newInfo);
      
      const timeRemaining = getTimeUntilNextRotation(newInfo.nextRotation);
      setTimeUntilNext(timeRemaining);
      
      console.log('[useUserAgentRotation] Reset and re-initialized');
    } catch (error) {
      console.error('[useUserAgentRotation] Reset error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh current rotation status
  const refreshRotation = useCallback(async () => {
    try {
      const info = await checkAndRotateUserAgent();
      setUserAgentInfo(info);
      
      const timeRemaining = getTimeUntilNextRotation(info.nextRotation);
      setTimeUntilNext(timeRemaining);
    } catch (error) {
      console.error('[useUserAgentRotation] Refresh error:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeRotation();
  }, [initializeRotation]);

  // Set up periodic checking for auto-rotation
  useEffect(() => {
    // Check every 10 minutes if it's time to rotate
    const checkInterval = setInterval(() => {
      refreshRotation();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(checkInterval);
  }, [refreshRotation]);

  // Update countdown timer every minute
  useEffect(() => {
    if (!userAgentInfo) return;

    const updateTimer = () => {
      const timeRemaining = getTimeUntilNextRotation(userAgentInfo.nextRotation);
      setTimeUntilNext(timeRemaining);
    };

    // Update immediately
    updateTimer();

    // Then update every minute
    const timerInterval = setInterval(updateTimer, 60 * 1000);

    return () => clearInterval(timerInterval);
  }, [userAgentInfo]);

  // Get all available user agents
  const allUserAgents = getAllUserAgents();

  return {
    userAgent: userAgentInfo?.userAgent || '',
    userAgentInfo,
    loading,
    timeUntilNextRotation: timeUntilNext,
    forceRotate,
    resetRotation,
    refreshRotation,
    allUserAgents,
  };
};