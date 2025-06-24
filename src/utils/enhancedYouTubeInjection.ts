// src/utils/enhancedYouTubeInjection.ts
import { AppSettings } from '../hooks/useSettings';

export interface InjectionStatus {
  isInjected: boolean;
  timestamp: number;
  pageType: string;
  appliedSettings: Partial<AppSettings>;
  errors: string[];
}

export const createEnhancedInjectionScript = (
  settings: AppSettings, 
  isAuthenticated: boolean = false
): string => {
  const settingsJSON = JSON.stringify(settings);
  
  return `
    (function() {
      try {
        // Store injection status globally
        window.ytControllerStatus = {
          isInjected: false,
          timestamp: Date.now(),
          pageType: 'unknown',
          appliedSettings: ${settingsJSON},
          errors: [],
          version: '2.0'
        };

        console.log('[YT Controller Enhanced] Starting injection...');
        
        // Enhanced page type detection
        function detectPageType() {
          const url = window.location.href;
          const pathname = window.location.pathname;
          
          if (url.includes('/feed/subscriptions') || pathname === '/feed/subscriptions') {
            return 'subscriptions';
          } else if (url.includes('/watch') || pathname.startsWith('/watch')) {
            return 'watch';
          } else if (url.includes('/shorts/')) {
            return 'shorts';
          } else if (url.includes('/channel/') || url.includes('/c/') || url.includes('/user/')) {
            return 'channel';
          } else if (url.includes('/results') || url.includes('search_query=')) {
            return 'search';
          } else if (pathname === '/' || url.includes('youtube.com/') && !url.includes('/watch')) {
            return 'home';
          }
          return 'unknown';
        }

        const pageType = detectPageType();
        window.ytControllerStatus.pageType = pageType;
        
        // Set body attributes immediately
        document.body.setAttribute('data-page-type', pageType);
        document.body.setAttribute('data-signed-in', '${isAuthenticated}');
        document.body.setAttribute('data-yt-controller', 'active');
        
        console.log('[YT Controller Enhanced] Page type:', pageType);

        // Remove existing styles
        const existingStyles = document.querySelectorAll('style[data-yt-controller]');
        existingStyles.forEach(style => style.remove());

        // Generate enhanced CSS
        const css = generateEnhancedCSS(${settingsJSON}, pageType, ${isAuthenticated});
        
        // Inject CSS
        const style = document.createElement('style');
        style.setAttribute('data-yt-controller', 'enhanced');
        style.setAttribute('data-version', '2.0');
        style.innerHTML = css;
        document.head.appendChild(style);
        
        console.log('[YT Controller Enhanced] CSS injected for page type:', pageType);

        // Handle special features based on settings
        if (!${settings.showShorts}) {
          handleShortsBlocking();
        }

        if (${isAuthenticated}) {
          setTimeout(() => createEnhancedControlButton(), 1000);
        }

        // Create floating status indicator
        createStatusIndicator();
        
        // Setup enhanced navigation monitoring
        setupEnhancedNavigation();
        
        // Mark as successfully injected
        window.ytControllerStatus.isInjected = true;
        window.ytControllerStatus.timestamp = Date.now();
        
        // Send detailed status to app
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'injection-enhanced-success',
            status: window.ytControllerStatus,
            settings: ${settingsJSON},
            pageType: pageType,
            authenticated: ${isAuthenticated}
          }));
        }

        // Enhanced CSS generation function
        function generateEnhancedCSS(settings, pageType, isAuth) {
          let css = \`
            /* YT Controller Enhanced Styles v2.0 */
            [data-yt-controller="active"] {
              --yt-controller-primary: #FF0000;
              --yt-controller-success: #4CAF50;
              --yt-controller-warning: #FF9800;
              --yt-controller-danger: #f44336;
            }
          \`;

          // Page-specific styles based on current page
          if (pageType === 'home' || pageType === 'unknown') {
            if (!settings.showRecommendations) {
              css += \`
                /* Enhanced home page hiding */
                ytm-browse[role="main"] .rich-grid-renderer,
                ytm-browse[role="main"] ytm-rich-item-renderer,
                ytm-browse[role="main"] ytm-video-with-context-renderer,
                body[data-page-type="home"] ytm-browse .rich-grid-renderer,
                body[data-page-type="unknown"] ytm-browse .rich-grid-renderer {
                  display: none !important;
                }
                
                /* Show helpful message */
                ytm-browse[role="main"]::before {
                  content: "🎯 Home recommendations hidden by YouTube Controller\\A\\AUse the search bar or subscriptions to find content";
                  display: block !important;
                  text-align: center;
                  padding: 40px 20px;
                  color: #666;
                  font-size: 16px;
                  white-space: pre-line;
                  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                  border-radius: 12px;
                  margin: 20px;
                  border-left: 4px solid var(--yt-controller-primary);
                }
              \`;
            }
          }

          if (pageType === 'watch') {
            if (!settings.showRelatedVideos) {
              css += \`
                /* Hide related videos on watch page */
                ytm-watch ytm-item-section-renderer:not(.video-primary-info):not(.video-secondary-info),
                ytm-watch .watch-next-feed,
                ytm-watch ytm-compact-video-renderer {
                  display: none !important;
                }
                
                /* Expand player area */
                ytm-watch #player-container {
                  max-width: 100% !important;
                }
              \`;
            }
            
            if (!settings.showComments) {
              css += \`
                /* Hide comments on watch page */
                ytm-watch ytm-comment-section-renderer,
                ytm-watch ytm-comments-entry-point-header-renderer {
                  display: none !important;
                }
              \`;
            }
          }

          if (!settings.showShorts) {
            css += \`
              /* Enhanced Shorts blocking */
              ytm-pivot-bar-renderer [tab-identifier="FEshorts"],
              ytm-reel-shelf-renderer,
              ytm-reel-item-renderer,
              .reel-shelf-items,
              body:not([data-page-type="watch"]) ytm-shorts-lockup-view-model {
                display: none !important;
              }
              
              /* Show message when Shorts are blocked */
              body[data-page-type="shorts"] ytm-browse::before {
                content: "🚫 YouTube Shorts blocked by YouTube Controller\\A\\AThis content has been redirected to regular video format";
                display: block !important;
                text-align: center;
                padding: 40px 20px;
                color: var(--yt-controller-danger);
                font-size: 16px;
                white-space: pre-line;
                background: #ffebee;
                border-radius: 12px;
                margin: 20px;
                border-left: 4px solid var(--yt-controller-danger);
              }
            \`;
          }

          // Enhanced sidebar control
          if (!settings.showSidebar) {
            css += \`
              /* Desktop sidebar hiding */
              #guide, #guide-wrapper, ytd-guide-renderer {
                display: none !important;
              }
            \`;
          }

          // Add status indicator styles
          css += \`
            /* Status indicator */
            #yt-controller-status {
              position: fixed;
              top: 10px;
              right: 10px;
              background: rgba(0, 0, 0, 0.8);
              color: white;
              padding: 8px 12px;
              border-radius: 20px;
              font-size: 12px;
              z-index: 999999;
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.2);
              cursor: pointer;
              transition: all 0.3s ease;
            }
            
            #yt-controller-status:hover {
              background: rgba(255, 0, 0, 0.9);
              transform: scale(1.05);
            }
            
            #yt-controller-status.success::before {
              content: "✓ ";
              color: var(--yt-controller-success);
            }
            
            /* Enhanced control button */
            #yt-controller-enhanced-button {
              position: fixed;
              bottom: 20px;
              right: 20px;
              background: linear-gradient(135deg, var(--yt-controller-primary), #CC0000);
              color: white;
              padding: 16px;
              border-radius: 50%;
              width: 60px;
              height: 60px;
              box-shadow: 0 4px 20px rgba(255, 0, 0, 0.3);
              z-index: 999998;
              cursor: pointer;
              transition: all 0.3s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              user-select: none;
            }
            
            #yt-controller-enhanced-button:hover {
              transform: scale(1.1);
              box-shadow: 0 6px 30px rgba(255, 0, 0, 0.5);
            }
            
            #yt-controller-enhanced-button:active {
              transform: scale(0.95);
            }
          \`;

          // Add custom CSS if provided
          if (settings.customCSS) {
            css += \`\\n/* Custom User CSS */\\n\${settings.customCSS}\\n\`;
          }

          return css;
        }

        function handleShortsBlocking() {
          // Redirect Shorts URLs immediately
          if (window.location.href.includes('/shorts/')) {
            const videoId = window.location.pathname.split('/shorts/')[1]?.split('?')[0];
            if (videoId) {
              const newUrl = \`https://m.youtube.com/watch?v=\${videoId}\`;
              console.log('[YT Controller] Redirecting Shorts to regular video:', newUrl);
              window.location.replace(newUrl);
              return;
            }
          }

          // Block Shorts navigation with enhanced detection
          document.addEventListener('click', function(e) {
            const target = e.target;
            const link = target.closest('a');
            
            if (link && link.href && link.href.includes('/shorts/')) {
              e.preventDefault();
              e.stopPropagation();
              
              const videoId = link.href.split('/shorts/')[1]?.split('?')[0];
              if (videoId) {
                const newUrl = \`https://m.youtube.com/watch?v=\${videoId}\`;
                window.location.href = newUrl;
              }
              return false;
            }
          }, true);
        }

        function createStatusIndicator() {
          const existing = document.getElementById('yt-controller-status');
          if (existing) existing.remove();

          const indicator = document.createElement('div');
          indicator.id = 'yt-controller-status';
          indicator.className = 'success';
          indicator.textContent = \`YT Controller \${pageType}\`;
          
          indicator.addEventListener('click', function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'show-status',
                status: window.ytControllerStatus
              }));
            }
          });

          document.body.appendChild(indicator);
          
          // Auto-hide after 3 seconds
          setTimeout(() => {
            if (indicator) {
              indicator.style.opacity = '0.7';
              indicator.style.transform = 'scale(0.9)';
            }
          }, 3000);
        }

        function createEnhancedControlButton() {
          const existing = document.getElementById('yt-controller-enhanced-button');
          if (existing) existing.remove();

          const button = document.createElement('div');
          button.id = 'yt-controller-enhanced-button';
          button.innerHTML = '⚙️';
          button.title = 'YouTube Controller Settings';
          
          button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Add click animation
            this.style.transform = 'scale(0.9)';
            setTimeout(() => {
              this.style.transform = 'scale(1)';
            }, 100);
            
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'show-quick-settings',
                source: 'enhanced-button',
                currentPage: pageType
              }));
            }
          });

          document.body.appendChild(button);
        }

        function setupEnhancedNavigation() {
          let currentUrl = window.location.href;
          
          // Monitor URL changes
          const urlObserver = new MutationObserver(function() {
            if (window.location.href !== currentUrl) {
              const oldUrl = currentUrl;
              currentUrl = window.location.href;
              const newPageType = detectPageType();
              
              console.log('[YT Controller Enhanced] Navigation:', oldUrl, '->', currentUrl);
              
              // Update page type and re-inject if needed
              document.body.setAttribute('data-page-type', newPageType);
              window.ytControllerStatus.pageType = newPageType;
              
              // Update status indicator
              const statusEl = document.getElementById('yt-controller-status');
              if (statusEl) {
                statusEl.textContent = \`YT Controller \${newPageType}\`;
              }
              
              // Handle Shorts blocking on navigation
              if (!${settings.showShorts} && newPageType === 'shorts') {
                setTimeout(handleShortsBlocking, 100);
              }
              
              // Notify app of navigation
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'navigation-detected',
                  from: oldUrl,
                  to: currentUrl,
                  pageType: newPageType
                }));
              }
            }
          });
          
          urlObserver.observe(document, { subtree: true, childList: true });
          
          // Handle popstate
          window.addEventListener('popstate', function() {
            setTimeout(() => {
              const newPageType = detectPageType();
              document.body.setAttribute('data-page-type', newPageType);
              window.ytControllerStatus.pageType = newPageType;
              
              const statusEl = document.getElementById('yt-controller-status');
              if (statusEl) {
                statusEl.textContent = \`YT Controller \${newPageType}\`;
              }
            }, 100);
          });
        }

      } catch (error) {
        console.error('[YT Controller Enhanced] Injection error:', error);
        
        if (window.ytControllerStatus) {
          window.ytControllerStatus.errors.push(error.toString());
        }
        
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'injection-enhanced-error',
            error: error.toString(),
            stack: error.stack
          }));
        }
      }
    })();
    true;
  `;
};

