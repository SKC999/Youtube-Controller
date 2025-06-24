import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Settings'>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { user, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear only cache-related data, not auth tokens
              await AsyncStorage.multiRemove(['cache_subscriptions', 'cache_videos']);
              Alert.alert('Success', 'Cache cleared successfully');
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const showAccountInfo = () => {
    Alert.alert(
      'Account Information',
      `Name: ${user?.name}\nEmail: ${user?.email}\nUser ID: ${user?.id}`,
      [{ text: 'OK' }]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'About YouTube Controller',
      'Version 1.0.0\n\nA simple YouTube controller app built with React Native and Expo.\n\nDeveloped for managing YouTube subscriptions and controlling playback.',
      [{ text: 'OK' }]
    );
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightComponent 
  }: {
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && onPress && <Text style={styles.arrow}>›</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <SettingItem
            title="Account Information"
            subtitle={user?.email}
            onPress={showAccountInfo}
          />
          
          <SettingItem
            title="Sign Out"
            subtitle="Sign out of your Google account"
            onPress={handleSignOut}
          />
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <SettingItem
            title="Notifications"
            subtitle="Enable push notifications"
            showArrow={false}
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: '#FF0000' }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
              />
            }
          />
          
          <SettingItem
            title="Autoplay"
            subtitle="Automatically play next video"
            showArrow={false}
            rightComponent={
              <Switch
                value={autoplayEnabled}
                onValueChange={setAutoplayEnabled}
                trackColor={{ false: '#767577', true: '#FF0000' }}
                thumbColor={autoplayEnabled ? '#ffffff' : '#f4f3f4'}
              />
            }
          />
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          
          <SettingItem
            title="Clear Cache"
            subtitle="Clear cached videos and subscriptions"
            onPress={clearCache}
          />
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <SettingItem
            title="About"
            subtitle="App version and information"
            onPress={showAbout}
          />
        </View>

        {/* User Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Signed in as {user?.name}
          </Text>
          <Text style={styles.footerSubtext}>
            User ID: {user?.id}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginHorizontal: 20,
  },
  settingItem: {
    backgroundColor: 'white',
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e0e0e0',
  },
  settingLeft: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 20,
    color: '#c0c0c0',
    marginLeft: 10,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
});

export default SettingsScreen;