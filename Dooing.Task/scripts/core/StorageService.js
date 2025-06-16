import { pubSub } from '../events/PubSub.js';

/**
 * StorageService
 * Handles data persistence using localStorage with fallback
 */
class StorageService {
    constructor() {
        this.storageKeys = {
            TASKS: 'dooing_tasks',
            SETTINGS: 'dooing_settings',
            STATE: 'dooing_state',
            POMODORO: 'dooing_pomodoro'
        };
        
        this.isStorageAvailable = this.checkStorageAvailability();
        this.fallbackStorage = new Map();
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} Storage availability
     */
    checkStorageAvailability() {
        try {
            const test = 'storage_test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            console.warn('localStorage not available, using fallback storage');
            return false;
        }
    }

    /**
     * Get item from storage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Stored value or default
     */
    getItem(key, defaultValue = null) {
        try {
            if (this.isStorageAvailable) {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } else {
                return this.fallbackStorage.get(key) || defaultValue;
            }
        } catch (error) {
            console.error(`Error getting item ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Set item in storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    setItem(key, value) {
        try {
            if (this.isStorageAvailable) {
                localStorage.setItem(key, JSON.stringify(value));
            } else {
                this.fallbackStorage.set(key, value);
            }
            
            pubSub.publish('storage:item:set', { key, value });
            return true;
        } catch (error) {
            console.error(`Error setting item ${key}:`, error);
            return false;
        }
    }

    /**
     * Remove item from storage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    removeItem(key) {
        try {
            if (this.isStorageAvailable) {
                localStorage.removeItem(key);
            } else {
                this.fallbackStorage.delete(key);
            }
            
            pubSub.publish('storage:item:removed', { key });
            return true;
        } catch (error) {
            console.error(`Error removing item ${key}:`, error);
            return false;
        }
    }

    /**
     * Clear all storage
     * @returns {boolean} Success status
     */
    clear() {
        try {
            if (this.isStorageAvailable) {
                // Only clear Dooing-related keys
                Object.values(this.storageKeys).forEach(key => {
                    localStorage.removeItem(key);
                });
            } else {
                this.fallbackStorage.clear();
            }
            
            pubSub.publish('storage:cleared');
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Get all tasks
     * @returns {Array} Array of tasks
     */
    getTasks() {
        return this.getItem(this.storageKeys.TASKS, []);
    }

    /**
     * Save tasks
     * @param {Array} tasks - Array of tasks
     * @returns {boolean} Success status
     */
    saveTasks(tasks) {
        const success = this.setItem(this.storageKeys.TASKS, tasks);
        if (success) {
            pubSub.publish('storage:tasks:saved', { tasks });
        }
        return success;
    }

    /**
     * Get settings
     * @returns {Object} Settings object
     */
    getSettings() {
        return this.getItem(this.storageKeys.SETTINGS, {
            theme: 'default',
            pomodoroSettings: {
                workDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                sessionsUntilLongBreak: 4
            },
            notifications: {
                enabled: true,
                sound: true
            }
        });
    }

    /**
     * Save settings
     * @param {Object} settings - Settings object
     * @returns {boolean} Success status
     */
    saveSettings(settings) {
        const success = this.setItem(this.storageKeys.SETTINGS, settings);
        if (success) {
            pubSub.publish('storage:settings:saved', { settings });
        }
        return success;
    }

    /**
     * Get application state
     * @returns {Object} Application state
     */
    getState() {
        return this.getItem(this.storageKeys.STATE, null);
    }

    /**
     * Save application state
     * @param {Object} state - Application state
     * @returns {boolean} Success status
     */
    saveState(state) {
        return this.setItem(this.storageKeys.STATE, state);
    }

    /**
     * Get pomodoro data
     * @returns {Object} Pomodoro data
     */
    getPomodoroData() {
        return this.getItem(this.storageKeys.POMODORO, {
            sessions: [],
            stats: {
                totalSessions: 0,
                totalWorkTime: 0,
                streakDays: 0
            }
        });
    }

    /**
     * Save pomodoro data
     * @param {Object} pomodoroData - Pomodoro data
     * @returns {boolean} Success status
     */
    savePomodoroData(pomodoroData) {
        const success = this.setItem(this.storageKeys.POMODORO, pomodoroData);
        if (success) {
            pubSub.publish('storage:pomodoro:saved', { pomodoroData });
        }
        return success;
    }

    /**
     * Export all data
     * @returns {Object} All stored data
     */
    exportData() {
        return {
            tasks: this.getTasks(),
            settings: this.getSettings(),
            state: this.getState(),
            pomodoro: this.getPomodoroData(),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import data
     * @param {Object} data - Data to import
     * @returns {boolean} Success status
     */
    importData(data) {
        try {
            if (data.tasks) this.saveTasks(data.tasks);
            if (data.settings) this.saveSettings(data.settings);
            if (data.state) this.saveState(data.state);
            if (data.pomodoro) this.savePomodoroData(data.pomodoro);
            
            pubSub.publish('storage:data:imported', { data });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage stats
     */
    getStorageInfo() {
        if (!this.isStorageAvailable) {
            return {
                isAvailable: false,
                used: this.fallbackStorage.size,
                total: Infinity,
                percentage: 0
            };
        }

        try {
            let used = 0;
            Object.values(this.storageKeys).forEach(key => {
                const item = localStorage.getItem(key);
                if (item) {
                    used += new Blob([item]).size;
                }
            });

            // Rough estimate of localStorage limit (usually 5-10MB)
            const total = 5 * 1024 * 1024; // 5MB
            
            return {
                isAvailable: true,
                used,
                total,
                percentage: (used / total) * 100
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return {
                isAvailable: true,
                used: 0,
                total: 0,
                percentage: 0
            };
        }
    }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
