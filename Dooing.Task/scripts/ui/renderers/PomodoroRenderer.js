import { pubSub } from '../../events/PubSub.js';
import { appState } from '../../core/AppState.js';
import { pomodoroManager } from '../../core/PomodoroManager.js';
import { taskManager } from '../../core/TaskManager.js';

/**
 * PomodoroRenderer
 * Handles all Pomodoro timer UI rendering and updates
 */
class PomodoroRenderer {
    constructor() {
        this.initialized = false;
        this.elements = {};
        
        this.setupEventListeners();
    }

    /**
     * Initialize the renderer
     */
    init() {
        if (this.initialized) return;

        this.cacheElements();
        this.renderInitialState();
        this.initialized = true;
        
        pubSub.publish('pomodoroRenderer:initialized');
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            container: document.querySelector('.pomodoro-container'),
            timer: document.querySelector('.pomodoro-timer'),
            timeDisplay: document.querySelector('.pomodoro-time'),
            progressCircle: document.querySelector('.pomodoro-progress-circle'),
            progressBar: document.querySelector('.pomodoro-progress-bar'),
            statusText: document.querySelector('.pomodoro-status'),
            startPauseBtn: document.querySelector('[data-action="pomodoro-toggle"]'),
            resetBtn: document.querySelector('[data-action="pomodoro-reset"]'),
            skipBtn: document.querySelector('[data-action="pomodoro-skip"]'),
            settingsBtn: document.querySelector('[data-action="pomodoro-settings"]'),
            currentTaskDisplay: document.querySelector('.pomodoro-current-task'),
            sessionCounter: document.querySelector('.pomodoro-session-count'),
            cycleIndicator: document.querySelector('.pomodoro-cycle-indicator')
        };
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for pomodoro state changes
        appState.observe('pomodoro', (newPomodoro) => {
            this.updateDisplay(newPomodoro);
        });

        // Listen for pomodoro events
        pubSub.subscribe('pomodoro:started', (data) => {
            this.handlePomodoroStarted(data);
        });

        pubSub.subscribe('pomodoro:paused', (data) => {
            this.handlePomodoroPaused(data);
        });

        pubSub.subscribe('pomodoro:resumed', (data) => {
            this.handlePomodoroResumed(data);
        });

        pubSub.subscribe('pomodoro:stopped', () => {
            this.handlePomodoroStopped();
        });

        pubSub.subscribe('pomodoro:tick', (data) => {
            this.updateTimer(data);
        });

        pubSub.subscribe('pomodoro:session:completed', (data) => {
            this.handleSessionCompleted(data);
        });

        pubSub.subscribe('pomodoro:cycle:changed', (data) => {
            this.handleCycleChanged(data);
        });

        pubSub.subscribe('pomodoro:settings:updated', (data) => {
            this.handleSettingsUpdated(data);
        });

        // Listen for UI toggle events
        pubSub.subscribe('pomodoro:toggle', () => {
            this.handleToggleClick();
        });

        pubSub.subscribe('pomodoro:reset', () => {
            this.handleResetClick();
        });

        pubSub.subscribe('pomodoro:skip', () => {
            this.handleSkipClick();
        });

