import { IslamicCalendar } from './islamic-calendar.js';

/**
 * Theme Manager
 * Handles application theme switching
 */
export class ThemeManager {
    /**
     * Constructor
     */
    constructor() {
        this.currentTheme = 'emerald';
        this.themes = [
            { id: 'light', name: 'Light', icon: '☀️' },
            { id: 'dark', name: 'Dark', icon: '🌙' },
            { id: 'desert', name: 'Desert', icon: '🕌' },
            { id: 'emerald', name: 'Emerald', icon: '💎' },
            { id: 'azure', name: 'Azure', icon: '🌊' },
            { id: 'ramadan', name: 'Ramadan', icon: '🌙' },
            { id: 'night', name: 'Night', icon: '✨' },
            { id: 'twilight', name: 'Twilight', icon: '🌌' },
            { id: 'calligraphy', name: 'Calligraphy', icon: '📜' }
        ];
        this.islamicCalendar = new IslamicCalendar();
        this.themeModal = null;
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initialize theme manager
     */
    initialize() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme && this.themes.some(theme => theme.id === savedTheme)) {
            this.currentTheme = savedTheme;
        } else {
            // Use system preference when no manual theme is saved.
            this.checkSystemPreference();
        }
        
        // Apply initial theme
        this.applyTheme(this.currentTheme);
        
        // Create theme modal
        this.createThemeModal();
        
