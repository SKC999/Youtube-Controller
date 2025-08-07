// src/components/SubscriptionHelpers.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';

// Types
export interface Subscription {
  id: string;
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
    resourceId: {
      channelId: string;
    };
    publishedAt: string;
  };
  contentDetails?: {
    totalItemCount: number;
    newItemCount: number;
  };
}

interface SubscriptionItemProps {
  subscription: Subscription;
  onPress: (subscription: Subscription) => void;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
}

interface SubscriptionGridProps {
  subscriptions: Subscription[];
  onChannelPress: (subscription: Subscription) => void;
  numColumns?: number;
  maxItems?: number;
  size?: 'small' | 'medium' | 'large';
}

// Individual subscription item component
export const SubscriptionItem: React.FC<SubscriptionItemProps> = ({
  subscription,
  onPress,
  size = 'medium',
  showDescription = false,
}) => {
  const sizeStyles = {
    small: {
      container: styles.subscriptionItemSmall,
      thumbnail: styles.thumbnailSmall,
      title: styles.titleSmall,
    },
    medium: {
      container: styles.subscriptionItemMedium,
      thumbnail: styles.thumbnailMedium,
      title: styles.titleMedium,
    },
    large: {
      container: styles.subscriptionItemLarge,
      thumbnail: styles.thumbnailLarge,
      title: styles.titleLarge,
    },
  };

  const currentStyles = sizeStyles[size];

  return (
    <TouchableOpacity
      style={currentStyles.container}
      onPress={() => onPress(subscription)}
      activeOpacity={0.7}
    >
      <Image
        source={{ 
          uri: subscription.snippet.thumbnails.medium?.url || 
               subscription.snippet.thumbnails.default.url 
        }}
        style={currentStyles.thumbnail}
      />
      <Text style={currentStyles.title} numberOfLines={size === 'large' ? 3 : 2}>
        {subscription.snippet.title}
      </Text>
      
      {showDescription && size === 'large' && subscription.snippet.description && (
        <Text style={styles.description} numberOfLines={2}>
          {subscription.snippet.description}
        </Text>
      )}
      
      {subscription.contentDetails?.newItemCount > 0 && (
        <View style={styles.newBadge}>
          <Text style={styles.newBadgeText}>
            {subscription.contentDetails.newItemCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Grid of subscription items
export const SubscriptionGrid: React.FC<SubscriptionGridProps> = ({
  subscriptions,
  onChannelPress,
  numColumns = 3,
  maxItems,
  size = 'medium',
}) => {
  const displaySubscriptions = maxItems 
    ? subscriptions.slice(0, maxItems) 
    : subscriptions;

  // Calculate item width based on number of columns
  const itemWidth = `${(100 / numColumns) - 2}%`;

  return (
    <View style={styles.gridContainer}>
      {displaySubscriptions.map((subscription, index) => (
        <View key={subscription.id} style={[styles.gridItem, { width: itemWidth }]}>
          <SubscriptionItem
            subscription={subscription}
            onPress={onChannelPress}
            size={size}
          />
        </View>
      ))}
    </View>
  );
};

// Utility functions
export const makeYouTubeAPICall = async (
  endpoint: string, 
  accessToken: string
) => {
  const response = await fetch(`https://www.googleapis.com/youtube/v3${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube API call failed: ${response.status}`);
  }

  return response.json();
};

export const fetchUserSubscriptions = async (
  accessToken: string,
  maxResults: number = 50
): Promise<Subscription[]> => {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    mine: 'true',
    maxResults: maxResults.toString(),
    order: 'alphabetical',
  });

  const data = await makeYouTubeAPICall(`/subscriptions?${params}`, accessToken);
  return data.items || [];
};

export const handleChannelNavigation = (
  subscription: Subscription,
  navigation: any,
  showConfirmation: boolean = true
) => {
  const channelId = subscription.snippet.resourceId.channelId;
  const channelTitle = subscription.snippet.title;

  const navigateToChannel = () => {
    navigation.navigate('YouTube', { 
      channelId, 
      channelTitle 
    });
  };

  if (showConfirmation) {
    Alert.alert(
      'Open Channel',
      `Open ${channelTitle} in YouTube?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Channel',
          onPress: navigateToChannel,
        },
      ]
    );
  } else {
    navigateToChannel();
  }
};

export const formatSubscriberCount = (count: string): string => {
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const formatPublishedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
  return `${Math.ceil(diffDays / 365)} years ago`;
};

const styles = StyleSheet.create({
  // Grid container
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  gridItem: {
    marginBottom: 12,
  },

  // Small size (for compact grids)
  subscriptionItemSmall: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    position: 'relative',
  },
  thumbnailSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 6,
  },
  titleSmall: {
    fontSize: 10,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    lineHeight: 12,
  },

  // Medium size (default)
  subscriptionItemMedium: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 8,
    position: 'relative',
  },
  thumbnailMedium: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  titleMedium: {
    fontSize: 11,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Large size (for featured display)
  subscriptionItemLarge: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    position: 'relative',
  },
  thumbnailLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  titleLarge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Common elements
  description: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
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
});

export default SubscriptionItem;