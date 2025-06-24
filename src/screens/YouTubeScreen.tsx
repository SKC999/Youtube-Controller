import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Vibration,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import { createInjectionScript } from '../utils/youtubeInjection';
import QuickSettings from '../components/QuickSettings';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';

type YouTubeScreenProps = StackScreenProps<RootStackParamList, 'YouTube'>;

const YouTubeScreen: React.FC<YouTubeScreenProps> = ({ navigation, route }) => {
  const webViewRef = useRef<WebView>(null);
  const { settings, getCurrentMode } = useSettings();
  const { user, isAuthenticated } = useAuth();
  
  // Redirect to auth if not signed in
  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to use YouTube Controller features.',
        [
          {
            text: 'Sign In',
            onPress: () => navigation.replace('Auth'),
          },
        ],
        { cancelable: false }
      );
      return;
    }
  }, [isAuthenticated, navigation]);

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [hasInjected, setHasInjected] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('https://m.youtube.com');
  const [currentPageType, setCurrentPageType] = useState<string>('home');
  const [showDragHint, setShowDragHint] = useState(false);

  // Animated values for movable button
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.authRequiredContainer}>
        <View style={styles.authRequiredContent}>
          <Text style={styles.authRequiredIcon}>🔒</Text>
          <Text style={styles.authRequiredTitle}>Authentication Required</Text>
          <Text style={styles.authRequiredMessage}>
            Please sign in to access YouTube Controller features
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.replace('Auth')}
          >
            <Text style={styles.signInButtonText}>Go to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Handle navigation parameters for direct channel/video access
  useEffect(() => {
    if (route?.params) {
      const params = route.params;
      if (params.channelId) {
        setCurrentUrl(`https://m.youtube.com/channel/${params.channelId}`);
      } else if (params.videoId) {
        setCurrentUrl(`https://m.youtube.com/watch?v=${params.videoId}`);
      }
    }
  }, [route?.params]);

  // Injection with better timing and no duplicate buttons
  useEffect(() => {
    if (!isLoading && webViewRef.current && !hasInjected) {
      injectCustomCSS();
      setHasInjected(true);
    }
  }, [settings, isLoading, hasInjected, currentPageType]);

  const injectCustomCSS = () => {
    if (!webViewRef.current) return;
    
    try {
      // Use the original injection script but disable any floating buttons
      // since YouTube has its own subscription tab and we have our own controls
      const script = createInjectionScript(settings, false); // Pass false to disable subscription button creation
      webViewRef.current.injectJavaScript(script);
      
      // Remove any subscription or control buttons created by injection
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`
          (function() {
            // Remove any floating buttons, subscription buttons, or status indicators
            const elementsToRemove = document.querySelectorAll(
              '#yt-controller-sub-button, #yt-controller-enhanced-button, #yt-controller-status, .yt-controller-floating-btn'
            );
            elementsToRemove.forEach(el => el.remove());
            
            // Clean up any controller-added elements
            const controllerElements = document.querySelectorAll('[id*="yt-controller"], [class*="yt-controller"]');
            controllerElements.forEach(el => {
              if (el.tagName !== 'STYLE') { // Keep our CSS styles
                el.remove();
              }
            });
            
            console.log('[YT Controller] Cleaned up injection-created UI elements');
          })();
          true;
        `);
      }, 1000);
      
      console.log('[YT Screen] CSS injection completed (UI elements disabled)');
    } catch (error) {
      console.error('[YT Screen] Injection error:', error);
      Alert.alert('Settings Error', 'Failed to apply settings. Please refresh the page.');
    }
  };

  // Simplified message handler
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'injection-success':
          console.log('✓ CSS injection successful');
          setHasInjected(true);
          break;
          
        case 'error':
          console.error('Injection error:', data.error);
          break;
          
        default:
          console.log('📨 Message type:', data.type);
      }
    } catch (error) {
      console.log('[YT Screen] Message parse error:', error);
    }
  };

  const handleLoadEnd = () => {
    setIsLoading(false);
    setHasInjected(false); // Reset injection flag for new page
  };

  const handleNavigationStateChange = (navState: any) => {
    setCurrentUrl(navState.url);
    
    if (!navState.loading && navState.url.includes('youtube.com')) {
      // Reset injection flag when navigating
      setHasInjected(false);
      
      // Detect page type from URL
      let pageType = 'home';
      if (navState.url.includes('/watch')) pageType = 'watch';
      else if (navState.url.includes('/feed/subscriptions')) pageType = 'subscriptions';
      else if (navState.url.includes('/shorts/')) pageType = 'shorts';
      else if (navState.url.includes('/channel/')) pageType = 'channel';
      
      setCurrentPageType(pageType);
    }
  };

  const refreshInjection = () => {
    setHasInjected(false);
    setTimeout(() => {
      if (webViewRef.current) {
        injectCustomCSS();
      }
    }, 500);
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
      const screenWidth = 400;
      const screenHeight = 800;
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
          Alert.alert('Error', 'Failed to load YouTube. Please check your internet connection.');
        }}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF0000" />
            <Text style={styles.loadingText}>Loading YouTube...</Text>
          </View>
        )}
      />

      {/* Dynamically Movable Floating Control Button */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.floatingButton, animatedButtonStyle]}>
          <TouchableOpacity
            style={styles.floatingButtonInner}
            onPress={handleButtonPress}
            activeOpacity={0.8}
            delayLongPress={200}
          >
            <Text style={styles.floatingButtonText}>⚙️</Text>
            {/* Add drag indicator */}
            <View style={styles.dragIndicator}>
              <View style={styles.dragDot} />
              <View style={styles.dragDot} />
              <View style={styles.dragDot} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>

      {/* Drag Hint Tooltip */}
      {showDragHint && (
        <View style={styles.dragHint}>
          <View style={styles.dragHintBubble}>
            <Text style={styles.dragHintText}>Drag me around! 👆</Text>
          </View>
          <View style={styles.dragHintArrow} />
        </View>
      )}

      {/* Control Panel */}
      {showControls && (
        <View style={styles.controlPanel}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>YouTube Controller</Text>
            <Text style={styles.statusText}>
              Mode: {getCurrentMode()} • Page: {currentPageType}
            </Text>
            <Text style={styles.statusDetails}>
              {hasInjected ? '✅ Settings Active' : '⏳ Loading...'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.controlButtonText}>← Back to Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.primaryButton]}
            onPress={() => setShowQuickSettings(true)}
          >
            <Text style={styles.controlButtonText}>🎛️ Quick Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.controlButtonText}>⚙️ Advanced Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.refreshButton]}
            onPress={refreshInjection}
          >
            <Text style={styles.controlButtonText}>🔄 Refresh Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.closeButton]}
            onPress={() => setShowControls(false)}
          >
            <Text style={styles.controlButtonText}>✕ Close</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Settings Modal */}
      <QuickSettings
        visible={showQuickSettings}
        onClose={() => setShowQuickSettings(false)}
        onApplyAndNavigate={() => {
          setShowQuickSettings(false);
          setTimeout(() => {
            refreshInjection();
          }, 500);
        }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF0000" />
          <Text style={styles.loadingText}>Preparing YouTube Controller...</Text>
          <Text style={styles.loadingSubtext}>
            Signed in as {user?.name} • Mode: {getCurrentMode()}
          </Text>
          <Text style={styles.loadingDetails}>
            Applying {getCurrentMode()} settings...
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
  authRequiredContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authRequiredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  authRequiredIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  authRequiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  authRequiredMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  signInButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    backgroundColor: '#4285F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    // Remove elevation here since it's handled in animated style
  },
  floatingButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  floatingButtonText: {
    fontSize: 22,
    color: 'white',
    marginBottom: 2,
  },
  dragIndicator: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    gap: 2,
  },
  dragDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  dragHint: {
    position: 'absolute',
    bottom: 100,
    right: 85,
    zIndex: 999999,
  },
  dragHintBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
  },
  dragHintText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  dragHintArrow: {
    position: 'absolute',
    bottom: -5,
    right: 20,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'rgba(0, 0, 0, 0.9)',
  },
  controlPanel: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    padding: 12,
    minWidth: 220,
    maxWidth: 280,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  statusInfo: {
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 2,
  },
  statusDetails: {
    color: '#4CAF50',
    fontSize: 11,
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
  refreshButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
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
    textAlign: 'center',
  },
  loadingDetails: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 4,
  },
});

export default YouTubeScreen;