import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isSigningIn: boolean;
  error: AuthError | null;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  handleManualToken: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  // For iOS OAuth clients, use the reversed client ID as redirect URI
  const iosRedirectUri = `com.googleusercontent.apps.398239762640-pcssb2kt1sf9ivsfmuouguiho27o8ssh://`;

  const [request, response, promptAsync] = Google.useAuthRequest({
    // Use the iOS client ID
    clientId: ENV.GOOGLE_IOS_CLIENT_ID,
    scopes: ENV.GOOGLE_SCOPES,
    responseType: 'code',
    shouldAutoExchangeCode: true,
    // Use the reversed client ID as redirect URI (required for iOS OAuth clients)
    redirectUri: iosRedirectUri,
    extraParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  });

  // Log configuration
  useEffect(() => {
    console.log('iOS OAuth Configuration:', {
      clientId: ENV.GOOGLE_IOS_CLIENT_ID,
      redirectUri: iosRedirectUri,
      scopes: ENV.GOOGLE_SCOPES,
    });
  }, []);

  // Log response changes for debugging
  useEffect(() => {
    console.log('Response changed:', response?.type || 'null');
    if (response) {
      console.log('Full response object:', JSON.stringify(response, null, 2));
    }
  }, [response]);

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      console.log('Auth response received: success');
      console.log('Full response:', JSON.stringify(response, null, 2));
      
      if (response.authentication?.accessToken) {
        fetchUserInfo(response.authentication.accessToken, response.authentication.refreshToken);
      } else {
        console.error('No access token in response');
        setError({
          code: 'NO_TOKEN',
          message: 'Authentication completed but no access token received.',
        });
        setIsSigningIn(false);
      }
    } else if (response?.type === 'error') {
      console.log('Auth response received: error');
      console.log('Full response:', JSON.stringify(response, null, 2));
      setError({
        code: 'AUTH_ERROR',
        message: response.error?.message || 'Authentication failed.',
        details: response.error,
      });
      setIsSigningIn(false);
    } else if (response?.type === 'cancel') {
      console.log('Auth response received: cancel');
      console.log('User cancelled authentication');
      setIsSigningIn(false);
    }
  }, [response]);

  const fetchUserInfo = useCallback(async (accessToken: string, refreshToken?: string) => {
    try {
      console.log('Fetching user info with token:', accessToken.substring(0, 20) + '...');
      
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const userInfo = await response.json();
        console.log('User info fetched successfully:', userInfo.name);

        const authUser: AuthUser = {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture,
          accessToken: accessToken,
          refreshToken: refreshToken,
        };        
        
        setUser(authUser);
        
        // Store tokens
        await AsyncStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          await AsyncStorage.setItem('refreshToken', refreshToken);
        }
        await AsyncStorage.setItem('user', JSON.stringify(authUser));
        
        console.log('Authentication completed successfully');
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch user info:', response.status, errorText);
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      setError({
        code: 'USER_INFO_ERROR',
        message: 'Failed to fetch user information.',
        details: error,
      });
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const signIn = useCallback(async (): Promise<boolean> => {
    try {
      setIsSigningIn(true);
      setError(null);
      
      console.log('Starting Google Sign-In...');
      console.log('Request object: present');
      console.log('PromptAsync function: present');
      
      const result = await promptAsync();
      console.log('PromptAsync result:', result ? JSON.stringify(result, null, 2) : 'null');
      
      return result?.type === 'success';
    } catch (error: any) {
      console.error('Sign-in error:', error);
      console.error('Error details:', error.message);
      setError({
        code: 'SIGNIN_ERROR',
        message: 'Failed to complete sign-in. Please try again.',
        details: error
      });
      return false;
    } finally {
      setIsSigningIn(false);
    }
  }, [promptAsync]);

  const handleManualToken = useCallback(async (accessToken: string): Promise<boolean> => {
    try {
      setIsSigningIn(true);
      setError(null);
      
      console.log('Processing manual token...');
      await fetchUserInfo(accessToken);
      return true;
    } catch (error: any) {
      console.error('Manual token error:', error);
      setError({
        code: 'MANUAL_TOKEN_ERROR',
        message: 'Invalid token. Please try again.',
        details: error
      });
      return false;
    }
  }, [fetchUserInfo]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      setUser(null);
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  }, []);

  // Load stored user on app start
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const accessToken = await AsyncStorage.getItem('accessToken');
        
        if (storedUser && accessToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            ...parsedUser,
            accessToken: accessToken,
          });
          console.log('Restored user session');
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
      }
    };
    loadStoredUser();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isSigningIn,
    error,
    signIn,
    signOut,
    handleManualToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};