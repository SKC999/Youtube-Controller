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
import { useUserAgentRotation } from '../hooks/useUserAgentRotation';
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
  // ALL HOOKS MUST BE CALLED AT THE TOP - NO CONDITIONAL HOOKS!
  const webViewRef = useRef<WebView>(null);
  const { settings, getCurrentMode } = useSettings();
  const { user, isAuthenticated } = useAuth();
  
  // Use the user agent rotation hook
  const {
    userAgent,
    userAgentInfo,
    loading: userAgentLoading,
    timeUntilNextRotation,
    refreshRotation,
  } = useUserAgentRotation();

  // State management - ALL declared at the top
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

  // Effects - ALL at the top level
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
    if (!isLoading && webViewRef.current && !hasInjected && userAgent) {
      injectCustomCSS();
      setHasInjected(true);
    }
  }, [settings, isLoading, hasInjected, currentPageType, userAgent]);

  // Enhanced injection script with AGGRESSIVE FULLSCREEN FIX
  const createEnhancedInjectionScript = () => {
    const baseScript = createInjectionScript(settings, isAuthenticated);
    
    // Add video playback fixes - AGGRESSIVE FULLSCREEN FIX
    const videoPlaybackFixes = `
      // YouTube video playback fixes - AGGRESSIVE FULLSCREEN FIX
      (function() {
        try {
          console.log('[YT Controller] Applying video playback fixes - Aggressive fullscreen fix...');
          console.log('[YT Controller] Using User Agent: ${userAgentInfo?.deviceInfo || 'Unknown Device'}');
          
          // Track user interactions to distinguish manual pauses
          let lastUserInteraction = Date.now();
          let userInitiatedPause = false;
          let isInFullscreen = false;
          let videoElement = null;
          
          // AGGRESSIVE: Check multiple ways to detect fullscreen
          function checkIfFullscreen() {
            // Standard fullscreen API
            if (document.fullscreenElement || document.webkitFullscreenElement) {
              return true;
            }
            
            // YouTube's custom fullscreen classes
            const player = document.querySelector('.html5-video-player');
            if (player) {
              if (player.classList.contains('ytp-fullscreen') ||
                  player.classList.contains('ytp-player-fullscreen') ||
                  player.classList.contains('ytp-fullscreen-mode')) {
                return true;
              }
            }
            
            // Mobile YouTube specific
            const app = document.querySelector('ytm-app');
            if (app && app.hasAttribute('fullscreen')) {
              return true;
            }
            
            // Check if video is taking full viewport
            if (videoElement) {
              const videoRect = videoElement.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              const viewportWidth = window.innerWidth;
              
              // If video covers more than 90% of viewport, consider it fullscreen
              if (videoRect.width >= viewportWidth * 0.9 && 
                  videoRect.height >= viewportHeight * 0.9) {
                return true;
              }
            }
            
            // Check for theater mode or expanded player
            const theater = document.querySelector('[theater]');
            if (theater || document.body.classList.contains('ytp-theater-mode')) {
              return true;
            }
            
            return false;
          }
          
          // Update fullscreen state continuously
          function updateFullscreenState() {
            const wasFullscreen = isInFullscreen;
            isInFullscreen = checkIfFullscreen();
            
            if (wasFullscreen !== isInFullscreen) {
              console.log('[YT Controller] Fullscreen state changed to:', isInFullscreen);
              
              // IMPORTANT: Reset user interaction flag when entering/exiting fullscreen
              if (isInFullscreen) {
                // Entering fullscreen - be more permissive with pauses
                userInitiatedPause = true;
                setTimeout(() => {
                  userInitiatedPause = false;
                }, 3000); // Give 3 seconds after entering fullscreen
              }
            }
          }
          
          // Check fullscreen state frequently
          setInterval(updateFullscreenState, 250); // Check every 250ms
          
          // Fix for visibility API to prevent automatic pausing
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
          
          // AGGRESSIVE: Track ALL interactions
          ['click', 'touchstart', 'touchend', 'keydown', 'keyup', 'pointerdown', 'pointerup', 'mousedown', 'mouseup'].forEach(eventType => {
            document.addEventListener(eventType, function(e) {
              lastUserInteraction = Date.now();
              
              // In fullscreen, ANY interaction should be considered user-initiated
              if (isInFullscreen) {
                userInitiatedPause = true;
                console.log('[YT Controller] Fullscreen interaction detected:', eventType);
                
                // Keep flag active for 5 seconds in fullscreen
                setTimeout(() => {
                  userInitiatedPause = false;
                }, 5000);
              } else {
                // Normal mode - check if it's a video control
                const target = e.target;
                const isVideoControl = 
                  target.closest('.ytp-play-button') ||
                  target.closest('.ytp-chrome-controls') ||
                  target.closest('.player-controls-container') ||
                  target.closest('[aria-label*="Pause" i]') ||
                  target.closest('[aria-label*="Play" i]') ||
                  target.closest('[title*="Pause" i]') ||
                  target.closest('[title*="Play" i]') ||
                  target.tagName === 'VIDEO' ||
                  target.closest('video') ||
                  (e.type === 'keydown' && (e.code === 'Space' || e.key === ' ' || e.code === 'KeyK'));
                
                if (isVideoControl) {
                  userInitiatedPause = true;
                  console.log('[YT Controller] Control interaction detected');
                  setTimeout(() => {
                    userInitiatedPause = false;
                  }, 2000);
                }
              }
            }, true);
          });
          
          // Monitor for video elements
          function setupVideoMonitoring() {
            const observer = new MutationObserver((mutations) => {
              mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeName === 'VIDEO') {
                    videoElement = node; // Store reference to video element
                    console.log('[YT Controller] Video element detected');
                    
                    // Add pause event listener with AGGRESSIVE fullscreen handling
                    node.addEventListener('pause', (e) => {
                      const video = e.target;
                      const timeSinceInteraction = Date.now() - lastUserInteraction;
                      
                      // Update fullscreen state right before checking
                      updateFullscreenState();
                      
                      console.log('[YT Controller] Pause event:', {
                        isFullscreen: isInFullscreen,
                        userInitiated: userInitiatedPause,
                        timeSinceInteraction: timeSinceInteraction,
                        currentTime: video.currentTime,
                        ended: video.ended
                      });
                      
                      // NEVER auto-resume videos - let user control playback completely
                      console.log('[YT Controller] Video paused - NO automatic resume will occur');
                      console.log('[YT Controller] Pause details:', {
                        isFullscreen: isInFullscreen,
                        userInitiated: userInitiatedPause,
                        timeSinceInteraction: timeSinceInteraction,
                        currentTime: video.currentTime,
                        ended: video.ended,
                        autoResumeDisabled: true
                      });
                      
                      // All pauses are now respected - no automatic resuming at all
                    });
                    
                    // Track play events
                    node.addEventListener('play', (e) => {
                      updateFullscreenState();
                      console.log('[YT Controller] Video playing (fullscreen:', isInFullscreen, ')');
                    });
                    
                    // Track seeking
                    node.addEventListener('seeking', (e) => {
                      userInitiatedPause = true;
                      setTimeout(() => {
                        userInitiatedPause = false;
                      }, 2000);
                    });
                    
                    // Track direct clicks on video
                    node.addEventListener('click', (e) => {
                      userInitiatedPause = true;
                      lastUserInteraction = Date.now();
                      console.log('[YT Controller] Direct video click');
                      setTimeout(() => {
                        userInitiatedPause = false;
                      }, 3000);
                    });
                  }
                });
              });
            });
            
            observer.observe(document.body, { childList: true, subtree: true });
          }
          
          setupVideoMonitoring();
          
          // Monitor fullscreen changes via mutation observer
          const fullscreenObserver = new MutationObserver(() => {
            updateFullscreenState();
          });
          
          // Observe changes to player and app elements
          setTimeout(() => {
            const player = document.querySelector('.html5-video-player');
            if (player) {
              fullscreenObserver.observe(player, { 
                attributes: true, 
                attributeFilter: ['class'] 
              });
            }
            
            const app = document.querySelector('ytm-app');
            if (app) {
              fullscreenObserver.observe(app, { 
                attributes: true, 
                attributeFilter: ['fullscreen'] 
              });
            }
            
            const body = document.body;
            fullscreenObserver.observe(body, { 
              attributes: true, 
              attributeFilter: ['class'] 
            });
          }, 1000);
          
          // Fix YouTube's bot detection
          if (window.navigator) {
            Object.defineProperty(navigator, 'webdriver', {
              get: () => undefined,
              configurable: true
            });
          }
          
          // Simulate user activity ONLY in normal mode
          setInterval(() => {
            updateFullscreenState();
            
            // NEVER simulate activity in fullscreen
            if (isInFullscreen) {
              return;
            }
            
            const video = document.querySelector('video');
            if (video && !video.paused && (Date.now() - lastUserInteraction) > 30000) {
              document.dispatchEvent(new MouseEvent('mousemove', {
                bubbles: true,
                cancelable: true,
                clientX: Math.random() * window.innerWidth,
                clientY: Math.random() * window.innerHeight
              }));
            }
          }, 45000);
          
          console.log('[YT Controller] Video playback fixes applied - Aggressive fullscreen protection enabled');
          
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
      
      console.log('[YT Screen] CSS injection completed with video fixes using', userAgentInfo?.deviceInfo);
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
          console.log('✓ CSS injection successful with User Agent:', userAgentInfo?.deviceInfo);
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
        translateY.value = withSpring(screenHeight/2 - buttonSize/2 + margin);
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
      
      console.log('[YT Controller] Pre-injection setup complete with User Agent rotation');
    })();
    true;
  `;

  // CONDITIONAL RENDERING LOGIC - Moved to JSX return instead of early returns
  // This respects the Rules of Hooks by ensuring all hooks run before any conditional rendering

  // Not authenticated case
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

  // User agent loading case
  if (userAgentLoading || !userAgent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF0000" />
          <Text style={styles.loadingText}>Initializing YouTube Controller...</Text>
          <Text style={styles.loadingSubtext}>
            Setting up secure connection
          </Text>
          <Text style={styles.loadingDetails}>
            Configuring user agent rotation system...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Main component render
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
        userAgent={userAgent} // Use the rotating user agent
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
            {/* User Agent Information */}
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
          <Text style={styles.userAgentLoadingInfo}>
            Device: {userAgentInfo?.deviceInfo || 'Configuring...'}
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
  userAgentInfo: {
    color: '#FFB74D',
    fontSize: 11,
    marginTop: 2,
  },
  rotationInfo: {
    color: '#81C784',
    fontSize: 10,
    marginTop: 2,
  },
  controlButton: {
    padding: 14,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  userAgentLoadingInfo: {
    color: '#FFB74D',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default YouTubeScreen;