import { AppSettings } from '../hooks/useSettings';

export const generateYouTubeCSS = (settings: AppSettings): string => {
  let css = '';

  // Hide recommendations on home page - Enhanced for all auth states
  if (!settings.showRecommendations) {
    css += `
      /* IMMEDIATE blocking - target by URL and default state */
      /* Block home page content immediately */
      ytm-browse .rich-grid-renderer:not([data-subscription-content]),
      ytm-browse .rich-grid-media:not([data-subscription-content]),
      ytm-browse .media-item:not([data-subscription-content]),
      ytm-browse .video-list-item:not([data-subscription-content]),
      ytm-browse .compact-media-item:not([data-subscription-content]),
      ytm-browse .large-media-item:not([data-subscription-content]),
      
      /* Target main content area on initial load */
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse .rich-grid-renderer,
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse .tab-content,
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse .browse-items-primary,
      
      /* Specific home page targeting */
      ytm-browse[page-subtype="home"] .rich-grid-renderer,
      ytm-browse[page-subtype="home"] .rich-grid-media,
      ytm-browse[page-subtype="home"] .media-item,
      ytm-browse[page-subtype="home"] .video-list-item,
      ytm-browse[page-subtype="home"] .compact-media-item,
      ytm-browse[page-subtype="home"] .large-media-item,
      ytm-browse[page-subtype="home"] .tab-content,
      ytm-browse[page-subtype="home"] .browse-items-primary,
      
      /* Hide feed filter chips */
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse ytm-feed-filter-chip-bar-renderer,
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse .feed-filter-chip-bar-container,
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse ytm-chip-cloud-renderer,
      
      /* Hide all item renderers when not on subscriptions or watch pages */
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse ytm-rich-item-renderer,
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse ytm-video-with-context-renderer,
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse ytm-playlist-video-renderer,
      
      /* Hide sections when not on subscriptions or watch pages */
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse ytm-section-list-renderer,
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse ytm-item-section-renderer,
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse .section-list,
      
      /* Hide shorts and shelves when not subscriptions or watch pages */
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse ytm-reel-shelf-renderer,
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse ytm-shorts-lockup-view-model,
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse .reel-shelf-items,
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse ytm-reel-item-renderer {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* EXCEPTION: Always show subscription content when URL contains subscriptions */
      body[data-page-type="subscriptions"] ytm-browse .rich-grid-renderer,
      body[data-page-type="subscriptions"] ytm-browse ytm-section-list-renderer,
      body[data-page-type="subscriptions"] ytm-browse ytm-item-section-renderer,
      body[data-page-type="subscriptions"] ytm-browse ytm-rich-item-renderer,
      body[data-page-type="subscriptions"] ytm-browse ytm-video-with-context-renderer,
      ytm-browse[page-subtype="subscriptions"] .rich-grid-renderer,
      ytm-browse[page-subtype="subscriptions"] ytm-section-list-renderer,
      ytm-browse[page-subtype="subscriptions"] ytm-item-section-renderer,
      ytm-browse[page-subtype="subscriptions"] ytm-rich-item-renderer,
      ytm-browse[page-subtype="subscriptions"] ytm-video-with-context-renderer {
        display: block !important;
        visibility: visible !important;
      }
      
      /* Show empty message on home page */
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse[role="main"]::after,
      ytm-browse[page-subtype="home"][role="main"]::after {
        content: "Home recommendations hidden - Use search or the subscriptions tab to find videos";
        display: block !important;
        text-align: center;
        padding: 60px 20px;
        color: #717171;
        font-size: 14px;
        position: absolute;
        width: calc(100% - 40px);
        top: 120px;
        z-index: 10;
        background: #f9f9f9;
        border-radius: 8px;
        margin: 20px;
      }
      
      /* Different message for authenticated users */
      body[data-signed-in="true"]:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse[role="main"]::after,
      body[data-signed-in="true"] ytm-browse[page-subtype="home"][role="main"]::after {
        content: "Home feed hidden - Use search, subscriptions tab, or the subscription button in the YouTube Controller app";
      }
      
      /* Make browse container relative for message positioning */
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse[role="main"],
      ytm-browse[page-subtype="home"][role="main"] {
        position: relative !important;
        min-height: 300px !important;
      }
      
      /* ALWAYS keep search results visible */
      ytm-search-results-container,
      ytm-search ytm-compact-video-renderer,
      ytm-search .compact-media-item,
      ytm-section-list-renderer[data-content-type="search"],
      ytm-search .search-results {
        display: block !important;
        visibility: visible !important;
      }
      
      /* Keep navigation visible */
      ytm-mobile-topbar-renderer,
      ytm-pivot-bar-renderer,
      ytm-searchbox,
      .mobile-topbar-renderer,
      .pivot-bar-container {
        display: flex !important;
        visibility: visible !important;
      }
      
      /* Keep subscriptions tab visible and functional */
      ytm-pivot-bar-renderer a[href*="/feed/subscriptions"],
      ytm-pivot-bar-renderer [tab-identifier="FEsubscriptions"],
      ytm-pivot-bar-item-renderer[tab-identifier="FEsubscriptions"] {
        display: flex !important;
        visibility: visible !important;
      }
    `;
  }

  // Hide sidebar/navigation (desktop only)
  if (!settings.showSidebar) {
    css += `
      /* Desktop sidebar only */
      #guide,
      #guide-wrapper,
      ytd-guide-renderer,
      ytd-mini-guide-renderer,
      tp-yt-app-drawer,
      #guide-button {
        display: none !important;
      }
      
      /* Adjust desktop layout */
      ytd-app #page-manager {
        margin-left: 0 !important;
      }
    `;
  }

  // Hide comments - Enhanced for all auth states BUT ALWAYS SHOW ON WATCH PAGES
  if (!settings.showComments) {
    css += `
      /* Hide comments on non-watch pages only */
      body:not([data-page-type="watch"]) #comments,
      body:not([data-page-type="watch"]) ytd-comments,
      body:not([data-page-type="watch"]) ytm-comment-section-renderer,
      body:not([data-page-type="watch"]) ytm-comments-entry-point-header-renderer,
      body:not([data-page-type="watch"]) ytm-engagement-panel-section-list-renderer,
      body:not([data-page-type="watch"]) .comment-section,
      body:not([data-page-type="watch"]) [section-identifier="comment-item-section"],
      body:not([data-page-type="watch"]) .comments-header,
      body:not([data-page-type="watch"]) .comment-entries,
      body:not([data-page-type="watch"]) ytm-comments-section-renderer,
      body:not([data-page-type="watch"]) ytm-comment-thread-renderer,
      body:not([data-page-type="watch"]) .comments-section,
      body:not([data-page-type="watch"]) ytm-comments-entry-point-teaser-renderer,
      body:not([data-page-type="watch"]) ytm-comments-entry-point-header-renderer {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* ALWAYS show comments on watch pages regardless of setting */
      body[data-page-type="watch"] #comments,
      body[data-page-type="watch"] ytd-comments,
      body[data-page-type="watch"] ytm-comment-section-renderer,
      body[data-page-type="watch"] ytm-comments-entry-point-header-renderer,
      body[data-page-type="watch"] ytm-engagement-panel-section-list-renderer,
      body[data-page-type="watch"] .comment-section,
      body[data-page-type="watch"] [section-identifier="comment-item-section"],
      body[data-page-type="watch"] .comments-header,
      body[data-page-type="watch"] .comment-entries,
      body[data-page-type="watch"] ytm-comments-section-renderer,
      body[data-page-type="watch"] ytm-comment-thread-renderer,
      body[data-page-type="watch"] .comments-section,
      body[data-page-type="watch"] ytm-comments-entry-point-teaser-renderer,
      body[data-page-type="watch"] ytm-comments-entry-point-header-renderer {
        display: block !important;
        visibility: visible !important;
      }
    `;
  }

  // Hide related videos and end screens - Enhanced BUT ALWAYS SHOW VIDEO PLAYER AND DESCRIPTION
  if (!settings.showRelatedVideos) {
    css += `
      /* Hide related videos but ALWAYS show video player and description */
      
      /* Desktop secondary column - hide related videos */
      body:not([data-page-type="watch"]) #secondary,
      body:not([data-page-type="watch"]) #related,
      body:not([data-page-type="watch"]) ytd-watch-next-secondary-results-renderer,
      
      /* Mobile watch page - Hide ONLY the related videos sections, NOT the player or description */
      body[data-page-type="watch"] ytm-watch ytm-item-section-renderer:not(.video-primary-info):not(.video-secondary-info),
      body[data-page-type="watch"] ytm-watch .item-section-renderer:not(.video-primary-info):not(.video-secondary-info),
      body[data-page-type="watch"] ytm-watch-next-secondary-results-renderer,
      body[data-page-type="watch"] .watch-next-feed,
      
      /* Hide related videos container but keep video player area */
      body[data-page-type="watch"] ytm-watch .single-column-watch-next-modern-panels:not([class*="player"]),
      body[data-page-type="watch"] ytm-watch .watch-below-the-player ytm-item-section-renderer:not(.video-primary-info):not(.video-secondary-info),
      
      /* Hide lazy lists that contain related videos */
      body[data-page-type="watch"] ytm-watch lazy-list:not([class*="player"]):not([class*="primary"]),
      body[data-page-type="watch"] ytm-watch .lazy-list:not([class*="player"]):not([class*="primary"]),
      
      /* Hide all compact video renderers on watch page (related videos) */
      body[data-page-type="watch"] ytm-watch ytm-compact-video-renderer,
      body[data-page-type="watch"] ytm-watch ytm-video-with-context-renderer,
      
      /* Hide autoplay toggle and up next */
      body[data-page-type="watch"] ytm-watch .watch-next-continuation,
      body[data-page-type="watch"] ytm-watch .autoplay-toggle,
      
      /* End screen elements */
      .ytp-endscreen-content,
      .ytp-ce-element,
      .ytp-ce-covering-overlay,
      .ytp-ce-element-shadow,
      .ytp-ce-covering-image,
      .ytp-ce-expanding-image,
      .ytp-ce-video,
      .ytp-ce-playlist,
      .ytp-ce-channel,
      
      /* Autoplay and suggested videos */
      .ytp-autonav-endscreen,
      .ytp-autonav-endscreen-upnext-container,
      .ytp-suggestion-set,
      .ytp-videowall-still,
      ytd-compact-autoplay-renderer,
      ytm-compact-autoplay-renderer,
      
      /* More videos text headers (but not video info headers) */
      body[data-page-type="watch"] ytm-watch .section-title-text:not(.video-title):not(.video-primary-info *):not(.video-secondary-info *),
      body[data-page-type="watch"] ytm-watch .item-section-header:not(.video-primary-info *):not(.video-secondary-info *) {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* ALWAYS ensure video player and description remain visible */
      body[data-page-type="watch"] ytm-watch #player,
      body[data-page-type="watch"] ytm-watch .player-container,
      body[data-page-type="watch"] ytm-watch ytm-player,
      body[data-page-type="watch"] ytm-watch .video-stream,
      body[data-page-type="watch"] ytm-watch .html5-video-player,
      body[data-page-type="watch"] ytm-watch ytm-slim-video-metadata-section-renderer,
      body[data-page-type="watch"] ytm-watch ytm-video-metadata-section-renderer,
      body[data-page-type="watch"] ytm-watch .video-primary-info,
      body[data-page-type="watch"] ytm-watch .video-secondary-info,
      body[data-page-type="watch"] ytm-watch .ytm-video-description,
      body[data-page-type="watch"] ytm-watch .video-title,
      body[data-page-type="watch"] ytm-watch .video-info,
      body[data-page-type="watch"] ytm-watch .channel-info,
      body[data-page-type="watch"] ytm-watch .subscribe-button,
      body[data-page-type="watch"] ytm-watch .like-button-renderer,
      body[data-page-type="watch"] ytm-watch .menu-renderer {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Expand video player when related videos are hidden */
      body[data-page-type="watch"] #player-container-outer {
        max-width: 100% !important;
      }
    `;
  }

  // Hide Shorts - New feature for bottom bar and throughout the app
  if (!settings.showShorts) {
    css += `
      /* Hide Shorts tab in bottom navigation */
      ytm-pivot-bar-renderer a[href*="/shorts"],
      ytm-pivot-bar-renderer [tab-identifier="FEshorts"],
      ytm-pivot-bar-item-renderer[tab-identifier="FEshorts"],
      .pivot-shorts,
      
      /* Hide Shorts content everywhere EXCEPT when it's the main video being watched */
      body:not([data-page-type="watch"]) ytm-reel-shelf-renderer,
      body:not([data-page-type="watch"]) ytm-reel-item-renderer,
      body:not([data-page-type="watch"]) ytm-shorts-lockup-view-model,
      body:not([data-page-type="watch"]) .reel-shelf-items,
      body:not([data-page-type="watch"]) .shorts-container,
      
      /* Hide Shorts on home page */
      ytm-browse ytm-reel-shelf-renderer,
      ytm-browse .reel-shelf,
      
      /* Hide Shorts in search results */
      ytm-search ytm-reel-item-renderer,
      ytm-search .reel-item,
      
      /* Hide entire Shorts page UNLESS it's redirected to watch */
      body:not([data-page-type="watch"]) ytm-reel-app-renderer,
      body:not([data-page-type="watch"]) ytm-shorts-player-renderer,
      
      /* Hide Shorts player controls when not main video */
      body:not([data-page-type="watch"]) .reel-player-overlay-actions,
      body:not([data-page-type="watch"]) .reel-player-header,
      
      /* Hide Shorts creation tools */
      .shorts-creation-guidance,
      ytm-shorts-creation-entry-point-renderer {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* ENSURE Shorts redirected to watch pages show properly */
      body[data-page-type="watch"] ytm-watch #player,
      body[data-page-type="watch"] ytm-watch .player-container,
      body[data-page-type="watch"] ytm-watch ytm-player {
        display: block !important;
        visibility: visible !important;
      }
    `;
  }

  // ALWAYS ENSURE CORE VIDEO WATCHING EXPERIENCE IS PRESERVED
  css += `
    /* CRITICAL: Always show video player and core video information on watch pages */
    body[data-page-type="watch"] ytm-watch #player,
    body[data-page-type="watch"] ytm-watch .player-container,
    body[data-page-type="watch"] ytm-watch ytm-player,
    body[data-page-type="watch"] ytm-watch .video-stream,
    body[data-page-type="watch"] ytm-watch .html5-video-player,
    body[data-page-type="watch"] ytm-watch video,
    body[data-page-type="watch"] ytm-watch .video-primary-info,
    body[data-page-type="watch"] ytm-watch .video-secondary-info,
    body[data-page-type="watch"] ytm-watch ytm-slim-video-metadata-section-renderer,
    body[data-page-type="watch"] ytm-watch ytm-video-metadata-section-renderer,
    body[data-page-type="watch"] ytm-watch .ytm-video-description,
    body[data-page-type="watch"] ytm-watch .video-title,
    body[data-page-type="watch"] ytm-watch .video-info,
    body[data-page-type="watch"] ytm-watch .channel-info,
    body[data-page-type="watch"] ytm-watch .owner-container,
    body[data-page-type="watch"] ytm-watch .subscribe-button,
    body[data-page-type="watch"] ytm-watch .like-button-renderer,
    body[data-page-type="watch"] ytm-watch .dislike-button-renderer,
    body[data-page-type="watch"] ytm-watch .menu-renderer,
    body[data-page-type="watch"] ytm-watch .video-actions,
    body[data-page-type="watch"] ytm-watch .engagement-buttons,
    body[data-page-type="watch"] ytm-watch .player-controls,
    body[data-page-type="watch"] ytm-watch .ytp-chrome-bottom,
    body[data-page-type="watch"] ytm-watch .ytp-chrome-controls {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      z-index: auto !important;
    }
    
    /* Ensure video container takes proper space */
    body[data-page-type="watch"] ytm-watch .watch-video,
    body[data-page-type="watch"] ytm-watch .watch-main-col {
      display: block !important;
      visibility: visible !important;
      max-width: 100% !important;
    }
    
    /* Make sure watch page content is visible */
    body[data-page-type="watch"] ytm-watch {
      display: block !important;
      visibility: visible !important;
    }
    
    /* Override any hiding of the main watch content */
    body[data-page-type="watch"] ytm-watch > *:first-child,
    body[data-page-type="watch"] ytm-watch .watch-above-the-fold,
    body[data-page-type="watch"] ytm-watch .watch-below-the-fold {
      display: block !important;
      visibility: visible !important;
    }
  `;

  // Add custom CSS if provided
  if (settings.customCSS && settings.customCSS.trim()) {
    css += `\n/* Custom User CSS */\n${settings.customCSS}\n`;
  }

  return css;
};

