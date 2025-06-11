// Utility functions for creating and managing the subscription button on YouTube pages

export interface SubscriptionButtonConfig {
  position: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-right';
  theme: 'red' | 'dark' | 'light' | 'auto';
  size: 'small' | 'medium' | 'large';
  showIcon: boolean;
  showText: boolean;
  customText?: string;
  fadeOnScroll: boolean;
  hideOnVideoPlayer: boolean;
}

const defaultConfig: SubscriptionButtonConfig = {
  position: 'bottom-center',
  theme: 'red',
  size: 'medium',
  showIcon: true,
  showText: true,
  customText: 'My Subscriptions',
  fadeOnScroll: false,
  hideOnVideoPlayer: false,
};

export const createSubscriptionButtonScript = (
  isAuthenticated: boolean = false,
  config: Partial<SubscriptionButtonConfig> = {}
): string => {
  if (!isAuthenticated) {
    return 'true;'; // Don't show button if not authenticated
  }

  const buttonConfig = { ...defaultConfig, ...config };

  const getPositionStyles = () => {
    const baseStyles = `
      position: fixed;
      z-index: 999999;
      pointer-events: auto;
    `;

    switch (buttonConfig.position) {
      case 'bottom-center':
        return `${baseStyles}
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);`;
      case 'bottom-left':
        return `${baseStyles}
          bottom: 20px;
          left: 20px;`;
      case 'bottom-right':
        return `${baseStyles}
          bottom: 20px;
          right: 20px;`;
      case 'top-right':
        return `${baseStyles}
          top: 70px;
          right: 20px;`;
      default:
        return `${baseStyles}
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);`;
    }
  };

  const getThemeStyles = () => {
    switch (buttonConfig.theme) {
      case 'red':
        return {
          background: '#FF0000',
          color: 'white',
          hoverBackground: '#CC0000',
        };
      case 'dark':
        return {
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          hoverBackground: 'rgba(0, 0, 0, 0.9)',
        };
      case 'light':
        return {
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#333',
          hoverBackground: 'rgba(255, 255, 255, 1)',
        };
      case 'auto':
        return {
          background: 'rgba(255, 0, 0, 0.9)',
          color: 'white',
          hoverBackground: 'rgba(255, 0, 0, 1)',
        };
      default:
        return {
          background: '#FF0000',
          color: 'white',
          hoverBackground: '#CC0000',
        };
    }
  };

  const getSizeStyles = () => {
    switch (buttonConfig.size) {
      case 'small':
        return {
          padding: '8px 16px',
          fontSize: '12px',
          iconSize: '14px',
          borderRadius: '20px',
        };
      case 'medium':
        return {
          padding: '12px 24px',
          fontSize: '14px',
          iconSize: '16px',
          borderRadius: '25px',
        };
      case 'large':
        return {
          padding: '16px 32px',
          fontSize: '16px',
          iconSize: '18px',
          borderRadius: '30px',
        };
      default:
        return {
          padding: '12px 24px',
          fontSize: '14px',
          iconSize: '16px',
          borderRadius: '25px',
        };
    }
  };

  const theme = getThemeStyles();
  const size = getSizeStyles();
  const positionStyles = getPositionStyles();

  return `
    (function() {
      try {
        // Remove existing subscription button
        const existingButton = document.getElementById('yt-controller-sub-button');
        if (existingButton) {
          existingButton.remove();
        }

        // Check if we're on a video page and should hide the button
        const isVideoPage = window.location.pathname.includes('/watch') || 
                           window.location.pathname.includes('/shorts/');
        
        if (${buttonConfig.hideOnVideoPlayer} && isVideoPage) {
          console.log('[YT Controller] Hiding subscription button on video page');
          return;
        }

        // Create subscription button container
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'yt-controller-sub-button';
        
        // Create button element
        const button = document.createElement('div');
        button.style.cssText = \`
          ${positionStyles}
          background: ${theme.background};
          color: ${theme.color};
          padding: ${size.padding};
          border-radius: ${size.borderRadius};
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          font-size: ${size.fontSize};
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          user-select: none;
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255,255,255,0.1);
          transition: all 0.3s ease;
          opacity: 0.9;
        \`;

        // Add content based on configuration
        let buttonContent = '';
        
        if (${buttonConfig.showIcon}) {
          buttonContent += \`<span style="font-size: ${size.iconSize};">📺</span>\`;
        }
        
        if (${buttonConfig.showText}) {
          buttonContent += \`<span>${buttonConfig.customText || 'My Subscriptions'}</span>\`;
        }

        button.innerHTML = buttonContent;

        // Add interaction handlers
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // Add click animation
          this.style.transform = this.style.transform.replace('scale(1)', 'scale(0.95)');
          setTimeout(() => {
            this.style.transform = this.style.transform.replace('scale(0.95)', 'scale(1)');
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
          this.style.background = '${theme.hoverBackground}';
          this.style.transform = (this.style.transform || '') + ' scale(1.05)';
          this.style.opacity = '1';
        });
        
        button.addEventListener('mouseleave', function() {
          this.style.background = '${theme.background}';
          this.style.transform = this.style.transform.replace(' scale(1.05)', '');
          this.style.opacity = '0.9';
        });

        // Add touch effects for mobile
        button.addEventListener('touchstart', function() {
          this.style.background = '${theme.hoverBackground}';
          this.style.transform = (this.style.transform || '') + ' scale(0.95)';
        }, { passive: true });

        button.addEventListener('touchend', function() {
          this.style.background = '${theme.background}';
          this.style.transform = this.style.transform.replace(' scale(0.95)', '');
        }, { passive: true });

        // Add to container and page
        buttonContainer.appendChild(button);
        document.body.appendChild(buttonContainer);

        // Add scroll behavior if enabled
        if (${buttonConfig.fadeOnScroll}) {
          let scrollTimeout;
          let lastScrollY = window.scrollY;
          
          window.addEventListener('scroll', function() {
            const currentScrollY = window.scrollY;
            const isScrollingDown = currentScrollY > lastScrollY;
            
            if (isScrollingDown) {
              button.style.opacity = '0.3';
              button.style.pointerEvents = 'none';
            } else {
              button.style.opacity = '0.9';
              button.style.pointerEvents = 'auto';
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
              button.style.opacity = '0.9';
              button.style.pointerEvents = 'auto';
            }, 1000);
            
            lastScrollY = currentScrollY;
          }, { passive: true });
        }

        // Store button reference globally for external control
        window.ytControllerSubscriptionButton = {
          element: button,
          show: function() {
            button.style.display = 'flex';
          },
          hide: function() {
            button.style.display = 'none';
          },
          remove: function() {
            buttonContainer.remove();
          },
          updatePosition: function(newPosition) {
            // Update position dynamically if needed
          }
        };

        console.log('[YT Controller] Subscription button created successfully');
        
        // Send success message
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'subscription-button-ready',
            position: '${buttonConfig.position}',
            theme: '${buttonConfig.theme}'
          }));
        }
        
      } catch (error) {
        console.error('[YT Controller] Failed to create subscription button:', error);
        
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'subscription-button-error',
            error: error.toString()
          }));
        }
      }
    })();
    true;
  `;
};

