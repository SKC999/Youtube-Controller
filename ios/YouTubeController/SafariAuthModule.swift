import Foundation
import SafariServices
import WebKit
import UIKit
import React

// MARK: - Safari Auth Module for React Native Bridge
@objc(SafariAuthModule)
@objcMembers
class SafariAuthModule: NSObject {
    
    // MARK: - React Native Module Setup
    @objc static func moduleName() -> String! {
        return "SafariAuthModule"
    }
    
    @objc static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // MARK: - Properties
    private var simpleSafariAuth: SimpleSafariAuth?
    private var authCompletionHandler: ((Bool, [String: Any]?) -> Void)?
    
    // MARK: - Initialization
    override init() {
        super.init()
        setupNotificationObservers()
    }
    
    private func setupNotificationObservers() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAuthSuccess(_:)),
            name: NSNotification.Name("SafariAuthSuccess"),
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAuthError(_:)),
            name: NSNotification.Name("SafariAuthError"),
            object: nil
        )
    }
    
    @objc private func handleAuthSuccess(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let authCode = userInfo["authorization_code"] as? String else {
            return
        }
        
        print("✅ [SafariAuthModule] Received auth success notification with code")
        authCompletionHandler?(true, ["authorization_code": authCode])
        authCompletionHandler = nil
    }
    
    @objc private func handleAuthError(_ notification: Notification) {
        let error = notification.userInfo?["error"] as? String ?? "Unknown error"
        print("❌ [SafariAuthModule] Received auth error notification: \(error)")
        authCompletionHandler?(false, ["error": error])
        authCompletionHandler = nil
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    // MARK: - Module Methods
    
    @objc func initializeAuthManager(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.simpleSafariAuth = SimpleSafariAuth.shared
            self.simpleSafariAuth?.initialize()
            
            print("✅ [SafariAuthModule] Simple Safari Auth initialized")
            resolve(["success": true])
        }
    }
    
    @objc func setupWebViewInterception(_ webViewTag: NSNumber, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async { [weak self] in
            guard self != nil else {
                reject("MODULE_DEALLOCATED", "Module was deallocated", nil)
                return
            }
            
            // For now, we'll store the webView tag and set up the auth manager
            // The WebView reference will be passed from React Native side
            print("✅ [SafariAuthModule] WebView interception requested for tag: \(webViewTag)")
            resolve(["success": true, "webViewTag": webViewTag])
        }
    }
    
    @objc func handleUniversalLink(_ url: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        guard let linkURL = URL(string: url) else {
            reject("INVALID_URL", "Invalid URL provided: \(url)", nil)
            return
        }
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self, let simpleSafariAuth = self.simpleSafariAuth else { 
                resolve(["success": true, "handled": false])
                return 
            }
            
            // Let SimpleSafariAuth handle the callback
            let handled = simpleSafariAuth.handleCallback(linkURL)
            
            if handled {
                resolve(["success": true, "handled": true])
            } else {
                resolve(["success": true, "handled": false])
            }
        }
    }
    
    @objc func openGoogleSignIn(_ clientId: String, scopes: [String], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        NSLog("🔐🔐🔐 [SafariAuthModule Swift] *** SWIFT METHOD CALLED *** openGoogleSignIn method called")
        print("🔐 [SafariAuthModule Swift] openGoogleSignIn method called")
        print("🔐 [SafariAuthModule Swift] clientId: \(clientId)")
        print("🔐 [SafariAuthModule Swift] scopes: \(scopes)")
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                print("❌ [SafariAuthModule Swift] Module was deallocated")
                reject("MODULE_DEALLOCATED", "Module was deallocated", nil)
                return
            }
            
            guard let simpleSafariAuth = self.simpleSafariAuth else {
                print("❌ [SafariAuthModule] SimpleSafariAuth not initialized")
                reject("NO_AUTH", "SimpleSafariAuth not initialized", nil)
                return
            }
            
            print("🔐 [SafariAuthModule] Using SimpleSafariAuth to open Google Sign-In...")
            
            // Store completion handler
            self.authCompletionHandler = { success, data in
                print("🔐 [SafariAuthModule] Auth completion: success=\(success), data=\(String(describing: data))")
                if success {
                    resolve(["success": true, "data": data ?? [:]])
                } else {
                    reject("AUTH_FAILED", "Authentication failed", NSError(
                        domain: "SafariAuthModule",
                        code: 1,
                        userInfo: data ?? [:]
                    ))
                }
            }
            
            // Use SimpleSafariAuth to open Google Sign-In
            simpleSafariAuth.openGoogleSignIn { success in
                print("🔐 [SafariAuthModule] SimpleSafariAuth completion: \(success)")
                if success {
                    print("✅ [SafariAuthModule] Safari View Controller opened successfully")
                    // The callback will be handled by the AppDelegate and SimpleSafariAuth
                } else {
                    print("❌ [SafariAuthModule] Failed to open Safari View Controller")
                    reject("SAFARI_FAILED", "Failed to open Safari View Controller", nil)
                }
            }
        }
    }
    
    @objc func dismissSafariAuth(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            resolve(["success": true])
        }
    }
    
    // MARK: - Constants Export
    @objc func constantsToExport() -> [String: Any] {
        return [
            "CALLBACK_SCHEME": "com.googleusercontent.apps.398239762640-pcssb2kt1sf9ivsfmuouguiho27o8ssh",
            "CALLBACK_HOST": "",
            "GOOGLE_AUTH_BASE_URL": "accounts.google.com"
        ]
    }
}