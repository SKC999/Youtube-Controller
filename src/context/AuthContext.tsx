import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, AuthUser } from '../hooks/useAuth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isSigningIn: boolean;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshUserToken: () => Promise<boolean>;
  makeYouTubeAPICall: (endpoint: string, options?: RequestInit) => Promise<Response>;
  error: any;
  clearError: () => void;
  isTokenValid: (() => Promise<boolean>) | null;
  tokenExpiresAt: number | undefined;
  hasRefreshToken: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authData = useAuth();

  return (
    <AuthContext.Provider value={authData}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};