// src/utils/notificationUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLEARED_NOTIFICATIONS_KEY = 'cleared_channel_notifications_v2';

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

export interface ClearedNotification {
  channelId: string;
  clearedCount: number; // How many videos were "seen" when cleared
  clearedAt: number; // Timestamp when cleared
  channelTitle: string; // For debugging/display purposes
}

/**
 * Smart notification manager that tracks cleared counts instead of just cleared channels
 * This allows new videos to still show notifications after previous ones were cleared
 */
export class SmartNotificationManager {
  private static instance: SmartNotificationManager;
  private clearedNotifications: Map<string, ClearedNotification> = new Map();

  private constructor() {}

  public static getInstance(): SmartNotificationManager {
    if (!SmartNotificationManager.instance) {
      SmartNotificationManager.instance = new SmartNotificationManager();
    }
    return SmartNotificationManager.instance;
  }

  /**
   * Load cleared notifications from AsyncStorage
   */
  public async loadClearedNotifications(): Promise<Map<string, ClearedNotification>> {
    try {
      const stored = await AsyncStorage.getItem(CLEARED_NOTIFICATIONS_KEY);
      if (stored) {
        const clearedArray: ClearedNotification[] = JSON.parse(stored);
        this.clearedNotifications = new Map(
          clearedArray.map(item => [item.channelId, item])
        );
        console.log(`Loaded ${this.clearedNotifications.size} cleared notifications`);
        return this.clearedNotifications;
      }
      return new Map();
    } catch (error) {
      console.error('Error loading cleared notifications:', error);
      return new Map();
    }
  }

  /**
   * Save cleared notifications to AsyncStorage
   */
  public async saveClearedNotifications(): Promise<void> {
    try {
      const clearedArray = Array.from(this.clearedNotifications.values());
      await AsyncStorage.setItem(CLEARED_NOTIFICATIONS_KEY, JSON.stringify(clearedArray));
      console.log(`Saved ${clearedArray.length} cleared notifications`);
    } catch (error) {
      console.error('Error saving cleared notifications:', error);
    }
  }

  /**
   * Clear a specific channel's notification with smart counting
   */
  public async clearChannelNotification(
    channelId: string, 
    currentNewCount: number, 
    channelTitle: string = 'Unknown Channel'
  ): Promise<void> {
    const clearedNotification: ClearedNotification = {
      channelId,
      clearedCount: currentNewCount, // Remember how many videos were "seen"
      clearedAt: Date.now(),
      channelTitle
    };
    
    this.clearedNotifications.set(channelId, clearedNotification);
    await this.saveClearedNotifications();
    
    console.log(`Cleared notification for ${channelTitle}: ${currentNewCount} videos marked as seen`);
  }

  /**
   * Get the effective new item count for a channel (accounting for previously cleared videos)
   */
  public getEffectiveNewItemCount(channelId: string, currentNewCount: number): number {
    const cleared = this.clearedNotifications.get(channelId);
    
    if (!cleared) {
      // No previous clearing, show full count
      return currentNewCount;
    }
    
    // Show only videos that are NEW since the last clearing
    const effectiveCount = Math.max(0, currentNewCount - cleared.clearedCount);
    
    // If there are new videos, we can optionally clear old cleared notification
    // to avoid accumulating too many cleared notifications
    if (effectiveCount > 0 && currentNewCount > cleared.clearedCount) {
      // Update the cleared count to current - effective, so we only track the "extra" videos
      // This prevents the cleared count from getting stale over time
      const updatedCleared: ClearedNotification = {
        ...cleared,
        clearedCount: currentNewCount - effectiveCount,
        clearedAt: Date.now()
      };
      this.clearedNotifications.set(channelId, updatedCleared);
      // Note: We don't await this save to avoid blocking the UI, it will save on next clear
    }
    
    return effectiveCount;
  }

  /**
   * Apply smart notification clearing to subscriptions data
   */
  public applySmartNotificationClearing(subscriptions: Subscription[]): Subscription[] {
    return subscriptions.map(sub => {
      const channelId = sub.snippet.resourceId.channelId;
      const currentNewCount = sub.contentDetails?.newItemCount || 0;
      
      if (currentNewCount === 0) {
        // No new content, return as-is
        return sub;
      }
      
      const effectiveCount = this.getEffectiveNewItemCount(channelId, currentNewCount);
      
      return {
        ...sub,
        contentDetails: sub.contentDetails ? {
          ...sub.contentDetails,
          newItemCount: effectiveCount
        } : undefined
      };
    });
  }

