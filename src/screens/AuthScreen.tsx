import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../hooks/useAuth';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

const AuthScreen = () => {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const { signIn, isSigningIn, error, isAuthenticated } = useAuth();

  // Navigate to home when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Home');
    }
  }, [isAuthenticated, navigation]);

  const handleSignIn = async () => {
    try {
      const success = await signIn();
      if (!success) {
        Alert.alert(
          'Sign In Failed', 
          'Unable to sign in with Google. Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: handleSignIn },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Error', 
        'An unexpected error occurred during sign in. Please try again.',
        [
          { text: 'Retry', onPress: handleSignIn },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>YouTube Controller</Text>
        <Text style={styles.subtitle}>Take control of your YouTube experience</Text>
        
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features:</Text>
          <Text style={styles.feature}>🎯 Hide distracting recommendations</Text>
          <Text style={styles.feature}>📺 Access your subscriptions easily</Text>
          <Text style={styles.feature}>🚫 Block YouTube Shorts</Text>
          <Text style={styles.feature}>💬 Control comments visibility</Text>
          <Text style={styles.feature}>⚙️ Customizable viewing modes</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error.message}</Text>
            <Text style={styles.errorHint}>
              Make sure you have a stable internet connection and try again.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.signInButton, isSigningIn && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={isSigningIn}
        >
          <Text style={styles.signInButtonText}>
            {isSigningIn ? 'Signing In...' : 'Sign in with Google'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Sign in to access your YouTube subscriptions and personalize your experience.
        </Text>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  feature: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 350,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  errorHint: {
    color: '#c62828',
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.8,
  },
  signInButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  note: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    maxWidth: 300,
    lineHeight: 18,
  },
});

export default AuthScreen;