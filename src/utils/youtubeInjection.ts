import { AppSettings } from '../hooks/useSettings';

export const generateYouTubeCSS = (settings: AppSettings, isProduction: boolean = false): string => {
  let css = '';

  // CRITICAL: Always ensure subscriptions tab is visible
  css += `
    /* ALWAYS show subscriptions tab regardless of other settings */
    ytm-pivot-bar-renderer a[href*="/feed/subscriptions"],
    ytm-pivot-bar-renderer [tab-identifier="FEsubscriptions"],
    ytm-pivot-bar-item-renderer[tab-identifier="FEsubscriptions"],
    ytm-pivot-bar-renderer [aria-label*="Subscriptions" i],
    ytm-pivot-bar-renderer [title*="Subscriptions" i] {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      width: auto !important;
      height: auto !important;
      overflow: visible !important;
      left: auto !important;
    }
    
    /* Ensure pivot bar itself is visible */
    ytm-pivot-bar-renderer {
      display: flex !important;
      visibility: visible !important;
    }
    
    /* Force show all non-Shorts tabs */
    ytm-pivot-bar-renderer ytm-pivot-bar-item-renderer:not([tab-identifier="FEshorts"]) {
      display: flex !important;
      visibility: visible !important;
      flex: 1 !important;
    }
  `;

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
        content: "🎯 Home recommendations hidden\\A\\AUse the 📺 Subscriptions tab below or search to find videos";
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
        white-space: pre-line;
      }
      
      /* Different message for authenticated users */
      body[data-signed-in="true"]:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse[role="main"]::after,
      body[data-signed-in="true"] ytm-browse[page-subtype="home"][role="main"]::after {
        content: "🎯 Home feed hidden\\A\\ATap the 📺 Subscriptions tab below to see your subscriptions\\Aor use search to find videos";
      }
      
      /* Make browse container relative for message positioning */
      body:not([data-page-type="subscriptions"]):not([data-page-type="watch"]) ytm-browse[role="main"],
      ytm-browse[page-subtype="home"][role="main"] {
        position: relative !important;
        min-height: 300px !important;
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

  // Hide comments - FIXED: Respect setting on ALL pages including watch pages
  if (!settings.showComments) {
    css += `
      /* Hide comments on ALL pages when setting is disabled */
      #comments,
      ytd-comments,
      ytm-comment-section-renderer,
      ytm-comments-entry-point-header-renderer,
      ytm-engagement-panel-section-list-renderer,
      .comment-section,
      [section-identifier="comment-item-section"],
      .comments-header,
      .comment-entries,
      ytm-comments-section-renderer,
      ytm-comment-thread-renderer,
      .comments-section,
      ytm-comments-entry-point-teaser-renderer,
      ytm-comments-entry-point-header-renderer,
      
      /* Mobile YouTube comment sections */
      ytm-watch ytm-comment-section-renderer,
      ytm-watch ytm-comments-entry-point-header-renderer,
      ytm-watch ytm-comments-entry-point-teaser-renderer,
      ytm-watch .comment-section,
      ytm-watch .comments-section,
      
      /* Desktop YouTube comment sections */
      ytd-watch-flexy #comments,
      ytd-watch-flexy ytd-comments,
      ytd-comments-entry-point-header-renderer,
      ytd-comment-thread-renderer,
      
      /* Comments continuation and loading */
      ytm-comments-continuation-renderer,
      .comments-continuation {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
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
      
      /* Expand video player when related videos are hidden */
      body[data-page-type="watch"] #player-container-outer {
        max-width: 100% !important;
      }
    `;
  }

  // Hide Shorts - Enhanced but NEVER hide subscriptions tab
  if (!settings.showShorts) {
    css += `
      /* AGGRESSIVE Shorts hiding - Remove ALL Shorts elements but PRESERVE subscriptions tab */
      
      /* Hide Shorts tab in bottom navigation - VERY SPECIFIC targeting */
      ytm-pivot-bar-renderer a[href*="/shorts"]:not([href*="/feed/subscriptions"]),
      ytm-pivot-bar-renderer [tab-identifier="FEshorts"],
      ytm-pivot-bar-item-renderer[tab-identifier="FEshorts"],
      ytm-pivot-bar-renderer .pivot-shorts:not([href*="/feed/subscriptions"]),
      .pivot-shorts:not([href*="/feed/subscriptions"]),
      [aria-label*="Shorts" i]:not([href*="/feed/subscriptions"]):not([aria-label*="Subscriptions" i]),
      [title*="Shorts" i]:not([href*="/feed/subscriptions"]):not([title*="Subscriptions" i]),
      
      /* Hide Shorts content everywhere */
      ytm-reel-shelf-renderer,
      ytm-reel-item-renderer,
      ytm-shorts-lockup-view-model,
      .reel-shelf-items,
      .shorts-container,
      .reel-shelf,
      .reel-item,
      
      /* Hide Shorts on home page and browse pages */
      ytm-browse ytm-reel-shelf-renderer,
      ytm-browse .reel-shelf,
      ytm-browse [data-content-type*="reel"],
      ytm-browse [data-content-type*="shorts"],
      
      /* Hide Shorts in search results */
      ytm-search ytm-reel-item-renderer,
      ytm-search .reel-item,
      ytm-search [data-content-type*="reel"],
      
      /* Hide Shorts in recommendations when recommendations are enabled */
      ytm-rich-item-renderer:has(a[href*="/shorts"]),
      ytm-video-with-context-renderer:has(a[href*="/shorts"]),
      .rich-item-renderer:has(a[href*="/shorts"]),
      
      /* Hide any element containing shorts URL but NOT subscriptions */
      a[href*="/shorts"]:not([href*="/feed/subscriptions"]),
      [href*="/shorts"]:not([href*="/feed/subscriptions"]),
      
      /* Hide Shorts player and app */
      ytm-reel-app-renderer,
      ytm-shorts-player-renderer,
      .reel-player-overlay-actions,
      .reel-player-header,
      
      /* Hide Shorts creation tools */
      .shorts-creation-guidance,
      ytm-shorts-creation-entry-point-renderer,
      
      /* Hide Shorts-related buttons and icons but preserve subscriptions */
      [aria-label*="Shorts" i]:not([aria-label*="Subscriptions" i]),
      [title*="Shorts" i]:not([title*="Subscriptions" i]),
      .shorts-icon,
      .yt-icon-shorts,
      
      /* Hide pivot bar items that contain "shorts" but not "subscriptions" */
      ytm-pivot-bar-item-renderer:has([href*="/shorts"]):not(:has([href*="/feed/subscriptions"])),
      
      /* Use attribute selectors to catch dynamic content */
      [data-tab-id*="shorts" i]:not([data-tab-id*="subscriptions" i]),
      [data-page-type*="shorts" i],
      [class*="shorts" i]:not(.video-title):not(.description):not([class*="subscriptions" i]),
      [id*="shorts" i]:not(.video-title):not(.description):not([id*="subscriptions" i]),
      
      /* Hide Shorts thumbnails and previews */
      .shorts-thumbnail,
      .reel-video-thumbnail,
      [data-video-type="shorts"],
      
      /* Force hide Shorts tab with maximum specificity but NEVER hide subscriptions */
      body ytm-pivot-bar-renderer a[href*="/shorts"]:not([href*="/feed/subscriptions"]),
      body ytm-pivot-bar-renderer [tab-identifier="FEshorts"],
      body ytm-pivot-bar-item-renderer[tab-identifier="FEshorts"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
        overflow: hidden !important;
        position: absolute !important;
        left: -9999px !important;
      }
      
      /* BUT ALWAYS ensure subscriptions tab stays visible with higher specificity */
      body ytm-pivot-bar-renderer a[href*="/feed/subscriptions"],
      body ytm-pivot-bar-renderer [tab-identifier="FEsubscriptions"],
      body ytm-pivot-bar-item-renderer[tab-identifier="FEsubscriptions"],
      body ytm-pivot-bar-renderer [aria-label*="Subscriptions" i],
      body ytm-pivot-bar-renderer [title*="Subscriptions" i] {
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        height: auto !important;
        width: auto !important;
        overflow: visible !important;
        position: relative !important;
        left: auto !important;
        flex: 1 !important;
      }
      
      /* Show message when Shorts are blocked */
      body[data-page-type="shorts"] ytm-browse::before {
        content: "🚫 YouTube Shorts blocked by YouTube Controller\\A\\AThis content has been redirected to regular video format";
        display: block !important;
        text-align: center;
        padding: 40px 20px;
        color: #d32f2f;
        font-size: 16px;
        white-space: pre-line;
        background: #ffebee;
        border-radius: 12px;
        margin: 20px;
        border-left: 4px solid #d32f2f;
      }
    `;
  }

  // CRITICAL: Always ensure core navigation and subscriptions work
  css += `
    /* CRITICAL: Always show core navigation elements */
    ytm-mobile-topbar-renderer,
    ytm-pivot-bar-renderer,
    ytm-searchbox,
    .mobile-topbar-renderer,
    .pivot-bar-container {
      display: flex !important;
      visibility: visible !important;
    }
    
    /* CRITICAL: Always show subscriptions tab with highest priority */
    ytm-pivot-bar-renderer a[href*="/feed/subscriptions"],
    ytm-pivot-bar-renderer [tab-identifier="FEsubscriptions"],
    ytm-pivot-bar-item-renderer[tab-identifier="FEsubscriptions"],
    ytm-pivot-bar-renderer [aria-label*="Subscriptions" i],
    ytm-pivot-bar-renderer [title*="Subscriptions" i] {
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      height: auto !important;
      width: auto !important;
      overflow: visible !important;
      left: auto !important;
      right: auto !important;
      top: auto !important;
      bottom: auto !important;
      flex: 1 !important;
      z-index: 1000 !important;
    }
    
    /* Ensure pivot bar flows properly */
    ytm-pivot-bar-renderer {
      display: flex !important;
      justify-content: space-around !important;
    }
    
    /* Make remaining tabs (after hiding Shorts) distribute evenly */
    ytm-pivot-bar-renderer ytm-pivot-bar-item-renderer:not([tab-identifier="FEshorts"]) {
      flex: 1 !important;
      display: flex !important;
      visibility: visible !important;
    }
    
    /* ALWAYS ensure video player and description remain visible */
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
    
    /* ALWAYS keep search results visible */
    ytm-search-results-container,
    ytm-search ytm-compact-video-renderer,
    ytm-search .compact-media-item,
    ytm-section-list-renderer[data-content-type="search"],
    ytm-search .search-results {
      display: block !important;
      visibility: visible !important;
    }
  `;

  // Add debug indicator ONLY in development
  if (!isProduction) {
    css += `
      /* Debug indicator that shows the injection is working - DEVELOPMENT ONLY */
      body::after {
        content: "YTC Active";
        position: fixed;
        top: 5px;
        right: 5px;
        background: rgba(76, 175, 80, 0.8);
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        z-index: 999999;
        pointer-events: none;
      }
    `;
  }

  // Add custom CSS if provided
  if (settings.customCSS && settings.customCSS.trim()) {
    css += `\n/* Custom User CSS */\n${settings.customCSS}\n`;
  }

  return css;
};

