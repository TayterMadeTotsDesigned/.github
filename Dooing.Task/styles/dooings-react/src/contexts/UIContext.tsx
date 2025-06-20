import React, { createContext, useContext, useReducer } from 'react';
import type { TaskCategory } from '../types';

// Define UI state interface
interface UIState {
  currentCategory: TaskCategory | 'pomodoro';
  isSidebarOpen: boolean;
  isModalOpen: boolean;
  modalType: 'create' | 'edit';
  initialModalDate?: Date;
  editingTaskId?: string;
  selectionMode: boolean;
  selectedTaskIds: string[];
  theme: string;
}

// Define action types for reducer
type UIAction = 
  | { type: 'SET_CATEGORY'; payload: TaskCategory | 'pomodoro' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR'; payload: boolean }
  | { type: 'OPEN_CREATE_MODAL'; payload?: { initialDate?: Date } }
  | { type: 'OPEN_EDIT_MODAL'; payload: { taskId: string } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'TOGGLE_SELECTION_MODE' }
  | { type: 'SELECT_TASK'; payload: string }
  | { type: 'DESELECT_TASK'; payload: string }
  | { type: 'TOGGLE_TASK_SELECTION'; payload: string }
  | { type: 'SELECT_ALL_TASKS'; payload: string[] }
  | { type: 'DESELECT_ALL_TASKS' }
  | { type: 'SET_THEME'; payload: string };

// Initial state
const initialState: UIState = {
  currentCategory: 'today',
  isSidebarOpen: false,
  isModalOpen: false,
  modalType: 'create',
  selectionMode: false,
  selectedTaskIds: [],
  theme: 'default',
};

// Create context with initial undefined value
const UIContext = createContext<{
  state: UIState;
  dispatch: React.Dispatch<UIAction>;
  setCategory: (category: TaskCategory | 'pomodoro') => void;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openCreateModal: (initialDate?: Date) => void;
  openEditModal: (taskId: string) => void;
  closeModal: () => void;
  toggleSelectionMode: () => void;
  toggleTaskSelection: (taskId: string) => void;
  selectAllTasks: (taskIds: string[]) => void;
  deselectAllTasks: () => void;
  isTaskSelected: (taskId: string) => boolean;
  setTheme: (theme: string) => void;
} | undefined>(undefined);

// Reducer function for handling state updates
function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_CATEGORY':
      return {
        ...state,
        currentCategory: action.payload,
      };
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        isSidebarOpen: !state.isSidebarOpen,
      };
    case 'SET_SIDEBAR':
      return {
        ...state,
        isSidebarOpen: action.payload,
      };
    case 'OPEN_CREATE_MODAL':
      return {
        ...state,
        isModalOpen: true,
        modalType: 'create',
        initialModalDate: action.payload?.initialDate,
        editingTaskId: undefined,
      };
    case 'OPEN_EDIT_MODAL':
      return {
        ...state,
        isModalOpen: true,
        modalType: 'edit',
        editingTaskId: action.payload.taskId,
        initialModalDate: undefined,
      };
    case 'CLOSE_MODAL':
      return {
        ...state,
        isModalOpen: false,
      };
    case 'TOGGLE_SELECTION_MODE': {
      const newSelectionMode = !state.selectionMode;
      return {
        ...state,
        selectionMode: newSelectionMode,
        // Clear selection when exiting selection mode
        selectedTaskIds: newSelectionMode ? state.selectedTaskIds : [],
      };
    }
    case 'SELECT_TASK':
      return {
        ...state,
        selectedTaskIds: [...state.selectedTaskIds, action.payload],
      };
    case 'DESELECT_TASK':
      return {
        ...state,
        selectedTaskIds: state.selectedTaskIds.filter(id => id !== action.payload),
      };
    case 'TOGGLE_TASK_SELECTION':
      return {
        ...state,
        selectedTaskIds: state.selectedTaskIds.includes(action.payload)
          ? state.selectedTaskIds.filter(id => id !== action.payload)
          : [...state.selectedTaskIds, action.payload],
      };
    case 'SELECT_ALL_TASKS':
      return {
        ...state,
        selectedTaskIds: action.payload,
      };
    case 'DESELECT_ALL_TASKS':
      return {
        ...state,
        selectedTaskIds: [],
      };
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      };
    default:
      return state;
  }
}

// Provider component
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  // Helper function to set current category
  const setCategory = (category: TaskCategory | 'pomodoro') => {
    dispatch({ type: 'SET_CATEGORY', payload: category });
  };

  // Helper function to toggle sidebar
  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  // Helper function to close sidebar
  const closeSidebar = () => {
    dispatch({ type: 'SET_SIDEBAR', payload: false });
  };

  // Helper function to open create modal
  const openCreateModal = (initialDate?: Date) => {
    dispatch({ type: 'OPEN_CREATE_MODAL', payload: { initialDate } });
  };

  // Helper function to open edit modal
  const openEditModal = (taskId: string) => {
    dispatch({ type: 'OPEN_EDIT_MODAL', payload: { taskId } });
  };

  // Helper function to close modal
  const closeModal = () => {
    dispatch({ type: 'CLOSE_MODAL' });
  };

  // Helper function to toggle selection mode
  const toggleSelectionMode = () => {
    dispatch({ type: 'TOGGLE_SELECTION_MODE' });
  };

  // Helper function to toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    dispatch({ type: 'TOGGLE_TASK_SELECTION', payload: taskId });
  };

  // Helper function to select all tasks
  const selectAllTasks = (taskIds: string[]) => {
    dispatch({ type: 'SELECT_ALL_TASKS', payload: taskIds });
  };

  // Helper function to deselect all tasks
  const deselectAllTasks = () => {
    dispatch({ type: 'DESELECT_ALL_TASKS' });
  };

  // Helper function to check if a task is selected
  const isTaskSelected = (taskId: string) => {
    return state.selectedTaskIds.includes(taskId);
  };

  // Helper function to set theme
  const setTheme = (theme: string) => {
    dispatch({ type: 'SET_THEME', payload: theme });
    localStorage.setItem('theme', theme);
  };

  // Create context value object
  const value = {
    state,
    dispatch,
    setCategory,
    toggleSidebar,
    closeSidebar,
    openCreateModal,
    openEditModal,
    closeModal,
    toggleSelectionMode,
    toggleTaskSelection,
    selectAllTasks,
    deselectAllTasks,
    isTaskSelected,
    setTheme,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

// Custom hook to use the UI context
export const useUIContext = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
};
