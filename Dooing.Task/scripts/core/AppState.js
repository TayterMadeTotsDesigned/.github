import { pubSub } from '../events/PubSub.js';

/**
 * AppState Singleton
 * Central state management for the application
 */
class AppState {
    constructor() {
        if (AppState.instance) {
            return AppState.instance;
        }

        this.state = {
            tasks: [],
            currentView: 'today', // today, tomorrow, future
            selectedDate: new Date().toISOString().split('T')[0],
            theme: 'default',
            pomodoro: {
                isActive: false,
                timeRemaining: 25 * 60 * 1000, // 25 minutes in milliseconds
                currentTask: null,
                cycle: 'work' // work, shortBreak, longBreak
            },
            ui: {
                isModalOpen: false,
                currentModal: null,
                sidebarCollapsed: false
            }
        };

        this.observers = new Map();
        AppState.instance = this;
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get specific state property
     * @param {string} path - Dot notation path (e.g., 'pomodoro.isActive')
     * @returns {*} State value
     */
    get(path) {
        return path.split('.').reduce((obj, key) => obj?.[key], this.state);
    }

    /**
     * Update state
     * @param {Object} updates - State updates
     * @param {boolean} silent - Skip notifications if true
     */
    setState(updates, silent = false) {
        const prevState = { ...this.state };
        this.state = this.mergeDeep(this.state, updates);

        if (!silent) {
            // Publish general state change
            pubSub.publish('state:changed', {
                prevState,
                newState: this.state,
                updates
            });

            // Publish specific change events
            this.notifyObservers(updates, prevState);
        }
    }

    /**
     * Set specific state property
     * @param {string} path - Dot notation path
     * @param {*} value - New value
     * @param {boolean} silent - Skip notifications if true
     */
    set(path, value, silent = false) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => {
            if (!obj[key]) obj[key] = {};
            return obj[key];
        }, this.state);

        const prevValue = target[lastKey];
        target[lastKey] = value;

        if (!silent && prevValue !== value) {
            pubSub.publish(`state:${path}:changed`, {
                path,
                prevValue,
                newValue: value
            });

            pubSub.publish('state:changed', {
                prevState: this.state,
                newState: this.state,
                updates: { [path]: value }
            });
        }
    }

    /**
     * Deep merge objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    mergeDeep(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.mergeDeep(result[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * Notify observers of specific changes
     * @param {Object} updates - State updates
     * @param {Object} prevState - Previous state
     */
    notifyObservers(updates, prevState) {
        Object.keys(updates).forEach(key => {
            if (this.observers.has(key)) {
                this.observers.get(key).forEach(callback => {
                    try {
                        callback(updates[key], prevState[key]);
                    } catch (error) {
                        console.error(`Error in state observer for ${key}:`, error);
                    }
                });
            }
        });
    }

    /**
     * Observe state changes for a specific property
     * @param {string} property - Property to observe
     * @param {Function} callback - Callback function
     * @returns {Function} Unobserve function
     */
    observe(property, callback) {
        if (!this.observers.has(property)) {
            this.observers.set(property, new Set());
        }
        
        this.observers.get(property).add(callback);
        
        return () => {
            this.observers.get(property).delete(callback);
        };
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this.setState({
            tasks: [],
            currentView: 'today',
            selectedDate: new Date().toISOString().split('T')[0],
            theme: 'default',
            pomodoro: {
                isActive: false,
                timeRemaining: 25 * 60 * 1000,
                currentTask: null,
                cycle: 'work'
            },
            ui: {
                isModalOpen: false,
                currentModal: null,
                sidebarCollapsed: false
            }
        });
    }

    /**
     * Serialize state for storage
     * @returns {string} Serialized state
     */
    serialize() {
        return JSON.stringify(this.state);
    }

    /**
     * Load state from serialized data
     * @param {string} serializedState - Serialized state
     */
    deserialize(serializedState) {
        try {
            const state = JSON.parse(serializedState);
            this.setState(state, true); // Silent update during deserialization
        } catch (error) {
            console.error('Failed to deserialize state:', error);
        }
    }
}

// Export singleton instance
export const appState = new AppState();
export default appState;