export const createInjectionScript = (settings: AppSettings, isAuthenticated: boolean = false): string => {
  // Detect if this is a production build
  const isProduction = !__DEV__;
  
  const cssContent = generateYouTubeCSS(settings, isProduction)
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
  
  return `
    (function() {
      try {
        const isProduction = ${isProduction};
        const logPrefix = isProduction ? '[YT Controller]' : '[YT Controller - DEV]';
        
        if (!isProduction) {
          console.log(logPrefix + ' Starting injection with settings:', JSON.stringify({
            showRecommendations: ${settings.showRecommendations},
            showShorts: ${settings.showShorts || true},
            showComments: ${settings.showComments},
            showRelatedVideos: ${settings.showRelatedVideos},
            authenticated: ${isAuthenticated}
          }));
        }
        
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
        
        if (!isProduction) {
          console.log(logPrefix + ' Initial page type detected:', initialPageType);
          console.log(logPrefix + ' Subscriptions tab will be ALWAYS VISIBLE');
        }
        
        // Remove any existing controller styles
        const existingStyles = document.querySelectorAll('style[data-youtube-controller]');
        existingStyles.forEach(style => {
          style.remove();
          if (!isProduction) {
            console.log(logPrefix + ' Removed existing style');
          }
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
          if (!isProduction) {
            console.log(logPrefix + ' CSS injected immediately');
            console.log(logPrefix + ' Subscriptions tab should now be visible');
          }
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
            if (!isProduction) {
              console.log(logPrefix + ' Updated browse element page-subtype:', browseEl.getAttribute('page-subtype'));
            }
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
            if (!isProduction) {
              console.log(logPrefix + ' Page attributes finalized');
            }
          }
        }, 100);
        
        // Clear interval after maximum time
        setTimeout(() => {
          clearInterval(attributeUpdateInterval);
        }, 5000);
        
        // Additional check specifically for subscriptions tab visibility
        function ensureSubscriptionsTabVisible() {
          const subscriptionsTab = document.querySelector('ytm-pivot-bar-renderer [tab-identifier="FEsubscriptions"], ytm-pivot-bar-renderer a[href*="/feed/subscriptions"]');
          if (subscriptionsTab) {
            subscriptionsTab.style.display = 'flex';
            subscriptionsTab.style.visibility = 'visible';
            subscriptionsTab.style.opacity = '1';
            if (!isProduction) {
              console.log(logPrefix + ' ✅ Subscriptions tab found and made visible');
            }
          } else {
            if (!isProduction) {
              console.log(logPrefix + ' ⚠️ Subscriptions tab not found, will retry...');
            }
          }
        }
        
        // Ensure subscriptions tab is visible
        setTimeout(ensureSubscriptionsTabVisible, 500);
        setTimeout(ensureSubscriptionsTabVisible, 1000);
        setTimeout(ensureSubscriptionsTabVisible, 2000);
        
        // Handle Shorts blocking with URL redirection
        if (${!settings.showShorts}) {
          handleShortsBlocking();
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
            subscriptionsTabVisible: true,
            production: isProduction,
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
              if (!isProduction) {
                console.log(logPrefix + ' Redirecting Shorts to regular video:', newUrl);
              }
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
              if (!isProduction) {
                console.log(logPrefix + ' Navigation detected from', oldUrl, 'to', currentUrl);
              }
              
              // Update page type immediately
              const newPageType = detectPageType();
              document.body.setAttribute('data-page-type', newPageType);
              document.body.setAttribute('data-signed-in', '${isAuthenticated}');
              
              // Update YouTube element attributes
              setTimeout(updateYouTubePageAttributes, 100);
              
              // Ensure subscriptions tab stays visible after navigation
              setTimeout(ensureSubscriptionsTabVisible, 300);
              
              // Re-apply Shorts blocking if needed
              if (${!settings.showShorts} && currentUrl.includes('/shorts/')) {
                setTimeout(handleShortsBlocking, 100);
              }
              
              if (!isProduction) {
                console.log(logPrefix + ' Page type updated to:', newPageType);
              }
            }
          });
          
          urlObserver.observe(document, { subtree: true, childList: true });
          
          // Also listen for popstate events
          window.addEventListener('popstate', function() {
            setTimeout(() => {
              const newPageType = detectPageType();
              document.body.setAttribute('data-page-type', newPageType);
              updateYouTubePageAttributes();
              ensureSubscriptionsTabVisible();
              if (!isProduction) {
                console.log(logPrefix + ' Popstate - page type updated to:', newPageType);
              }
            }, 100);
          });
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