// Enhanced message handler for the WebView
export const createEnhancedMessageHandler = () => {
  return (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('[YT Controller] Enhanced message received:', data.type);
      
      switch (data.type) {
        case 'injection-enhanced-success':
          console.log('✅ Enhanced injection successful for page:', data.pageType);
          console.log('Applied settings:', data.settings);
          break;
          
        case 'show-quick-settings':
          console.log('🎛️ Quick settings requested from:', data.source);
          // Handle showing quick settings modal
          break;
          
        case 'show-status':
          console.log('📊 Status requested:', data.status);
          // Handle showing status information
          break;
          
        case 'navigation-detected':
          console.log('🧭 Navigation detected:', data.from, '->', data.to);
          break;
          
        case 'injection-enhanced-error':
          console.error('❌ Enhanced injection error:', data.error);
          break;
          
        default:
          console.log('📨 Unknown message type:', data.type);
      }
    } catch (error) {
      console.log('Failed to parse WebView message:', error);
    }
  };
};

// Utility to get injection status
export const getInjectionStatusScript = (): string => {
  return `
    (function() {
      if (window.ytControllerStatus) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'injection-status-response',
            status: window.ytControllerStatus
          }));
        }
      } else {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'injection-status-response',
            status: null,
            message: 'No injection detected'
          }));
        }
      }
    })();
    true;
  `;
};