export const createInjectionScript = (settings: AppSettings, isAuthenticated: boolean = false): string => {
  const cssContent = generateYouTubeCSS(settings)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
  
  return `
    (function() {
      try {
        console.log('[YT Controller] Starting injection with settings:', JSON.stringify({
          showRecommendations: ${settings.showRecommendations},
          showShorts: ${settings.showShorts || true},
          showComments: ${settings.showComments},
          showRelatedVideos: ${settings.showRelatedVideos},
          authenticated: ${isAuthenticated}
        }));
        
        // IMMEDIATE page type detection before any other processing
        function detectPageType() {
          const currentUrl = window.location.href;
          const pathname = window.location.pathname;
          
          let pageType = 'home'; // default
          
          if (currentUrl.includes('/feed/subscriptions') || pathname === '/feed/subscriptions') {
            pageType = 'subscriptions';
          } else if (currentUrl.includes('/watch') || pathname.startsWith('/watch')) {
            pageType = 'watch';
          } else if (pathname === '/' || pathname === '' || currentUrl.includes('youtube.com/') && !currentUrl.includes('/watch') && !currentUrl.includes('/feed/')) {
            pageType = 'home';
          }
          
          return pageType;
        }
        
        // Set page type IMMEDIATELY
        const initialPageType = detectPageType();
        document.body.setAttribute('data-page-type', initialPageType);
        document.body.setAttribute('data-signed-in', '${isAuthenticated}');
        
        console.log('[YT Controller] Initial page type detected:', initialPageType);
        
        // Remove any existing controller styles
        const existingStyles = document.querySelectorAll('style[data-youtube-controller]');
        existingStyles.forEach(style => {
          style.remove();
          console.log('[YT Controller] Removed existing style');
        });
        
        // Create and inject CSS IMMEDIATELY
        const style = document.createElement('style');
        style.setAttribute('data-youtube-controller', 'true');
        style.setAttribute('type', 'text/css');
        style.innerHTML = \`${cssContent}\`;
        
        // Inject into the document head immediately
        const head = document.head || document.getElementsByTagName('head')[0];
        if (head) {
          head.appendChild(style);
          console.log('[YT Controller] CSS injected immediately');
        }
        
        // Function to update page attributes for YouTube elements
        function updateYouTubePageAttributes() {
          const browseEl = document.querySelector('ytm-browse');
          if (browseEl) {
            const currentPageType = document.body.getAttribute('data-page-type');
            if (currentPageType === 'subscriptions') {
              browseEl.setAttribute('page-subtype', 'subscriptions');
            } else if (currentPageType === 'watch') {
              browseEl.setAttribute('page-subtype', 'watch');
            } else {
              browseEl.setAttribute('page-subtype', 'home');
            }
            console.log('[YT Controller] Updated browse element page-subtype:', browseEl.getAttribute('page-subtype'));
          }
        }
        
        // Update attributes immediately and periodically until page loads
        updateYouTubePageAttributes();
        
        // Keep updating attributes until the page is fully loaded
        const attributeUpdateInterval = setInterval(() => {
          updateYouTubePageAttributes();
          
          // Stop after page seems loaded
          if (document.querySelector('ytm-browse[page-subtype]')) {
            clearInterval(attributeUpdateInterval);
            console.log('[YT Controller] Page attributes finalized');
          }
        }, 100);
        
        // Clear interval after maximum time
        setTimeout(() => {
          clearInterval(attributeUpdateInterval);
        }, 5000);
        
        // Handle Shorts blocking with URL redirection
        if (${!settings.showShorts}) {
          handleShortsBlocking();
        }
        
        // Add subscription button if authenticated
        if (${isAuthenticated}) {
          setTimeout(() => {
            addSubscriptionButton();
          }, 1500);
        }
        
        // Monitor for navigation changes
        setupNavigationObserver();
        
        // Send success message
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'injection-success',
            timestamp: new Date().toISOString(),
            location: window.location.href,
            authenticated: ${isAuthenticated},
            pageType: initialPageType,
            settings: {
              showRecommendations: ${settings.showRecommendations},
              showComments: ${settings.showComments},
              showRelatedVideos: ${settings.showRelatedVideos},
              showShorts: ${settings.showShorts || true}
            }
          }));
        }
        
        function handleShortsBlocking() {
          // Redirect Shorts URLs to regular video URLs
          if (window.location.href.includes('/shorts/')) {
            const videoId = window.location.pathname.split('/shorts/')[1];
            if (videoId) {
              const newUrl = \`https://m.youtube.com/watch?v=\${videoId}\`;
              console.log('[YT Controller] Redirecting Shorts to regular video:', newUrl);
              window.location.replace(newUrl);
              return;
            }
          }
          
          // Block Shorts navigation
          document.addEventListener('click', function(e) {
            const target = e.target;
            let link = target.closest('a');
            
            if (link && link.href && link.href.includes('/shorts/')) {
              e.preventDefault();
              e.stopPropagation();
              
              const videoId = link.href.split('/shorts/')[1];
              if (videoId) {
                const newUrl = \`https://m.youtube.com/watch?v=\${videoId.split('?')[0]}\`;
                window.location.href = newUrl;
              }
              return false;
            }
          }, true);
        }
        
        function setupNavigationObserver() {
          let currentUrl = window.location.href;
          
          const urlObserver = new MutationObserver(function() {
            if (window.location.href !== currentUrl) {
              const oldUrl = currentUrl;
              currentUrl = window.location.href;
              console.log('[YT Controller] Navigation detected from', oldUrl, 'to', currentUrl);
              
              // Update page type immediately
              const newPageType = detectPageType();
              document.body.setAttribute('data-page-type', newPageType);
              document.body.setAttribute('data-signed-in', '${isAuthenticated}');
              
              // Update YouTube element attributes
              setTimeout(updateYouTubePageAttributes, 100);
              
              // Re-apply Shorts blocking if needed
              if (${!settings.showShorts} && currentUrl.includes('/shorts/')) {
                setTimeout(handleShortsBlocking, 100);
              }
              
              console.log('[YT Controller] Page type updated to:', newPageType);
            }
          });
          
          urlObserver.observe(document, { subtree: true, childList: true });
          
          // Also listen for popstate events
          window.addEventListener('popstate', function() {
            setTimeout(() => {
              const newPageType = detectPageType();
              document.body.setAttribute('data-page-type', newPageType);
              updateYouTubePageAttributes();
              console.log('[YT Controller] Popstate - page type updated to:', newPageType);
            }, 100);
          });
        }
        
        function addSubscriptionButton() {
          // Remove existing button
          const existingButton = document.getElementById('yt-controller-sub-button');
          if (existingButton) {
            existingButton.remove();
          }

          // Don't show on Shorts pages (they get redirected anyway)
          if (window.location.href.includes('/shorts/')) {
            return;
          }

          // Create subscription button
          const button = document.createElement('div');
          button.id = 'yt-controller-sub-button';
          button.style.cssText = \`
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #FF0000, #CC0000);
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            user-select: none;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255,255,255,0.1);
            transition: all 0.3s ease;
          \`;
          
          button.innerHTML = '<span style="font-size: 16px;">📺</span><span>My Subscriptions</span>';

          // Add click handler
          button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Add click animation
            this.style.transform = 'translateX(-50%) scale(0.95)';
            setTimeout(() => {
              this.style.transform = 'translateX(-50%) scale(1)';
            }, 100);
            
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'show-subscriptions',
                source: 'subscription-button'
              }));
            }
          });

          // Add hover effects
          button.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(135deg, #CC0000, #AA0000)';
            this.style.transform = 'translateX(-50%) scale(1.05)';
            this.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
          });
          
          button.addEventListener('mouseleave', function() {
            this.style.background = 'linear-gradient(135deg, #FF0000, #CC0000)';
            this.style.transform = 'translateX(-50%) scale(1)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
          });

          // Add to page
          document.body.appendChild(button);
          
          console.log('[YT Controller] Subscription button added');
        }
        
      } catch (error) {
        console.error('[YT Controller] Injection error:', error);
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            error: error.toString(),
            stack: error.stack
          }));
        }
      }
    })();
    true;
  `;
};

// Simple version for backwards compatibility
export const createCustomInjection = createInjectionScript;