import React, { createContext, useReducer, useEffect } from 'react';
import type { PomodoroSettings, PomodoroSessionType, Task, TaskSuggestion, PomodoroSession } from '../types';

// Define enhanced state interface
interface PomodoroState {
  isActive: boolean;
  isPaused: boolean;
  currentSession: PomodoroSessionType;
  timeRemaining: number; // in seconds
  sessionsCompleted: number;
  settings: PomodoroSettings;
  // Task integration
  activeTaskId: string | null;
  availableTasks: Task[];
  suggestions: TaskSuggestion[];
  sessionHistory: PomodoroSession[];
  needsTaskSelection: boolean;
  // Session completion tracking
  sessionJustCompleted: boolean;
}

// Define action types for reducer
type PomodoroAction =
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'TICK' }
  | { type: 'SKIP_SESSION' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<PomodoroSettings> }
  | { type: 'INIT_SETTINGS'; payload: PomodoroSettings }
  // Task integration actions
  | { type: 'SELECT_TASK'; payload: string }
  | { type: 'CLEAR_ACTIVE_TASK' }
  | { type: 'UPDATE_AVAILABLE_TASKS'; payload: Task[] }
  | { type: 'ADD_SUGGESTION'; payload: TaskSuggestion }
  | { type: 'CLEAR_SUGGESTIONS' }
  | { type: 'COMPLETE_TASK_SESSION'; payload: { taskId: string; successful: boolean } }
  | { type: 'SET_NEEDS_TASK_SELECTION'; payload: boolean }
  | { type: 'SET_SESSION_COMPLETED'; payload: boolean };

// Enhanced initial state
const initialState: PomodoroState = {
  isActive: false,
  isPaused: false,
  currentSession: 'work',
  timeRemaining: 25 * 60, // 25 minutes in seconds
  sessionsCompleted: 0,
  settings: {
    workDuration: 25, // in minutes
    shortBreakDuration: 5, // in minutes
    longBreakDuration: 15, // in minutes
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true,
    // Task integration settings
    autoSelectNextTask: true,
    pauseWhenTasksComplete: true,
    suggestTaskMovement: true,
  },
  // Task integration
  activeTaskId: null,
  availableTasks: [],
  suggestions: [],
  sessionHistory: [],
  needsTaskSelection: false,
  // Session completion tracking
  sessionJustCompleted: false,
};

// Create context with enhanced interface
const PomodoroContext = createContext<{
  state: PomodoroState;
  dispatch: React.Dispatch<PomodoroAction>;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
  getFormattedTime: () => string;
  getProgressPercentage: () => number;
  // Task integration methods
  selectTask: (taskId: string) => void;
  clearActiveTask: () => void;
  updateAvailableTasks: (tasks: Task[]) => void;
  generateTaskSuggestions: () => void;
  handleTaskCompletion: (taskId: string, successful: boolean) => void;
  dismissSuggestions: () => void;
} | undefined>(undefined);

// Export the context for use in custom hooks
export { PomodoroContext };

