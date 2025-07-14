import { AppSettings } from '../hooks/useSettings';

export const generateYouTubeCSS = (settings: AppSettings, isProduction: boolean = false): string => {
  let css = '';

  // CRITICAL: Always ensure subscriptions tab is visible
  css += `
    /* ALWAYS show subscriptions tab and channels tab regardless of other settings */
    ytm-pivot-bar-renderer a[href*="/feed/subscriptions"],
    ytm-pivot-bar-renderer a[href*="/feed/channels"],
    ytm-pivot-bar-renderer [tab-identifier="FEsubscriptions"],
    ytm-pivot-bar-renderer [tab-identifier="FEchannels"],
    ytm-pivot-bar-item-renderer[tab-identifier="FEsubscriptions"],
    ytm-pivot-bar-item-renderer[tab-identifier="FEchannels"],
    ytm-pivot-bar-renderer [aria-label*="Subscriptions" i],
    ytm-pivot-bar-renderer [title*="Subscriptions" i],
    ytm-pivot-bar-renderer [aria-label*="Channels" i],
    ytm-pivot-bar-renderer [title*="Channels" i] {
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

  // Hide recommendations on home page - BUT allow temporary bypass and NEVER affect subscriptions
  if (!settings.showRecommendations) {
    css += `
      /* ONLY hide recommendations when NOT temporarily bypassed AND NOT on subscriptions page */
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse .rich-grid-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse .rich-grid-media,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse .media-item,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse .video-list-item,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse .compact-media-item,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse .large-media-item,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse .tab-content,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse .browse-items-primary,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse ytm-rich-item-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse ytm-video-with-context-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse ytm-playlist-video-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse ytm-section-list-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse ytm-item-section-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse .section-list,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="unknown"]:not([data-page-type="subscriptions"]):not([data-page-type="watch"]):not([data-page-type="channel"]) ytm-browse .rich-grid-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="unknown"]:not([data-page-type="subscriptions"]):not([data-page-type="watch"]):not([data-page-type="channel"]) ytm-browse ytm-rich-item-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="unknown"]:not([data-page-type="subscriptions"]):not([data-page-type="watch"]):not([data-page-type="channel"]) ytm-browse ytm-video-with-context-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] .rich-grid-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] .rich-grid-media,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] .media-item,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] .video-list-item,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] .compact-media-item,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] .large-media-item,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] .tab-content,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] .browse-items-primary,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] ytm-rich-item-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] ytm-video-with-context-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] ytm-playlist-video-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] ytm-section-list-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] ytm-item-section-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) ytm-browse[page-subtype="home"] .section-list,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse ytm-feed-filter-chip-bar-renderer,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse .feed-filter-chip-bar-container,
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"]) [data-page-type="home"] ytm-browse ytm-chip-cloud-renderer {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* Show empty message only when recommendations are hidden AND NOT on subscriptions page */
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"])[data-page-type="home"] ytm-browse[role="main"]::after {
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
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"])[data-signed-in="true"][data-page-type="home"] ytm-browse[role="main"]::after {
        content: "🎯 Home feed hidden\\A\\ATap the 📺 Subscriptions tab below to see your subscriptions\\Aor use search to find videos";
      }
      
      /* Make browse container relative for message positioning only when needed */
      body:not([data-temp-recommendations-enabled]):not([data-page-type="subscriptions"])[data-page-type="home"] ytm-browse[role="main"] {
        position: relative !important;
        min-height: 300px !important;
      }
    `;
  }
  
  // ALWAYS ensure subscriptions and channel pages are fully visible - SIMPLE APPROACH
  css += `
    /* CRITICAL: ALWAYS show content on subscriptions and channel pages */
    body[data-page-type="subscriptions"] ytm-browse .rich-grid-renderer,
    body[data-page-type="subscriptions"] ytm-browse .rich-grid-media,
    body[data-page-type="subscriptions"] ytm-browse .media-item,
    body[data-page-type="subscriptions"] ytm-browse .video-list-item,
    body[data-page-type="subscriptions"] ytm-browse .compact-media-item,
    body[data-page-type="subscriptions"] ytm-browse .large-media-item,
    body[data-page-type="subscriptions"] ytm-browse .tab-content,
    body[data-page-type="subscriptions"] ytm-browse .browse-items-primary,
    body[data-page-type="subscriptions"] ytm-browse ytm-section-list-renderer,
    body[data-page-type="subscriptions"] ytm-browse ytm-item-section-renderer,
    body[data-page-type="subscriptions"] ytm-browse ytm-rich-item-renderer,
    body[data-page-type="subscriptions"] ytm-browse ytm-video-with-context-renderer,
    body[data-page-type="subscriptions"] ytm-browse ytm-playlist-video-renderer,
    body[data-page-type="subscriptions"] ytm-browse .section-list,
    body[data-page-type="subscriptions"] ytm-browse ytm-feed-filter-chip-bar-renderer,
    body[data-page-type="subscriptions"] ytm-browse .feed-filter-chip-bar-container,
    body[data-page-type="subscriptions"] ytm-browse ytm-chip-cloud-renderer,
    body[data-page-type="subscriptions"] ytm-browse ytm-browse-feed-actions-renderer,
    body[data-page-type="subscriptions"] ytm-browse .channel-list-item,
    body[data-page-type="subscriptions"] ytm-browse ytm-channel-renderer,
    body[data-page-type="channel"] ytm-browse .rich-grid-renderer,
    body[data-page-type="channel"] ytm-browse .rich-grid-media,
    body[data-page-type="channel"] ytm-browse .media-item,
    body[data-page-type="channel"] ytm-browse ytm-rich-item-renderer,
    body[data-page-type="channel"] ytm-browse ytm-video-with-context-renderer,
    ytm-browse[page-subtype="subscriptions"] .rich-grid-renderer,
    ytm-browse[page-subtype="subscriptions"] .rich-grid-media,
    ytm-browse[page-subtype="subscriptions"] .media-item,
    ytm-browse[page-subtype="subscriptions"] .video-list-item,
    ytm-browse[page-subtype="subscriptions"] .compact-media-item,
    ytm-browse[page-subtype="subscriptions"] .large-media-item,
    ytm-browse[page-subtype="subscriptions"] .tab-content,
    ytm-browse[page-subtype="subscriptions"] .browse-items-primary,
    ytm-browse[page-subtype="subscriptions"] ytm-section-list-renderer,
    ytm-browse[page-subtype="subscriptions"] ytm-item-section-renderer,
    ytm-browse[page-subtype="subscriptions"] ytm-rich-item-renderer,
    ytm-browse[page-subtype="subscriptions"] ytm-video-with-context-renderer,
    ytm-browse[page-subtype="subscriptions"] ytm-playlist-video-renderer,
    ytm-browse[page-subtype="subscriptions"] .section-list,
    ytm-browse[page-subtype="subscriptions"] ytm-feed-filter-chip-bar-renderer,
    ytm-browse[page-subtype="subscriptions"] ytm-feed-filter-chip-bar-container,
    ytm-browse[page-subtype="subscriptions"] ytm-chip-cloud-renderer,
    ytm-browse[page-subtype="subscriptions"] ytm-browse-feed-actions-renderer,
    ytm-browse[page-subtype="subscriptions"] .channel-list-item,
    ytm-browse[page-subtype="subscriptions"] ytm-channel-renderer,
    ytm-browse[page-subtype="channel"] .rich-grid-renderer,
    ytm-browse[page-subtype="channel"] ytm-rich-item-renderer,
    ytm-browse[page-subtype="channel"] ytm-video-with-context-renderer {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      height: auto !important;
      overflow: visible !important;
      position: relative !important;
    }
    
    /* NEVER show empty message on subscriptions or channel pages */
    body[data-page-type="subscriptions"] ytm-browse[role="main"]::after,
    body[data-page-type="channel"] ytm-browse[role="main"]::after,
    ytm-browse[page-subtype="subscriptions"][role="main"]::after,
    ytm-browse[page-subtype="channel"][role="main"]::after {
      display: none !important;
      content: none !important;
    }
    
    /* Reset browse container on subscriptions and channel pages */
    body[data-page-type="subscriptions"] ytm-browse[role="main"],
    body[data-page-type="channel"] ytm-browse[role="main"],
    ytm-browse[page-subtype="subscriptions"][role="main"],
    ytm-browse[page-subtype="channel"][role="main"] {
      position: static !important;
      min-height: auto !important;
    }
  `;

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
      .comments-continuation,
      
      /* Comment-specific elements - target the exact comment components */
      yt-comment-teaser-carousel-item-view-model,
      .ytCommentTeaserCarouselItemViewModelHost,
      comments-entry-point-teaser-view-model,
      .ytCommentsEntryPointTeaserViewModelHost,
      
      /* Comment carousel items with specific aria-label */
      yt-carousel-item-view-model[aria-label="Comments"],
      .ytCarouselItemViewModelHost[aria-label="Comments"],
      
      /* Comment entry point elements */
      .ytCommentsEntryPointTeaserViewModelTeaser,
      .ytCommentsEntryPointTeaserViewModelAvatar {
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
      
      /* Mobile watch page - Hide ONLY the related videos sections, NOT the player or description or comments */
      body[data-page-type="watch"] ytm-watch ytm-item-section-renderer:not(.video-primary-info):not(.video-secondary-info):not(.ytc-comment-container),
      body[data-page-type="watch"] ytm-watch .item-section-renderer:not(.video-primary-info):not(.video-secondary-info):not(.ytc-comment-container),
      body[data-page-type="watch"] ytm-watch-next-secondary-results-renderer,
      body[data-page-type="watch"] .watch-next-feed,
      
      /* Hide related videos container but keep video player area and comment containers */
      body[data-page-type="watch"] ytm-watch .single-column-watch-next-modern-panels:not([class*="player"]):not(.ytc-comment-container),
      body[data-page-type="watch"] ytm-watch .watch-below-the-player ytm-item-section-renderer:not(.video-primary-info):not(.video-secondary-info):not(.ytc-comment-container),
      
      /* Hide lazy lists that contain related videos but not comments */
      body[data-page-type="watch"] ytm-watch lazy-list:not([class*="player"]):not([class*="primary"]):not(.ytc-comment-list),
      body[data-page-type="watch"] ytm-watch .lazy-list:not([class*="player"]):not([class*="primary"]):not(.ytc-comment-list),
      
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
      
      /* Hide Shorts shelf headers - target by structure and icon */
      yt-shelf-header-layout.shelf-header-layout-wiz,
      .shelf-header-layout-wiz,
      yt-shelf-header-layout:has(c3-icon svg path[fill="#f03"]),
      yt-shelf-header-layout:has(.yt-icon-shape svg path[fill="#f03"]),
      
      /* Hide Shorts on home page and browse pages but NEVER on subscriptions */
      body[data-page-type="home"] ytm-browse ytm-reel-shelf-renderer,
      body[data-page-type="home"] ytm-browse .reel-shelf,
      body[data-page-type="home"] ytm-browse [data-content-type*="reel"],
      body[data-page-type="home"] ytm-browse [data-content-type*="shorts"],
      body[data-page-type="unknown"]:not([data-page-type="subscriptions"]) ytm-browse ytm-reel-shelf-renderer,
      body[data-page-type="unknown"]:not([data-page-type="subscriptions"]) ytm-browse .reel-shelf,
      body[data-page-type="unknown"]:not([data-page-type="subscriptions"]) ytm-browse [data-content-type*="reel"],
      body[data-page-type="unknown"]:not([data-page-type="subscriptions"]) ytm-browse [data-content-type*="shorts"],
      
      /* Hide Shorts in search results */
      ytm-search ytm-reel-item-renderer,
      ytm-search .reel-item,
      ytm-search [data-content-type*="reel"],
      
      /* Hide Shorts in recommendations when recommendations are enabled but NEVER on subscriptions */
      body:not([data-page-type="subscriptions"]) ytm-rich-item-renderer:has(a[href*="/shorts"]),
      body:not([data-page-type="subscriptions"]) ytm-video-with-context-renderer:has(a[href*="/shorts"]),
      body:not([data-page-type="subscriptions"]) .rich-item-renderer:has(a[href*="/shorts"]),
      
      /* Hide any element containing shorts URL but NOT subscriptions */
      body:not([data-page-type="subscriptions"]) a[href*="/shorts"]:not([href*="/feed/subscriptions"]),
      body:not([data-page-type="subscriptions"]) [href*="/shorts"]:not([href*="/feed/subscriptions"]),
      
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
      
      /* Hide Shorts thumbnails and previews but not on subscriptions */
      body:not([data-page-type="subscriptions"]) .shorts-thumbnail,
      body:not([data-page-type="subscriptions"]) .reel-video-thumbnail,
      body:not([data-page-type="subscriptions"]) [data-video-type="shorts"],
      
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

  // Hide Shorts shelf headers when recommendations are on but Shorts are off
  if (settings.showRecommendations && !settings.showShorts) {
    css += `
      /* Hide Shorts shelf headers in recommendations when Shorts are disabled but NEVER on subscriptions */
      body:not([data-page-type="subscriptions"]) yt-shelf-header-layout.shelf-header-layout-wiz,
      body:not([data-page-type="subscriptions"]) .shelf-header-layout-wiz,
      body:not([data-page-type="subscriptions"]) yt-shelf-header-layout:has(c3-icon svg path[fill="#f03"]),
      body:not([data-page-type="subscriptions"]) yt-shelf-header-layout:has(.yt-icon-shape svg path[fill="#f03"]),
      
      /* Hide any Shorts-related shelves in recommendations but NEVER on subscriptions */
      body[data-page-type="home"] ytm-browse .shelf-header-layout-wiz,
      body[data-page-type="home"] ytm-browse yt-shelf-header-layout.shelf-header-layout-wiz,
      body[data-page-type="unknown"]:not([data-page-type="subscriptions"]) ytm-browse .shelf-header-layout-wiz,
      body[data-page-type="unknown"]:not([data-page-type="subscriptions"]) ytm-browse yt-shelf-header-layout.shelf-header-layout-wiz {
        display: none !important;
        visibility: hidden !important;
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

// ALWAYS ensure no unwanted overlays or transparent blocks
css += `
  /* Fix for transparent blocks and overlays */
  
  /* Remove any unwanted pseudo-elements that might create transparent blocks */
  body::before {
    display: none !important;
  }
  
  /* Ensure no floating overlays when related videos are shown */
  .ytp-ce-covering-overlay,
  .ytp-ce-element-shadow,
  .ytp-overlay,
  .ytp-cards-teaser,
  .ytp-ce-expanding-overlay {
    position: absolute !important;
    z-index: auto !important;
  }
  
  /* Fix any positioned elements that might create blocks */
  *[style*="position: fixed"]:not(#yt-controller-status):not(.yt-controller-button) {
    z-index: 1 !important;
  }
  
  /* Ensure no transparent overlays from YouTube's own elements */
  .html5-video-player .ytp-chrome-top,
  .html5-video-player .ytp-gradient-top {
    background: transparent !important;
    backdrop-filter: none !important;
  }
  
  /* Remove any controller-related overlays that might persist */
  [id*="yt-controller"]:not(style):not(#yt-controller-status) {
    display: none !important;
  }
  
  /* Fix scroll-related positioning issues */
  body.scrolling *[style*="position: fixed"] {
    transform: none !important;
  }
`;

  // Add custom CSS if provided
  if (settings.customCSS && settings.customCSS.trim()) {
    css += `\n/* Custom User CSS */\n${settings.customCSS}\n`;
  }

  // CONDITIONAL MOBILE HEADER - Only fix transparency when watching videos
  css += `
    /* CONDITIONAL MOBILE HEADER - Only fix transparency when watching videos */
    
    /* ONLY apply transparency fixes on video pages */
    body[data-page-type="watch"] ytm-mobile-topbar-renderer,
    body[data-page-type="watch"] .mobile-topbar-header,
    .watch-active-meta ytm-mobile-topbar-renderer {
      background: #000000 !important;
      background-color: #000000 !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      opacity: 1 !important;
    }
    
    /* Video page header containers */
    body[data-page-type="watch"] ytm-mobile-topbar-renderer .mobile-topbar-header-content,
    body[data-page-type="watch"] ytm-mobile-topbar-renderer .topbar-header-renderer {
      background: #000000 !important;
      background-color: #000000 !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    
    /* Remove glass/blur effects ONLY on video pages */
    body[data-page-type="watch"] ytm-mobile-topbar-renderer {
      box-shadow: none !important;
      filter: none !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
    }
    
    /* Ensure icons remain visible on video pages */
    body[data-page-type="watch"] ytm-mobile-topbar-renderer yt-icon,
    body[data-page-type="watch"] ytm-mobile-topbar-renderer .topbar-logo,
    body[data-page-type="watch"] ytm-mobile-topbar-renderer button {
      opacity: 1 !important;
      visibility: visible !important;
      display: block !important;
      background: none !important;
    }
    
    /* Remove problematic pseudo-elements ONLY on video pages */
    body[data-page-type="watch"] ytm-mobile-topbar-renderer::before,
    body[data-page-type="watch"] ytm-mobile-topbar-renderer::after {
      display: none !important;
      content: none !important;
    }
    
    /* Leave home page header completely untouched - no CSS applied */
    /* This ensures the original transparency behavior works on the home page */
  `;

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
        
        // Simple temporary recommendations bypass tracking
        let tempRecommendationsEnabled = false;
        
        // IMMEDIATE page type detection before any other processing
        function detectPageType() {
          const currentUrl = window.location.href;
          const pathname = window.location.pathname;
          
          let pageType = 'home'; // default
          
          // Check for ALL subscription-related and feed pages
          if (pathname.startsWith('/feed/') || currentUrl.includes('/feed/')) {
            // Any feed page (subscriptions, channels, trending, etc.) should be treated as subscriptions
            pageType = 'subscriptions';
          } else if (currentUrl.includes('/watch') || pathname.startsWith('/watch')) {
            pageType = 'watch';
          } else if (currentUrl.includes('/channel/') || currentUrl.includes('/c/') || currentUrl.includes('/user/') || pathname.startsWith('/@')) {
            pageType = 'channel';
          } else if (currentUrl.includes('/results') || currentUrl.includes('search_query=')) {
            pageType = 'search';
          } else if (pathname === '/' || pathname === '' || currentUrl.includes('youtube.com/') && !currentUrl.includes('/watch')) {
            pageType = 'home';
          }
          
          if (!isProduction) {
            console.log(logPrefix + ' Page detection - URL:', currentUrl, 'Type:', pageType);
          }
          
          return pageType;
        }
        
        // SIMPLIFIED: Track clicks on navigation elements to temporarily bypass recommendations hiding
        function setupTemporaryRecommendationsBypass() {
          document.addEventListener('click', function(e) {
            const target = e.target.closest('a, button');
            if (!target) return;
            
            // Get the href to check what was clicked
            const href = target.href || '';
            
            // Check if it's subscriptions, feed pages, or channel
            const isSubscriptionsOrChannel = 
              href.includes('/feed/') ||  // Any feed page
              href.includes('/channel/') ||
              href.includes('/c/') ||
              href.includes('/user/') ||
              href.includes('/@') ||
              target.getAttribute('tab-identifier')?.startsWith('FE') && target.getAttribute('tab-identifier') !== 'FEwhat_to_watch';
            
            if (isSubscriptionsOrChannel) {
              // Enable recommendations temporarily
              if (!isProduction) {
                console.log(logPrefix + ' 📺 Subscriptions/Channel clicked - enabling recommendations');
              }
              // Set flag immediately so it's ready when page loads
              tempRecommendationsEnabled = true;
              document.body.setAttribute('data-temp-recommendations-enabled', 'true');
            } else {
              // Disable recommendations for ANY other click (home, logo, or anything else)
              if (!isProduction) {
                console.log(logPrefix + ' 🏠 Other navigation clicked - disabling recommendations');
              }
              tempRecommendationsEnabled = false;
              document.body.removeAttribute('data-temp-recommendations-enabled');
            }
          }, true);
        }
        
        // Set page type IMMEDIATELY
        const initialPageType = detectPageType();
        document.body.setAttribute('data-page-type', initialPageType);
        document.body.setAttribute('data-signed-in', '${isAuthenticated}');
        
        // Simple initial state - recommendations OFF by default
        tempRecommendationsEnabled = false;
        document.body.removeAttribute('data-temp-recommendations-enabled');
        
        // Only enable if we started on subscriptions or channel
        if (initialPageType === 'subscriptions' || initialPageType === 'channel') {
          tempRecommendationsEnabled = true;
          document.body.setAttribute('data-temp-recommendations-enabled', 'true');
        }
        
        if (!isProduction) {
          console.log(logPrefix + ' Initial page type detected:', initialPageType);
          console.log(logPrefix + ' Subscriptions tab will be ALWAYS VISIBLE');
          console.log(logPrefix + ' Simple temporary recommendations bypass active');
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
            console.log(logPrefix + ' Subscriptions page content should be completely unaffected');
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
            } else if (currentPageType === 'channel') {
              browseEl.setAttribute('page-subtype', 'channel');
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
        
        // Additional check specifically for subscriptions page content - SIMPLE VERSION
        function ensureSubscriptionsContentVisible() {
          const currentPageType = document.body.getAttribute('data-page-type');
          const browseElement = document.querySelector('ytm-browse');
          const pageSubtype = browseElement ? browseElement.getAttribute('page-subtype') : null;
          
          if (currentPageType === 'subscriptions' || pageSubtype === 'subscriptions' || 
              window.location.pathname.startsWith('/feed/')) {
            
            const subscriptionsContent = document.querySelectorAll('ytm-browse .rich-grid-renderer, ytm-browse ytm-rich-item-renderer, ytm-browse ytm-video-with-context-renderer, ytm-browse ytm-section-list-renderer, ytm-browse ytm-item-section-renderer, ytm-browse ytm-channel-renderer, ytm-browse .channel-list-item');
            subscriptionsContent.forEach(element => {
              element.style.display = 'block';
              element.style.visibility = 'visible';
              element.style.opacity = '1';
            });
            
            // Ensure ytm-browse element has correct page-subtype
            if (browseElement && pageSubtype !== 'subscriptions') {
              browseElement.setAttribute('page-subtype', 'subscriptions');
            }
            
            if (!isProduction && subscriptionsContent.length > 0) {
              console.log(logPrefix + ' ✅ Subscriptions content ensured visible:', subscriptionsContent.length, 'elements');
            }
          }
        }
        
        // Ensure subscriptions tab is visible
        setTimeout(ensureSubscriptionsTabVisible, 500);
        setTimeout(ensureSubscriptionsTabVisible, 1000);
        setTimeout(ensureSubscriptionsTabVisible, 2000);
        
        // Ensure subscriptions content is visible on initial load
        setTimeout(ensureSubscriptionsContentVisible, 500);
        setTimeout(ensureSubscriptionsContentVisible, 1000);
        setTimeout(ensureSubscriptionsContentVisible, 2000);
        setTimeout(ensureSubscriptionsContentVisible, 4000);
        
        // Handle comment carousel visibility
        function handleCommentCarousel() {
          // Find all comment carousels and their containers
          const commentCarousels = document.querySelectorAll('yt-video-metadata-carousel-view-model');
          
          commentCarousels.forEach(carousel => {
            const titleElement = carousel.querySelector('h2.ytCarouselTitleViewModelTitle');
            if (titleElement && titleElement.textContent && titleElement.textContent.toLowerCase().includes('comment')) {
              
              // Mark the parent containers so they're not hidden by related videos CSS
              let parentContainer = carousel.closest('ytm-item-section-renderer');
              if (parentContainer) {
                parentContainer.classList.add('ytc-comment-container');
              }
              
              // Also mark the lazy-list container
              let lazyListContainer = carousel.closest('lazy-list');
              if (lazyListContainer) {
                lazyListContainer.classList.add('ytc-comment-list');
              }
              
              // Show/hide based on comments setting
              if (${!settings.showComments}) {
                carousel.style.display = 'none';
                carousel.style.visibility = 'hidden';
                carousel.style.height = '0';
                carousel.style.overflow = 'hidden';
                if (!isProduction) {
                  console.log(logPrefix + ' Hidden comment carousel');
                }
              } else {
                carousel.style.display = '';
                carousel.style.visibility = '';
                carousel.style.height = '';
                carousel.style.overflow = '';
                if (!isProduction) {
                  console.log(logPrefix + ' Showed comment carousel');
                }
              }
            }
          });
          
          // Also handle the case where comments are disabled - hide any remaining comment elements
          if (${!settings.showComments}) {
            const allCommentElements = document.querySelectorAll(
              'yt-comment-teaser-carousel-item-view-model, ' +
              'comments-entry-point-teaser-view-model, ' +
              '.ytCommentsEntryPointTeaserViewModelHost, ' +
              '.ytCommentTeaserCarouselItemViewModelHost'
            );
            allCommentElements.forEach(el => {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
            });
          } else {
            // Show comment elements when comments are enabled
            const allCommentElements = document.querySelectorAll(
              'yt-comment-teaser-carousel-item-view-model, ' +
              'comments-entry-point-teaser-view-model, ' +
              '.ytCommentsEntryPointTeaserViewModelHost, ' +
              '.ytCommentTeaserCarouselItemViewModelHost'
            );
            allCommentElements.forEach(el => {
              el.style.display = '';
              el.style.visibility = '';
            });
          }
        }
        
        // Handle comment carousel visibility immediately and periodically
        handleCommentCarousel();
        setTimeout(handleCommentCarousel, 500);
        setTimeout(handleCommentCarousel, 1000);
        setTimeout(handleCommentCarousel, 2000);
        
        // Set up observer for dynamically loaded comment carousels
        const commentObserver = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node;
                if (element.tagName === 'YT-VIDEO-METADATA-CAROUSEL-VIEW-MODEL' || 
                    element.classList.contains('ytVideoMetadataCarouselViewModelHost')) {
                  setTimeout(handleCommentCarousel, 100);
                }
                // Also check if any child elements are comment carousels
                const carousels = element.querySelectorAll && element.querySelectorAll('yt-video-metadata-carousel-view-model');
                if (carousels && carousels.length > 0) {
                  setTimeout(handleCommentCarousel, 100);
                }
              }
            });
          });
        });
        
        commentObserver.observe(document.body, { 
          childList: true, 
          subtree: true 
        });
        
        // Handle Shorts blocking with URL redirection
        if (${!settings.showShorts}) {
          handleShortsBlocking();
        }
        
        // Setup simple temporary recommendations bypass
        setupTemporaryRecommendationsBypass();
        
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
            subscriptionsPageProtected: true,
            temporaryRecommendationsBypass: true,
            delayedBypassEnabled: true,
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
        
        // SIMPLIFIED: Monitor for navigation changes
        function setupNavigationObserver() {
          let currentUrl = window.location.href;
          
          const urlObserver = new MutationObserver(function() {
            if (window.location.href !== currentUrl) {
              const oldUrl = currentUrl;
              currentUrl = window.location.href;
              
              // Update page type
              const newPageType = detectPageType();
              document.body.setAttribute('data-page-type', newPageType);
              document.body.setAttribute('data-signed-in', '${isAuthenticated}');
              
              // Simple logic: Only keep recommendations enabled on subscriptions/channel pages
              if (newPageType === 'subscriptions' || newPageType === 'channel') {
                // Keep or enable recommendations
                if (!tempRecommendationsEnabled) {
                  tempRecommendationsEnabled = true;
                  document.body.setAttribute('data-temp-recommendations-enabled', 'true');
                  if (!isProduction) {
                    console.log(logPrefix + ' ✅ On subscriptions/channel - recommendations enabled');
                  }
                }
              } else {
                // Disable recommendations on all other pages (home, watch, etc.)
                tempRecommendationsEnabled = false;
                document.body.removeAttribute('data-temp-recommendations-enabled');
                if (!isProduction) {
                  console.log(logPrefix + ' ❌ Not on subscriptions/channel - recommendations disabled');
                }
              }
              
              // Update YouTube element attributes
              setTimeout(updateYouTubePageAttributes, 100);
              
              // Ensure subscriptions tab stays visible
              setTimeout(ensureSubscriptionsTabVisible, 300);
              
              // Ensure subscriptions content stays visible
              setTimeout(ensureSubscriptionsContentVisible, 300);
              setTimeout(ensureSubscriptionsContentVisible, 800);
              setTimeout(ensureSubscriptionsContentVisible, 1500);
              
              // Re-handle comment carousel visibility
              setTimeout(handleCommentCarousel, 300);
              
              // Re-apply Shorts blocking if needed
              if (${!settings.showShorts} && currentUrl.includes('/shorts/')) {
                setTimeout(handleShortsBlocking, 100);
              }
              
              if (!isProduction) {
                console.log(logPrefix + ' Page type:', newPageType, 'Recommendations:', tempRecommendationsEnabled);
              }
            }
          });
          
          urlObserver.observe(document, { subtree: true, childList: true });
          
          // Also listen for popstate events (back/forward buttons)
          window.addEventListener('popstate', function() {
            setTimeout(() => {
              const newPageType = detectPageType();
              document.body.setAttribute('data-page-type', newPageType);
              
              // Same simple logic for popstate
              if (newPageType === 'subscriptions' || newPageType === 'channel') {
                tempRecommendationsEnabled = true;
                document.body.setAttribute('data-temp-recommendations-enabled', 'true');
                if (!isProduction) {
                  console.log(logPrefix + ' ✅ Popstate to subscriptions/channel - recommendations enabled');
                }
              } else {
                tempRecommendationsEnabled = false;
                document.body.removeAttribute('data-temp-recommendations-enabled');
                if (!isProduction) {
                  console.log(logPrefix + ' ❌ Popstate to other page - recommendations disabled');
                }
              }
              
              updateYouTubePageAttributes();
              ensureSubscriptionsTabVisible();
              ensureSubscriptionsContentVisible();
              setTimeout(ensureSubscriptionsContentVisible, 300);
              handleCommentCarousel();
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