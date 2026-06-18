import { PrayerTimeCalculator } from './prayer-calculator.js';
import { AdhanPlayer } from './adhan-player.js';
import { QiblaCompass } from './qibla-compass.js';
import { IslamicCalendar } from './islamic-calendar.js';
import { ThemeManager } from './theme-manager.js';
import { LocationManager } from './location-manager.js';
import { DSTManager } from './dst-manager.js';
import { NotificationManager } from './notification-manager.js';

/**
 * Main application initializer
 */
class AppInitializer {
    constructor() {
        this.prayerCalculator = null;
        this.adhanPlayer = null;
        this.qiblaCompass = null;
        this.islamicCalendar = null;
        this.themeManager = null;
        this.locationManager = null;
        this.dstManager = null;
        this.notificationManager = null;
        
        // Default coordinates (Makkah)
        this.defaultCoordinates = {
            latitude: 21.3891,
            longitude: 39.8579
        };
        
        // Update intervals
        this.intervals = {
            prayerTimes: 60000, // 1 minute
            calendar: 3600000,  // 1 hour
            dst: 86400000,      // 24 hours
            location: 1800000   // 30 minutes
        };
    }
    
    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Initializing application...');
            
            // Initialize managers
            this.themeManager = new ThemeManager();
            this.locationManager = new LocationManager(this.defaultCoordinates);
            this.dstManager = new DSTManager();
            this.notificationManager = new NotificationManager();
            
            // Initialize components
            await this.initializeComponents();
            
            // Setup event listeners
            this.setupEventListeners();
            this.setupSelfTestControls();
            this.updateReadinessStatus();
            
            // Start periodic updates
            this.startPeriodicUpdates();
            