// Reducer function for handling state updates
function pomodoroReducer(state: PomodoroState, action: PomodoroAction): PomodoroState {
  switch (action.type) {
    case 'START_TIMER':
      return {
        ...state,
        isActive: true,
        isPaused: false,
      };
    case 'PAUSE_TIMER':
      return {
        ...state,
        isActive: false,
        isPaused: true,
      };
    case 'RESET_TIMER':
      return {
        ...state,
        isActive: false,
        isPaused: false,
        timeRemaining: getSessionDuration(state),
      };
    case 'TICK':
      // If time is up, complete the session
      if (state.timeRemaining <= 1) {
        return {
          ...state,
          isActive: false,
          isPaused: false,
          timeRemaining: 0,
        };
      }
      return {
        ...state,
        timeRemaining: state.timeRemaining - 1,
      };
    case 'SKIP_SESSION':
      return transitionToNextSession(state);
    case 'COMPLETE_SESSION':
      return transitionToNextSession(state);
    case 'UPDATE_SETTINGS': {
      const newSettings = { ...state.settings, ...action.payload };
      // Update time remaining if we're not in an active session
      let newTimeRemaining = state.timeRemaining;
      if (!state.isActive && !state.isPaused) {
        newTimeRemaining = getSessionDurationFromSettings(state.currentSession, newSettings);
      }
      return {
        ...state,
        settings: newSettings,
        timeRemaining: newTimeRemaining,
      };
    }
    case 'INIT_SETTINGS':
      return {
        ...state,
        settings: action.payload,
        timeRemaining: getSessionDurationFromSettings(state.currentSession, action.payload),
      };
    // Task integration cases
    case 'SELECT_TASK':
      return {
        ...state,
        activeTaskId: action.payload,
        needsTaskSelection: false,
        suggestions: [], // Clear suggestions when task is selected
      };
    case 'CLEAR_ACTIVE_TASK':
      return {
        ...state,
        activeTaskId: null,
        needsTaskSelection: state.currentSession === 'work' && state.isActive,
      };
    case 'UPDATE_AVAILABLE_TASKS':
      return {
        ...state,
        availableTasks: action.payload,
        // If no tasks available and timer is running, suggest task creation
        needsTaskSelection: action.payload.length === 0 && state.currentSession === 'work' && state.isActive,
      };
    case 'ADD_SUGGESTION':
      return {
        ...state,
        suggestions: [...state.suggestions, action.payload],
      };
    case 'CLEAR_SUGGESTIONS':
      return {
        ...state,
        suggestions: [],
      };
    case 'COMPLETE_TASK_SESSION': {
      const { taskId, successful } = action.payload;
      const sessionRecord: PomodoroSession = {
        id: Date.now().toString(),
        type: state.currentSession,
        duration: getSessionDuration(state) / 60, // Convert to minutes
        startTime: new Date(Date.now() - (getSessionDuration(state) - state.timeRemaining) * 1000),
        endTime: new Date(),
        isActive: false,
        isPaused: false,
        remainingTime: 0,
        associatedTaskId: taskId,
        completedSuccessfully: successful,
      };
      return {
        ...state,
        sessionHistory: [...state.sessionHistory, sessionRecord],
      };
    }
    case 'SET_NEEDS_TASK_SELECTION':
      return {
        ...state,
        needsTaskSelection: action.payload,
      };
    case 'SET_SESSION_COMPLETED':
      return {
        ...state,
        sessionJustCompleted: action.payload,
      };
    default:
      return state;
  }
}

// Helper to get session duration based on current session type
function getSessionDuration(state: PomodoroState): number {
  return getSessionDurationFromSettings(state.currentSession, state.settings);
}

// Helper to get session duration in seconds from settings
function getSessionDurationFromSettings(
  sessionType: PomodoroSessionType, 
  settings: PomodoroSettings
): number {
  switch (sessionType) {
    case 'work':
      return settings.workDuration * 60;
    case 'shortBreak':
      return settings.shortBreakDuration * 60;
    case 'longBreak':
      return settings.longBreakDuration * 60;
    default:
      return settings.workDuration * 60;
  }
}

// Helper to transition to the next session
function transitionToNextSession(state: PomodoroState): PomodoroState {
  let nextSession: PomodoroSessionType;
  let nextSessionsCompleted = state.sessionsCompleted;
  
  // Increment completed sessions count and determine next session type
  if (state.currentSession === 'work') {
    nextSessionsCompleted = state.sessionsCompleted + 1;
    // After work session, determine if we should take a short or long break
    nextSession = 
      nextSessionsCompleted % state.settings.sessionsUntilLongBreak === 0
        ? 'longBreak'
        : 'shortBreak';
  } else {
    // After any break, go back to work
    nextSession = 'work';
  }
  
  // Determine if we should auto-start the next session
  const shouldAutoStart = 
    nextSession === 'work'
      ? state.settings.autoStartPomodoros
      : state.settings.autoStartBreaks;
  
  return {
    ...state,
    currentSession: nextSession,
    timeRemaining: getSessionDurationFromSettings(nextSession, state.settings),
    isActive: shouldAutoStart,
    isPaused: false,
    sessionsCompleted: nextSessionsCompleted,
    sessionJustCompleted: true, // Mark that a session just completed
  };
}

