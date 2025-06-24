import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import LoadingScreen from './src/screens/LoadingScreen';
import AuthScreen from './src/screens/AuthScreen'; // Remove the {} since it's default export
import HomeScreen from './src/screens/HomeScreen';
import SubscriptionsScreen from './src/screens/SubscriptionsScreen';
import YouTubeScreen from './src/screens/YouTubeScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import auth context - use the new AuthProvider from useAuth
import { AuthProvider } from './src/hooks/useAuth';

export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Home: undefined;
  Subscriptions: undefined;
  YouTube: { 
    channelId?: string; 
    channelTitle?: string; 
    videoId?: string; 
    videoTitle?: string 
  } | undefined;
  Settings: undefined;
  ChannelView: { channelId: string; channelTitle: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Loading"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#FF0000',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Loading" 
              component={LoadingScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen}
              options={{ 
                title: 'Sign In',
                headerShown: false 
              }}
            />
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ 
                title: 'YouTube Controller'
              }}
            />
            <Stack.Screen 
              name="Subscriptions"
              component={SubscriptionsScreen}
              options={{ 
                title: 'My Subscriptions'
              }}
            />
            <Stack.Screen 
              name="YouTube" 
              component={YouTubeScreen}
              options={{ 
                title: 'YouTube',
                headerShown: false
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen}
              options={{ 
                title: 'Settings'
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}