        // Listen for system theme changes
        this.listenForSystemChanges();
    }
    
    /**
     * Create theme modal
     */
    createThemeModal() {
        // Check if modal already exists
        if (document.getElementById('themeModal')) {
            return;
        }
        
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'themeModal';
        modal.className = 'theme-modal';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'theme-modal-content';
        
        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'theme-modal-header';
        
        const modalTitle = document.createElement('h2');
        modalTitle.className = 'theme-modal-title';
        modalTitle.textContent = 'Themes';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'theme-modal-close';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => this.hideThemeModal());
        
        modalHeader.appendChild(modalTitle);
        modalHeader.appendChild(closeButton);
        
        // Create theme grid
        const themeGrid = document.createElement('div');
        themeGrid.className = 'theme-grid';
        
        // Add theme options
        this.themes.forEach(theme => {
            const themeOption = document.createElement('div');
            themeOption.className = `theme-option theme-${theme.id}`;
            themeOption.setAttribute('data-theme', theme.id);
            if (theme.id === this.currentTheme) {
                themeOption.classList.add('active');
            }
            
            const themeIcon = document.createElement('div');
            themeIcon.className = 'theme-icon';
            themeIcon.textContent = theme.icon;
            
            const themeName = document.createElement('div');
            themeName.className = 'theme-name';
            themeName.textContent = theme.name;
            
            themeOption.appendChild(themeIcon);
            themeOption.appendChild(themeName);
            
            // Add click event
            themeOption.addEventListener('click', () => {
                this.setTheme(theme.id);
                this.hideThemeModal();
            });
            
            themeGrid.appendChild(themeOption);
        });
        
        // Assemble modal
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(themeGrid);
        modal.appendChild(modalContent);
        
        // Add modal to body
        document.body.appendChild(modal);
        
        // Store reference to modal
        this.themeModal = modal;
        
        // Add click event to close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideThemeModal();
            }
        });
        
        // Add ESC key event to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.themeModal.classList.contains('active')) {
                this.hideThemeModal();
            }
        });
    }
    
    /**
     * Show theme modal
     */
    showThemeModal() {
        if (this.themeModal) {
            this.themeModal.classList.add('active');
            
            // Update active theme
            const themeOptions = this.themeModal.querySelectorAll('.theme-option');
            themeOptions.forEach(option => {
                if (option.getAttribute('data-theme') === this.currentTheme) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        }
    }
    
    /**
     * Hide theme modal
     */
    hideThemeModal() {
        if (this.themeModal) {
            this.themeModal.classList.remove('active');
        }
    }
    
    /**
     * Check system color scheme preference
     */
    checkSystemPreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            this.currentTheme = 'dark';
        }
    }
    
    /**
     * Listen for system theme changes
     */
    listenForSystemChanges() {
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                // Only change if user hasn't manually set a theme
                if (!localStorage.getItem('theme')) {
                    const newTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(newTheme);
                    this.currentTheme = newTheme;
                }
            });
        }
    }
    
    /**
     * Toggle between themes
     */
    toggleTheme() {
        // Show theme modal instead of cycling through themes
        this.showThemeModal();
    }
    
    /**
     * Set specific theme
     * @param {string} theme - Theme name
     */
    setTheme(theme) {
        if (!this.themes.some(t => t.id === theme)) {
            console.error('Invalid theme:', theme);
            return;
        }
        
        this.applyTheme(theme);
        this.currentTheme = theme;
        
        // Save preference
        localStorage.setItem('theme', theme);
    }
    
    /**
     * Apply theme to document
     * @param {string} theme - Theme name
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme toggle button
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            const themeIcon = themeToggleBtn.querySelector('.theme-icon');
            if (themeIcon) {
                // Find the theme object
                const themeObj = this.themes.find(t => t.id === theme);
                if (themeObj) {
                    themeIcon.textContent = themeObj.icon;
                }
            }
        }
        
        // Apply special theme adjustments
        this.applySpecialThemeAdjustments(theme);
    }
    
    /**
     * Apply special theme adjustments
     * @param {string} theme - Theme name
     */
    applySpecialThemeAdjustments(theme) {
        // Check if it's Ramadan
        const islamicDate = this.islamicCalendar.getIslamicDate();
        const isRamadan = islamicDate.month === 9;
        
        // Apply Ramadan theme if it's Ramadan and theme is not already Ramadan
        if (isRamadan && theme !== 'ramadan') {
            document.body.classList.add('ramadan-month');
            
            // Add Ramadan decorations
            this.addRamadanDecorations();
        } else {
            document.body.classList.remove('ramadan-month');
            
            // Remove Ramadan decorations if not Ramadan theme
            if (theme !== 'ramadan') {
                this.removeRamadanDecorations();
            }
        }
        
        // Add decorations for specific themes
        if (theme === 'ramadan') {
            this.addRamadanDecorations();
        } else if (theme === 'night' || theme === 'twilight') {
            this.addNightDecorations();
        } else if (theme === 'desert') {
            this.addDesertDecorations();
        } else {
            // Remove all decorations
            this.removeAllDecorations();
        }
    }
    
    /**
     * Add Ramadan decorations
     */
    addRamadanDecorations() {
        // Remove any existing decorations
        this.removeAllDecorations();
        
        // Check if decorations already exist
        if (document.querySelector('.ramadan-decoration')) {
            return;
        }
        
        // Create decorations container
        const decorationsContainer = document.createElement('div');
        decorationsContainer.className = 'decorations-container ramadan-decorations';
        
        // Add crescent moon
        const crescentMoon = document.createElement('div');
        crescentMoon.className = 'decoration ramadan-decoration crescent-moon';
        crescentMoon.innerHTML = '☪️';
        crescentMoon.style.position = 'fixed';
        crescentMoon.style.top = '20px';
        crescentMoon.style.right = '20px';
        crescentMoon.style.fontSize = '30px';
        crescentMoon.style.zIndex = '1000';
        
        // Add lantern
        const lantern = document.createElement('div');
        lantern.className = 'decoration ramadan-decoration lantern';
        lantern.innerHTML = '🏮';
        lantern.style.position = 'fixed';
        lantern.style.bottom = '20px';
        lantern.style.left = '20px';
        lantern.style.fontSize = '30px';
        lantern.style.zIndex = '1000';
        
        // Add to container
        decorationsContainer.appendChild(crescentMoon);
        decorationsContainer.appendChild(lantern);
        
        // Add to body
        document.body.appendChild(decorationsContainer);
    }
    
    /**
     * Add night decorations
     */
    addNightDecorations() {
        // Remove any existing decorations
        this.removeAllDecorations();
        
        // Check if decorations already exist
        if (document.querySelector('.night-decoration')) {
            return;
        }
        
        // Create decorations container
        const decorationsContainer = document.createElement('div');
        decorationsContainer.className = 'decorations-container night-decorations';
        
        // Add stars
        for (let i = 0; i < 20; i++) {
            const star = document.createElement('div');
            star.className = 'decoration night-decoration star';
            star.innerHTML = '✨';
            star.style.position = 'fixed';
            star.style.top = `${Math.random() * 100}%`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.fontSize = `${Math.random() * 10 + 10}px`;
            star.style.opacity = `${Math.random() * 0.5 + 0.5}`;
            star.style.zIndex = '1000';
            star.style.animation = `twinkle ${Math.random() * 3 + 2}s infinite`;
            
            decorationsContainer.appendChild(star);
        }
        
        // Add to body
        document.body.appendChild(decorationsContainer);
    }
    
    /**
     * Add desert decorations
     */
    addDesertDecorations() {
        // Remove any existing decorations
        this.removeAllDecorations();
        
        // Check if decorations already exist
        if (document.querySelector('.desert-decoration')) {
            return;
        }
        
        // Create decorations container
        const decorationsContainer = document.createElement('div');
        decorationsContainer.className = 'decorations-container desert-decorations';
        
        // Add mosque silhouette
        const mosque = document.createElement('div');
        mosque.className = 'decoration desert-decoration mosque';
        mosque.style.position = 'fixed';
        mosque.style.bottom = '0';
        mosque.style.right = '20px';
        mosque.style.width = '200px';
        mosque.style.height = '150px';
        mosque.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'%3E%3Cpath d='M10,60 L10,40 L15,40 L15,60 M20,60 L20,30 L25,30 L25,60 M30,60 L30,40 L35,40 L35,60 M40,60 L40,20 C40,15 50,10 50,10 C50,10 60,15 60,20 L60,60 M65,60 L65,40 L70,40 L70,60 M75,60 L75,30 L80,30 L80,60 M85,60 L85,40 L90,40 L90,60' stroke='%23b8860b' fill='none' stroke-width='1.5'/%3E%3C/svg%3E\")";
        mosque.style.backgroundRepeat = 'no-repeat';
        mosque.style.backgroundPosition = 'bottom right';
        mosque.style.backgroundSize = 'contain';
        mosque.style.opacity = '0.2';
        mosque.style.zIndex = '1000';
        
        // Add to container
        decorationsContainer.appendChild(mosque);
        
        // Add to body
        document.body.appendChild(decorationsContainer);
    }
    
    /**
     * Remove Ramadan decorations
     */
    removeRamadanDecorations() {
        const decorations = document.querySelectorAll('.ramadan-decoration');
        decorations.forEach(decoration => decoration.remove());
        
        const container = document.querySelector('.ramadan-decorations');
        if (container) {
            container.remove();
        }
    }
    
    /**
     * Remove all decorations
     */
    removeAllDecorations() {
        const decorations = document.querySelectorAll('.decoration');
        decorations.forEach(decoration => decoration.remove());
        
        const containers = document.querySelectorAll('.decorations-container');
        containers.forEach(container => container.remove());
    }
    
    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    /**
     * Get theme object by ID
     * @param {string} themeId - Theme ID
     * @returns {Object} Theme object
     */
    getThemeById(themeId) {
        return this.themes.find(theme => theme.id === themeId);
    }
} 