// Provider component
export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(pomodoroReducer, initialState);

  // Load settings from localStorage on initial render
  useEffect(() => {
    const savedSettings = localStorage.getItem('dooing-pomodoro-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        dispatch({ 
          type: 'INIT_SETTINGS', 
          payload: { ...initialState.settings, ...settings } 
        });
      } catch (error) {
        console.error('Error loading pomodoro settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dooing-pomodoro-settings', JSON.stringify(state.settings));
  }, [state.settings]);

  // Timer tick effect
  useEffect(() => {
    let timerId: number | undefined;
    
    if (state.isActive) {
      timerId = window.setInterval(() => {
        if (state.timeRemaining <= 1) {
          // Session complete
          dispatch({ type: 'COMPLETE_SESSION' });
          
          // Play notification sound if enabled
          if (state.settings.soundEnabled) {
            try {
              const audio = new Audio('/assets/notification-sound.mp3');
              audio.play();
            } catch (error) {
              console.error('Error playing notification sound:', error);
            }
          }
          
          // Show browser notification if allowed
          if (Notification.permission === 'granted') {
            new Notification(
              state.currentSession === 'work' ? 'Break time!' : 'Time to work!',
              { 
                body: state.currentSession === 'work' 
                  ? 'Great job! Take a break.'
                  : 'Break is over. Time to focus!' 
              }
            );
          }
        } else {
          dispatch({ type: 'TICK' });
        }
      }, 1000);
    }
    
    return () => {
      if (timerId !== undefined) {
        clearInterval(timerId);
      }
    };
  }, [state.isActive, state.timeRemaining, state.currentSession, state.settings.soundEnabled]);

  // Helper function to start the timer
  const startTimer = () => {
    dispatch({ type: 'START_TIMER' });
  };

  // Helper function to pause the timer
  const pauseTimer = () => {
    dispatch({ type: 'PAUSE_TIMER' });
  };

  // Helper function to reset the timer
  const resetTimer = () => {
    dispatch({ type: 'RESET_TIMER' });
  };

  // Helper function to skip to the next session
  const skipSession = () => {
    dispatch({ type: 'SKIP_SESSION' });
  };

  // Helper function to update settings
  const updateSettings = (settings: Partial<PomodoroSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  // Helper function to format the remaining time as MM:SS
  const getFormattedTime = () => {
    const minutes = Math.floor(state.timeRemaining / 60);
    const seconds = state.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Helper function to get progress percentage for timer visualization
  const getProgressPercentage = () => {
    const totalDuration = getSessionDurationFromSettings(state.currentSession, state.settings);
    return ((totalDuration - state.timeRemaining) / totalDuration) * 100;
  };

  // Task integration methods
  const selectTask = (taskId: string) => {
    dispatch({ type: 'SELECT_TASK', payload: taskId });
  };

  const clearActiveTask = () => {
    dispatch({ type: 'CLEAR_ACTIVE_TASK' });
  };

  const updateAvailableTasks = (tasks: Task[]) => {
    dispatch({ type: 'UPDATE_AVAILABLE_TASKS', payload: tasks });
  };

  const generateTaskSuggestions = () => {
    // Only generate suggestions if a session just completed
    if (!state.sessionJustCompleted) {
      return;
    }
    
    // Clear existing suggestions first
    dispatch({ type: 'CLEAR_SUGGESTIONS' });
    
    if (state.availableTasks.length === 0) {
      // No tasks available - suggest adding tasks or moving from tomorrow
      dispatch({ 
        type: 'ADD_SUGGESTION', 
        payload: {
          type: 'add_tasks',
          message: 'Great work! No tasks available for today. Add new tasks to stay productive!',
          actionLabel: 'Add Tasks'
        }
      });
      
      dispatch({ 
        type: 'ADD_SUGGESTION', 
        payload: {
          type: 'move_from_tomorrow',
          message: 'Move tasks from tomorrow to keep working',
          actionLabel: 'Move Tasks'
        }
      });
    } else if (!state.activeTaskId && state.currentSession === 'work') {
      // Tasks available but none selected
      dispatch({ 
        type: 'ADD_SUGGESTION', 
        payload: {
          type: 'continue_working',
          message: 'Session completed! Select a task to focus on during the next Pomodoro',
          actionLabel: 'Select Task'
        }
      });
    }
  };

  const handleTaskCompletion = (taskId: string, successful: boolean) => {
    dispatch({ type: 'COMPLETE_TASK_SESSION', payload: { taskId, successful } });
  };

  const dismissSuggestions = () => {
    dispatch({ type: 'SET_SESSION_COMPLETED', payload: false });
  };

  // Create context value object
  const value = {
    state,
    dispatch,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession,
    updateSettings,
    getFormattedTime,
    getProgressPercentage,
    // Task integration methods
    selectTask,
    clearActiveTask,
    updateAvailableTasks,
    generateTaskSuggestions,
    handleTaskCompletion,
    dismissSuggestions,
  };

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
};
