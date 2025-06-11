import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { ENV, validateEnvironment } from '../config/environment';

WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  photo?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

interface AuthError {
  code: string;
  message: string;
  details?: any;
}

const STORAGE_KEY = 'youtube-controller-user';
const SECURE_STORAGE_KEY = 'youtube-controller-tokens';

// Validate environment on load
validateEnvironment();

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  // Configure Google Auth with proper client IDs
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: ENV.GOOGLE_WEB_CLIENT_ID,
    iosClientId: ENV.GOOGLE_IOS_CLIENT_ID,
    androidClientId: ENV.GOOGLE_ANDROID_CLIENT_ID,
    scopes: ENV.GOOGLE_SCOPES,
    responseType: 'code',
    shouldAutoExchangeCode: true,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent', // Force consent to get refresh token
    },
  });

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    handleAuthResponse();
  }, [response]);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      await checkStoredUser();
    } catch (error) {
      console.error('Auth initialization error:', error);
      setError({
        code: 'INIT_ERROR',
        message: 'Failed to initialize authentication',
        details: error
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStoredUser = async (): Promise<AuthUser | null> => {
    try {
      // Get user data from storage
      const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
      if (!storedUser) return null;

      const userData = JSON.parse(storedUser);
      
      // Get secure token data
      try {
        const secureData = await SecureStore.getItemAsync(SECURE_STORAGE_KEY);
        if (secureData) {
          const tokenData = JSON.parse(secureData);
          userData.accessToken = tokenData.accessToken;
          userData.refreshToken = tokenData.refreshToken;
          userData.expiresAt = tokenData.expiresAt;
        }
      } catch (secureError) {
        console.warn('Failed to get secure token data:', secureError);
      }
      
      // Check if we have required token data
      if (!userData.accessToken) {
        await clearStoredAuth();
        return null;
      }
      
      // Check if token is still valid
      if (await isTokenValid(userData.accessToken)) {
        setUser(userData);
        return userData;
      }
      
      // Try to refresh token if available
      if (userData.refreshToken) {
        const refreshedUser = await refreshUserToken(userData);
        if (refreshedUser) {
          setUser(refreshedUser);
          return refreshedUser;
        }
      }
      
      // Token invalid and can't refresh, clear storage
      await clearStoredAuth();
    } catch (error) {
      console.error('Error checking stored user:', error);
      await clearStoredAuth();
    }
    return null;
  };

  const handleAuthResponse = async () => {
    if (!response) return;

    try {
      if (response.type === 'success') {
        setIsSigningIn(true);
        const { authentication } = response;
        
        if (authentication?.accessToken) {
          await fetchUserInfo(
            authentication.accessToken, 
            authentication.refreshToken || undefined
          );
        } else {
          throw new Error('No access token received');
        }
      } else if (response.type === 'error') {
        const errorMessage = response.error?.message || 'Authentication failed';
        console.error('Auth error:', response.error);
        
        setError({
          code: 'AUTH_ERROR',
          message: errorMessage,
          details: response.error
        });
        
        // User-friendly error messages
        if (errorMessage.includes('popup_closed')) {
          setError({
            code: 'AUTH_CANCELLED',
            message: 'Sign-in was cancelled. Please try again.',
            details: response.error
          });
        }
      } else if (response.type === 'dismiss' || response.type === 'cancel') {
        console.log('Auth dismissed by user');
      }
    } catch (error) {
      console.error('Auth response handling error:', error);
      setError({
        code: 'RESPONSE_ERROR',
        message: 'Failed to complete sign-in. Please try again.',
        details: error
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const isTokenValid = async (accessToken: string): Promise<boolean> => {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const tokenInfo = await response.json();
        // Valid if more than 5 minutes left
        return tokenInfo.expires_in > 300;
      }
      
      return false;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const refreshUserToken = async (userData: AuthUser): Promise<AuthUser | null> => {
    if (!userData.refreshToken) {
      console.log('No refresh token available');
      return null;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: ENV.GOOGLE_WEB_CLIENT_ID,
          refresh_token: userData.refreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (response.ok) {
        const tokenData = await response.json();
        
        const updatedUser: AuthUser = {
          ...userData,
          accessToken: tokenData.access_token,
          expiresAt: Date.now() + (tokenData.expires_in * 1000),
          // Keep existing refresh token if new one not provided
          refreshToken: tokenData.refresh_token || userData.refreshToken,
        };

        await storeUserSecurely(updatedUser);
        return updatedUser;
      } else {
        const errorData = await response.json();
        console.error('Token refresh failed:', errorData);
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  };

  const fetchUserInfo = async (accessToken: string, refreshToken?: string) => {
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        
        const authUser: AuthUser = {
          id: userInfo.id,
          name: userInfo.name || userInfo.given_name || 'User',
          email: userInfo.email,
          photo: userInfo.picture,
          accessToken: accessToken,
          refreshToken: refreshToken,
          expiresAt: Date.now() + (3600 * 1000), // Default 1 hour
        };

        await storeUserSecurely(authUser);
        setUser(authUser);
        setError(null);
      } else {
        throw new Error(`Failed to fetch user info: ${userInfoResponse.status}`);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setError({
        code: 'USER_INFO_ERROR',
        message: 'Failed to retrieve user information',
        details: error
      });
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  };

  const storeUserSecurely = async (userData: AuthUser) => {
    try {
      // Store non-sensitive data in AsyncStorage
      const publicData = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        photo: userData.photo,
      };
      
      // Store sensitive tokens in SecureStore
      const secureData = {
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
        expiresAt: userData.expiresAt,
      };

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(publicData)),
        SecureStore.setItemAsync(SECURE_STORAGE_KEY, JSON.stringify(secureData))
      ]);
    } catch (error) {
      console.error('Error storing user data:', error);
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    }
  };

  const clearStoredAuth = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEY),
        SecureStore.deleteItemAsync(SECURE_STORAGE_KEY).catch(() => {
          // Ignore error if item doesn't exist
        })
      ]);
    } catch (error) {
      console.error('Error clearing stored auth:', error);
    }
  };

  const signIn = useCallback(async (): Promise<boolean> => {
    try {
      setIsSigningIn(true);
      setError(null);
      
      if (!request) {
        setError({
          code: 'REQUEST_ERROR',
          message: 'Authentication not properly configured. Please try again.'
        });
        setIsSigningIn(false);
        return false;
      }
      
      console.log('Starting Google Sign-In...');
      const result = await promptAsync();
      
      // The response will be handled by the useEffect hook
      return result?.type === 'success';
    } catch (error) {
      console.error('Sign-in error:', error);
      setError({
        code: 'SIGNIN_ERROR',
        message: 'Failed to initiate sign-in. Please check your internet connection.',
        details: error
      });
      setIsSigningIn(false);
      return false;
    }
  }, [request, promptAsync]);

  const signOut = useCallback(async () => {
    try {
      setUser(null);
      setError(null);
      await clearStoredAuth();
      
      // Optionally revoke token on Google's end
      if (user?.accessToken) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${user.accessToken}`, {
            method: 'POST'
          });
        } catch (revokeError) {
          console.warn('Failed to revoke token on server:', revokeError);
          // Don't throw - local signout is more important
        }
      }
    } catch (error) {
      console.error('Sign-out error:', error);
      setError({
        code: 'SIGNOUT_ERROR',
        message: 'Failed to complete sign-out',
        details: error
      });
    }
  }, [user]);

  const refreshCurrentUserToken = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setError({
        code: 'NO_USER',
        message: 'No user is currently signed in'
      });
      return false;
    }

    try {
      const refreshedUser = await refreshUserToken(user);
      if (refreshedUser) {
        setUser(refreshedUser);
        setError(null);
        return true;
      } else {
        setError({
          code: 'REFRESH_FAILED',
          message: 'Failed to refresh authentication. Please sign in again.'
        });
        return false;
      }
    } catch (error) {
      console.error('Manual token refresh error:', error);
      setError({
        code: 'REFRESH_ERROR',
        message: 'Error occurred while refreshing authentication',
        details: error
      });
      return false;
    }
  }, [user]);

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!user?.expiresAt || !user?.refreshToken) return;

    const timeUntilExpiry = user.expiresAt - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 1000); // Refresh 5 minutes before expiry

    if (refreshTime > 0) {
      const timer = setTimeout(async () => {
        console.log('Auto-refreshing token...');
        const success = await refreshCurrentUserToken();
        if (!success) {
          console.warn('Auto-refresh failed, user may need to sign in again');
        }
      }, refreshTime);

      return () => clearTimeout(timer);
    }
  }, [user?.expiresAt, refreshCurrentUserToken]);

  // YouTube API helper function
  const makeYouTubeAPICall = useCallback(async (
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> => {
    if (!user?.accessToken) {
      throw new Error('User not authenticated');
    }

    // Ensure endpoint starts with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const response = await fetch(`https://www.googleapis.com/youtube/v3${cleanEndpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle token expiry
    if (response.status === 401) {
      console.log('Token expired, attempting refresh...');
      const refreshSuccess = await refreshCurrentUserToken();
      if (refreshSuccess && user?.accessToken) {
        // Retry with new token
        return fetch(`https://www.googleapis.com/youtube/v3${cleanEndpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${user.accessToken}`,
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
      }
      throw new Error('Authentication expired. Please sign in again.');
    }

    return response;
  }, [user, refreshCurrentUserToken]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    user,
    loading,
    isSigningIn,
    error,
    
    // Actions
    signIn,
    signOut,
    refreshUserToken: refreshCurrentUserToken,
    clearError,
    
    // Utilities
    makeYouTubeAPICall,
    isTokenValid: user?.accessToken ? () => isTokenValid(user.accessToken) : null,
    
    // Token info
    tokenExpiresAt: user?.expiresAt,
    hasRefreshToken: !!user?.refreshToken,
  };
};