  /**
   * Clean up old cleared notifications (older than 30 days or for unsubscribed channels)
   */
  public async cleanupOldNotifications(currentSubscriptions: Subscription[]): Promise<void> {
    const currentChannelIds = new Set(
      currentSubscriptions.map(sub => sub.snippet.resourceId.channelId)
    );
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let cleanupCount = 0;
    
    // Remove notifications for channels that no longer exist or are very old
    for (const [channelId, notification] of this.clearedNotifications.entries()) {
      const shouldRemove = 
        !currentChannelIds.has(channelId) || // Channel no longer subscribed
        notification.clearedAt < thirtyDaysAgo; // Notification is older than 30 days
      
      if (shouldRemove) {
        this.clearedNotifications.delete(channelId);
        cleanupCount++;
      }
    }
    
    if (cleanupCount > 0) {
      await this.saveClearedNotifications();
      console.log(`Cleaned up ${cleanupCount} old cleared notifications`);
    }
  }

  /**
   * Get statistics about cleared notifications
   */
  public getStats(): { 
    totalCleared: number; 
    clearedChannels: Array<{channelId: string, channelTitle: string, clearedCount: number, clearedAt: Date}>;
    oldestClearing: Date | null;
    newestClearing: Date | null;
  } {
    const notifications = Array.from(this.clearedNotifications.values());
    
    return {
      totalCleared: notifications.length,
      clearedChannels: notifications.map(n => ({
        channelId: n.channelId,
        channelTitle: n.channelTitle,
        clearedCount: n.clearedCount,
        clearedAt: new Date(n.clearedAt)
      })),
      oldestClearing: notifications.length > 0 
        ? new Date(Math.min(...notifications.map(n => n.clearedAt)))
        : null,
      newestClearing: notifications.length > 0
        ? new Date(Math.max(...notifications.map(n => n.clearedAt)))
        : null
    };
  }

  /**
   * Reset all cleared notifications
   */
  public async resetAllNotifications(): Promise<void> {
    this.clearedNotifications.clear();
    await AsyncStorage.removeItem(CLEARED_NOTIFICATIONS_KEY);
    console.log('Reset all cleared notifications');
  }

  /**
   * Check if a channel has any cleared notifications
   */
  public hasChannelBeenCleared(channelId: string): boolean {
    return this.clearedNotifications.has(channelId);
  }

  /**
   * Get cleared notification info for a specific channel
   */
  public getClearedInfo(channelId: string): ClearedNotification | null {
    return this.clearedNotifications.get(channelId) || null;
  }
}

/**
 * Hook for using smart notification management in React components
 */
export const useSmartNotificationManager = () => {
  const manager = SmartNotificationManager.getInstance();
  
  return {
    loadClearedNotifications: () => manager.loadClearedNotifications(),
    clearChannelNotification: (channelId: string, currentNewCount: number, channelTitle?: string) => 
      manager.clearChannelNotification(channelId, currentNewCount, channelTitle),
    applySmartNotificationClearing: (subscriptions: Subscription[]) => 
      manager.applySmartNotificationClearing(subscriptions),
    getEffectiveNewItemCount: (channelId: string, currentNewCount: number) =>
      manager.getEffectiveNewItemCount(channelId, currentNewCount),
    cleanupOldNotifications: (subscriptions: Subscription[]) => 
      manager.cleanupOldNotifications(subscriptions),
    resetAllNotifications: () => manager.resetAllNotifications(),
    getStats: () => manager.getStats(),
    hasChannelBeenCleared: (channelId: string) => manager.hasChannelBeenCleared(channelId),
    getClearedInfo: (channelId: string) => manager.getClearedInfo(channelId),
  };
};

/**
 * Utility functions for subscription management
 */
export const SubscriptionUtils = {
  /**
   * Filter subscriptions that have new content (after smart clearing)
   */
  getSubscriptionsWithNewContent: (subscriptions: Subscription[]): Subscription[] => {
    return subscriptions.filter(sub => 
      sub.contentDetails && sub.contentDetails.newItemCount > 0
    );
  },

  /**
   * Get total count of new items across all subscriptions (after smart clearing)
   */
  getTotalNewItemCount: (subscriptions: Subscription[]): number => {
    return subscriptions.reduce((total, sub) => {
      return total + (sub.contentDetails?.newItemCount || 0);
    }, 0);
  },

  /**
   * Sort subscriptions by new content count (descending)
   */
  sortByNewContent: (subscriptions: Subscription[]): Subscription[] => {
    return [...subscriptions].sort((a, b) => {
      const aCount = a.contentDetails?.newItemCount || 0;
      const bCount = b.contentDetails?.newItemCount || 0;
      return bCount - aCount;
    });
  },

  /**
   * Format subscriber count for display
   */
  formatSubscriberCount: (count: string | number): string => {
    const num = typeof count === 'string' ? parseInt(count) : count;
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  },

  /**
   * Format published date for display
   */
  formatPublishedDate: (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  },
};

export default SmartNotificationManager;