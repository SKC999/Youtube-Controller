// Environment configuration for YouTube Controller
// Replace these values with your actual OAuth client IDs from Google Cloud Console

export const ENV = {
  // Google OAuth Client IDs
  GOOGLE_WEB_CLIENT_ID: '398239762640-h0nlkqbidfout500g51buq6tmngps418.apps.googleusercontent.com',
  GOOGLE_IOS_CLIENT_ID: '398239762640-pcssb2kt1sf9ivsfmuouguiho27o8ssh.apps.googleusercontent.com', // iOS Client ID from Google Cloud Console
  GOOGLE_ANDROID_CLIENT_ID: '398239762640-rnkjam0p4465t3qu0j587hdt3trtgq40.apps.googleusercontent.com',
  
  // App Configuration
  APP_NAME: 'YouTube Controller',
  APP_VERSION: '1.0.0',
  
  // API Configuration
  YOUTUBE_API_BASE_URL: 'https://www.googleapis.com/youtube/v3',
  OAUTH_TOKEN_URL: 'https://oauth2.googleapis.com/token',
  OAUTH_REVOKE_URL: 'https://oauth2.googleapis.com/revoke',
  
  // App Links
  PRIVACY_POLICY_URL: 'https://locusflow.com/privacy-policy', // Updated with placeholder
  TERMS_OF_SERVICE_URL: 'https://locusflow.com/terms-of-service', // Updated with placeholder
  SUPPORT_EMAIL: 'support@locusflow.com', // Updated with placeholder
  
  // Feature Flags
  ENABLE_ANALYTICS: false, // Set to true when you add analytics
  ENABLE_CRASH_REPORTING: false, // Set to true when you add crash reporting
  
  // OAuth Scopes
  GOOGLE_SCOPES: [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ],
};

// Validate required environment variables
export const validateEnvironment = () => {
  const requiredVars = [
    'GOOGLE_WEB_CLIENT_ID',
    'GOOGLE_IOS_CLIENT_ID',
    'GOOGLE_ANDROID_CLIENT_ID',
  ];
  
  const missingVars = requiredVars.filter(varName => {
    const value = ENV[varName as keyof typeof ENV];
    return !value || value.toString().includes('YOUR_') || value.toString().includes('REPLACE_WITH');
  });
  
  if (missingVars.length > 0) {
    console.warn(`Missing or invalid environment variables: ${missingVars.join(', ')}`);
    console.warn('Please update src/config/environment.ts with your actual values');
  }
  
  return missingVars.length === 0;
};