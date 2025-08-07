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
  Linking,
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
  const [injectionRetryCount, setInjectionRetryCount] = useState(0);

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

  // Enhanced injection script that includes video playback fixes
  const createEnhancedInjectionScript = () => {
    const baseScript = createInjectionScript(settings, isAuthenticated);
    
    // Add video playback fixes
    const videoPlaybackFixes = `
      // YouTube video playback fixes
      (function() {
        try {
          console.log('[YT Controller] Applying video playback fixes...');
          
          // Fix for 1-minute playback issue
          // Override visibility API to prevent YouTube from pausing
          Object.defineProperty(document, 'visibilityState', {
            get: () => 'visible',
            configurable: true
          });
          
          Object.defineProperty(document, 'hidden', {
            get: () => false,
            configurable: true
          });
          
          // Prevent page visibility change events
          const origAddEventListener = document.addEventListener;
          document.addEventListener = function(type, listener, options) {
            if (type === 'visibilitychange' || type === 'webkitvisibilitychange') {
              console.log('[YT Controller] Blocked visibility change listener');
              return;
            }
            return origAddEventListener.call(this, type, listener, options);
          };
          
          // Keep video playing by simulating user interaction
          let videoKeepAliveInterval = null;
          
          function keepVideoPlaying() {
            const video = document.querySelector('video');
            if (video && video.paused && video.currentTime > 0) {
              console.log('[YT Controller] Resuming paused video...');
              video.play().catch(e => console.log('[YT Controller] Play prevented:', e));
            }
          }
          
          // Monitor for video elements
          function setupVideoMonitoring() {
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeName === 'VIDEO') {
                    console.log('[YT Controller] Video element detected');
                    
                    // Clear any existing interval
                    if (videoKeepAliveInterval) {
                      clearInterval(videoKeepAliveInterval);
                    }
                    
                    // Setup keep-alive interval
                    videoKeepAliveInterval = setInterval(keepVideoPlaying, 5000);
                    
                    // Add event listeners to the video
                    node.addEventListener('pause', (e) => {
                      // Check if pause was automatic (not user-initiated)
                      if (node.currentTime > 0 && !node.ended) {
                        console.log('[YT Controller] Video paused, attempting to resume...');
                        setTimeout(() => {
                          if (node.paused && !node.ended) {
                            node.play().catch(err => console.log('[YT Controller] Resume failed:', err));
                          }
                        }, 100);
                      }
                    });
                    
                    // Prevent automatic quality changes that might interrupt playback
                    node.addEventListener('loadstart', () => {
                      console.log('[YT Controller] Video loading...');
                    });
                  }
                });
              });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
          }
          
          setupVideoMonitoring();
          
          // Fix YouTube's bot detection
          if (window.navigator) {
            Object.defineProperty(navigator, 'webdriver', {
              get: () => undefined,
              configurable: true
            });
          }
          
          // Simulate user activity periodically
          setInterval(() => {
            // Dispatch a fake user interaction event
            document.dispatchEvent(new MouseEvent('mousemove', {
              bubbles: true,
              cancelable: true,
              clientX: Math.random() * window.innerWidth,
              clientY: Math.random() * window.innerHeight
            }));
          }, 30000); // Every 30 seconds
          
          console.log('[YT Controller] Video playback fixes applied');
          
        } catch (error) {
          console.error('[YT Controller] Error applying video fixes:', error);
        }
      })();
    `;
    
    // Combine the scripts
    return baseScript.replace('true;', videoPlaybackFixes + '\ntrue;');
  };

  const injectCustomCSS = () => {
    if (!webViewRef.current) return;
    
    try {
      const script = createEnhancedInjectionScript();
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
      
      console.log('[YT Screen] CSS injection completed with video fixes');
    } catch (error) {
      console.error('[YT Screen] Injection error:', error);
      
      // Retry injection if it fails
      if (injectionRetryCount < 3) {
        setInjectionRetryCount(injectionRetryCount + 1);
        setTimeout(() => {
          setHasInjected(false);
        }, 1000);
      } else {
        Alert.alert('Settings Error', 'Failed to apply settings. Please refresh the page.');
      }
    }
  };

  // Handle opening Safari for subscribing
  const handleOpenSafariToSubscribe = async (data: any) => {
    try {
      const { channelTitle, url } = data;
      
      Alert.alert(
        'Subscribe in Safari',
        `You currently can't subscribe in this app as such, we'll open Safari where you can sign in to YouTube and subscribe. You can return to the app after subscribing.`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Open Safari',
            onPress: async () => {
              try {
                const supported = await Linking.canOpenURL(url);
                if (supported) {
                  await Linking.openURL(url);
                  console.log('Opened Safari for subscription:', url);
                } else {
                  Alert.alert('Error', 'Unable to open Safari');
                }
              } catch (error) {
                console.error('Failed to open Safari:', error);
                Alert.alert(
                  'Error', 
                  'Failed to open Safari. You can manually visit the channel to subscribe.'
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error handling Safari subscribe:', error);
      Alert.alert('Error', 'Failed to process subscribe request');
    }
  };

  // Enhanced message handler
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'injection-success':
          console.log('✓ CSS injection successful');
          setHasInjected(true);
          setInjectionRetryCount(0); // Reset retry count on success
          break;
          
        case 'open-in-safari-to-subscribe':
          console.log('🌐 Subscribe button clicked - opening Safari');
          handleOpenSafariToSubscribe(data);
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
    setInjectionRetryCount(0);
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

  // Updated user agent to avoid detection as bot
  const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

  // Inject JavaScript to keep session alive
  const injectedJavaScriptBeforeContentLoaded = `
    (function() {
      // Prevent YouTube from detecting WebView
      delete window.navigator.__proto__.webdriver;
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
      });
      
      // Keep session alive
      window.ytInitialData = window.ytInitialData || {};
      window.ytInitialPlayerResponse = window.ytInitialPlayerResponse || {};
      
      // Override XMLHttpRequest to add auth headers if needed
      const originalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        xhr.open = function(method, url, ...args) {
          // Add timestamp to prevent caching
          if (url && url.includes('youtube.com')) {
            const separator = url.includes('?') ? '&' : '?';
            url = url + separator + '_=' + Date.now();
          }
          return originalOpen.call(this, method, url, ...args);
        };
        return xhr;
      };
      
      console.log('[YT Controller] Pre-injection setup complete');
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ 
          uri: currentUrl,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Upgrade-Insecure-Requests': '1',
            // Add authorization header if we have a token
            ...(user?.accessToken ? { 'Authorization': `Bearer ${user.accessToken}` } : {})
          }
        }}
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
        // Add these props to improve video playback
        allowsFullscreenVideo={true}
        allowsProtectedMedia={true}
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={injectedJavaScriptBeforeContentLoaded}
        // Prevent WebView from being recycled
        androidLayerType="hardware"
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        // Add these for better cookie handling
        incognito={false}
        // Inject auth cookies if available
        injectedJavaScript={user?.accessToken ? `
          document.cookie = "CONSENT=YES+; domain=.youtube.com; path=/";
          true;
        ` : undefined}
        onError={(error) => {
          console.error('WebView error:', error);
          Alert.alert('Error', 'Failed to load YouTube. Please check your internet connection.');
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('HTTP error', nativeEvent);
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
          <Text style={styles.subscribeNote}>
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
  subscribeInfo: {
    color: '#FFB74D',
    fontSize: 11,
    marginTop: 4,
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
  subscribeNote: {
    color: '#FFB74D',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default YouTubeScreen;