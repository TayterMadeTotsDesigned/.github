import { usePomodoroContext } from '../hooks/usePomodoroContext';
import { useTaskContext } from '../contexts/TaskContext';
import { useUIContext } from '../contexts';
import { useEffect } from 'react';
import type { Task } from '../types';
import PomodoroTaskSelector from './PomodoroTaskSelector';
import PomodoroSuggestions from './PomodoroSuggestions';
import PomodoroTaskInput from './PomodoroTaskInput';

const PomodoroTimer = ({ onSettingsToggle, isStandalone = false }: { 
  onSettingsToggle: () => void;
  isStandalone?: boolean;
}) => {
  const { 
    state, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    skipSession,
    getFormattedTime,
    getProgressPercentage,
    selectTask,
    clearActiveTask,
    updateAvailableTasks,
    generateTaskSuggestions,
    dismissSuggestions
  } = usePomodoroContext();
  
  const taskContext = useTaskContext();
  const uiContext = useUIContext();
  
  if (!taskContext) {
    throw new Error('PomodoroTimer must be used within a TaskProvider');
  }
  
  if (!uiContext) {
    throw new Error('PomodoroTimer must be used within a UIProvider');
  }
  
  const { getTasksByCategory, moveTaskToCategory } = taskContext;
  const { state: uiState } = uiContext;
  
  const { 
    isActive, 
    currentSession, 
    settings, 
    activeTaskId, 
    availableTasks, 
    suggestions, 
    sessionJustCompleted
  } = state;

  // Update available tasks when today's tasks change
  useEffect(() => {
    const todayTasks = getTasksByCategory('today').filter(task => !task.completed);
    updateAvailableTasks(todayTasks);
  }, [getTasksByCategory, updateAvailableTasks]);

  // Generate suggestions only when a session just completed
  useEffect(() => {
    if (sessionJustCompleted) {
      generateTaskSuggestions();
    }
  }, [sessionJustCompleted, generateTaskSuggestions]);

  // Get session type display
  const getSessionType = () => {
    switch (currentSession) {
      case 'work': return 'Work';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Work';
    }
  };

  // Get timer classes for retro effects based on theme
  const getTimerClasses = () => {
    const classes = [];
    const theme = uiState.theme;
    
    if (isActive) {
      if (theme?.includes('neon') || theme?.includes('cyber')) {
        classes.push('cyber-text');
      }
      if (theme?.includes('rainbow')) {
        classes.push('rainbow-text');
      }
      if (theme?.includes('electric')) {
        classes.push('retro-glow');
      }
      if (theme?.includes('candy') || theme?.includes('pop')) {
        classes.push('retro-pulse');
      }
    }
    
    return classes.join(' ');
  };

  // Get container classes for retro effects
  const getContainerClasses = () => {
    const classes = [];
    const theme = uiState.theme;
    
    if (theme?.includes('disco') || theme?.includes('rainbow')) {
      classes.push('disco-ball');
    }
    if (theme?.includes('holo')) {
      classes.push('holographic');
    }
    
    return classes.join(' ');
  };

  // Get button classes for retro effects
  const getButtonClasses = () => {
    const classes = [];
    const theme = uiState.theme;
    
    if (theme?.includes('candy') || theme?.includes('pop')) {
      classes.push('retro-btn');
    }
    if (theme?.includes('neon') || theme?.includes('cyber')) {
      classes.push('neon-sign');
    }
    
    return classes.join(' ');
  };

  const handleStart = () => {
    // If starting work session and no task selected, pause and suggest task selection
    if (currentSession === 'work' && !activeTaskId && availableTasks.length > 0 && settings.autoSelectNextTask) {
      generateTaskSuggestions();
      return;
    }
    startTimer();
  };

  const handlePause = () => {
    pauseTimer();
  };

  const handleReset = () => {
    resetTimer();
  };

  const handleSkip = () => {
    skipSession();
  };

  // Task integration handlers
  const handleTaskSelect = (taskId: string) => {
    selectTask(taskId);
  };

  const handleClearTask = () => {
    clearActiveTask();
  };

  const handleAddTasks = () => {
    // This would typically open a task creation modal
    // For now, we'll just show a placeholder action
    console.log('Add tasks action triggered');
  };

  const handleMoveTasksFromTomorrow = (tasks: Task[]) => {
    // Move selected tasks from tomorrow to today
    tasks.forEach(task => {
      moveTaskToCategory(task.id, 'today');
    });
  };

  const handleSelectTaskFromSuggestion = () => {
    // This would open task selection interface
    generateTaskSuggestions();
  };

  const handleDismissSuggestions = () => {
    dismissSuggestions();
  };

  const tomorrowTasks = getTasksByCategory('tomorrow').filter(task => !task.completed);

  return (
    <div className={`pomodoro-container ${isActive ? 'active' : ''} ${getContainerClasses()}`}>
      {/* Smart Suggestions Notification Container */}
      {currentSession === 'work' && sessionJustCompleted && suggestions.length > 0 && (
        <div className="pomodoro-notifications">
          <PomodoroSuggestions
            suggestions={suggestions}
            tomorrowTasks={tomorrowTasks}
            onAddTasks={handleAddTasks}
            onMoveTasksFromTomorrow={handleMoveTasksFromTomorrow}
            onSelectTask={handleSelectTaskFromSuggestion}
            onDismiss={handleDismissSuggestions}
          />
        </div>
      )}

      <div className="pomodoro-glass-card">
        {/* Header Section with Settings */}
        <div className="pomodoro-header-section">
          <div className="pomodoro-header">
            <div className="header-content">
              <h1 className="pomodoro-title">Pomodoro Timer</h1>
              <p className="pomodoro-subtitle">Focus • Achieve • Repeat</p>
            </div>
            <button 
              className="pomodoro-settings-btn" 
              id="pomodoro-settings-btn" 
              aria-label="Toggle Settings"
              onClick={onSettingsToggle}
            >
              <img src="/assets/settings-cog-svgrepo-com.svg" alt="Settings" className="settings-cog" />
            </button>
          </div>
          
        {/* Session Type Indicator with Stats */}
        <div className="session-indicator-container">
          <div className={`session-indicator ${currentSession}`}>
            <div className="session-icon">
              {currentSession === 'work' ? '🍅' : currentSession === 'shortBreak' ? '☕' : '🏖️'}
            </div>
            <div className="session-info">
              <span className="session-type">{getSessionType()}</span>
              <span className="session-progress">Session {state.sessionsCompleted + 1}</span>
            </div>
            {isStandalone && (
              <div className="session-stats">
                <div className="stat-item">
                  <span className="stat-label">Completed</span>
                  <span className="stat-value">{state.sessionsCompleted}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Time Left</span>
                  <span className="stat-value">{getFormattedTime()}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Task Integration Section */}
        {currentSession === 'work' && (
          <div className="task-integration-section">
            {isStandalone ? (
              <PomodoroTaskInput onTaskAdded={() => {
                // Refresh available tasks after adding a new one
                const todayTasks = getTasksByCategory('today').filter(task => !task.completed);
                updateAvailableTasks(todayTasks);
              }} />
            ) : (
              <PomodoroTaskSelector
                availableTasks={availableTasks}
                activeTaskId={activeTaskId}
                onTaskSelect={handleTaskSelect}
                onClearTask={handleClearTask}
              />
            )}
          </div>
        )}
        
        {/* Timer Display Section */}
        <div className="pomodoro-timer-section">
          <div className="timer-container">
            <div className="timer-circle">
              <div className="timer-ring-container">
                <svg className="timer-ring" width="320" height="320" viewBox="0 0 320 320">
                  <defs>
                    <linearGradient id="timer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--accent)" />
                      <stop offset="100%" stopColor="rgba(var(--accent-rgb), 0.7)" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <circle
                    className="timer-ring-background"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="12"
                    fill="transparent"
                    r="154"
                    cx="160"
                    cy="160"
                  />
                  <circle
                    className="timer-ring-progress"
                    stroke="url(#timer-gradient)"
                    strokeWidth="12"
                    fill="transparent"
                    r="154"
                    cx="160"
                    cy="160"
                    strokeDasharray={`${getProgressPercentage() * 9.67} 967`}
                    transform="rotate(-90 160 160)"
                    filter="url(#glow)"
                    style={{
                      transition: 'stroke-dasharray 0.3s ease-in-out',
                      strokeLinecap: 'round',
                    }}
                  />
                </svg>
                <div className="timer-glow"></div>
              </div>
              
              <div className="timer-display">
                <div className={`timer-time ${getTimerClasses()}`}>
                  {getFormattedTime()}
                </div>
                <div className="timer-session-label">
                  {getSessionType()} Session
                </div>
                <div className="timer-status">
                  {isActive ? (
                    <span className="status-active">
                      <span className="pulse-dot"></span>
                      Running
                    </span>
                  ) : state.isPaused ? (
                    <span className="status-paused">Paused</span>
                  ) : (
                    <span className="status-ready">Ready to Start</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="pomodoro-controls-section">
          <div className="primary-controls">
            <button 
              className={`control-btn primary ${isActive ? 'running' : ''} ${getButtonClasses()}`}
              id="pomodoro-start-pause" 
              aria-label="Start/Pause timer"
              onClick={isActive ? handlePause : handleStart}
              disabled={currentSession === 'work' && availableTasks.length === 0 && settings.pauseWhenTasksComplete}
            >
              <div className="btn-icon">
                <img 
                  src={isActive ? "/assets/pause-circle-svgrepo-com.svg" : "/assets/play-circle-svgrepo-com.svg"} 
                  alt={isActive ? "Pause" : "Play"} 
                />
              </div>
              <span className="btn-text">{isActive ? 'Pause' : 'Start'}</span>
            </button>
          </div>
          
          <div className="secondary-controls">
            <button 
              className="control-btn secondary" 
              id="pomodoro-reset" 
              aria-label="Reset timer"
              onClick={handleReset}
            >
              <div className="btn-icon">
                <img src="/assets/timer-remove-svgrepo-com.svg" alt="Reset" />
              </div>
              <span className="btn-text">Reset</span>
            </button>
            
            <button 
              className="control-btn secondary" 
              id="pomodoro-skip" 
              aria-label="Skip session"
              onClick={handleSkip}
            >
              <div className="btn-icon">
                <img src="/assets/skip-next-svgrepo-com.svg" alt="Skip" />
              </div>
              <span className="btn-text">Skip</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;
