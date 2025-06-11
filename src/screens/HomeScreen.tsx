import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSettings } from '../hooks/useSettings';
import { useAuthContext } from '../context/AuthContext';

// Define the navigation types to match App.tsx
type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Home: undefined;
  YouTube: { channelId?: string; channelTitle?: string; videoId?: string; videoTitle?: string } | undefined;
  Settings: undefined;
  Subscriptions: undefined;
  ChannelView: { channelId: string; channelTitle: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

interface Subscription {
  id: string;
  snippet: {
    title: string;
    thumbnails: {
      default: { url: string };
    };
    resourceId: {
      channelId: string;
    };
  };
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { settings, updateSettings } = useSettings();
  const { user, signOut } = useAuthContext();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  useEffect(() => {
    if (user?.accessToken) {
      fetchSubscriptions();
    }
  }, [user]);

  const fetchSubscriptions = async () => {
    if (!user?.accessToken) return;

    setLoadingSubscriptions(true);
    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=10',
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.items || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const quickModes = [
    {
      id: 'focus',
      name: 'Focus Mode',
      description: 'Hide all distractions - just search and watch',
      icon: '🎯',
      settings: {
        showRecommendations: false,
        showSidebar: false,
        showComments: false,
        showRelatedVideos: false,
        showShorts: false, // Block Shorts in focus mode
      },
    },
    {
      id: 'minimal',
      name: 'Minimal Mode',
      description: 'Hide recommendations but keep basic features',
      icon: '✨',
      settings: {
        showRecommendations: false,
        showSidebar: true,
        showComments: true,
        showRelatedVideos: false,
        showShorts: true, // Allow Shorts in minimal mode
      },
    },
    {
      id: 'no-shorts',
      name: 'No Shorts',
      description: 'Hide all Shorts while keeping other features',
      icon: '🚫',
      settings: {
        showRecommendations: true,
        showSidebar: true,
        showComments: true,
        showRelatedVideos: true,
        showShorts: false, // Specifically block Shorts
      },
    },
    {
      id: 'normal',
      name: 'Normal Mode',
      description: 'Show all YouTube features including Shorts',
      icon: '📺',
      settings: {
        showRecommendations: true,
        showSidebar: true,
        showComments: true,
        showRelatedVideos: true,
        showShorts: true,
      },
    },
  ];

  const handleQuickMode = async (mode: typeof quickModes[0]) => {
    const success = await updateSettings(mode.settings);
    if (success) {
      Alert.alert(
        `${mode.name} Applied!`,
        mode.description,
        [
          { text: 'Open YouTube', onPress: () => navigation.navigate('YouTube') },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert('Error', 'Failed to apply settings. Please try again.');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You\'ll lose access to your personal YouTube features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.replace('Auth');
          },
        },
      ]
    );
  };

  const navigateToSubscriptions = () => {
    console.log('Navigating to Subscriptions...');
    try {
      navigation.navigate('Subscriptions');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to navigate to subscriptions. Please try again.');
    }
  };

  const getStatusIndicator = (setting: keyof typeof settings, label: string) => {
    const isEnabled = settings[setting];
    return (
      <View style={[styles.statusIndicator, isEnabled ? styles.statusEnabled : styles.statusDisabled]}>
        <Text style={[styles.statusText, isEnabled ? styles.statusTextEnabled : styles.statusTextDisabled]}>
          {label}: {isEnabled ? 'ON' : 'OFF'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile Section */}
        {user && (
          <View style={styles.userSection}>
            <View style={styles.userInfo}>
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.userAvatar} />
              ) : (
                <View style={styles.userAvatarPlaceholder}>
                  <Text style={styles.userAvatarText}>
                    {user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.userDetails}>
                <Text style={styles.userName}>Welcome, {user.name}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.header}>
          <Text style={styles.title}>YouTube Controller</Text>
          <Text style={styles.subtitle}>
            Take control of your YouTube experience
          </Text>
        </View>

        {/* Quick Start Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start Modes</Text>
          <Text style={styles.sectionDescription}>
            Apply preset configurations instantly
          </Text>
          {quickModes.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={styles.modeCard}
              onPress={() => handleQuickMode(mode)}
            >
              <View style={styles.modeHeader}>
                <Text style={styles.modeIcon}>{mode.icon}</Text>
                <View style={styles.modeInfo}>
                  <Text style={styles.modeName}>{mode.name}</Text>
                  <Text style={styles.modeDescription}>{mode.description}</Text>
                </View>
              </View>
              <View style={styles.modeSettings}>
                <Text style={styles.modeSettingsText}>
                  {!mode.settings.showShorts ? '🚫 Shorts' : '📱 Shorts'} • 
                  {!mode.settings.showRecommendations ? ' 🚫 Recs' : ' 📺 Recs'} • 
                  {!mode.settings.showComments ? ' 🚫 Comments' : ' 💬 Comments'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Current Settings Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Settings</Text>
          <View style={styles.settingsStatus}>
            {getStatusIndicator('showRecommendations', 'Recommendations')}
            {getStatusIndicator('showShorts', 'Shorts')}
            {getStatusIndicator('showComments', 'Comments')}
            {getStatusIndicator('showRelatedVideos', 'Related Videos')}
          </View>
        </View>

        {/* Subscriptions Section */}
        {user && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Subscriptions</Text>
              <TouchableOpacity
                onPress={navigateToSubscriptions}
                style={styles.seeAllButton}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {loadingSubscriptions ? (
              <ActivityIndicator size="small" color="#FF0000" style={styles.loader} />
            ) : subscriptions.length > 0 ? (
              <FlatList
                horizontal
                data={subscriptions}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.subscriptionItem}>
                    <Image
                      source={{ uri: item.snippet.thumbnails.default.url }}
                      style={styles.subscriptionThumbnail}
                    />
                    <Text style={styles.subscriptionTitle} numberOfLines={1}>
                      {item.snippet.title}
                    </Text>
                  </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subscriptionsList}
              />
            ) : (
              <TouchableOpacity
                style={styles.subscriptionButton}
                onPress={navigateToSubscriptions}
              >
                <Text style={styles.subscriptionButtonText}>View Subscriptions</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('YouTube')}
          >
            <Text style={styles.primaryButtonText}>
              {user ? 'Open YouTube (Signed In)' : 'Open YouTube'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.secondaryButtonText}>Advanced Settings</Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity
              style={[styles.button, styles.subscriptionsButton]}
              onPress={navigateToSubscriptions}
            >
              <Text style={styles.subscriptionsButtonText}>📺 All Subscriptions</Text>
            </TouchableOpacity>
          )}

          {!user && (
            <TouchableOpacity
              style={[styles.button, styles.authButton]}
              onPress={() => navigation.navigate('Auth')}
            >
              <Text style={styles.authButtonText}>Sign In to Access Account</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Tips</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Shorts Blocking:</Text> When disabled, Shorts URLs are automatically redirected to regular video format for a better viewing experience.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Focus Mode:</Text> Perfect for studying or work - hides all distracting content including Shorts and recommendations.
            </Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Draggable Button:</Text> The settings button in YouTube can be moved around the screen by pressing and dragging it to your preferred position.
            </Text>
          </View>
          {user && (
            <View style={styles.tipCard}>
              <Text style={styles.tipText}>
                <Text style={styles.tipBold}>Subscriptions:</Text> Access your subscriptions through the dedicated screen or the floating button in YouTube for controlled browsing.
              </Text>
            </View>
          )}
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
  scrollContent: {
    padding: 20,
  },
  userSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  signOutButtonText: {
    color: '#FF6B6B',
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  modeCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  modeInfo: {
    flex: 1,
  },
  modeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
  },
  modeSettings: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 6,
  },
  modeSettingsText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  settingsStatus: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusEnabled: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  statusDisabled: {
    backgroundColor: '#FFF3F3',
    borderColor: '#FF6B6B',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextEnabled: {
    color: '#2E7D32',
  },
  statusTextDisabled: {
    color: '#C62828',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF0000',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  subscriptionsButton: {
    backgroundColor: '#4285F4',
  },
  authButton: {
    backgroundColor: '#4285F4',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#FF0000',
    fontSize: 18,
    fontWeight: '600',
  },
  subscriptionsButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  authButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF0000',
    borderRadius: 15,
  },
  seeAllText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  subscriptionsList: {
    paddingRight: 10,
  },
  subscriptionItem: {
    marginRight: 15,
    alignItems: 'center',
    width: 80,
  },
  subscriptionThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  subscriptionButton: {
    backgroundColor: '#FF0000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  subscriptionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tipCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '600',
    color: '#333',
  },
});

export default HomeScreen;