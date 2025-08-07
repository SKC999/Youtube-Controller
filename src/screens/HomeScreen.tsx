import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Dimensions,
  StatusBar,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../hooks/useSettings';
import { useSmartNotificationManager, Subscription } from '../utils/notificationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, signOut, refreshAccessToken } = useAuth();
  const { 
    settings, 
    updateSettings, 
    getCurrentMode, 
    builtInPresets, 
    applyPreset,
    loading 
  } = useSettings();
  
  // Smart notification manager
  const {
    loadClearedNotifications,
    clearChannelNotification,
    applySmartNotificationClearing,
    cleanupOldNotifications,
    getStats
  } = useSmartNotificationManager();
  
  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [subscriptionsError, setSubscriptionsError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAllSubscriptions, setShowAllSubscriptions] = useState(false);

  // Track when settings are updated
  useEffect(() => {
    setLastSaved(new Date());
  }, [settings]);

  // Load cleared notifications on component mount
  useEffect(() => {
    loadClearedNotifications();
  }, []);

  // Fetch subscriptions on component mount
  useEffect(() => {
    if (user?.accessToken) {
      fetchSubscriptions();
    }
  }, [user]);

  const makeAPICall = async (endpoint: string, retryCount = 0): Promise<any> => {
    // Get the current token, either from user state or directly from storage on retry
    let currentToken = user?.accessToken;
    if (retryCount > 0) {
      // On retry, get the fresh token from storage
      currentToken = await AsyncStorage.getItem('accessToken');
    }
    
    if (!currentToken) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`https://www.googleapis.com/youtube/v3${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401 && retryCount === 0) {
      console.log('Access token expired, attempting refresh...');
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        console.log('Token refreshed, retrying API call...');
        return makeAPICall(endpoint, 1); // Retry once with new token
      } else {
        console.log('Token refresh failed, signing out user...');
        await signOut();
        navigation.replace('Auth');
        throw new Error('Authentication expired. Please sign in again.');
      }
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return response.json();
  };

  const fetchSubscriptions = async (showAlert: boolean = false) => {
    if (!user?.accessToken) return;

    try {
      setLoadingSubscriptions(true);
      setSubscriptionsError(null);

      const params = new URLSearchParams({
        part: 'snippet,contentDetails',
        mine: 'true',
        maxResults: '50',
        order: 'alphabetical',
      });

      const data = await makeAPICall(`/subscriptions?${params}`);
      
      // Apply smart notification clearing to fetched data
      const rawSubscriptions = data.items || [];
      const smartClearedSubscriptions = applySmartNotificationClearing(rawSubscriptions);
      setSubscriptions(smartClearedSubscriptions);
      
      // Clean up old notifications
      await cleanupOldNotifications(rawSubscriptions);
      
      if (showAlert && rawSubscriptions.length > 0) {
        const stats = getStats();
        const totalNewVideos = smartClearedSubscriptions.reduce((sum, sub) => 
          sum + (sub.contentDetails?.newItemCount || 0), 0
        );
        
        Alert.alert(
          'Subscriptions Loaded', 
          `${rawSubscriptions.length} channels loaded\n${totalNewVideos} new videos to watch`
        );
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setSubscriptionsError('Failed to load subscriptions');
      if (showAlert) {
        Alert.alert('Error', 'Failed to load subscriptions. Please check your connection and try again.');
      }
    } finally {
      setLoadingSubscriptions(false);
    }
  };

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
            navigation.replace('Auth');
          },
        },
      ]
    );
  };

  const handleSettingToggle = async (setting: keyof typeof settings, value: any) => {
    const success = await updateSettings({ [setting]: value });
    if (!success) {
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handlePresetApply = async (presetId: string) => {
    const preset = builtInPresets.find(p => p.id === presetId);
    if (!preset) return;

    Alert.alert(
      'Apply Preset',
      `Apply "${preset.name}"?\n\n${preset.description}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: async () => {
            const success = await applyPreset(presetId);
            if (success) {
              Alert.alert('Success', `"${preset.name}" has been applied!`);
            } else {
              Alert.alert('Error', 'Failed to apply preset. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openYouTubeWithSettings = () => {
    navigation.navigate('YouTube');
  };

  // UPDATED: Smart notification clearing that allows new videos to show
  const handleChannelNotificationClear = async (channelId: string, channelTitle: string, currentNewCount: number) => {
    // Clear using smart system that tracks the count
    await clearChannelNotification(channelId, currentNewCount, channelTitle);
    
    // Update local state immediately to provide instant feedback
    setSubscriptions(prevSubscriptions => 
      applySmartNotificationClearing(prevSubscriptions)
    );

    console.log(`Cleared ${currentNewCount} notifications for ${channelTitle}. New videos posted after this will still show notifications.`);
  };

  const handleChannelPress = (subscription: Subscription) => {
    const channelId = subscription.snippet.resourceId.channelId;
    const channelTitle = subscription.snippet.title;
    const currentNewCount = subscription.contentDetails?.newItemCount || 0;
    
    Alert.alert(
      'Open Channel',
      `Open ${channelTitle} in YouTube?${currentNewCount > 0 ? `` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Channel',
          onPress: async () => {
            // Clear notifications if there are any
            if (currentNewCount > 0) {
              await handleChannelNotificationClear(channelId, channelTitle, currentNewCount);
            }
            
            // Navigate to YouTube
            navigation.navigate('YouTube', { 
              channelId, 
              channelTitle 
            });
          },
        },
      ]
    );
  };

  const handleViewAllSubscriptions = () => {
    navigation.navigate('Subscriptions');
  };

  const currentMode = getCurrentMode();
  const isCustomMode = currentMode === 'Custom';

  // Display subscriptions (show max 6 on home screen)
  const displaySubscriptions = showAllSubscriptions ? subscriptions : subscriptions.slice(0, 6);

  // Status indicators
  const getStatusColor = (enabled: boolean) => enabled ? '#4CAF50' : '#f44336';
  const getStatusText = (enabled: boolean) => enabled ? 'ON' : 'OFF';

  const ControlCard = ({ 
    title, 
    subtitle, 
    children, 
    icon 
  }: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    icon?: string;
  }) => (
    <View style={styles.controlCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          {icon && <Text style={styles.cardIcon}>{icon}</Text>}
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
          </View>
        </View>
      </View>
      <View style={styles.cardContent}>
        {children}
      </View>
    </View>
  );

  const ToggleRow = ({ 
    label, 
    value, 
    onToggle, 
    description,
    disabled = false 
  }: {
    label: string;
    value: boolean;
    onToggle: (value: boolean) => void;
    description?: string;
    disabled?: boolean;
  }) => (
    <View style={[styles.toggleRow, disabled && styles.toggleRowDisabled]}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, disabled && styles.toggleLabelDisabled]}>
          {label}
        </Text>
        {description && (
          <Text style={[styles.toggleDescription, disabled && styles.toggleDescriptionDisabled]}>
            {description}
          </Text>
        )}
      </View>
      <View style={styles.toggleContainer}>
        <Text style={[
          styles.statusText, 
          { color: getStatusColor(value) },
          disabled && styles.statusTextDisabled
        ]}>
          {getStatusText(value)}
        </Text>
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={disabled || loading}
          trackColor={{ false: '#767577', true: '#FF0000' }}
          thumbColor={value ? '#ffffff' : '#f4f3f4'}
          style={styles.switch}
        />
      </View>
    </View>
  );

  const PresetButton = ({ preset }: { preset: any }) => {
    const isActive = currentMode === preset.name;
    
    return (
      <TouchableOpacity
        style={[styles.presetButton, isActive && styles.presetButtonActive]}
        onPress={() => handlePresetApply(preset.id)}
        disabled={loading}
      >
        <Text style={styles.presetIcon}>{preset.icon}</Text>
        <Text style={[styles.presetName, isActive && styles.presetNameActive]}>
          {preset.name}
        </Text>
        <Text style={[styles.presetDescription, isActive && styles.presetDescriptionActive]}>
          {preset.description}
        </Text>
        {isActive && (
          <View style={styles.activeIndicator}>
            <Text style={styles.activeIndicatorText}>ACTIVE</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const SubscriptionItem = ({ subscription }: { subscription: Subscription }) => {
    const newCount = subscription.contentDetails?.newItemCount || 0;
    
    return (
      <TouchableOpacity
        style={styles.subscriptionItem}
        onPress={() => handleChannelPress(subscription)}
      >
        <Image
          source={{ uri: subscription.snippet.thumbnails.medium?.url || subscription.snippet.thumbnails.default.url }}
          style={styles.subscriptionThumbnail}
        />
        <Text style={styles.subscriptionTitle} numberOfLines={2}>
          {subscription.snippet.title}
        </Text>
        {newCount > 0 && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>
              {newCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF0000" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Content Controller</Text>
          <Text style={styles.headerSubtitle}>
            Welcome back, {user?.name?.split(' ')[0] || 'User'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleSignOut}>
          <Text style={styles.profileButtonText}>
            {user?.name?.charAt(0) || 'U'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loadingSubscriptions}
            onRefresh={() => fetchSubscriptions(true)}
            colors={['#FF0000']}
            tintColor="#FF0000"
          />
        }
      >
        {/* Current Mode Status */}
        <ControlCard 
          title="Current Mode" 
          subtitle={`Active since ${lastSaved?.toLocaleTimeString() || 'startup'}`}
          icon="⚙️"
        >
          <View style={styles.currentModeContainer}>
            <View style={styles.currentModeInfo}>
              <Text style={styles.currentModeName}>{currentMode}</Text>
              {isCustomMode && (
                <Text style={styles.customModeNote}>
                  Custom configuration active
                </Text>
              )}
            </View>
            <TouchableOpacity 
              style={styles.launchButton}
              onPress={openYouTubeWithSettings}
            >
              <Text style={styles.launchButtonText}>🚀 Launch YouTube</Text>
            </TouchableOpacity>
          </View>
        </ControlCard>

        {/* My Subscriptions Section */}
        <ControlCard 
          title="My Subscriptions" 
          subtitle={
            subscriptions.length > 0 
              ? `${subscriptions.length} channels • ${subscriptions.reduce((sum, sub) => sum + (sub.contentDetails?.newItemCount || 0), 0)} new videos`
              : 'Loading...'
          }
          icon="📺"
        >
          {loadingSubscriptions ? (
            <View style={styles.subscriptionsLoading}>
              <ActivityIndicator size="small" color="#FF0000" />
              <Text style={styles.loadingText}>Loading subscriptions...</Text>
            </View>
          ) : subscriptionsError ? (
            <View style={styles.subscriptionsError}>
              <Text style={styles.errorText}>Failed to load subscriptions</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => fetchSubscriptions(true)}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : subscriptions.length > 0 ? (
            <>
              <FlatList
                data={displaySubscriptions}
                renderItem={({ item }) => <SubscriptionItem subscription={item} />}
                keyExtractor={(item) => item.id}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.subscriptionsGrid}
              />
              <View style={styles.subscriptionsActions}>
                {subscriptions.length > 6 && (
                  <TouchableOpacity
                    style={styles.showMoreButton}
                    onPress={() => setShowAllSubscriptions(!showAllSubscriptions)}
                  >
                    <Text style={styles.showMoreButtonText}>
                      {showAllSubscriptions ? 'Show Less' : `Show All (${subscriptions.length})`}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={handleViewAllSubscriptions}
                >
                  <Text style={styles.viewAllButtonText}>Full Subscriptions View</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.noSubscriptions}>
              <Text style={styles.noSubscriptionsText}>No subscriptions found</Text>
              <Text style={styles.noSubscriptionsSubtext}>
                Subscribe to channels on YouTube to see them here
              </Text>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={openYouTubeWithSettings}
              >
                <Text style={styles.exploreButtonText}>Explore YouTube</Text>
              </TouchableOpacity>
            </View>
          )}
        </ControlCard>

        {/* Quick Presets */}
        <ControlCard title="Quick Modes" icon="🎯">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.presetsContainer}>
              {builtInPresets.map((preset) => (
                <PresetButton key={preset.id} preset={preset} />
              ))}
            </View>
          </ScrollView>
        </ControlCard>

        {/* Content Control */}
        <ControlCard 
          title="Content Control" 
          subtitle="Toggle what content appears on YouTube"
          icon="📺"
        >
          <ToggleRow
            label="Home Recommendations"
            description="Show video recommendations on YouTube home page"
            value={settings.showRecommendations}
            onToggle={(value) => handleSettingToggle('showRecommendations', value)}
          />
          <ToggleRow
            label="Related Videos"
            description="Show related videos when watching"
            value={settings.showRelatedVideos}
            onToggle={(value) => handleSettingToggle('showRelatedVideos', value)}
          />
          <ToggleRow
            label="Comments"
            description="Show comments section"
            value={settings.showComments}
            onToggle={(value) => handleSettingToggle('showComments', value)}
          />
          <ToggleRow
            label="YouTube Shorts"
            description="Show Shorts content and tab"
            value={settings.showShorts}
            onToggle={(value) => handleSettingToggle('showShorts', value)}
          />
        </ControlCard>

        <ControlCard 
          title="Platform Status" 
          subtitle="Current capabilities and limitations"
          icon="ℹ️"
        >
          <View style={styles.platformStatusContainer}>
            {/* What's Working Section */}
            <View style={styles.statusSection}>
              <View style={styles.statusHeader}>
                <Text style={styles.statusIconSuccess}>✅</Text>
                <Text style={styles.statusTitle}>What's Working</Text>
              </View>
              <View style={styles.statusList}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusBullet}>•</Text>
                  <Text style={styles.statusText}>View subscriptions and content</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusBullet}>•</Text>
                  <Text style={styles.statusText}>Control YouTube interface (hide distractions)</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusBullet}>•</Text>
                  <Text style={styles.statusText}>Watch videos with custom settings</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusBullet}>•</Text>
                  <Text style={styles.statusText}>Navigate channels and playlists</Text>
                </View>
              </View>
            </View>

            {/* Current Limitations Section */}
            <View style={[styles.statusSection, styles.statusSectionLast]}>
              <View style={styles.statusHeader}>
                <Text style={styles.statusIconWarning}>⚠️</Text>
                <Text style={styles.statusTitle}>Current Limitations</Text>
              </View>
              <View style={styles.statusList}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusBullet}>•</Text>
                  <Text style={styles.statusText}>Can't subscribe to channels in-app</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusBullet}>•</Text>
                  <Text style={styles.statusText}>Can't like/dislike videos in-app</Text>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusBullet}>•</Text>
                  <Text style={styles.statusText}>Can't post comments in-app</Text>
                </View>
              </View>
              <Text style={styles.limitationsNote}>
                These actions need to be done on YouTube directly
              </Text>
            </View>
          </View>
        </ControlCard>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Signed in as {user?.email}
          </Text>
          {lastSaved && (
            <Text style={styles.footerSubtext}>
              Settings last updated: {lastSaved.toLocaleString()}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  controlCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardContent: {
    padding: 16,
  },
  currentModeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentModeInfo: {
    flex: 1,
  },
  currentModeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  customModeNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  launchButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  launchButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Subscriptions styles
  subscriptionsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  subscriptionsError: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  subscriptionsGrid: {
    paddingVertical: 8,
  },
  subscriptionItem: {
    flex: 1,
    margin: 4,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    position: 'relative',
  },
  subscriptionThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
  },
  newBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF0000',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  subscriptionsActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  showMoreButton: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  showMoreButtonText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
  },
  viewAllButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewAllButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  noSubscriptions: {
    alignItems: 'center',
    padding: 20,
  },
  noSubscriptionsText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 4,
  },
  noSubscriptionsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  exploreButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  // Existing styles continue...
  presetsContainer: {
    flexDirection: 'row',
    paddingRight: 16,
  },
  presetButton: {
    width: 140,
    marginRight: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  presetButtonActive: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
  },
  presetIcon: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  presetNameActive: {
    color: 'white',
  },
  presetDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  presetDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  activeIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
    alignSelf: 'center',
  },
  activeIndicatorText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleRowDisabled: {
    opacity: 0.5,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  toggleLabelDisabled: {
    color: '#999',
  },
  toggleDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
  },
  toggleDescriptionDisabled: {
    color: '#ccc',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 24,
  },
  statusTextDisabled: {
    color: '#ccc',
  },
  switch: {
    transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
  },
  footer: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  
  // Platform Status Styles
  platformStatusContainer: {
    paddingVertical: 8,
  },
  statusSection: {
    marginBottom: 16,
  },
  statusSectionLast: {
    marginBottom: 0,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusIconSuccess: {
    fontSize: 18,
    marginRight: 8,
  },
  statusIconWarning: {
    fontSize: 18,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusList: {
    marginLeft: 26,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  statusBullet: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
    marginTop: 1,
  },
  limitationsNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 26,
    marginTop: 8,
  },
});

export default HomeScreen;