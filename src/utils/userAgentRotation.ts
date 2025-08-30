// src/utils/userAgentRotation.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_AGENT_KEY = 'youtube_controller_user_agent';
const USER_AGENT_TIMESTAMP_KEY = 'youtube_controller_user_agent_timestamp';

// iOS phone user agents - 30 different iPhone models and iOS versions for maximum rotation variety
const IOS_USER_AGENTS = [
  // iPhone 15 Series - iOS 17.x
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  
  // iPhone 14 Series - iOS 16.x
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.7 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  
  // iPhone 13 Series - iOS 15.x
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7_9 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.7 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.7 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_7_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.3 Mobile/15E148 Safari/604.1',
  
  // iPhone 12 Series - iOS 14.x & 15.x
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
  
  // iPhone 11 Series - iOS 13.x & 14.x
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 13_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 13_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.2 Mobile/15E148 Safari/604.1',
];

// 24 hours in milliseconds
const ROTATION_INTERVAL = 24 * 60 * 60 * 1000;

export interface UserAgentInfo {
  userAgent: string;
  index: number;
  lastRotated: number;
  nextRotation: number;
  deviceInfo: string;
}

/**
 * Get a user-friendly device info from user agent
 */
const getDeviceInfo = (userAgent: string): string => {
  // Extract iOS version and create device mapping
  const iosVersionMatch = userAgent.match(/iPhone OS (\d+_\d+(?:_\d+)?)/);
  if (!iosVersionMatch) return 'iPhone';
  
  const iosVersion = iosVersionMatch[1];
  
  // Map iOS versions to likely iPhone models based on release timeline
  if (iosVersion.startsWith('17_')) {
    if (iosVersion === '17_2_1') return 'iPhone 15 Pro Max';
    if (iosVersion.includes('17_1')) return 'iPhone 15 Pro';
    if (iosVersion.includes('17_0')) return 'iPhone 15';
    return 'iPhone 15 Series';
  }
  
  if (iosVersion.startsWith('16_')) {
    if (iosVersion.includes('16_7')) return 'iPhone 14 Pro Max';
    if (iosVersion.includes('16_6')) return 'iPhone 14 Pro';
    if (iosVersion.includes('16_5')) return 'iPhone 14 Plus';
    if (iosVersion.includes('16_4')) return 'iPhone 14';
    if (iosVersion.includes('16_3')) return 'iPhone 14 Pro';
    if (iosVersion.includes('16_2')) return 'iPhone 14 Plus';
    if (iosVersion.includes('16_1')) return 'iPhone 14';
    if (iosVersion.includes('16_0')) return 'iPhone 14';
    return 'iPhone 14 Series';
  }
  
  if (iosVersion.startsWith('15_')) {
    if (iosVersion.includes('15_7')) return 'iPhone 13 Pro Max';
    if (iosVersion.includes('15_6')) return 'iPhone 13 Pro';
    if (iosVersion.includes('15_5')) return 'iPhone 13';
    if (iosVersion.includes('15_4')) return 'iPhone 13 mini';
    if (iosVersion.includes('15_3')) return 'iPhone 13 Pro';
    if (iosVersion.includes('15_2')) return 'iPhone 12 Pro Max';
    return 'iPhone 13 Series';
  }
  
  if (iosVersion.startsWith('14_')) {
    if (iosVersion.includes('14_8')) return 'iPhone 12 Pro Max';
    if (iosVersion.includes('14_7')) return 'iPhone 12 Pro';
    if (iosVersion.includes('14_6')) return 'iPhone 12';
    if (iosVersion.includes('14_5')) return 'iPhone 12 mini';
    if (iosVersion.includes('14_4')) return 'iPhone 12 Pro';
    if (iosVersion.includes('14_3')) return 'iPhone 11 Pro Max';
    return 'iPhone 12 Series';
  }
  
  if (iosVersion.startsWith('13_')) {
    if (iosVersion.includes('13_7')) return 'iPhone 11 Pro Max';
    if (iosVersion.includes('13_6')) return 'iPhone 11 Pro';
    return 'iPhone 11 Series';
  }
  
  // Fallback with iOS version
  return `iPhone (iOS ${iosVersion.replace(/_/g, '.')})`;
};

/**
 * Initialize or load the current user agent rotation state
 */
