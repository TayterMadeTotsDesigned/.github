// pomodoro.js - Pomodoro Timer Module
import Storage from './storage.js';

class PomodoroTimer {
    constructor() {
        this.currentSession = 'focus'; // 'focus', 'shortBreak', 'longBreak'
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = 0;
        this.sessionCount = 0;
        this.timer = null;
        this.totalDuration = 0;
        
        // Default settings
        this.settings = {
            focusDuration: 25, // minutes
            shortBreakDuration: 5, // minutes
            longBreakDuration: 15, // minutes
            sessionsPerCycle: 4,
            autoStartWork: false,
            autoStartBreak: false,
            skipAction: 'skip', // 'skip', 'reset', 'complete'
            soundNotifications: true
        };
        
        this.loadSettings();
        this.initializeTimer();
        this.bindEvents();
    }
    
    loadSettings() {
        const savedSettings = Storage.load('pomodoroSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
        }
    }
    
    saveSettings() {
        Storage.save('pomodoroSettings', this.settings);
    }
    
    initializeTimer() {
        this.timeRemaining = this.settings.focusDuration * 60; // Convert to seconds
        this.totalDuration = this.timeRemaining;
        this.updateDisplay();
        this.updateSessionIndicator();
    }
    
    bindEvents() {
        // Timer control buttons
        const startPauseBtn = document.getElementById('pomodoro-start-pause');
        const resetBtn = document.getElementById('pomodoro-reset');
        const skipBtn = document.getElementById('pomodoro-skip');
        
        if (startPauseBtn) {
            startPauseBtn.addEventListener('click', () => this.toggleTimer());
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetTimer());
        }
        
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.handleSkip());
        }
        
        // Settings toggle button
        const settingsBtn = document.getElementById('pomodoro-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.toggleSettings());
        }
        
        // Settings sliders and inputs
        this.bindSettingsEvents();
    }
    
    bindSettingsEvents() {
        // Duration sliders
        const focusSlider = document.getElementById('focus-duration');
        const shortBreakSlider = document.getElementById('short-break-duration');
        const longBreakSlider = document.getElementById('long-break-duration');
        const sessionsSlider = document.getElementById('sessions-per-cycle');
        
        if (focusSlider) {
            focusSlider.addEventListener('input', (e) => {
                this.settings.focusDuration = parseInt(e.target.value);
                document.getElementById('focus-value').textContent = e.target.value;
                this.saveSettings();
                if (this.currentSession === 'focus' && !this.isRunning) {
                    this.timeRemaining = this.settings.focusDuration * 60;
                    this.totalDuration = this.timeRemaining;
                    this.updateDisplay();
                }
            });
        }
        
        if (shortBreakSlider) {
            shortBreakSlider.addEventListener('input', (e) => {
                this.settings.shortBreakDuration = parseInt(e.target.value);
                document.getElementById('short-break-value').textContent = e.target.value;
                this.saveSettings();
                if (this.currentSession === 'shortBreak' && !this.isRunning) {
                    this.timeRemaining = this.settings.shortBreakDuration * 60;
                    this.totalDuration = this.timeRemaining;
                    this.updateDisplay();
                }
            });
        }
        
        if (longBreakSlider) {
            longBreakSlider.addEventListener('input', (e) => {
                this.settings.longBreakDuration = parseInt(e.target.value);
                document.getElementById('long-break-value').textContent = e.target.value;
                this.saveSettings();
                if (this.currentSession === 'longBreak' && !this.isRunning) {
                    this.timeRemaining = this.settings.longBreakDuration * 60;
                    this.totalDuration = this.timeRemaining;
                    this.updateDisplay();
                }
            });
        }
        
        if (sessionsSlider) {
            sessionsSlider.addEventListener('input', (e) => {
                this.settings.sessionsPerCycle = parseInt(e.target.value);
                document.getElementById('sessions-value').textContent = e.target.value;
                this.saveSettings();
                this.updateSessionIndicator();
            });
        }
        
        // Checkboxes
        const autoStartWork = document.getElementById('auto-start-work');
        const autoStartBreak = document.getElementById('auto-start-break');
        const soundNotifications = document.getElementById('sound-notifications');
        
        if (autoStartWork) {
            autoStartWork.addEventListener('change', (e) => {
                this.settings.autoStartWork = e.target.checked;
                this.saveSettings();
            });
        }
        
        if (autoStartBreak) {
            autoStartBreak.addEventListener('change', (e) => {
                this.settings.autoStartBreak = e.target.checked;
                this.saveSettings();
            });
        }
        
        if (soundNotifications) {
            soundNotifications.addEventListener('change', (e) => {
                this.settings.soundNotifications = e.target.checked;
                this.saveSettings();
            });
        }
        
        // Skip action selector
        const skipAction = document.getElementById('skip-action');
        if (skipAction) {
            skipAction.addEventListener('change', (e) => {
                this.settings.skipAction = e.target.value;
                this.saveSettings();
            });
        }
    }
    
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    startTimer() {
        this.isRunning = true;
        this.isPaused = false;
        
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateDisplay();
            this.updateProgressCircle();
            
            if (this.timeRemaining <= 0) {
                this.completeSession();
            }
        }, 1000);
        
        this.updateControls();
        this.showNotification(`${this.getCurrentSessionName()} session started!`, 'info');
    }
    
    pauseTimer() {
        this.isRunning = false;
        this.isPaused = true;
        clearInterval(this.timer);
        this.updateControls();
        this.showNotification('Timer paused', 'info');
    }
    
    resetTimer() {
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timer);
        
        // Reset to current session duration
        switch (this.currentSession) {
            case 'focus':
                this.timeRemaining = this.settings.focusDuration * 60;
                break;
            case 'shortBreak':
                this.timeRemaining = this.settings.shortBreakDuration * 60;
                break;
            case 'longBreak':
                this.timeRemaining = this.settings.longBreakDuration * 60;
                break;
        }
        
        this.totalDuration = this.timeRemaining;
        this.updateDisplay();
        this.updateProgressCircle();
        this.updateControls();
        this.showNotification('Timer reset', 'info');
    }
    
    handleSkip() {
        switch (this.settings.skipAction) {
            case 'skip':
                this.completeSession();
                break;
            case 'reset':
                this.resetTimer();
                break;
            case 'complete':
                this.markSessionComplete();
                break;
        }
    }
    
    completeSession() {
        this.isRunning = false;
        clearInterval(this.timer);
        
        if (this.settings.soundNotifications) {
            this.playNotificationSound();
        }
        
        if (this.currentSession === 'focus') {
            this.sessionCount++;
            this.showSessionSummary();
            
            // Determine next session type
            if (this.sessionCount % this.settings.sessionsPerCycle === 0) {
                this.switchToSession('longBreak');
            } else {
                this.switchToSession('shortBreak');
            }
        } else {
            // Break session completed
            this.switchToSession('focus');
        }
        
        this.updateControls();
    }
    
    markSessionComplete() {
        this.completeSession();
    }
    
    switchToSession(sessionType) {
        this.currentSession = sessionType;
        
        switch (sessionType) {
            case 'focus':
                this.timeRemaining = this.settings.focusDuration * 60;
                break;
            case 'shortBreak':
                this.timeRemaining = this.settings.shortBreakDuration * 60;
                break;
            case 'longBreak':
                this.timeRemaining = this.settings.longBreakDuration * 60;
                break;
        }
        
        this.totalDuration = this.timeRemaining;
        this.updateDisplay();
        this.updateProgressCircle();
        this.updateSessionIndicator();
        
        const sessionName = this.getCurrentSessionName();
        this.showNotification(`Time for ${sessionName}!`, 'success');
        
        // Auto-start if enabled
        if ((sessionType === 'focus' && this.settings.autoStartWork) ||
            (sessionType !== 'focus' && this.settings.autoStartBreak)) {
            setTimeout(() => this.startTimer(), 1000);
        }
    }
    
    getCurrentSessionName() {
        switch (this.currentSession) {
            case 'focus': return 'Focus';
            case 'shortBreak': return 'Short Break';
            case 'longBreak': return 'Long Break';
            default: return 'Session';
        }
    }
    
    updateDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timerDisplay = document.getElementById('pomodoro-timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = display;
        }
    }
    
    updateProgressCircle() {
        const progressCircle = document.querySelector('.pomodoro-progress-circle');
        if (!progressCircle) return;
        
        const progress = (this.totalDuration - this.timeRemaining) / this.totalDuration;
        const circumference = 2 * Math.PI * 45; // radius = 45
        const strokeDashoffset = circumference - (progress * circumference);
        
        progressCircle.style.strokeDashoffset = strokeDashoffset;
    }
    
    updateControls() {
        const startPauseBtn = document.getElementById('pomodoro-start-pause');
        if (startPauseBtn) {
            const buttonText = this.isRunning ? '⏸ Pause' : '▶ Start';
            startPauseBtn.innerHTML = `<span>${buttonText}</span>`;
            startPauseBtn.classList.toggle('running', this.isRunning);
        }
    }
    
    updateSessionIndicator() {
        const sessionIndicator = document.getElementById('pomodoro-session-type');
        if (sessionIndicator) {
            sessionIndicator.textContent = this.getCurrentSessionName();
            sessionIndicator.className = `session-type ${this.currentSession}`;
        }
        
        // Update session counter
        const sessionCounter = document.getElementById('pomodoro-session-counter');
        if (sessionCounter) {
            const completedSessions = this.sessionCount;
            const totalSessions = this.settings.sessionsPerCycle;
            sessionCounter.textContent = `Session ${(completedSessions % totalSessions) + 1} of ${totalSessions}`;
        }
    }
    
    showSessionSummary() {
        // Show post-session summary modal
        const modal = document.getElementById('pomodoro-summary-modal');
        if (modal) {
            modal.style.display = 'block';
            this.updateSummaryContent();
        }
    }
    
    updateSummaryContent() {
        // This would integrate with the task system
        // For now, just show placeholder data
        const completedCount = document.getElementById('summary-completed-count');
        const pendingCount = document.getElementById('summary-pending-count');
        
        if (completedCount) completedCount.textContent = '0';
        if (pendingCount) pendingCount.textContent = '0';
    }
    
    closeSummaryModal() {
        const modal = document.getElementById('pomodoro-summary-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    rolloverTasks() {
        this.closeSummaryModal();
        this.showNotification('Tasks rolled over. Starting new session!', 'info');
    }
    
    clearTasks() {
        this.closeSummaryModal();
        this.showNotification('Task list cleared!', 'info');
    }
    
    playNotificationSound() {
        if (!this.settings.soundNotifications) return;
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio notification not available');
        }
    }
    
    showNotification(message, type = 'info') {
        // Use existing notification system from app
        if (window.App && window.App.showNotification) {
            window.App.showNotification(message, type);
        } else {
            console.log(`${type}: ${message}`);
        }
    }
    
    // Initialize settings UI
    initializeSettingsUI() {
        // Set slider values
        const focusSlider = document.getElementById('focus-duration');
        const shortBreakSlider = document.getElementById('short-break-duration');
        const longBreakSlider = document.getElementById('long-break-duration');
        const sessionsSlider = document.getElementById('sessions-per-cycle');
        
        if (focusSlider) focusSlider.value = this.settings.focusDuration;
        if (shortBreakSlider) shortBreakSlider.value = this.settings.shortBreakDuration;
        if (longBreakSlider) longBreakSlider.value = this.settings.longBreakDuration;
        if (sessionsSlider) sessionsSlider.value = this.settings.sessionsPerCycle;
        
        // Set checkbox values
        const autoStartWork = document.getElementById('auto-start-work');
        const autoStartBreak = document.getElementById('auto-start-break');
        const soundNotifications = document.getElementById('sound-notifications');
        
        if (autoStartWork) autoStartWork.checked = this.settings.autoStartWork;
        if (autoStartBreak) autoStartBreak.checked = this.settings.autoStartBreak;
        if (soundNotifications) soundNotifications.checked = this.settings.soundNotifications;
        
        // Set skip action
        const skipAction = document.getElementById('skip-action');
        if (skipAction) skipAction.value = this.settings.skipAction;
        
        // Update display values
        const focusValue = document.getElementById('focus-value');
        const shortBreakValue = document.getElementById('short-break-value');
        const longBreakValue = document.getElementById('long-break-value');
        const sessionsValue = document.getElementById('sessions-value');
        
        if (focusValue) focusValue.textContent = this.settings.focusDuration;
        if (shortBreakValue) shortBreakValue.textContent = this.settings.shortBreakDuration;
        if (longBreakValue) longBreakValue.textContent = this.settings.longBreakDuration;
        if (sessionsValue) sessionsValue.textContent = this.settings.sessionsPerCycle;
        
        this.updateSessionIndicator();
        
        // Hide settings by default
        this.hideSettings();
    }
    
    // Show/hide settings
    toggleSettings() {
        const settingsElement = document.querySelector('.pomodoro-settings');
        if (settingsElement) {
            const isHidden = settingsElement.style.display === 'none';
            settingsElement.style.display = isHidden ? 'block' : 'none';
        }
    }
    
    hideSettings() {
        const settingsElement = document.querySelector('.pomodoro-settings');
        if (settingsElement) {
            settingsElement.style.display = 'none';
        }
    }
    
    showSettings() {
        const settingsElement = document.querySelector('.pomodoro-settings');
        if (settingsElement) {
            settingsElement.style.display = 'block';
        }
    }
}

// Export for use in main app
export default PomodoroTimer;
