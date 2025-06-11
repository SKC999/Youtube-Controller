export interface AppSettings {
  showRecommendations: boolean;
  showSidebar: boolean;
  showComments: boolean;
  showRelatedVideos: boolean;
  customCSS: string;
}

export interface ControlMode {
  id: string;
  name: string;
  description: string;
  settings: Partial<AppSettings>;
}

export type RootStackParamList = {
  Home: undefined;
  YouTube: undefined;
  Settings: undefined;
};