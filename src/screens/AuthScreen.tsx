import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { ENV } from '../config/environment';

type RootStackParamList = {
  Home: undefined;
  YouTube: undefined;
  Settings: undefined;
  Auth: undefined;
};

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

interface Props {
  navigation: AuthScreenNavigationProp;
}

export const AuthScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn, isSigningIn, error, clearError } = useAuth();

  const handleSignIn = async () => {
    try {
      clearError();
      const success = await signIn();
      
      if (success) {
        // Navigation will be handled by LoadingScreen
        // based on auth state change
      } else if (error) {
        // Error is already set by useAuth hook
        showErrorAlert();
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      showErrorAlert();
    }
  };

  const showErrorAlert = () => {
    const errorMessage = error?.message || 'An unexpected error occurred during sign-in.';
    const errorCode = error?.code || 'UNKNOWN_ERROR';
    
    let title = 'Sign-In Failed';
    let message = errorMessage;
    
    // Provide user-friendly error messages
    switch (errorCode) {
      case 'AUTH_CANCELLED':
        title = 'Sign-In Cancelled';
        message = 'You cancelled the sign-in process. Please try again when you\'re ready.';
        break;
      case 'NETWORK_ERROR':
        title = 'Network Error';
        message = 'Please check your internet connection and try again.';
        break;
      case 'REQUEST_ERROR':
        title = 'Configuration Error';
        message = 'There\'s an issue with the app configuration. Please contact support.';
        break;
      default:
        // Use the error message from the hook
        break;
    }
    
    Alert.alert(title, message, [
      { text: 'OK', onPress: () => clearError() }
    ]);
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL(ENV.PRIVACY_POLICY_URL);
  };

  const handleTermsOfService = () => {
    Linking.openURL(ENV.TERMS_OF_SERVICE_URL);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        
        <Text style={styles.title}>YouTube Controller</Text>
        <Text style={styles.subtitle}>
          Take control of your YouTube experience with enhanced parental controls
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🚫</Text>
            <Text style={styles.featureText}>Block distracting content</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📺</Text>
            <Text style={styles.featureText}>Manage subscriptions</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⚙️</Text>
            <Text style={styles.featureText}>Customize your experience</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={handleSignIn}
          disabled={isSigningIn}
        >
          {isSigningIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error.message}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={styles.errorDismiss}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            By signing in, you agree to our{' '}
            <Text style={styles.link} onPress={handleTermsOfService}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={styles.link} onPress={handlePrivacyPolicy}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>🔒</Text>
          <Text style={styles.securityText}>
            Your data is secure. We only access YouTube data to provide app features.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 40,
    width: '100%',
    maxWidth: 300,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#555',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 12,
    backgroundColor: '#fff',
    color: '#4285F4',
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    maxWidth: 300,
    width: '100%',
  },
  errorText: {
    color: '#C33',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDismiss: {
    color: '#C33',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalContainer: {
    marginTop: 24,
    paddingHorizontal: 40,
  },
  legalText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: '#4285F4',
    textDecorationLine: 'underline',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    paddingHorizontal: 20,
    maxWidth: 300,
  },
  securityIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  securityText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});