        pubSub.subscribe('pomodoro:settings:toggle', () => {
            this.handleSettingsToggle();
        });
    }

    /**
     * Render initial state
     */
    renderInitialState() {
        const pomodoroState = appState.get('pomodoro');
        if (pomodoroState) {
            this.updateDisplay(pomodoroState);
        }
    }

    /**
     * Update the entire display
     * @param {Object} pomodoroState - Pomodoro state
     */
    updateDisplay(pomodoroState) {
        if (!this.initialized) return;

        this.updateTimer({
            timeRemaining: pomodoroState.timeRemaining,
            progress: this.calculateProgress(pomodoroState)
        });
        
        this.updateControls(pomodoroState);
        this.updateStatus(pomodoroState);
        this.updateCurrentTask(pomodoroState);
        this.updateSessionInfo(pomodoroState);
        this.updateCycleIndicator(pomodoroState);
    }

    /**
     * Update timer display
     * @param {Object} data - Timer data
     */
    updateTimer(data) {
        if (!this.elements.timeDisplay) return;

        const timeRemaining = data.timeRemaining;
        const formattedTime = this.formatTime(timeRemaining);
        
        this.elements.timeDisplay.textContent = formattedTime;
        
        // Update progress indicators
        if (data.progress !== undefined) {
            this.updateProgress(data.progress);
        }

        // Update document title with timer
        const pomodoroState = appState.get('pomodoro');
        if (pomodoroState?.isActive && !pomodoroState?.isPaused) {
            document.title = `${formattedTime} - ${this.getCycleDisplayName(pomodoroState.currentCycle)} - Dooing`;
        }
    }

    /**
     * Update progress indicators
     * @param {number} progress - Progress percentage (0-100)
     */
    updateProgress(progress) {
        // Update circular progress
        if (this.elements.progressCircle) {
            const circumference = 2 * Math.PI * 50; // radius = 50
            const offset = circumference - (progress / 100) * circumference;
            this.elements.progressCircle.style.strokeDashoffset = offset;
        }

        // Update linear progress bar
        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${progress}%`;
        }
    }

    /**
     * Update control buttons
     * @param {Object} pomodoroState - Pomodoro state
     */
    updateControls(pomodoroState) {
        if (!this.elements.startPauseBtn) return;

        const isRunning = pomodoroState.isActive && !pomodoroState.isPaused;
        const isPaused = pomodoroState.isActive && pomodoroState.isPaused;

        // Update start/pause button
        if (isRunning) {
            this.elements.startPauseBtn.textContent = '⏸️';
            this.elements.startPauseBtn.setAttribute('aria-label', 'Pause timer');
            this.elements.startPauseBtn.title = 'Pause';
        } else {
            this.elements.startPauseBtn.textContent = '▶️';
            this.elements.startPauseBtn.setAttribute('aria-label', isPaused ? 'Resume timer' : 'Start timer');
            this.elements.startPauseBtn.title = isPaused ? 'Resume' : 'Start';
        }

        // Update other buttons
        if (this.elements.resetBtn) {
            this.elements.resetBtn.disabled = !pomodoroState.isActive;
        }

        if (this.elements.skipBtn) {
            this.elements.skipBtn.disabled = !pomodoroState.isActive;
        }

        // Update container state classes
        if (this.elements.container) {
            this.elements.container.classList.toggle('running', isRunning);
            this.elements.container.classList.toggle('paused', isPaused);
            this.elements.container.classList.toggle('stopped', !pomodoroState.isActive);
        }
    }

    /**
     * Update status display
     * @param {Object} pomodoroState - Pomodoro state
     */
    updateStatus(pomodoroState) {
        if (!this.elements.statusText) return;

        let statusText = '';
        
        if (pomodoroState.isActive) {
            if (pomodoroState.isPaused) {
                statusText = `${this.getCycleDisplayName(pomodoroState.currentCycle)} - Paused`;
            } else {
                statusText = `${this.getCycleDisplayName(pomodoroState.currentCycle)} - Running`;
            }
        } else {
            statusText = `${this.getCycleDisplayName(pomodoroState.currentCycle)} - Ready to start`;
        }

        this.elements.statusText.textContent = statusText;
    }

    /**
     * Update current task display
     * @param {Object} pomodoroState - Pomodoro state
     */
    updateCurrentTask(pomodoroState) {
        if (!this.elements.currentTaskDisplay) return;

        if (pomodoroState.currentTask) {
            const task = taskManager.getTaskById(pomodoroState.currentTask);
            if (task) {
                this.elements.currentTaskDisplay.innerHTML = `
                    <div class="current-task">
                        <span class="label">Working on:</span>
                        <span class="task-name">${this.escapeHtml(task.title || task.name)}</span>
                    </div>
                `;
                this.elements.currentTaskDisplay.style.display = 'block';
            }
        } else {
            this.elements.currentTaskDisplay.style.display = 'none';
        }
    }

    /**
     * Update session info
     * @param {Object} pomodoroState - Pomodoro state
     */
    updateSessionInfo(pomodoroState) {
        if (this.elements.sessionCounter) {
            const sessionsPerCycle = pomodoroState.settings?.sessionsPerCycle || 4;
            const currentSession = (pomodoroState.sessionCount % sessionsPerCycle) + 1;
            this.elements.sessionCounter.innerHTML = `
                <span class="session-count">${currentSession}/${sessionsPerCycle}</span>
                <span class="session-label">Session</span>
            `;
        }
    }

    /**
     * Update cycle indicator
     * @param {Object} pomodoroState - Pomodoro state
     */
    updateCycleIndicator(pomodoroState) {
        if (!this.elements.cycleIndicator) return;

        const cycleClass = `cycle-${pomodoroState.currentCycle}`;
        this.elements.cycleIndicator.className = `pomodoro-cycle-indicator ${cycleClass}`;
        
        const cycleIcon = this.getCycleIcon(pomodoroState.currentCycle);
        this.elements.cycleIndicator.innerHTML = `
            <span class="cycle-icon">${cycleIcon}</span>
            <span class="cycle-name">${this.getCycleDisplayName(pomodoroState.currentCycle)}</span>
        `;
    }

    /**
     * Calculate progress percentage
     * @param {Object} pomodoroState - Pomodoro state
     * @returns {number} Progress percentage
     */
    calculateProgress(pomodoroState) {
        if (pomodoroState.totalDuration === 0) return 0;
        
        const elapsed = pomodoroState.totalDuration - pomodoroState.timeRemaining;
        return Math.round((elapsed / pomodoroState.totalDuration) * 100);
    }

    /**
     * Format time for display
     * @param {number} milliseconds - Time in milliseconds
     * @returns {string} Formatted time (MM:SS)
     */
    formatTime(milliseconds) {
        const totalSeconds = Math.ceil(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Get display name for cycle
     * @param {string} cycle - Cycle type
     * @returns {string} Display name
     */
    getCycleDisplayName(cycle) {
        const names = {
            work: 'Focus Time',
            shortBreak: 'Short Break',
            longBreak: 'Long Break'
        };
        return names[cycle] || cycle;
    }

    /**
     * Get icon for cycle
     * @param {string} cycle - Cycle type
     * @returns {string} Icon
     */
    getCycleIcon(cycle) {
        const icons = {
            work: '🍅',
            shortBreak: '☕',
            longBreak: '🌳'
        };
        return icons[cycle] || '⏱️';
    }

    /**
     * Escape HTML for safe display
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Event handlers
     */
    handleToggleClick() {
        const pomodoroState = appState.get('pomodoro');
        
        if (pomodoroState.isActive) {
            if (pomodoroState.isPaused) {
                pomodoroManager.resume();
            } else {
                pomodoroManager.pause();
            }
        } else {
            pomodoroManager.start();
        }
    }

    handleResetClick() {
        pomodoroManager.reset();
    }

    handleSkipClick() {
        pomodoroManager.skip();
    }

    handleSettingsToggle() {
        pubSub.publish('modal:open', {
            type: 'pomodoroSettings'
        });
    }

    handlePomodoroStarted(data) {
        // Add visual feedback
        if (this.elements.container) {
            this.elements.container.classList.add('session-starting');
            setTimeout(() => {
                this.elements.container?.classList.remove('session-starting');
            }, 1000);
        }
    }

    handlePomodoroPaused(data) {
        // Reset document title
        document.title = 'Dooing - Task Manager';
    }

    handlePomodoroResumed(data) {
        // Visual feedback handled by updateControls
    }

    handlePomodoroStopped() {
        // Reset document title
        document.title = 'Dooing - Task Manager';
        
        // Visual feedback
        if (this.elements.container) {
            this.elements.container.classList.remove('session-starting', 'running', 'paused');
        }
    }

    handleSessionCompleted(data) {
        // Add completion animation
        if (this.elements.container) {
            this.elements.container.classList.add('session-completed');
            setTimeout(() => {
                this.elements.container?.classList.remove('session-completed');
            }, 2000);
        }

        // Reset document title
        document.title = 'Dooing - Task Manager';
    }

    handleCycleChanged(data) {
        // Update display to reflect new cycle
        const pomodoroState = appState.get('pomodoro');
        this.updateDisplay(pomodoroState);
    }

    handleSettingsUpdated(data) {
        // Re-render with new settings
        const pomodoroState = appState.get('pomodoro');
        this.updateDisplay(pomodoroState);
    }

    /**
     * Render settings panel
     * @param {Object} settings - Pomodoro settings
     */
    renderSettings(settings) {
        // This would be called by ModalManager when settings modal opens
        return `
            <div class="pomodoro-settings">
                <h3>Pomodoro Settings</h3>
                
                <div class="setting-group">
                    <label for="focus-duration">Focus Duration (minutes)</label>
                    <input type="range" id="focus-duration" 
                           min="5" max="60" value="${settings.focusDuration}"
                           data-setting="focusDuration">
                    <span class="setting-value">${settings.focusDuration}</span>
                </div>

                <div class="setting-group">
                    <label for="short-break-duration">Short Break (minutes)</label>
                    <input type="range" id="short-break-duration" 
                           min="1" max="30" value="${settings.shortBreakDuration}"
                           data-setting="shortBreakDuration">
                    <span class="setting-value">${settings.shortBreakDuration}</span>
                </div>

                <div class="setting-group">
                    <label for="long-break-duration">Long Break (minutes)</label>
                    <input type="range" id="long-break-duration" 
                           min="5" max="60" value="${settings.longBreakDuration}"
                           data-setting="longBreakDuration">
                    <span class="setting-value">${settings.longBreakDuration}</span>
                </div>

                <div class="setting-group">
                    <label for="sessions-per-cycle">Sessions per Cycle</label>
                    <input type="range" id="sessions-per-cycle" 
                           min="2" max="10" value="${settings.sessionsPerCycle}"
                           data-setting="sessionsPerCycle">
                    <span class="setting-value">${settings.sessionsPerCycle}</span>
                </div>

                <div class="setting-group">
                    <label>
                        <input type="checkbox" ${settings.autoStartWork ? 'checked' : ''}
                               data-setting="autoStartWork">
                        Auto-start work sessions
                    </label>
                </div>

                <div class="setting-group">
                    <label>
                        <input type="checkbox" ${settings.autoStartBreak ? 'checked' : ''}
                               data-setting="autoStartBreak">
                        Auto-start break sessions
                    </label>
                </div>

                <div class="setting-group">
                    <label>
                        <input type="checkbox" ${settings.soundNotifications ? 'checked' : ''}
                               data-setting="soundNotifications">
                        Sound notifications
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Get renderer statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        return {
            initialized: this.initialized,
            elementsFound: Object.keys(this.elements).filter(key => this.elements[key]).length,
            totalElements: Object.keys(this.elements).length
        };
    }

    /**
     * Cleanup renderer
     */
    cleanup() {
        // Reset document title
        document.title = 'Dooing - Task Manager';
        
        this.initialized = false;
        this.elements = {};
        
        pubSub.publish('pomodoroRenderer:cleanup');
    }
}

// Create and export singleton instance
export const pomodoroRenderer = new PomodoroRenderer();
export default pomodoroRenderer;
