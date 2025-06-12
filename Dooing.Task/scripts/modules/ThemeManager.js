// ThemeManager.js - Handles theme switching and persistence
import Storage from '../storage.js';

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
    }

    /**
     * Initialize theme manager
     */
    init() {
        this.loadSavedTheme();
        this.setupThemeSelector();
        this.applyTheme(this.currentTheme);
    }

    /**
     * Load saved theme from storage
     */
    loadSavedTheme() {
        const settings = Storage.loadSettings();
        if (settings && settings.theme) {
            this.currentTheme = settings.theme;
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
            console.warn(`Invalid theme: ${themeName}`);
            return;
        }

        // Update document theme attribute
        document.documentElement.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;

        // Save to storage
        this.saveTheme();

        // Dispatch theme change event
        this.dispatchThemeChangeEvent(themeName);
    }

    /**
     * Set and apply a new theme
     */
    setTheme(themeName) {
        this.applyTheme(themeName);
        
        // Update selector if it exists
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector && themeSelector.value !== themeName) {
            themeSelector.value = themeName;
        }
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
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
        const settings = Storage.loadSettings() || {};
        settings.theme = this.currentTheme;
        Storage.saveSettings(settings);
    }

    /**
     * Dispatch theme change event
     */
    dispatchThemeChangeEvent(themeName) {
        const event = new CustomEvent('themeChanged', {
            detail: { theme: themeName }
        });
        document.dispatchEvent(event);
    }

    /**
     * Toggle between light and dark themes (if available)
     */
    toggleDarkMode() {
        const darkThemes = ['bold-contrast'];
        const lightThemes = ['cool-blues', 'warm-neutrals', 'earthy-greens'];
        
        if (darkThemes.includes(this.currentTheme)) {
            // Switch to light theme
            this.setTheme(lightThemes[0]);
        } else {
            // Switch to dark theme
            this.setTheme(darkThemes[0]);
        }
    }

    /**
     * Get theme preview colors (for theme picker UI)
     */
    getThemePreview(themeName) {
        const previews = {
            'cool-blues': { primary: '#006d77', secondary: '#83c5be', accent: '#ffddd2' },
            'warm-neutrals': { primary: '#8d5524', secondary: '#c1946a', accent: '#f4f3ee' },
            'bold-contrast': { primary: '#000000', secondary: '#ffffff', accent: '#ff6b6b' },
            'earthy-greens': { primary: '#2d5016', secondary: '#61a5c2', accent: '#a9d6e5' },
            'pastel-gradient': { primary: '#b8e6b8', secondary: '#ffb3ba', accent: '#bfb3ff' },
            'sunset-gradient': { primary: '#ff9a8b', secondary: '#ffeaa7', accent: '#fab1a0' },
            'vintage-gold': { primary: '#8b7355', secondary: '#d4af37', accent: '#f5f5dc' }
        };
        
        return previews[themeName] || null;
    }
}

export default ThemeManager;
