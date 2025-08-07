import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { RootStackParamList } from '../../App';
import { useSmartNotificationManager, Subscription, SubscriptionUtils } from '../utils/notificationUtils';

// Use StackScreenProps instead of custom interface
interface Props {
  navigation: any;
  route?: any;
}

interface ChannelInfo {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    publishedAt: string;
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
}

const SubscriptionsScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  
  // Smart notification manager
  const {
    loadClearedNotifications,
    clearChannelNotification,
    applySmartNotificationClearing,
    cleanupOldNotifications,
    getStats
  } = useSmartNotificationManager();
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<ChannelInfo | null>(null);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [channelVideos, setChannelVideos] = useState<any[]>([]);
  const [loadingChannelInfo, setLoadingChannelInfo] = useState(false);

  useEffect(() => {
    if (user?.accessToken) {
      loadClearedNotifications();
      fetchSubscriptions();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Filter subscriptions based on search query
    if (searchQuery.trim() === '') {
      setFilteredSubscriptions(subscriptions);
    } else {
      const filtered = subscriptions.filter(sub =>
        sub.snippet.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSubscriptions(filtered);
    }
  }, [searchQuery, subscriptions]);

  const makeAPICall = async (endpoint: string) => {
    if (!user?.accessToken) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`https://www.googleapis.com/youtube/v3${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${user.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return response.json();
  };

  const fetchSubscriptions = async (pageToken?: string) => {
    if (!user?.accessToken) return;

    try {
      const params = new URLSearchParams({
        part: 'snippet,contentDetails',
        mine: 'true',
        maxResults: '50',
        order: 'alphabetical',
        ...(pageToken && { pageToken }),
      });

      const data = await makeAPICall(`/subscriptions?${params}`);
      
      // Apply smart notification clearing to fetched data
      const rawSubscriptions = data.items || [];
      const smartClearedSubscriptions = applySmartNotificationClearing(rawSubscriptions);
      
      if (pageToken) {
        setSubscriptions(prev => [...prev, ...smartClearedSubscriptions]);
      } else {
        setSubscriptions(smartClearedSubscriptions);
        // Clean up old notifications
        await cleanupOldNotifications(rawSubscriptions);
      }
      
      setNextPageToken(data.nextPageToken || null);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      Alert.alert('Error', 'Failed to load subscriptions. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const fetchChannelDetails = async (channelId: string) => {
    if (!user?.accessToken) return null;

    try {
      setLoadingChannelInfo(true);
      
      // Fetch channel information
      const channelParams = new URLSearchParams({
        part: 'snippet,statistics',
        id: channelId,
      });

      const channelData = await makeAPICall(`/channels?${channelParams}`);
      const channel = channelData.items?.[0];

      if (channel) {
        setSelectedChannel(channel);
        
        // Fetch recent videos from the channel
        const videosParams = new URLSearchParams({
          part: 'snippet',
          channelId: channelId,
          maxResults: '20',
          order: 'date',
          type: 'video',
        });

        try {
          const videosData = await makeAPICall(`/search?${videosParams}`);
          setChannelVideos(videosData.items || []);
        } catch (videosError) {
          //console.warn('Failed to load channel videos:', videosError);
          setChannelVideos([]);
        }
      }

      return channel;
    } catch (error) {
      console.error('Error fetching channel details:', error);
      Alert.alert('Error', 'Failed to load channel details');
      return null;
    } finally {
      setLoadingChannelInfo(false);
    }
  };

  // Smart notification clearing
  const handleChannelNotificationClear = async (channelId: string, channelTitle: string, currentNewCount: number) => {
    if (currentNewCount > 0) {
      await clearChannelNotification(channelId, currentNewCount, channelTitle);
      
      // Update local state immediately
      setSubscriptions(prevSubscriptions => 
        applySmartNotificationClearing(prevSubscriptions)
      );
      setFilteredSubscriptions(prevFiltered =>
        applySmartNotificationClearing(prevFiltered)
      );

      console.log(`Smart cleared ${currentNewCount} notifications for ${channelTitle}. New videos will still show notifications.`);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setNextPageToken(null);
    fetchSubscriptions();
  }, []);

  const handleLoadMore = useCallback(() => {
    if (nextPageToken && !loadingMore) {
      setLoadingMore(true);
      fetchSubscriptions(nextPageToken);
    }
  }, [nextPageToken, loadingMore]);

  const handleChannelPress = async (subscription: Subscription) => {
    const channelId = subscription.snippet.resourceId.channelId;
    const channelTitle = subscription.snippet.title;
    const currentNewCount = subscription.contentDetails?.newItemCount || 0;
    
    // Clear notifications immediately when channel is pressed
    await handleChannelNotificationClear(channelId, channelTitle, currentNewCount);
    
    setShowChannelModal(true);
    await fetchChannelDetails(channelId);
  };

  const navigateToChannel = async (channelId: string, channelTitle: string) => {
    setShowChannelModal(false);
    
    // Additional clearing when navigating to YouTube (just in case)
    const currentSub = subscriptions.find(sub => sub.snippet.resourceId.channelId === channelId);
    if (currentSub?.contentDetails?.newItemCount > 0) {
      await handleChannelNotificationClear(channelId, channelTitle, currentSub.contentDetails.newItemCount);
    }
    
    Alert.alert(
      'Open Channel',
      `Open ${channelTitle} in YouTube?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open in YouTube',
          onPress: () => {
            // Navigate to YouTube with channel parameter
            navigation.navigate('YouTube', { channelId, channelTitle });
          },
        },
      ]
    );
  };

  const openVideo = (videoId: string, videoTitle: string) => {
    setShowChannelModal(false);
    
    Alert.alert(
      'Open Video',
      `Watch "${videoTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Watch Now',
          onPress: () => {
            // Navigate to YouTube with video parameter
            navigation.navigate('YouTube', { videoId, videoTitle });
          },
        },
      ]
    );
  };

  const renderSubscription = ({ item }: { item: Subscription }) => {
    const newCount = item.contentDetails?.newItemCount || 0;
    
    return (
      <TouchableOpacity
        style={styles.subscriptionItem}
        onPress={() => handleChannelPress(item)}
      >
        <Image
          source={{ uri: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url }}
          style={styles.channelThumbnail}
        />
        <View style={styles.channelInfo}>
          <Text style={styles.channelTitle} numberOfLines={1}>
            {item.snippet.title}
          </Text>
          <Text style={styles.channelDescription} numberOfLines={2}>
            {item.snippet.description || 'No description available'}
          </Text>
          <View style={styles.channelStats}>
            <Text style={styles.statText}>
              Subscribed {SubscriptionUtils.formatPublishedDate(item.snippet.publishedAt)}
            </Text>
            {item.contentDetails?.totalItemCount ? (
              <Text style={styles.statText}>
                • {item.contentDetails.totalItemCount} videos
              </Text>
            ) : null}
            {newCount > 0 && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>
                  {newCount} new
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.arrowIcon}>→</Text>
      </TouchableOpacity>
    );
  };

  const renderChannelVideo = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => openVideo(item.id.videoId, item.snippet.title)}
    >
      <Image
        source={{ uri: item.snippet.thumbnails.medium.url }}
        style={styles.videoThumbnail}
      />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.snippet.title}
        </Text>
        <Text style={styles.videoDate}>
          {SubscriptionUtils.formatPublishedDate(item.snippet.publishedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#FF0000" />
        <Text style={styles.loadingText}>Loading more channels...</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF0000" />
        <Text style={styles.loadingText}>Loading your subscriptions...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>📺</Text>
          <Text style={styles.errorText}>Sign in to view your subscriptions</Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.signInButtonText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate stats for display
  const totalNewVideos = SubscriptionUtils.getTotalNewItemCount(filteredSubscriptions);
  const channelsWithNewContent = SubscriptionUtils.getSubscriptionsWithNewContent(filteredSubscriptions).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Subscriptions</Text>
        <Text style={styles.subscriptionCount}>
          {filteredSubscriptions.length} channel{filteredSubscriptions.length !== 1 ? 's' : ''}
          {searchQuery ? ` (filtered)` : ''}
          {totalNewVideos > 0 && (
            <Text style={styles.newContentIndicator}>
              {' • '}{totalNewVideos} new video{totalNewVideos !== 1 ? 's' : ''} from {channelsWithNewContent} channel{channelsWithNewContent !== 1 ? 's' : ''}
            </Text>
          )}
        </Text>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search channels..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>
      
      <FlatList
        data={filteredSubscriptions}
        renderItem={renderSubscription}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#FF0000']}
            tintColor="#FF0000"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {searchQuery ? (
              <>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>No channels found</Text>
                <Text style={styles.emptySubtext}>
                  Try a different search term
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyIcon}>📺</Text>
                <Text style={styles.emptyText}>No subscriptions found</Text>
                <Text style={styles.emptySubtext}>
                  Subscribe to channels on YouTube to see them here
                </Text>
                <TouchableOpacity
                  style={styles.exploreButton}
                  onPress={() => navigation.navigate('YouTube')}
                >
                  <Text style={styles.exploreButtonText}>Explore YouTube</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        }
      />

      {/* Channel Details Modal */}
      <Modal
        visible={showChannelModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowChannelModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowChannelModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Channel Details</Text>
            <View style={styles.placeholder} />
          </View>

          {loadingChannelInfo ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#FF0000" />
              <Text style={styles.loadingText}>Loading channel details...</Text>
            </View>
          ) : selectedChannel ? (
            <ScrollView style={styles.modalContent}>
              {/* Channel Header */}
              <View style={styles.channelHeader}>
                <Image
                  source={{ uri: selectedChannel.snippet.thumbnails.high.url }}
                  style={styles.channelHeaderImage}
                />
                <Text style={styles.channelHeaderTitle}>
                  {selectedChannel.snippet.title}
                </Text>
                <Text style={styles.channelHeaderStats}>
                  {SubscriptionUtils.formatSubscriberCount(selectedChannel.statistics.subscriberCount)} subscribers • {' '}
                  {selectedChannel.statistics.videoCount} videos
                </Text>
                <Text style={styles.channelHeaderDescription} numberOfLines={3}>
                  {selectedChannel.snippet.description}
                </Text>
                
                <TouchableOpacity
                  style={styles.visitChannelButton}
                  onPress={() => navigateToChannel(selectedChannel.id, selectedChannel.snippet.title)}
                >
                  <Text style={styles.visitChannelButtonText}>Visit Channel</Text>
                </TouchableOpacity>
              </View>

              {/* Recent Videos */}
              <View style={styles.videosSection}>
                <Text style={styles.videosSectionTitle}>Recent Videos</Text>
                {channelVideos.length > 0 ? (
                  <FlatList
                    data={channelVideos}
                    renderItem={renderChannelVideo}
                    keyExtractor={(item) => item.id.videoId}
                    scrollEnabled={false}
                  />
                ) : (
                  <Text style={styles.noVideosText}>No recent videos found</Text>
                )}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>Failed to load channel details</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subscriptionCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  newContentIndicator: {
    color: '#FF0000',
    fontWeight: '600',
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  subscriptionItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 10,
    marginTop: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  channelThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  channelInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  channelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  channelDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  channelStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
  newBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#999',
    alignSelf: 'center',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  modalContent: {
    flex: 1,
  },
  channelHeader: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  channelHeaderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  channelHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  channelHeaderStats: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  channelHeaderDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  visitChannelButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  visitChannelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  videosSection: {
    backgroundColor: 'white',
    marginTop: 10,
    padding: 20,
  },
  videosSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  videoItem: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: 120,
    height: 68,
  },
  videoInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    lineHeight: 18,
  },
  videoDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noVideosText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SubscriptionsScreen;