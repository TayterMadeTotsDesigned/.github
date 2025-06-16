// ThemeManager.js - Handles theme switching and persistence
import { pubSub } from '../../events/PubSub.js';
import { appState } from '../../core/AppState.js';
import { storageService } from '../../core/StorageService.js';

class ThemeManager {
    constructor() {
        this.currentTheme = 'cool-blues';
        this.availableThemes = [
            { value: 'cool-blues', name: 'Cool Blues' },
            { value: 'warm-neutrals', name: 'Warm Neutrals' },
            { value: 'bold-contrast', name: 'Bold Contrast' },
            { value: 'earthy-greens', name: 'Earthy Greens' },
            { value: 'pastel-gradient', name: 'Pastel Gradient' },
            { value: 'sunset-gradient', name: 'Sunset Gradient' },
            { value: 'vintage-gold', name: 'Vintage Gold' }
        ];
        this.subscribers = [];
        this.isInitialized = false;
    }

    /**
     * Initialize theme manager
     */
    init() {
        if (this.isInitialized) return;
        
        this.loadSavedTheme();
        this.setupThemeSelector();
        this.subscribeToEvents();
        this.applyTheme(this.currentTheme);
        
        this.isInitialized = true;
        pubSub.publish('theme:initialized', { 
            manager: this, 
            currentTheme: this.currentTheme 
        });
    }

    /**
     * Subscribe to relevant events
     */
    subscribeToEvents() {
        // Listen for theme change requests
        this.subscribers.push(
            pubSub.subscribe('theme:change', (data) => this.setTheme(data.theme))
        );
        
        // Listen for theme toggle requests
        this.subscribers.push(
            pubSub.subscribe('theme:toggle', () => this.toggleDarkMode())
        );
        
        // Listen for settings updates
        this.subscribers.push(
            pubSub.subscribe('settings:loaded', (data) => {
                if (data.settings.theme && data.settings.theme !== this.currentTheme) {
                    this.setTheme(data.settings.theme);
                }
            })
        );
        
        // Listen for app state updates
        this.subscribers.push(
            pubSub.subscribe('appState:updated', (data) => {
                if (data.property === 'theme' && data.value !== this.currentTheme) {
                    this.setTheme(data.value);
                }
            })
        );
    }

    /**
     * Load saved theme from storage
     */
    loadSavedTheme() {
        try {
            const settings = storageService.getSettings();
            if (settings && settings.theme) {
                this.currentTheme = settings.theme;
            }
            
            // Also update app state
            appState.set('theme', this.currentTheme);
        } catch (error) {
            console.warn('Failed to load saved theme:', error);
        }
    }

