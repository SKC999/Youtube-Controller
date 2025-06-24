// types/index.ts - Centralized type definitions

// Navigation Types
export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Home: undefined;
  Subscriptions: undefined; // Fixed naming consistency
  YouTube: YouTubeScreenParams | undefined;
  Settings: undefined;
  ChannelView: { channelId: string; channelTitle: string };
};

export interface YouTubeScreenParams {
  channelId?: string;
  channelTitle?: string;
  videoId?: string;
  videoTitle?: string;
}

// YouTube API Types
export interface YouTubeSubscription {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: YouTubeThumbnails;
    resourceId: {
      channelId: string;
    };
    publishedAt: string;
  };
  contentDetails?: {
    totalItemCount: number;
    newItemCount: number;
  };
}

export interface YouTubeThumbnails {
  default: { url: string };
  medium: { url: string };
  high: { url: string };
}

export interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: YouTubeThumbnails;
    publishedAt: string;
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
}

export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: YouTubeThumbnails;
    publishedAt: string;
    channelId: string;
    channelTitle: string;
  };
}

// App Settings Types
export interface AppSettings {
  showRecommendations: boolean;
  showSidebar: boolean;
  showComments: boolean;
  showRelatedVideos: boolean;
  showShorts: boolean;
  customCSS: string;
  debugMode: boolean;
  autoInject: boolean;
  injectionDelay: number;
  theme: 'light' | 'dark' | 'auto';
}

export interface SettingsPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: Partial<AppSettings>;
}

// Authentication Types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  photo?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// Quick Mode Types
export interface QuickMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: Partial<AppSettings>;
}

// API Response Types
export interface YouTubeAPIResponse<T> {
  kind: string;
  etag: string;
  items: T[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export type SubscriptionsResponse = YouTubeAPIResponse<YouTubeSubscription>;
export type ChannelsResponse = YouTubeAPIResponse<YouTubeChannel>;
export type VideosResponse = YouTubeAPIResponse<YouTubeVideo>;

// UI Component Types
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  retry?: () => void;
}

export interface NavigationProps<T extends keyof RootStackParamList> {
  navigation: any; // Stack navigation prop
  route?: any; // Route prop
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Environment Types
export interface EnvironmentConfig {
  GOOGLE_WEB_CLIENT_ID: string;
  GOOGLE_IOS_CLIENT_ID: string;
  GOOGLE_ANDROID_CLIENT_ID: string;
  APP_NAME: string;
  APP_VERSION: string;
  YOUTUBE_API_BASE_URL: string;
  OAUTH_TOKEN_URL: string;
  OAUTH_REVOKE_URL: string;
  PRIVACY_POLICY_URL: string;
  TERMS_OF_SERVICE_URL: string;
  SUPPORT_EMAIL: string;
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASH_REPORTING: boolean;
  GOOGLE_SCOPES: string[];
}

// Storage Types
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export interface SecureStorageData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface PublicUserData {
  id: string;
  name: string;
  email: string;
  photo?: string;
}