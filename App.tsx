import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import LoadingScreen from './src/screens/LoadingScreen';
import { AuthScreen } from './src/screens/AuthScreen';

// Import auth context
import { AuthProvider } from './src/context/AuthContext';

export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
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
                backgroundColor: '#FF0000', // YouTube red
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
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}