    /**
     * Set up theme selector dropdown
     */
    setupThemeSelector() {
        const themeSelector = document.getElementById('theme-selector');
        if (!themeSelector) return;

        // Clear existing options
        themeSelector.innerHTML = '';
        
        // Add theme options
        this.availableThemes.forEach(theme => {
            const option = document.createElement('option');
            option.value = theme.value;
            option.textContent = theme.name;
            themeSelector.appendChild(option);
        });
        
        // Set current theme
        themeSelector.value = this.currentTheme;
        
        // Add change listener
        themeSelector.addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });
    }

    /**
     * Apply a theme
     */
    applyTheme(themeName) {
        if (!this.isValidTheme(themeName)) {
            console.warn(`Invalid theme: ${themeName}. Falling back to default.`);
            themeName = 'cool-blues';
        }

        const previousTheme = this.currentTheme;
        
        // Update document theme attribute
        document.documentElement.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;

        // Update app state
        appState.set('theme', themeName);

        // Save to storage
        this.saveTheme();

        // Publish theme change events
        pubSub.publish('theme:changed', { 
            theme: themeName, 
            previousTheme,
            manager: this 
        });
        
        pubSub.publish('theme:applied', { 
            theme: themeName,
            preview: this.getThemePreview(themeName)
        });
    }

    /**
     * Set and apply a new theme
     */
    setTheme(themeName) {
        if (!themeName || themeName === this.currentTheme) {
            return;
        }
        
        this.applyTheme(themeName);
        
        // Update selector if it exists
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector && themeSelector.value !== themeName) {
            themeSelector.value = themeName;
        }
        
        pubSub.publish('notification:show', {
            type: 'info',
            message: `Theme changed to ${this.getThemeName(themeName)}`,
            duration: 2000
        });
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Get theme display name
     */
    getThemeName(themeValue) {
        const theme = this.availableThemes.find(t => t.value === themeValue);
        return theme ? theme.name : themeValue;
    }

    /**
     * Get available themes
     */
    getAvailableThemes() {
        return [...this.availableThemes];
    }

    /**
     * Check if theme name is valid
     */
    isValidTheme(themeName) {
        return this.availableThemes.some(theme => theme.value === themeName);
    }

    /**
     * Save current theme to storage
     */
    saveTheme() {
        try {
            const settings = storageService.getSettings() || {};
            settings.theme = this.currentTheme;
            storageService.saveSettings(settings);
            
            pubSub.publish('theme:saved', { theme: this.currentTheme });
        } catch (error) {
            console.error('Failed to save theme:', error);
            pubSub.publish('notification:show', {
                type: 'error',
                message: 'Failed to save theme preference'
            });
        }
    }

    /**
     * Toggle between light and dark themes (if available)
     */
    toggleDarkMode() {
        const darkThemes = ['bold-contrast'];
        const lightThemes = ['cool-blues', 'warm-neutrals', 'earthy-greens'];
        
        let newTheme;
        if (darkThemes.includes(this.currentTheme)) {
            // Switch to light theme
            newTheme = lightThemes[0];
        } else {
            // Switch to dark theme
            newTheme = darkThemes[0];
        }
        
        this.setTheme(newTheme);
        
        pubSub.publish('theme:toggled', { 
            theme: newTheme,
            isDark: darkThemes.includes(newTheme)
        });
    }

    /**
     * Get theme preview colors (for theme picker UI)
     */
    getThemePreview(themeName) {
        const previews = {
            'cool-blues': { 
                primary: '#006d77', 
                secondary: '#83c5be', 
                accent: '#ffddd2',
                description: 'Calming blues and teals with warm accents'
            },
            'warm-neutrals': { 
                primary: '#8d5524', 
                secondary: '#c1946a', 
                accent: '#f4f3ee',
                description: 'Earthy browns and warm beiges'
            },
            'bold-contrast': { 
                primary: '#000000', 
                secondary: '#ffffff', 
                accent: '#ff6b6b',
                description: 'High contrast dark theme with red accents'
            },
            'earthy-greens': { 
                primary: '#2d5016', 
                secondary: '#61a5c2', 
                accent: '#a9d6e5',
                description: 'Natural greens with blue highlights'
            },
            'pastel-gradient': { 
                primary: '#b8e6b8', 
                secondary: '#ffb3ba', 
                accent: '#bfb3ff',
                description: 'Soft pastel colors with gradient effects'
            },
            'sunset-gradient': { 
                primary: '#ff9a8b', 
                secondary: '#ffeaa7', 
                accent: '#fab1a0',
                description: 'Warm sunset colors with golden tones'
            },
            'vintage-gold': { 
                primary: '#8b7355', 
                secondary: '#d4af37', 
                accent: '#f5f5dc',
                description: 'Classic vintage gold and cream palette'
            }
        };
        
        return previews[themeName] || null;
    }

    /**
     * Get current theme preview
     */
    getCurrentThemePreview() {
        return this.getThemePreview(this.currentTheme);
    }

    /**
     * Export current theme settings
     */
    exportThemeSettings() {
        return {
            currentTheme: this.currentTheme,
            availableThemes: this.availableThemes,
            preview: this.getCurrentThemePreview()
        };
    }

    /**
     * Import theme settings
     */
    importThemeSettings(settings) {
        if (settings && settings.currentTheme && this.isValidTheme(settings.currentTheme)) {
            this.setTheme(settings.currentTheme);
        }
    }

    /**
     * Reset to default theme
     */
    resetToDefault() {
        this.setTheme('cool-blues');
        
        pubSub.publish('theme:reset', { theme: 'cool-blues' });
    }

    /**
     * Destroy the theme manager and clean up subscriptions
     */
    destroy() {
        this.subscribers.forEach(unsubscribe => unsubscribe());
        this.subscribers = [];
        this.isInitialized = false;
        
        pubSub.publish('theme:destroyed');
    }
}

// Create and export singleton instance
export const themeManager = new ThemeManager();
export default themeManager;