export const initializeUserAgentRotation = async (): Promise<UserAgentInfo> => {
  try {
    const storedUserAgent = await AsyncStorage.getItem(USER_AGENT_KEY);
    const storedTimestamp = await AsyncStorage.getItem(USER_AGENT_TIMESTAMP_KEY);
    
    const currentTime = Date.now();
    let currentIndex = 0;
    let lastRotated = currentTime;
    
    // If we have stored data, try to use it
    if (storedUserAgent && storedTimestamp) {
      const storedIndex = IOS_USER_AGENTS.findIndex(ua => ua === storedUserAgent);
      const timestamp = parseInt(storedTimestamp, 10);
      
      if (storedIndex !== -1 && !isNaN(timestamp)) {
        const timeSinceLastRotation = currentTime - timestamp;
        
        if (timeSinceLastRotation < ROTATION_INTERVAL) {
          // Use stored user agent if it hasn't been 24 hours yet
          currentIndex = storedIndex;
          lastRotated = timestamp;
        } else {
          // Time to rotate - move to next user agent
          currentIndex = (storedIndex + 1) % IOS_USER_AGENTS.length;
          lastRotated = currentTime;
          
          // Save new rotation
          await AsyncStorage.setItem(USER_AGENT_KEY, IOS_USER_AGENTS[currentIndex]);
          await AsyncStorage.setItem(USER_AGENT_TIMESTAMP_KEY, currentTime.toString());
          
          console.log('[User Agent Rotation] Rotated to new user agent:', getDeviceInfo(IOS_USER_AGENTS[currentIndex]));
        }
      }
    } else {
      // First time - use random starting index to distribute load
      currentIndex = Math.floor(Math.random() * IOS_USER_AGENTS.length);
      lastRotated = currentTime;
      
      // Save initial selection
      await AsyncStorage.setItem(USER_AGENT_KEY, IOS_USER_AGENTS[currentIndex]);
      await AsyncStorage.setItem(USER_AGENT_TIMESTAMP_KEY, currentTime.toString());
      
      console.log('[User Agent Rotation] Initialized with user agent:', getDeviceInfo(IOS_USER_AGENTS[currentIndex]));
    }
    
    const userAgent = IOS_USER_AGENTS[currentIndex];
    const nextRotation = lastRotated + ROTATION_INTERVAL;
    
    return {
      userAgent,
      index: currentIndex,
      lastRotated,
      nextRotation,
      deviceInfo: getDeviceInfo(userAgent),
    };
  } catch (error) {
    console.error('[User Agent Rotation] Error initializing:', error);
    
    // Fallback to first user agent
    const fallbackIndex = 0;
    const fallbackUserAgent = IOS_USER_AGENTS[fallbackIndex];
    const currentTime = Date.now();
    
    return {
      userAgent: fallbackUserAgent,
      index: fallbackIndex,
      lastRotated: currentTime,
      nextRotation: currentTime + ROTATION_INTERVAL,
      deviceInfo: getDeviceInfo(fallbackUserAgent),
    };
  }
};

/**
 * Check if it's time to rotate and perform rotation if needed
 */
export const checkAndRotateUserAgent = async (): Promise<UserAgentInfo> => {
  try {
    const currentInfo = await initializeUserAgentRotation();
    const currentTime = Date.now();
    
    // Check if 24 hours have passed
    if (currentTime >= currentInfo.nextRotation) {
      const newIndex = (currentInfo.index + 1) % IOS_USER_AGENTS.length;
      const newUserAgent = IOS_USER_AGENTS[newIndex];
      
      // Save new rotation
      await AsyncStorage.setItem(USER_AGENT_KEY, newUserAgent);
      await AsyncStorage.setItem(USER_AGENT_TIMESTAMP_KEY, currentTime.toString());
      
      console.log('[User Agent Rotation] Auto-rotated from', getDeviceInfo(currentInfo.userAgent), 'to', getDeviceInfo(newUserAgent));
      
      return {
        userAgent: newUserAgent,
        index: newIndex,
        lastRotated: currentTime,
        nextRotation: currentTime + ROTATION_INTERVAL,
        deviceInfo: getDeviceInfo(newUserAgent),
      };
    }
    
    return currentInfo;
  } catch (error) {
    console.error('[User Agent Rotation] Error checking rotation:', error);
    return await initializeUserAgentRotation(); // Fallback to initialization
  }
};

/**
 * Force rotation to next user agent (for testing or manual rotation)
 */
export const forceRotateUserAgent = async (): Promise<UserAgentInfo> => {
  try {
    const currentInfo = await initializeUserAgentRotation();
    const newIndex = (currentInfo.index + 1) % IOS_USER_AGENTS.length;
    const newUserAgent = IOS_USER_AGENTS[newIndex];
    const currentTime = Date.now();
    
    // Save forced rotation
    await AsyncStorage.setItem(USER_AGENT_KEY, newUserAgent);
    await AsyncStorage.setItem(USER_AGENT_TIMESTAMP_KEY, currentTime.toString());
    
    console.log('[User Agent Rotation] Force rotated to:', getDeviceInfo(newUserAgent));
    
    return {
      userAgent: newUserAgent,
      index: newIndex,
      lastRotated: currentTime,
      nextRotation: currentTime + ROTATION_INTERVAL,
      deviceInfo: getDeviceInfo(newUserAgent),
    };
  } catch (error) {
    console.error('[User Agent Rotation] Error forcing rotation:', error);
    return await initializeUserAgentRotation();
  }
};

/**
 * Get time remaining until next rotation
 */
export const getTimeUntilNextRotation = (nextRotation: number): {
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
} => {
  const currentTime = Date.now();
  const timeRemaining = Math.max(0, nextRotation - currentTime);
  
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  return {
    hours,
    minutes,
    seconds,
    totalMs: timeRemaining,
  };
};

/**
 * Get all available user agents with device info
 */
export const getAllUserAgents = (): Array<{userAgent: string; deviceInfo: string; index: number}> => {
  return IOS_USER_AGENTS.map((userAgent, index) => ({
    userAgent,
    deviceInfo: getDeviceInfo(userAgent),
    index,
  }));
};

/**
 * Reset rotation system (clears stored data)
 */
export const resetUserAgentRotation = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_AGENT_KEY);
    await AsyncStorage.removeItem(USER_AGENT_TIMESTAMP_KEY);
    console.log('[User Agent Rotation] Reset completed');
  } catch (error) {
    console.error('[User Agent Rotation] Error resetting:', error);
  }
};