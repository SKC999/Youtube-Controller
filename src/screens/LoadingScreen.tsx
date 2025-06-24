import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../hooks/useAuth'; // Use the new auth hook

type LoadingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Loading'>;

const LoadingScreen = () => {
  const navigation = useNavigation<LoadingScreenNavigationProp>();
  const { isAuthenticated, user } = useAuth(); // Use the new auth hook

  useEffect(() => {
    // Add a small delay to show the loading screen
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        // User is signed in, go to home
        navigation.replace('Home');
      } else {
        // User is not signed in, go to auth
        navigation.replace('Auth');
      }
    }, 2000); // 2 second delay

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YouTube Controller</Text>
      <ActivityIndicator size="large" color="#FF0000" style={styles.loader} />
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginTop: 20,
  },
  loader: {
    marginVertical: 20,
  },
});

export default LoadingScreen;