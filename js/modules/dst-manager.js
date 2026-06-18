/**
 * DST Manager
 * Handles Daylight Saving Time detection and management
 */
export class DSTManager {
    /**
     * Constructor
     */
    constructor() {
        this.dstMode = 'automatic'; // 'automatic', 'always-on', 'always-off'
        this.dstActive = false;
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initialize DST manager
     */
    initialize() {
        // Check for saved DST mode
        const savedMode = localStorage.getItem('dstMode');
        
        if (savedMode) {
            this.dstMode = savedMode;
        }
        
        // Check current DST status
        this.checkDST();
        
        // Set initial radio button state
        this.updateDSTRadioButtons();
    }
    
    /**
     * Check if DST is currently active
     */
    checkDST() {
        // If mode is not automatic, use the set value
        if (this.dstMode === 'always-on') {
            this.dstActive = true;
            return;
        }
        
        if (this.dstMode === 'always-off') {
            this.dstActive = false;
            return;
        }
        
        // For automatic mode, detect DST
        this.dstActive = this.detectDST();
    }
    
    /**
     * Detect if DST is currently active
     * @returns {boolean} Whether DST is active
     */
    detectDST() {
        const date = new Date();
        const jan = new Date(date.getFullYear(), 0, 1);
        const jul = new Date(date.getFullYear(), 6, 1);
        
        // DST is on if the offset in January is less than the offset in July
        return date.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
    }
    
    /**
     * Set DST mode
     * @param {string} mode - DST mode ('automatic', 'always-on', 'always-off')
     */
    setDSTMode(mode) {
        if (!['automatic', 'always-on', 'always-off'].includes(mode)) {
            console.error('Invalid DST mode:', mode);
            return;
        }
        
        this.dstMode = mode;
        
        // Save preference
        localStorage.setItem('dstMode', mode);
        
        // Update DST status
        this.checkDST();
        
        // Update radio buttons
        this.updateDSTRadioButtons();
    }
    
    /**
     * Update DST radio buttons
     */
    updateDSTRadioButtons() {
        const radioButtons = document.querySelectorAll('input[name="dst"]');
        
        radioButtons.forEach(radio => {
            if (radio.value === this.dstMode) {
                radio.checked = true;
            }
        });
    }
    
    /**
     * Check if DST is active
     * @returns {boolean} Whether DST is active
     */
    isDSTActive() {
        return this.dstActive;
    }
    
    /**
     * Get current DST mode
     * @returns {string} Current DST mode
     */
    getDSTMode() {
        return this.dstMode;
    }
    
    /**
     * Get DST status text
     * @returns {string} DST status text
     */
    getDSTStatusText() {
        if (this.dstMode === 'automatic') {
            return this.dstActive 
                ? 'Daylight Saving Time is currently active (Auto)' 
                : 'Daylight Saving Time is not active (Auto)';
        } else if (this.dstMode === 'always-on') {
            return 'Daylight Saving Time is always on (Manual)';
        } else {
            return 'Daylight Saving Time is always off (Manual)';
        }
    }
}