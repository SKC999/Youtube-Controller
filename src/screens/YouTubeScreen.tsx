import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useSettings } from '../hooks/useSettings';
import { useAuthContext } from '../context/AuthContext';
import { createInjectionScript } from '../utils/youtubeInjection';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';

type YouTubeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'YouTube'>;
type YouTubeScreenRouteProp = RouteProp<RootStackParamList, 'YouTube'>;

interface Props {
  navigation: YouTubeScreenNavigationProp;
  route?: YouTubeScreenRouteProp;
}

interface SubscriptionData {
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
  };
}

const YouTubeScreen: React.FC<Props> = ({ navigation, route }) => {
  const webViewRef = useRef<WebView>(null);
  const { settings } = useSettings();
  const { user } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showSubscriptions, setShowSubscriptions] = useState(false);
  const [subscriptions, setSubscriptions] = useState<SubscriptionData[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [hasInjected, setHasInjected] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('https://m.youtube.com');

  // Animated values for movable button
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Handle navigation parameters for direct channel/video access
  useEffect(() => {
    if (route?.params) {
      const params = route.params as any;
      if (params.channelId) {
        setCurrentUrl(`https://m.youtube.com/channel/${params.channelId}`);
      } else if (params.videoId) {
        setCurrentUrl(`https://m.youtube.com/watch?v=${params.videoId}`);
      }
    }
  }, [route?.params]);

  // Only inject once when settings change
  useEffect(() => {
    if (!isLoading && webViewRef.current && !hasInjected) {
      console.log('Injecting CSS with settings:', settings);
      injectCustomCSS();
      setHasInjected(true);
    }
  }, [settings, isLoading, hasInjected]);

  const injectCustomCSS = () => {
    if (!webViewRef.current) return;
    
    const script = createInjectionScript(settings, !!user);
    webViewRef.current.injectJavaScript(script);
  };

  const loadUserSubscriptions = async () => {
    if (!user?.accessToken) return;

    setLoadingSubscriptions(true);
    try {
      const response = await fetch(
        'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50&order=alphabetical',
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.items || []);
      } else {
        throw new Error('Failed to load subscriptions');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      Alert.alert('Error', 'Failed to load subscriptions. Please check your internet connection.');
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message received:', data);
      
      if (data.type === 'show-subscriptions') {
        setShowSubscriptions(true);
        loadUserSubscriptions();
      } else if (data.type === 'injection-success') {
        console.log('✓ CSS injected successfully');
      } else if (data.type === 'error') {
        console.error('Injection error:', data.error);
      }
    } catch (error) {
      console.log('Message parse error:', error);
    }
  };

  const handleLoadEnd = () => {
    console.log('WebView loaded');
    setIsLoading(false);
    setHasInjected(false); // Reset injection flag for new page
  };

  const navigateToChannel = (channelId: string, channelTitle: string) => {
    const channelUrl = `https://m.youtube.com/channel/${channelId}`;
    console.log(`Navigating to channel: ${channelTitle} (${channelId})`);
    
    webViewRef.current?.injectJavaScript(`
      window.location.href = '${channelUrl}';
      true;
    `);
    setShowSubscriptions(false);
  };

  const handleNavigationStateChange = (navState: any) => {
    console.log('Navigation:', navState.url);
    setCurrentUrl(navState.url);
    
    if (!navState.loading && navState.url.includes('youtube.com')) {
      // Reset injection flag when navigating
      setHasInjected(false);
    }
  };

  const goToSubscriptionsPage = () => {
    setShowSubscriptions(false);
    navigation.navigate('Subscriptions');
  };

  const goHome = () => {
    const homeUrl = 'https://m.youtube.com';
    webViewRef.current?.injectJavaScript(`
      window.location.href = '${homeUrl}';
      true;
    `);
  };

  // Gesture handler for dragging the button
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context: any) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
      buttonScale.value = withSpring(0.9);
    },
    onActive: (event, context) => {
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: () => {
      buttonScale.value = withSpring(1);
      
      // Snap to edges if needed
      const screenWidth = 400; // Approximate screen width
      const screenHeight = 800; // Approximate screen height
      const buttonSize = 56;
      const margin = 20;
      
      // Keep button within screen bounds
      if (translateX.value < -screenWidth/2 + buttonSize/2 + margin) {
        translateX.value = withSpring(-screenWidth/2 + buttonSize/2 + margin);
      }
      if (translateX.value > screenWidth/2 - buttonSize/2 - margin) {
        translateX.value = withSpring(screenWidth/2 - buttonSize/2 - margin);
      }
      if (translateY.value < -screenHeight/2 + buttonSize/2 + margin) {
        translateY.value = withSpring(-screenHeight/2 + buttonSize/2 + margin);
      }
      if (translateY.value > screenHeight/2 - buttonSize/2 - margin) {
        translateY.value = withSpring(screenHeight/2 - buttonSize/2 - margin);
      }
    },
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: buttonScale.value },
      ],
    };
  });

  const handleButtonPress = () => {
    setShowControls(!showControls);
  };

  const userAgent = 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webview}
        onLoadEnd={handleLoadEnd}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        userAgent={userAgent}
        onError={(error) => {
          console.error('WebView error:', error);
          Alert.alert('Error', 'Failed to load YouTube. Please check your internet connection.');
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF0000" />
            <Text style={styles.loadingText}>Loading YouTube...</Text>
          </View>
        )}
      />

      {/* Movable Floating Control Button */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.floatingButton, user && styles.floatingButtonAuth, animatedButtonStyle]}>
          <TouchableOpacity
            style={styles.floatingButtonInner}
            onPress={handleButtonPress}
            activeOpacity={0.8}
          >
            <Text style={styles.floatingButtonText}>⚙️</Text>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>

      {/* Control Panel */}
      {showControls && (
        <View style={styles.controlPanel}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.controlButtonText}>← Back to Home</Text>
          </TouchableOpacity>

          {user && (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.primaryButton]}
                onPress={() => {
                  setShowSubscriptions(true);
                  loadUserSubscriptions();
                }}
              >
                <Text style={styles.controlButtonText}>📺 Quick Subscriptions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.primaryButton]}
                onPress={goToSubscriptionsPage}
              >
                <Text style={styles.controlButtonText}>📋 Full Subscriptions</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.controlButtonText}>⚙️ Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.closeButton]}
            onPress={() => setShowControls(false)}
          >
            <Text style={styles.controlButtonText}>✕ Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Subscriptions Modal */}
      <Modal
        visible={showSubscriptions}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubscriptions(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quick Access - Subscriptions</Text>
            <View style={styles.modalHeaderButtons}>
              <TouchableOpacity
                style={styles.fullListButton}
                onPress={goToSubscriptionsPage}
              >
                <Text style={styles.fullListButtonText}>Full List</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowSubscriptions(false)}
              >
                <Text style={styles.closeModalText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {loadingSubscriptions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF0000" />
              <Text style={styles.loadingText}>Loading subscriptions...</Text>
            </View>
          ) : (
            <ScrollView style={styles.subscriptionsList}>
              {subscriptions.slice(0, 20).map((subscription) => (
                <TouchableOpacity
                  key={subscription.id}
                  style={styles.subscriptionItem}
                  onPress={() => navigateToChannel(
                    subscription.snippet.resourceId.channelId,
                    subscription.snippet.title
                  )}
                >
                  <Image
                    source={{ uri: subscription.snippet.thumbnails.medium?.url || subscription.snippet.thumbnails.default.url }}
                    style={styles.channelThumbnail}
                  />
                  <View style={styles.channelInfo}>
                    <Text style={styles.channelTitle} numberOfLines={1}>
                      {subscription.snippet.title}
                    </Text>
                    <Text style={styles.channelDescription} numberOfLines={2}>
                      {subscription.snippet.description || 'No description available'}
                    </Text>
                  </View>
                  <Text style={styles.arrowIcon}>→</Text>
                </TouchableOpacity>
              ))}
              
              {subscriptions.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No subscriptions found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Subscribe to channels on YouTube to see them here
                  </Text>
                </View>
              )}

              {subscriptions.length > 20 && (
                <TouchableOpacity
                  style={styles.seeMoreButton}
                  onPress={goToSubscriptionsPage}
                >
                  <Text style={styles.seeMoreButtonText}>
                    See All {subscriptions.length} Subscriptions
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF0000" />
          <Text style={styles.loadingText}>Preparing YouTube Controller...</Text>
          <Text style={styles.loadingSubtext}>
            {user ? 'Signed in as ' + user.name : 'Guest mode'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF0000',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  floatingButtonAuth: {
    backgroundColor: '#4285F4',
  },
  floatingButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButtonText: {
    fontSize: 22,
    color: 'white',
  },
  controlPanel: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    padding: 12,
    minWidth: 200,
    maxWidth: 250,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  controlButton: {
    padding: 14,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  primaryButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    marginTop: 8,
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  loadingSubtext: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 8,
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fullListButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  fullListButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  closeModalButton: {
    padding: 8,
  },
  closeModalText: {
    fontSize: 18,
    color: '#666',
  },
  subscriptionsList: {
    flex: 1,
    padding: 16,
  },
  subscriptionItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  channelThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  channelInfo: {
    flex: 1,
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
  },
  arrowIcon: {
    fontSize: 18,
    color: '#999',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  seeMoreButton: {
    backgroundColor: '#FF0000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  seeMoreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default YouTubeScreen;