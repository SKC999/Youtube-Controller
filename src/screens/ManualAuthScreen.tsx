import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';

const ManualAuthScreen = ({ onTokenReceived }: { onTokenReceived: (token: string) => void }) => {
  const [token, setToken] = useState('');

  const openOAuthPlayground = () => {
    Linking.openURL('https://developers.google.com/oauthplayground');
  };

  const handleSubmit = () => {
    if (token.trim()) {
      onTokenReceived(token.trim());
    } else {
      Alert.alert('Error', 'Please enter a valid token');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Manual Authentication</Text>
      
      <Text style={styles.instructions}>
        Due to Expo Go limitations, please follow these steps:
      </Text>

      <View style={styles.steps}>
        <Text style={styles.step}>1. Click the button below to open Google OAuth Playground</Text>
        <Text style={styles.step}>2. Click the gear icon (⚙️) in the top right</Text>
        <Text style={styles.step}>3. Check "Use your own OAuth credentials"</Text>
        <Text style={styles.step}>4. Enter Client ID: 398239762640-h0nlkqbidfout500g51buq6tmngps418.apps.googleusercontent.com</Text>
        <Text style={styles.step}>5. Enter Client Secret: (get from Google Console)</Text>
        <Text style={styles.step}>6. Select "YouTube Data API v3" from the list</Text>
        <Text style={styles.step}>7. Click "Authorize APIs"</Text>
        <Text style={styles.step}>8. Sign in and authorize</Text>
        <Text style={styles.step}>9. Click "Exchange authorization code for tokens"</Text>
        <Text style={styles.step}>10. Copy the Access Token and paste it below</Text>
      </View>

      <TouchableOpacity style={styles.playgroundButton} onPress={openOAuthPlayground}>
        <Text style={styles.playgroundButtonText}>Open Google OAuth Playground</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Paste your access token here"
        value={token}
        onChangeText={setToken}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit Token</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        Note: This is a temporary solution for development with Expo Go. 
        The production app will use proper OAuth flow.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  steps: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  step: {
    fontSize: 14,
    marginBottom: 10,
    color: '#333',
  },
  playgroundButton: {
    backgroundColor: '#4285F4',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  playgroundButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#34A853',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ManualAuthScreen;