            console.log('Application initialized successfully');
        } catch (error) {
            console.error('Error initializing application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }
    
    /**
     * Initialize all components
     */
    async initializeComponents() {
        // Get current location
        const coordinates = await this.locationManager.getCurrentPosition();
        
        // Initialize prayer calculator
        this.prayerCalculator = new PrayerTimeCalculator(
            coordinates,
            this.dstManager.isDSTActive()
        );
        
        // Initialize Adhan player
        this.adhanPlayer = new AdhanPlayer();
        
        // Initialize Qibla compass
        this.qiblaCompass = new QiblaCompass(coordinates);
        
        // Initialize Islamic calendar
        this.islamicCalendar = new IslamicCalendar();
        
        // Update UI components
        await this.updateUIComponents();
    }
    
    /**
     * Update all UI components
     */
    async updateUIComponents() {
        // Update prayer times
        await this.updatePrayerTimes();
        
        // Update Islamic calendar
        this.updateIslamicCalendar();
        
        // Update Qibla compass
        this.updateQiblaCompass();
        
        // Update DST status
        this.updateDSTStatus();
        
        // Update location display
        this.updateLocationDisplay();
    }
    
    /**
     * Update prayer times display
     */
    async updatePrayerTimes() {
        try {
            // Show loading state
            document.querySelectorAll('.prayer-card').forEach(card => {
                card.classList.add('loading');
                const countdownElement = card.querySelector('.countdown');
                if (countdownElement) {
                    countdownElement.textContent = 'Calculating...';
                }
            });
            
            // Calculate prayer times (now async)
            const prayerTimes = await this.prayerCalculator.calculatePrayerTimes();
            
            // Remove loading state
            document.querySelectorAll('.prayer-card').forEach(card => {
                card.classList.remove('loading');
            });
            
            const prayerCards = document.querySelectorAll('.prayer-card');
            
            prayerCards.forEach(card => {
                const prayerName = card.getAttribute('data-prayer');
                const prayerTimeElement = card.querySelector('.prayer-time');
                const countdownElement = card.querySelector('.countdown');
                
                if (prayerTimes[prayerName]) {
                    const formattedTime = new Date(prayerTimes[prayerName]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    prayerTimeElement.textContent = formattedTime;
                    
                    // Update countdown
                    const countdown = this.prayerCalculator.getCountdown(prayerName);
                    countdownElement.textContent = countdown;
                    
                    // Check if this is the next prayer
                    if (this.prayerCalculator.isNextPrayer(prayerName)) {
                        card.classList.add('active');
                        
                        // Schedule Adhan if needed
                        this.adhanPlayer.scheduleAdhan(prayerName, prayerTimes[prayerName]);
                    } else {
                        card.classList.remove('active');
                    }
                }
            });
            
            // Update calculation source indicator
            const calculationSourceElement = document.getElementById('calculationSource');
            if (calculationSourceElement) {
                calculationSourceElement.textContent = this.prayerCalculator.useAPI ? 'API' : 'Local';
                calculationSourceElement.className = this.prayerCalculator.useAPI ? 'source-api' : 'source-local';
            }

            this.updateReadinessStatus();
        } catch (error) {
            console.error('Error updating prayer times:', error);
            
            // Show error state
            document.querySelectorAll('.prayer-card').forEach(card => {
                card.classList.remove('loading');
                const countdownElement = card.querySelector('.countdown');
                if (countdownElement) {
                    countdownElement.textContent = 'Error calculating times';
                }
            });
            
            // Try to fall back to local calculation if API failed
            if (this.prayerCalculator.useAPI) {
                console.log('Falling back to local calculation');
                this.prayerCalculator.setUseAPI(false);
                await this.updatePrayerTimes();
                this.prayerCalculator.setUseAPI(true); // Reset for next time
            }
        }
    }
    
    /**
     * Update Islamic calendar display
     */
    updateIslamicCalendar() {
        const islamicDate = this.islamicCalendar.getIslamicDate();
        
        document.getElementById('islamic-date-day').textContent = islamicDate.day;
        document.getElementById('islamic-date-month').textContent = islamicDate.monthName;
        document.getElementById('islamic-date-year').textContent = islamicDate.year;
        document.getElementById('islamic-date-gregorian').querySelector('.gregorian-date-text').textContent = 
            this.islamicCalendar.getGregorianDateString();
            
        // Update moon phase
        const moonPhase = this.islamicCalendar.getMoonPhase();
        const moonPhaseElement = document.getElementById('moon-phase');
        moonPhaseElement.querySelector('.moon-phase-icon').textContent = moonPhase.icon;
        moonPhaseElement.querySelector('.moon-phase-name').textContent = moonPhase.name;
    }
    
    /**
     * Update Qibla compass display
     */
    updateQiblaCompass() {
        const { latitude, longitude } = this.locationManager.getCurrentLocation();
        this.qiblaCompass.updateCoordinates({ latitude, longitude });

        const qiblaDirection = this.qiblaCompass.calculateQiblaDirection();
        const compassArrow = document.querySelector('.compass-arrow');
        const compassInfo = document.querySelector('.compass-info');
        
        compassArrow.style.transform = `translate(-50%, -100%) rotate(${qiblaDirection}deg)`;
        compassInfo.textContent = `Qibla Direction: ${Math.round(qiblaDirection)}° from North`;
    }
    
    /**
     * Update DST status display
     */
    updateDSTStatus() {
        const dstStatus = document.getElementById('dstStatus');
        const isDSTActive = this.dstManager.isDSTActive();
        
        dstStatus.textContent = this.dstManager.getDSTStatusText();
            
        // Update prayer times if DST status changed
        this.prayerCalculator.setDST(isDSTActive);
    }
    
    /**
     * Update location display
     */
    updateLocationDisplay() {
        const locationInfo = document.getElementById('location-info');
        const locationCoords = document.getElementById('location-coords');
        
        const { latitude, longitude, locationName } = this.locationManager.getCurrentLocation();
        
        locationInfo.classList.remove('loading');
        locationCoords.textContent = locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Calculation method change
        document.getElementById('calculationMethod').addEventListener('change', (e) => {
            this.prayerCalculator.setCalculationMethod(e.target.value);
            this.updatePrayerTimes();
        });
        
        // Madhab selection
        document.querySelectorAll('input[name="madhab"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.prayerCalculator.setMadhab(e.target.value);
                this.updatePrayerTimes();
            });
        });
        
        // DST settings
        document.querySelectorAll('input[name="dst"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.dstManager.setDSTMode(e.target.value);
                this.updateDSTStatus();
                this.updatePrayerTimes();
            });
        });
        
        // API calculation toggle
        document.getElementById('useAPI').addEventListener('change', (e) => {
            this.prayerCalculator.setUseAPI(e.target.checked);
            this.prayerCalculator.clearCache(); // Clear cache when switching
            this.updatePrayerTimes();
        });
        
        // Prayer notifications
        document.getElementById('prayerNotifications').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.notificationManager.requestPermission();
            }
            this.updateReadinessStatus();
        });
        
        // Refresh location
        document.getElementById('refresh-location').addEventListener('click', async () => {
            document.getElementById('location-info').classList.add('loading');
            const coordinates = await this.locationManager.refreshLocation();
            this.prayerCalculator.setCoordinates(coordinates);
            this.updateLocationDisplay();
            this.updatePrayerTimes();
            this.updateQiblaCompass();
            this.updateReadinessStatus();
        });
        
        // Theme toggle
        document.getElementById('theme-toggle-btn').addEventListener('click', () => {
            this.themeManager.toggleTheme();
        });

        // Settings quick-jump
        const settingsButton = document.getElementById('settings-btn');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                const settingsSection = document.querySelector('.settings-section');
                if (settingsSection) {
                    settingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
        
        // Adhan play buttons
        document.querySelectorAll('.play-adhan').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const prayer = e.target.getAttribute('data-prayer');
                const qariSelect = document.getElementById(`${prayer}QariSelect`);
                const qari = qariSelect.value;
                
                this.adhanPlayer.playAdhan(prayer, qari);
            });
        });
        
        // Adhan stop buttons
        document.querySelectorAll('.stop-adhan').forEach(btn => {
            btn.addEventListener('click', () => {
                this.adhanPlayer.stopAdhan();
            });
        });
    }

    /**
     * Setup dev-only self-test controls for quick playback verification.
     */
    setupSelfTestControls() {
        const panel = document.getElementById('adhanSelfTestPanel');
        const playButton = document.getElementById('selfTestPlayBtn');
        const stopButton = document.getElementById('selfTestStopBtn');
        const status = document.getElementById('selfTestStatus');

        if (!panel || !playButton || !stopButton || !status) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const isDevMode = params.get('dev') === '1' || localStorage.getItem('devSelfTest') === 'true';
        panel.style.display = isDevMode ? 'block' : 'none';

        playButton.addEventListener('click', () => this.runSelfTest(status));
        stopButton.addEventListener('click', () => {
            this.adhanPlayer.stopAdhan();
            this.adhanPlayer.cancelScheduledAdhan();
            status.textContent = 'Self-test stopped and pending timers cleared.';
        });
    }

    /**
     * Run a short duplicate-scheduling test to verify one trigger plays.
     * @param {HTMLElement} statusElement - Status text target
     */
    runSelfTest(statusElement) {
        const prayer = 'fajr';
        const triggerTime = new Date(Date.now() + 5000);
        const readableTime = triggerTime.toLocaleTimeString();

        this.adhanPlayer.stopAdhan();
        this.adhanPlayer.cancelScheduledAdhan(prayer);
        localStorage.removeItem('lastAdhanPlaybackLock');

        // Intentionally schedule the same trigger more than once.
        this.adhanPlayer.scheduleAdhan(prayer, new Date(triggerTime.getTime()));
        this.adhanPlayer.scheduleAdhan(prayer, new Date(triggerTime.getTime()));
        this.adhanPlayer.scheduleAdhan(prayer, new Date(triggerTime.getTime()));

        statusElement.textContent = `Self-test scheduled for ${readableTime}. Only one Fajr Adhan should play.`;
    }
    
    /**
     * Start all periodic updates
     */
    startPeriodicUpdates() {
        // Update prayer times every minute
        setInterval(() => this.updatePrayerTimes(), this.intervals.prayerTimes);
        setInterval(() => this.updateReadinessStatus(), 15000);
        
        // Update Islamic calendar and moon phase every hour
        setInterval(() => this.updateIslamicCalendar(), this.intervals.calendar);
        
        // Check DST status every day
        setInterval(() => this.updateDSTStatus(), this.intervals.dst);
        
        // Refresh location every 30 minutes
        setInterval(async () => {
            const coordinates = await this.locationManager.refreshLocation();
            this.prayerCalculator.setCoordinates(coordinates);
            this.updateLocationDisplay();
            this.updatePrayerTimes();
            this.updateQiblaCompass();
            this.updateReadinessStatus();
        }, this.intervals.location);
    }

    /**
     * Refresh readiness indicators for reliable on-time Adhan playback.
     */
    updateReadinessStatus() {
        const audioBadge = document.getElementById('statusAudio');
        const notificationsBadge = document.getElementById('statusNotifications');
        const locationBadge = document.getElementById('statusLocation');
        const scheduleBadge = document.getElementById('statusSchedule');
        const summary = document.getElementById('statusSummary');

        if (!audioBadge || !notificationsBadge || !locationBadge || !scheduleBadge || !summary) {
            return;
        }

        const audioReady = Boolean(
            this.adhanPlayer &&
            this.adhanPlayer.audioContext &&
            this.adhanPlayer.audioContext.state === 'running'
        );
        const notificationsReady = Boolean(
            this.notificationManager &&
            this.notificationManager.areNotificationsEnabled()
        );
        const locationReady = Boolean(
            this.locationManager &&
            this.locationManager.isAvailable()
        );
        const scheduleReady = Boolean(
            this.adhanPlayer &&
            this.adhanPlayer.scheduledAdhans &&
            this.adhanPlayer.scheduledAdhans.size > 0
        );

        this.setReadinessBadge(audioBadge, audioReady, audioReady ? 'Ready' : 'Tap page to unlock');
        this.setReadinessBadge(notificationsBadge, notificationsReady, notificationsReady ? 'Enabled' : 'Off');
        this.setReadinessBadge(locationBadge, locationReady, locationReady ? 'Live' : 'Fallback');
        this.setReadinessBadge(scheduleBadge, scheduleReady, scheduleReady ? 'Scheduled' : 'Waiting');

        const readinessScore = [audioReady, notificationsReady, locationReady, scheduleReady].filter(Boolean).length;
        if (readinessScore === 4) {
            summary.textContent = 'All systems ready for on-time Azan.';
        } else if (readinessScore >= 2) {
            summary.textContent = 'Partial readiness. Improve highlighted items for better reliability.';
        } else {
            summary.textContent = 'Low readiness. Enable permissions and interact once with the page.';
        }
    }

    /**
     * Update status badge style and text.
     * @param {HTMLElement} element - Badge element
     * @param {boolean} isReady - Readiness state
     * @param {string} text - Badge text
     */
    setReadinessBadge(element, isReady, text) {
        element.textContent = text;
        element.classList.remove('readiness-ok', 'readiness-warn');
        element.classList.add(isReady ? 'readiness-ok' : 'readiness-warn');
    }
    
    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        
        document.body.appendChild(errorElement);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new AppInitializer();
    app.initialize();
}); 