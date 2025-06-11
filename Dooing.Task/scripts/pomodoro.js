// pomodoro.js - Pomodoro Timer Module
import { UIRenderer } from './UI_Renderer.js';
import TaskManager from './taskManager.js';
import Storage from './storage.js';

class PomodoroTimer {
    constructor() {
        this.currentSession = 'focus'; // 'focus', 'shortBreak', 'longBreak'
        this.isRunning = false;
        this.isPaused = false;
        this.timeRemaining = 0;
        this.sessionCount = 0;
        this.timer = null;
        
        // Default settings - can be customized
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
        this.updateDisplay();
    }
    
    bindEvents() {
        // Timer control buttons
        document.getElementById('pomodoro-start-pause')?.addEventListener('click', () => {
            this.toggleTimer();
        });
        
        document.getElementById('pomodoro-reset')?.addEventListener('click', () => {
            this.resetTimer();
        });
        
        document.getElementById('pomodoro-skip')?.addEventListener('click', () => {
            this.handleSkip();
        });
        
        // Settings sliders and inputs
        document.getElementById('focus-duration')?.addEventListener('input', (e) => {
            this.settings.focusDuration = parseInt(e.target.value);
            document.getElementById('focus-value').textContent = e.target.value;
            this.saveSettings();
            if (this.currentSession === 'focus' && !this.isRunning) {
                this.timeRemaining = this.settings.focusDuration * 60;
                this.updateDisplay();
            }
        });
        
        document.getElementById('short-break-duration')?.addEventListener('input', (e) => {
            this.settings.shortBreakDuration = parseInt(e.target.value);
            document.getElementById('short-break-value').textContent = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('long-break-duration')?.addEventListener('input', (e) => {
            this.settings.longBreakDuration = parseInt(e.target.value);
            document.getElementById('long-break-value').textContent = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('sessions-per-cycle')?.addEventListener('input', (e) => {
            this.settings.sessionsPerCycle = parseInt(e.target.value);
            document.getElementById('sessions-value').textContent = e.target.value;
            this.saveSettings();
        });
        
        // Auto-start checkboxes
        document.getElementById('auto-start-work')?.addEventListener('change', (e) => {
            this.settings.autoStartWork = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('auto-start-break')?.addEventListener('change', (e) => {
            this.settings.autoStartBreak = e.target.checked;
            this.saveSettings();
        });
        
        // Skip action selector
        document.getElementById('skip-action')?.addEventListener('change', (e) => {
            this.settings.skipAction = e.target.value;
            this.saveSettings();
        });
        
        // Sound notifications
        document.getElementById('sound-notifications')?.addEventListener('change', (e) => {
            this.settings.soundNotifications = e.target.checked;
            this.saveSettings();
        });
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
        
        this.updateDisplay();
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
        
        this.updateDisplay();
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
        
        // Update progress circle if exists
        this.updateProgressCircle();
    }
    
    updateProgressCircle() {
        const progressCircle = document.querySelector('.pomodoro-progress-circle');
        if (!progressCircle) return;
        
        let totalDuration;
        switch (this.currentSession) {
            case 'focus':
                totalDuration = this.settings.focusDuration * 60;
                break;
            case 'shortBreak':
                totalDuration = this.settings.shortBreakDuration * 60;
                break;
            case 'longBreak':
                totalDuration = this.settings.longBreakDuration * 60;
                break;
        }
        
        const progress = (totalDuration - this.timeRemaining) / totalDuration;
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
            sessionCounter.textContent = `Session ${completedSessions % totalSessions + 1} of ${totalSessions}`;
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
        const todayTasks = TaskManager.getTasksByCategory('today');
        const completedTasks = todayTasks.filter(task => task.completed);
        const pendingTasks = todayTasks.filter(task => !task.completed);
        
        document.getElementById('summary-completed-count').textContent = completedTasks.length;
        document.getElementById('summary-pending-count').textContent = pendingTasks.length;
        
        // Populate pending tasks list
        const pendingList = document.getElementById('summary-pending-tasks');
        pendingList.innerHTML = '';
        pendingTasks.forEach(task => {
            const li = document.createElement('li');
            li.textContent = task.title;
            pendingList.appendChild(li);
        });
    }
    
    closeSummaryModal() {
        const modal = document.getElementById('pomodoro-summary-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    rolloverTasks() {
        // Keep unfinished tasks and restart session
        this.closeSummaryModal();
        this.showNotification('Tasks rolled over. Starting new session!', 'info');
    }
    
    clearTasks() {
        // Clear all tasks
        const todayTasks = TaskManager.getTasksByCategory('today');
        todayTasks.forEach(task => {
            if (!task.completed) {
                TaskManager.deleteTask(task.id);
            }
        });
        this.closeSummaryModal();
        this.showNotification('Task list cleared!', 'info');
    }
    
    moveTomorrowTasks() {
        // Move selected tasks from tomorrow to today
        const tomorrowTasks = TaskManager.getTasksByCategory('tomorrow');
        const selectedTasks = Array.from(document.querySelectorAll('#tomorrow-tasks input:checked'))
            .map(checkbox => checkbox.value);
        
        selectedTasks.forEach(taskId => {
            const task = tomorrowTasks.find(t => t.id === taskId);
            if (task) {
                task.category = 'today';
                TaskManager.updateTask(task);
            }
        });
        
        this.closeSummaryModal();
        this.showNotification(`${selectedTasks.length} tasks moved to today!`, 'success');
    }
    
    playNotificationSound() {
        // Create a simple beep sound
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
    }
    
    showNotification(message, type = 'info') {
        // Use existing notification system from app
        if (window.App && window.App.showNotification) {
            window.App.showNotification(message, type);
        }
    }
    
    // Initialize settings UI
    initializeSettingsUI() {
        // Set slider values
        document.getElementById('focus-duration').value = this.settings.focusDuration;
        document.getElementById('short-break-duration').value = this.settings.shortBreakDuration;
        document.getElementById('long-break-duration').value = this.settings.longBreakDuration;
        document.getElementById('sessions-per-cycle').value = this.settings.sessionsPerCycle;
        
        // Set checkbox values
        document.getElementById('auto-start-work').checked = this.settings.autoStartWork;
        document.getElementById('auto-start-break').checked = this.settings.autoStartBreak;
        document.getElementById('sound-notifications').checked = this.settings.soundNotifications;
        
        // Set skip action
        document.getElementById('skip-action').value = this.settings.skipAction;
        
        // Update display values
        document.getElementById('focus-value').textContent = this.settings.focusDuration;
        document.getElementById('short-break-value').textContent = this.settings.shortBreakDuration;
        document.getElementById('long-break-value').textContent = this.settings.longBreakDuration;
        document.getElementById('sessions-value').textContent = this.settings.sessionsPerCycle;
        
        this.updateSessionIndicator();
    }
}

// Export for use in main app
export default PomodoroTimer;