// Enhanced profile button injection
export const createProfileButtonEnhancementScript = (isAuthenticated: boolean = false): string => {
  if (!isAuthenticated) {
    return 'true;';
  }

  return `
    (function() {
      try {
        // Enhanced profile button targeting
        const profileSelectors = [
          // Mobile YouTube selectors
          'ytm-mobile-topbar-renderer button[aria-label*="Account"]',
          'ytm-mobile-topbar-renderer .topbar-menu-button-avatar-button',
          'ytm-mobile-topbar-renderer img[alt*="Avatar"]',
          '.ytm-topbar-menu-button-avatar-button',
          'button[aria-label="Account menu"]',
          
          // Desktop YouTube selectors (fallback)
          '#avatar-btn',
          '.ytd-topbar-menu-button-avatar-button',
          'button[aria-label*="Google Account"]',
          
          // Generic avatar selectors
          'img[alt*="avatar" i]',
          'img[alt*="profile" i]',
          '[role="button"] img[referrerpolicy="origin"]'
        ];

        let profileButton = null;
        let attempts = 0;
        const maxAttempts = 10;
        
        function findProfileButton() {
          for (const selector of profileSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              // Additional validation - check if it's actually a profile button
              const hasProfileIndicators = (
                element.getAttribute('aria-label')?.toLowerCase().includes('account') ||
                element.getAttribute('alt')?.toLowerCase().includes('avatar') ||
                element.closest('[aria-label*="Account"]') ||
                element.src?.includes('ggpht.com') || // Google profile images
                element.src?.includes('googleusercontent.com')
              );
              
              if (hasProfileIndicators) {
                profileButton = element.closest('button') || element;
                break;
              }
            }
            if (profileButton) break;
          }
          
          return profileButton;
        }

        function enhanceProfileButton() {
          if (!findProfileButton()) {
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(enhanceProfileButton, 500);
              return;
            } else {
              console.log('[YT Controller] Profile button not found after', maxAttempts, 'attempts');
              return;
            }
          }

          // Remove existing enhancement
          const existingIndicator = document.querySelector('#yt-controller-profile-indicator');
          if (existingIndicator) {
            existingIndicator.remove();
          }

          // Store original handlers
          const originalClick = profileButton.onclick;
          const originalHandlers = [];
          
          // Capture existing event listeners (limited access)
          const events = ['click', 'touchstart', 'mousedown'];
          events.forEach(eventType => {
            const originalHandler = profileButton.getAttribute('on' + eventType);
            if (originalHandler) {
              originalHandlers.push({ type: eventType, handler: originalHandler });
            }
          });

          // Override click behavior
          profileButton.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Add visual feedback
            const originalTransform = this.style.transform;
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
              this.style.transform = originalTransform;
            }, 100);
            
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'show-profile',
                source: 'profile-button'
              }));
            }
            
            return false;
          };

          // Add visual enhancement indicator
          const indicator = document.createElement('div');
          indicator.id = 'yt-controller-profile-indicator';
          indicator.style.cssText = \`
            position: absolute;
            top: -3px;
            right: -3px;
            width: 12px;
            height: 12px;
            background: linear-gradient(45deg, #00FF00, #00CC00);
            border-radius: 50%;
            border: 2px solid white;
            z-index: 1000;
            animation: pulse 2s infinite;
            pointer-events: none;
          \`;

          // Add CSS animation
          if (!document.getElementById('yt-controller-profile-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'yt-controller-profile-styles';
            styleSheet.textContent = \`
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
              }
            \`;
            document.head.appendChild(styleSheet);
          }
          
          // Ensure button container is positioned relative
          const buttonContainer = profileButton.closest('button') || profileButton;
          if (getComputedStyle(buttonContainer).position === 'static') {
            buttonContainer.style.position = 'relative';
          }
          
          buttonContainer.appendChild(indicator);

          // Add tooltip
          const tooltip = document.createElement('div');
          tooltip.style.cssText = \`
            position: absolute;
            bottom: -35px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
            z-index: 1001;
          \`;
          tooltip.textContent = 'Enhanced Profile';
          
          buttonContainer.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1';
          });
          
          buttonContainer.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
          });
          
          buttonContainer.appendChild(tooltip);

          // Store reference for cleanup
          window.ytControllerProfileEnhancement = {
            button: profileButton,
            indicator: indicator,
            tooltip: tooltip,
            originalHandlers: originalHandlers,
            cleanup: function() {
              if (indicator && indicator.parentNode) {
                indicator.remove();
              }
              if (tooltip && tooltip.parentNode) {
                tooltip.remove();
              }
              // Restore original handlers if possible
              originalHandlers.forEach(({ type, handler }) => {
                profileButton.setAttribute('on' + type, handler);
              });
            }
          };

          console.log('[YT Controller] Profile button enhanced successfully');
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'profile-button-enhanced',
              success: true
            }));
          }
        }

        // Start enhancement process
        enhanceProfileButton();
        
        // Also try to enhance after potential page changes
        const observer = new MutationObserver(function(mutations) {
          let shouldReenhance = false;
          
          mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
              if (node.nodeType === Node.ELEMENT_NODE && 
                  (node.querySelector && node.querySelector('button[aria-label*="Account"]') ||
                   node.matches && node.matches('button[aria-label*="Account"]'))) {
                shouldReenhance = true;
              }
            });
          });
          
          if (shouldReenhance) {
            setTimeout(enhanceProfileButton, 500);
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
      } catch (error) {
        console.error('[YT Controller] Failed to enhance profile button:', error);
        
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'profile-button-error',
            error: error.toString()
          }));
        }
      }
    })();
    true;
  `;
};

// Cleanup script for removing enhancements
export const createCleanupScript = (): string => {
  return `
    (function() {
      try {
        // Remove subscription button
        const subButton = document.getElementById('yt-controller-sub-button');
        if (subButton) {
          subButton.remove();
        }
        
        // Cleanup profile enhancement
        if (window.ytControllerProfileEnhancement) {
          window.ytControllerProfileEnhancement.cleanup();
          delete window.ytControllerProfileEnhancement;
        }
        
        // Remove profile styles
        const profileStyles = document.getElementById('yt-controller-profile-styles');
        if (profileStyles) {
          profileStyles.remove();
        }
        
        // Cleanup subscription button reference
        if (window.ytControllerSubscriptionButton) {
          delete window.ytControllerSubscriptionButton;
        }
        
        console.log('[YT Controller] Cleanup completed');
        
      } catch (error) {
        console.error('[YT Controller] Cleanup error:', error);
      }
    })();
    true;
  `;
};