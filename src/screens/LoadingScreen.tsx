import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuthContext } from '../context/AuthContext';

type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Home: undefined;
  YouTube: undefined;
  Settings: undefined;
};

type LoadingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Loading'>;

interface Props {
  navigation: LoadingScreenNavigationProp;
}

const LoadingScreen: React.FC<Props> = ({ navigation }) => {
  const { user, loading } = useAuthContext();

  useEffect(() => {
    if (!loading) {
      // Navigate based on auth state
      if (user) {
        navigation.replace('Home');
      } else {
        navigation.replace('Auth');
      }
    }
  }, [loading, user, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>📺</Text>
        </View>
        
        <Text style={styles.title}>YouTube Controller</Text>
        
        <ActivityIndicator 
          size="large" 
          color="#FF0000" 
          style={styles.loader}
        />
        
        <Text style={styles.loadingText}>
          Initializing your experience...
        </Text>
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
    padding: 24,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  logoText: {
    fontSize: 48,
    color: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default LoadingScreen;