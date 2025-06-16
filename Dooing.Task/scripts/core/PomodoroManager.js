import { pubSub } from '../events/PubSub.js';
import { appState } from './AppState.js';
import { storageService } from './StorageService.js';
import { generateId } from '../utils/helpers.js';

/**
 * PomodoroManager
 * Core business logic for Pomodoro timer functionality
 */
class PomodoroManager {
    constructor() {
        this.timer = null;
        this.initialized = false;
        
        // Default settings
        this.defaultSettings = {
            focusDuration: 25, // minutes
            shortBreakDuration: 5, // minutes
            longBreakDuration: 15, // minutes
            sessionsPerCycle: 4,
            autoStartWork: false,
            autoStartBreak: false,
            skipAction: 'skip', // 'skip', 'reset', 'complete'
            soundNotifications: true,
            playTickSound: false,
            volume: 0.5
        };

        this.sessionTypes = {
            WORK: 'work',
            SHORT_BREAK: 'shortBreak',
            LONG_BREAK: 'longBreak'
        };

        this.setupEventListeners();
    }

    /**
     * Initialize PomodoroManager
     */
    async init() {
        if (this.initialized) return;

        try {
            // Load settings from storage
            const savedSettings = storageService.getSettings();
            const pomodoroSettings = savedSettings.pomodoroSettings || {};
            const settings = { ...this.defaultSettings, ...pomodoroSettings };

            // Initialize state
            const initialState = {
                isActive: false,
                isPaused: false,
                currentCycle: this.sessionTypes.WORK,
                timeRemaining: settings.focusDuration * 60 * 1000, // Convert to milliseconds
                totalDuration: settings.focusDuration * 60 * 1000,
                sessionCount: 0,
                currentTask: null,
                settings
            };

            appState.set('pomodoro', initialState, true);

            // Load pomodoro data
            const pomodoroData = storageService.getPomodoroData();
            this.loadPomodoroData(pomodoroData);

            this.initialized = true;
            pubSub.publish('pomodoro:initialized');

        } catch (error) {
            console.error('Failed to initialize PomodoroManager:', error);
            pubSub.publish('pomodoro:error', { error, action: 'init' });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for settings changes
        appState.observe('pomodoro', (newPomodoro, oldPomodoro) => {
            if (newPomodoro?.settings !== oldPomodoro?.settings) {
                this.saveSettings(newPomodoro.settings);
            }
        });

        // Handle visibility changes (pause when tab not visible)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isRunning()) {
                pubSub.publish('pomodoro:visibility:hidden');
            } else if (!document.hidden && this.isRunning()) {
                pubSub.publish('pomodoro:visibility:visible');
            }
        });
    }

    /**
     * Start timer
     * @param {string} taskId - Optional task ID to associate with session
     */
    start(taskId = null) {
        if (this.isRunning()) {
            console.warn('Timer is already running');
            return;
        }

        const pomodoroState = appState.get('pomodoro');
        
        // Set current task if provided
        if (taskId) {
            appState.set('pomodoro.currentTask', taskId);
        }

        // Start the timer
        appState.set('pomodoro.isActive', true);
        appState.set('pomodoro.isPaused', false);

        this.timer = setInterval(() => {
            this.tick();
        }, 1000);

        // Create session record
        this.createSessionRecord('started');

        pubSub.publish('pomodoro:started', {
            cycle: pomodoroState.currentCycle,
            duration: pomodoroState.totalDuration,
            taskId
        });
    }

    /**
     * Pause timer
     */
    pause() {
        if (!this.isRunning()) {
            console.warn('Timer is not running');
            return;
        }

        appState.set('pomodoro.isPaused', true);
        this.clearTimer();

        pubSub.publish('pomodoro:paused', {
            timeRemaining: appState.get('pomodoro.timeRemaining')
        });
    }

    /**
     * Resume timer
     */
    resume() {
        const pomodoroState = appState.get('pomodoro');
        
        if (!pomodoroState.isActive || !pomodoroState.isPaused) {
            console.warn('Timer is not paused');
            return;
        }

        appState.set('pomodoro.isPaused', false);

        this.timer = setInterval(() => {
            this.tick();
        }, 1000);

        pubSub.publish('pomodoro:resumed', {
            timeRemaining: pomodoroState.timeRemaining
        });
    }

    /**
     * Stop and reset timer
     */
    stop() {
        this.clearTimer();
        
        const pomodoroState = appState.get('pomodoro');
        const duration = this.getDurationForCycle(pomodoroState.currentCycle);

        appState.set('pomodoro.isActive', false);
        appState.set('pomodoro.isPaused', false);
        appState.set('pomodoro.timeRemaining', duration);
        appState.set('pomodoro.totalDuration', duration);
        appState.set('pomodoro.currentTask', null);

        pubSub.publish('pomodoro:stopped');
    }

    /**
     * Skip current session
     */
    skip() {
        const pomodoroState = appState.get('pomodoro');
        const settings = pomodoroState.settings;

        switch (settings.skipAction) {
            case 'skip':
                this.completeSession();
                break;
            case 'reset':
                this.reset();
                break;
            case 'complete':
                this.markSessionComplete();
                break;
        }

        pubSub.publish('pomodoro:skipped', {
            action: settings.skipAction
        });
    }

    /**
     * Reset timer to current cycle duration
     */
    reset() {
        const wasRunning = this.isRunning();
        this.clearTimer();

        const pomodoroState = appState.get('pomodoro');
        const duration = this.getDurationForCycle(pomodoroState.currentCycle);

        appState.set('pomodoro.isActive', false);
        appState.set('pomodoro.isPaused', false);
        appState.set('pomodoro.timeRemaining', duration);
        appState.set('pomodoro.totalDuration', duration);

        pubSub.publish('pomodoro:reset', { wasRunning });
    }

    /**
     * Timer tick handler
     */
    tick() {
        const pomodoroState = appState.get('pomodoro');
        
        if (pomodoroState.isPaused) return;

        const newTimeRemaining = pomodoroState.timeRemaining - 1000; // Subtract 1 second

        if (newTimeRemaining <= 0) {
            this.completeSession();
        } else {
            appState.set('pomodoro.timeRemaining', newTimeRemaining);
            pubSub.publish('pomodoro:tick', {
                timeRemaining: newTimeRemaining,
                progress: this.getProgress()
            });
        }
    }

    /**
     * Complete current session
     */
    completeSession() {
        this.clearTimer();
        
        const pomodoroState = appState.get('pomodoro');
        
        // Create completion record
        this.createSessionRecord('completed');

        // Update session count for work sessions
        if (pomodoroState.currentCycle === this.sessionTypes.WORK) {
            appState.set('pomodoro.sessionCount', pomodoroState.sessionCount + 1);
        }

        // Determine next cycle
        const nextCycle = this.getNextCycle();
        this.switchToCycle(nextCycle);

        pubSub.publish('pomodoro:session:completed', {
            completedCycle: pomodoroState.currentCycle,
            nextCycle,
            sessionCount: pomodoroState.sessionCount
        });

        // Auto-start next session if enabled
        if (this.shouldAutoStart(nextCycle)) {
            setTimeout(() => this.start(), 1000);
        }
    }

    /**
     * Mark session as manually completed
     */
    markSessionComplete() {
        const pomodoroState = appState.get('pomodoro');
        
        this.createSessionRecord('manual_complete');
        this.completeSession();
        
        pubSub.publish('pomodoro:session:manual_complete', {
            cycle: pomodoroState.currentCycle
        });
    }

    /**
     * Switch to specific cycle
     * @param {string} cycle - Cycle type
     */
    switchToCycle(cycle) {
        const duration = this.getDurationForCycle(cycle);
        
        appState.set('pomodoro.currentCycle', cycle);
        appState.set('pomodoro.timeRemaining', duration);
        appState.set('pomodoro.totalDuration', duration);
        appState.set('pomodoro.isActive', false);
        appState.set('pomodoro.isPaused', false);
        appState.set('pomodoro.currentTask', null);

        pubSub.publish('pomodoro:cycle:changed', {
            cycle,
            duration
        });
    }

    /**
     * Get next cycle in sequence
     * @returns {string} Next cycle type
     */
    getNextCycle() {
        const pomodoroState = appState.get('pomodoro');
        const { currentCycle, sessionCount, settings } = pomodoroState;

        if (currentCycle === this.sessionTypes.WORK) {
            // After work, determine if long or short break
            const nextSessionNumber = sessionCount + 1;
            if (nextSessionNumber % settings.sessionsPerCycle === 0) {
                return this.sessionTypes.LONG_BREAK;
            } else {
                return this.sessionTypes.SHORT_BREAK;
            }
        } else {
            // After any break, go to work
            return this.sessionTypes.WORK;
        }
    }

    /**
     * Get duration for cycle type
     * @param {string} cycle - Cycle type
     * @returns {number} Duration in milliseconds
     */
    getDurationForCycle(cycle) {
        const settings = appState.get('pomodoro.settings');
        
        switch (cycle) {
            case this.sessionTypes.WORK:
                return settings.focusDuration * 60 * 1000;
            case this.sessionTypes.SHORT_BREAK:
                return settings.shortBreakDuration * 60 * 1000;
            case this.sessionTypes.LONG_BREAK:
                return settings.longBreakDuration * 60 * 1000;
            default:
                return settings.focusDuration * 60 * 1000;
        }
    }

    /**
     * Check if auto-start is enabled for cycle
     * @param {string} cycle - Cycle type
     * @returns {boolean} Should auto-start
     */
    shouldAutoStart(cycle) {
        const settings = appState.get('pomodoro.settings');
        
        return cycle === this.sessionTypes.WORK 
            ? settings.autoStartWork 
            : settings.autoStartBreak;
    }

    /**
     * Update settings
     * @param {Object} newSettings - New settings
     */
    updateSettings(newSettings) {
        const currentSettings = appState.get('pomodoro.settings');
        const updatedSettings = { ...currentSettings, ...newSettings };
        
        appState.set('pomodoro.settings', updatedSettings);
        
        // If duration changed and timer is not running, update current timer
        if (!this.isRunning()) {
            const pomodoroState = appState.get('pomodoro');
            const newDuration = this.getDurationForCycle(pomodoroState.currentCycle);
            
            appState.set('pomodoro.timeRemaining', newDuration);
            appState.set('pomodoro.totalDuration', newDuration);
        }

        pubSub.publish('pomodoro:settings:updated', { settings: updatedSettings });
    }

    /**
     * Get current progress percentage
     * @returns {number} Progress (0-100)
     */
    getProgress() {
        const pomodoroState = appState.get('pomodoro');
        const { timeRemaining, totalDuration } = pomodoroState;
        
        if (totalDuration === 0) return 0;
        
        const elapsed = totalDuration - timeRemaining;
        return Math.round((elapsed / totalDuration) * 100);
    }

    /**
     * Get formatted time remaining
     * @returns {string} Formatted time (MM:SS)
     */
    getFormattedTimeRemaining() {
        const timeRemaining = appState.get('pomodoro.timeRemaining');
        const totalSeconds = Math.ceil(timeRemaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Check if timer is running
     * @returns {boolean} Is running
     */
    isRunning() {
        const pomodoroState = appState.get('pomodoro');
        return pomodoroState.isActive && !pomodoroState.isPaused;
    }

    /**
     * Check if timer is paused
     * @returns {boolean} Is paused
     */
    isPaused() {
        const pomodoroState = appState.get('pomodoro');
        return pomodoroState.isActive && pomodoroState.isPaused;
    }

    /**
     * Get current state summary
     * @returns {Object} State summary
     */
    getState() {
        const pomodoroState = appState.get('pomodoro');
        
        return {
            ...pomodoroState,
            isRunning: this.isRunning(),
            isPaused: this.isPaused(),
            progress: this.getProgress(),
            formattedTime: this.getFormattedTimeRemaining()
        };
    }

    /**
     * Create session record for statistics
     * @param {string} action - Action type (started, completed, paused, etc.)
     */
    createSessionRecord(action) {
        const pomodoroState = appState.get('pomodoro');
        const pomodoroData = storageService.getPomodoroData();
        
        const session = {
            id: generateId('session'),
            type: pomodoroState.currentCycle,
            action,
            taskId: pomodoroState.currentTask,
            startTime: new Date().toISOString(),
            duration: pomodoroState.totalDuration,
            timeRemaining: pomodoroState.timeRemaining,
            completed: action === 'completed' || action === 'manual_complete'
        };

        pomodoroData.sessions.push(session);
        
        // Update stats
        if (action === 'completed' && pomodoroState.currentCycle === this.sessionTypes.WORK) {
            pomodoroData.stats.totalSessions++;
            pomodoroData.stats.totalWorkTime += pomodoroState.totalDuration;
        }

        storageService.savePomodoroData(pomodoroData);
        
        pubSub.publish('pomodoro:session:recorded', { session });
    }

    /**
     * Save settings to storage
     * @param {Object} settings - Settings to save
     */
    saveSettings(settings) {
        const currentSettings = storageService.getSettings();
        const updatedSettings = {
            ...currentSettings,
            pomodoroSettings: settings
        };
        
        storageService.saveSettings(updatedSettings);
    }

    /**
     * Load pomodoro data from storage
     * @param {Object} data - Pomodoro data
     */
    loadPomodoroData(data) {
        // Process any incomplete sessions
        if (data.sessions) {
            const incompleteSessions = data.sessions.filter(s => !s.completed);
            if (incompleteSessions.length > 0) {
                pubSub.publish('pomodoro:incomplete:sessions', { sessions: incompleteSessions });
            }
        }
    }

    /**
     * Clear timer interval
     */
    clearTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    /**
     * Get statistics
     * @returns {Object} Pomodoro statistics
     */
    getStatistics() {
        const pomodoroData = storageService.getPomodoroData();
        const today = new Date().toDateString();
        
        const todaySessions = pomodoroData.sessions.filter(s => 
            new Date(s.startTime).toDateString() === today
        );

        return {
            ...pomodoroData.stats,
            todaysSessions: todaySessions.length,
            todaysWorkTime: todaySessions
                .filter(s => s.type === this.sessionTypes.WORK && s.completed)
                .reduce((total, s) => total + s.duration, 0)
        };
    }

    /**
     * Reset all statistics
     */
    resetStatistics() {
        const emptyData = {
            sessions: [],
            stats: {
                totalSessions: 0,
                totalWorkTime: 0,
                streakDays: 0
            }
        };
        
        storageService.savePomodoroData(emptyData);
        pubSub.publish('pomodoro:stats:reset');
    }

    /**
     * Export pomodoro data
     * @returns {Object} Export data
     */
    exportData() {
        return {
            pomodoro: storageService.getPomodoroData(),
            settings: appState.get('pomodoro.settings'),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import pomodoro data
     * @param {Object} data - Import data
     * @returns {boolean} Success status
     */
    importData(data) {
        try {
            if (data.pomodoro) {
                storageService.savePomodoroData(data.pomodoro);
            }
            
            if (data.settings) {
                this.updateSettings(data.settings);
            }

            pubSub.publish('pomodoro:data:imported', { data });
            return true;
        } catch (error) {
            console.error('Failed to import pomodoro data:', error);
            pubSub.publish('pomodoro:error', { error, action: 'import' });
            return false;
        }
    }
}

// Export singleton instance
export const pomodoroManager = new PomodoroManager();
export default pomodoroManager;
