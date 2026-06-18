/**
 * Notification Manager
 * Handles browser notifications for prayer times across all platforms
 */
export class NotificationManager {
    /**
     * Constructor
     */
    constructor() {
        this.notificationsEnabled = false;
        this.notificationPermission = 'default';
        this.serviceWorkerRegistration = null;
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        this.isAndroid = /Android/.test(navigator.userAgent);
        this.isMobile = this.isIOS || this.isAndroid || /Mobi|Android/i.test(navigator.userAgent);
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initialize notification manager
     */
    async initialize() {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return;
        }
        
        // Check saved preference
        const savedPreference = localStorage.getItem('notificationsEnabled');
        
        if (savedPreference === 'true') {
            this.notificationsEnabled = true;
        }
        
        // Check current permission
        this.notificationPermission = Notification.permission;
        
        // Get service worker registration if available
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
                console.log('Service worker ready for notifications');
            } catch (error) {
                console.error('Error getting service worker registration:', error);
            }
        }
        
        // Update checkbox state
        this.updateNotificationCheckbox();
        
        // Show banner if needed
        this.showNotificationBannerIfNeeded();
    }
    
    /**
     * Request notification permission
     * @returns {Promise<string>} Permission status
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            return 'denied';
        }
        
        try {
            // Request permission
            const permission = await Notification.requestPermission();
            
            // Update permission status
            this.notificationPermission = permission;
            
            if (permission === 'granted') {
                this.notificationsEnabled = true;
                localStorage.setItem('notificationsEnabled', 'true');
                
                // Hide banner
                this.hideNotificationBanner();
                
                // Get service worker registration if available
                if ('serviceWorker' in navigator && !this.serviceWorkerRegistration) {
                    try {
                        this.serviceWorkerRegistration = await navigator.serviceWorker.ready;
                    } catch (error) {
                        console.error('Error getting service worker registration:', error);
                    }
                }
                
                // Show welcome notification
                this.showWelcomeNotification();
                
                // Request push subscription if supported
                if (this.serviceWorkerRegistration && 'pushManager' in this.serviceWorkerRegistration) {
                    try {
                        const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: this.urlBase64ToUint8Array(
                                'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
                            )
                        });
                        console.log('Push subscription successful:', subscription);
                    } catch (error) {
                        console.error('Error subscribing to push notifications:', error);
                    }
                }
            } else {
                // Show banner
                this.showNotificationBanner();
            }
            
            // Update checkbox
            this.updateNotificationCheckbox();
            
            return permission;
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return 'denied';
        }
    }
    
    /**
     * Show notification
     * @param {string} title - Notification title
     * @param {Object} options - Notification options
     * @returns {Notification|null} Notification object or null
     */
    async showNotification(title, options = {}) {
        if (!this.notificationsEnabled || this.notificationPermission !== 'granted') {
            return null;
        }
        
        try {
            // Set default icon if not provided
            if (!options.icon) {
                options.icon = './assets/icons/favicon.svg';
            }
            
            // Set default badge for mobile
            if (this.isMobile && !options.badge) {
                options.badge = './assets/icons/icon-96x96.png';
            }
            
            // Add vibration for mobile
            if (this.isMobile && !options.vibrate) {
                options.vibrate = [100, 50, 100];
            }
            
            // Add actions for mobile
            if (this.isMobile && !options.actions) {
                options.actions = [
                    {
                        action: 'open',
                        title: 'Open App'
                    }
                ];
            }
            
            // Use service worker if available (better for mobile)
            if (this.serviceWorkerRegistration && 'showNotification' in this.serviceWorkerRegistration) {
                return await this.serviceWorkerRegistration.showNotification(title, {
                    ...options,
                    data: {
                        ...options.data,
                        url: window.location.href
                    }
                });
            }
            
            // Fallback to regular notification
            const notification = new Notification(title, options);
            
            // Add click handler
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
            
            // Auto close after 10 seconds if not specified
            if (!options.autoClose && options.autoClose !== false) {
                setTimeout(() => notification.close(), 10000);
            }
            
            return notification;
        } catch (error) {
            console.error('Error showing notification:', error);
            
            // Try fallback method for iOS
            if (this.isIOS) {
                this.showIOSFallbackNotification(title, options.body || '');
            }
            
            return null;
        }
    }
    
    /**
     * Show welcome notification
     */
    showWelcomeNotification() {
        this.showNotification('Notifications Enabled', {
            body: 'You will now receive notifications for prayer times',
            icon: './assets/icons/favicon.svg',
            tag: 'welcome-notification'
        });
    }
    
    /**
     * Show prayer time notification
     * @param {string} prayer - Prayer name
     * @param {Date} time - Prayer time
     */
    showPrayerNotification(prayer, time) {
        const prayerNames = {
            tahajjud: 'Tahajjud',
            suhoor: 'Suhoor',
            fajr: 'Fajr',
            ishraq: 'Ishraq',
            dhuhr: 'Dhuhr',
            asr: 'Asr',
            maghrib: 'Maghrib',
            isha: 'Isha'
        };
        
        const formattedTime = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        this.showNotification('Prayer Time', {
            body: `It's time for ${prayerNames[prayer]} (${formattedTime})`,
            icon: './assets/icons/favicon.svg',
            tag: `prayer-${prayer}`,
            data: {
                prayer: prayer,
                time: time.toISOString()
            }
        });
    }
    
    /**
     * Show iOS fallback notification (alert)
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     */
    showIOSFallbackNotification(title, body) {
        // Create a temporary banner for iOS
        const banner = document.createElement('div');
        banner.className = 'ios-notification-banner';
        banner.innerHTML = `
            <div class="ios-notification-content">
                <div class="ios-notification-title">${title}</div>
                <div class="ios-notification-body">${body}</div>
            </div>
            <button class="ios-notification-close">&times;</button>
        `;
        
        // Style the banner
        Object.assign(banner.style, {
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '10px',
            padding: '10px 15px',
            zIndex: '9999',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        });
        
        // Add close button handler
        const closeButton = banner.querySelector('.ios-notification-close');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(banner);
        });
        
        // Auto-remove after 5 seconds
        document.body.appendChild(banner);
        setTimeout(() => {
            if (document.body.contains(banner)) {
                document.body.removeChild(banner);
            }
        }, 5000);
    }
    
    /**
     * Update notification checkbox
     */
    updateNotificationCheckbox() {
        const checkbox = document.getElementById('prayerNotifications');
        
        if (checkbox) {
            checkbox.checked = this.notificationsEnabled && this.notificationPermission === 'granted';
            checkbox.disabled = this.notificationPermission === 'denied';
            
            // Add special styling for iOS
            if (this.isIOS) {
                const label = checkbox.nextElementSibling;
                if (label && label.classList.contains('toggle-label')) {
                    if (this.notificationPermission === 'denied') {
                        label.innerHTML = 'Notifications blocked in iOS Settings';
                        label.style.opacity = '0.7';
                    }
                }
            }
        }
    }
    
    /**
     * Show notification banner if needed
     */
    showNotificationBannerIfNeeded() {
        if (this.notificationPermission === 'default' && !this.notificationsEnabled) {
            this.showNotificationBanner();
        }
    }
    
    /**
     * Show notification banner
     */
    showNotificationBanner() {
        const banner = document.getElementById('notificationBanner');
        
        if (banner) {
            banner.style.display = 'block';
            
            // Add platform-specific text
            if (this.isIOS) {
                banner.textContent = 'Enable notifications in iOS Settings to receive prayer time alerts';
            } else if (this.isAndroid) {
                banner.textContent = 'Allow notifications to receive prayer time alerts on your Android device';
            }
            
            // Add click handler if not already added
            if (!banner.hasAttribute('data-handler-added')) {
                banner.addEventListener('click', () => this.requestPermission());
                banner.setAttribute('data-handler-added', 'true');
            }
        }
    }
    
    /**
     * Hide notification banner
     */
    hideNotificationBanner() {
        const banner = document.getElementById('notificationBanner');
        
        if (banner) {
            banner.style.display = 'none';
        }
    }
    
    /**
     * Check if notifications are enabled
     * @returns {boolean} Whether notifications are enabled
     */
    areNotificationsEnabled() {
        return this.notificationsEnabled && this.notificationPermission === 'granted';
    }
    
    /**
     * Get notification permission
     * @returns {string} Notification permission
     */
    getPermission() {
        return this.notificationPermission;
    }
    
    /**
     * Convert base64 to Uint8Array (for push subscription)
     * @param {string} base64String - Base64 string
     * @returns {Uint8Array} Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        
        return outputArray;
    }
} 