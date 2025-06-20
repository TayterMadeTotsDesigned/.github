import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { Task, TaskCategory, TaskPriority } from '../types';

// Define state type
interface TaskState {
  tasks: Task[];
  taskLimitEnabled: boolean;
  taskLimit: number;
  loading: boolean;
  error: string | null;
}

// Define action types for reducer
type TaskAction =
  | { type: 'INIT_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'DELETE_MULTIPLE_TASKS'; payload: string[] }
  | { type: 'TOGGLE_TASK_COMPLETION'; payload: string }
  | { type: 'SET_TASK_LIMIT'; payload: { enabled: boolean; limit: number } }
  | { type: 'MOVE_TASK_TO_CATEGORY'; payload: { taskId: string; category: TaskCategory } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: TaskState = {
  tasks: [],
  taskLimitEnabled: true,
  taskLimit: 6,
  loading: true,
  error: null,
};

// Create context with initial undefined value
const TaskContext = createContext<{
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  deleteTasks: (taskIds: string[]) => void;
  toggleTaskCompletion: (taskId: string) => void;
  moveTaskToCategory: (taskId: string, category: TaskCategory) => void;
  getTasksByCategory: (category: TaskCategory) => Task[];
  checkTaskLimit: (category: TaskCategory) => { isAtLimit: boolean; isNearLimit: boolean; remaining: number };
  shouldBumpTask: (newTaskPriority: TaskPriority, category: TaskCategory) => { shouldBump: boolean; taskToBump: Task | null };
} | undefined>(undefined);

// Reducer function for handling state updates
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'INIT_TASKS':
      return {
        ...state,
        tasks: action.payload,
        loading: false,
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'DELETE_MULTIPLE_TASKS':
      return {
        ...state,
        tasks: state.tasks.filter(task => !action.payload.includes(task.id)),
      };
    case 'TOGGLE_TASK_COMPLETION':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload 
            ? { ...task, completed: !task.completed, updatedAt: new Date() } 
            : task
        ),
      };
    case 'SET_TASK_LIMIT':
      return {
        ...state,
        taskLimitEnabled: action.payload.enabled,
        taskLimit: action.payload.limit,
      };
    case 'MOVE_TASK_TO_CATEGORY':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.taskId 
            ? { ...task, category: action.payload.category, updatedAt: new Date() } 
            : task
        ),
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Provider component
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Load tasks from localStorage on initial render
  useEffect(() => {
    const savedTasks = localStorage.getItem('dooing-tasks');
    if (savedTasks) {
      try {
        const tasks = JSON.parse(savedTasks);
        dispatch({ type: 'INIT_TASKS', payload: tasks });
      } catch (error) {
        console.error('Error loading tasks:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks from storage' });
      }
    } else {
      dispatch({ type: 'INIT_TASKS', payload: [] });
    }
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (!state.loading) {
      localStorage.setItem('dooing-tasks', JSON.stringify(state.tasks));
    }
  }, [state.tasks, state.loading]);

  // Helper function to add a new task
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });
    return newTask;
  };

  // Helper function to update a task
  const updateTask = (task: Task) => {
    const updatedTask = {
      ...task,
      updatedAt: new Date(),
    };
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
  };

  // Helper function to delete a task
  const deleteTask = (taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: taskId });
  };

  // Helper function to delete multiple tasks
  const deleteTasks = (taskIds: string[]) => {
    if (taskIds.length === 0) return;
    dispatch({ type: 'DELETE_MULTIPLE_TASKS', payload: taskIds });
  };

  // Helper function to toggle task completion
  const toggleTaskCompletion = (taskId: string) => {
    dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: taskId });
  };

  // Helper function to move a task to a different category
  const moveTaskToCategory = (taskId: string, category: TaskCategory) => {
    dispatch({ 
      type: 'MOVE_TASK_TO_CATEGORY', 
      payload: { taskId, category } 
    });
  };

  // Helper function to get tasks by category
  const getTasksByCategory = (category: TaskCategory): Task[] => {
    return state.tasks.filter(task => task.category === category);
  };

  // Helper function to check if a category is at or near its task limit
  const checkTaskLimit = (category: TaskCategory) => {
    if (category !== 'today' || !state.taskLimitEnabled) {
      return { isAtLimit: false, isNearLimit: false, remaining: Infinity };
    }

    const categoryTaskCount = getTasksByCategory(category).length;
    const remaining = state.taskLimit - categoryTaskCount;
    
    return {
      isAtLimit: categoryTaskCount >= state.taskLimit,
      isNearLimit: categoryTaskCount >= state.taskLimit - 1,
      remaining,
    };
  };

  // Helper function to determine if a lower priority task should be bumped
  const shouldBumpTask = (newTaskPriority: TaskPriority, category: TaskCategory) => {
    if (category !== 'today' || !state.taskLimitEnabled) {
      return { shouldBump: false, taskToBump: null };
    }

    const categoryTasks = getTasksByCategory(category);
    
    // Check if we're at or above the task limit
    if (categoryTasks.length >= state.taskLimit) {
      // Find lowest priority task that could be bumped
      const priorityValues = { low: 0, medium: 1, high: 2 };
      const newPriorityValue = priorityValues[newTaskPriority];
      
      // Get all incomplete tasks with lower priority, sorted by priority (lowest first)
      const lowerPriorityTasks = categoryTasks
        .filter(task => !task.completed && priorityValues[task.priority] < newPriorityValue)
        .sort((a, b) => priorityValues[a.priority] - priorityValues[b.priority]);
      
      if (lowerPriorityTasks.length > 0) {
        return { shouldBump: true, taskToBump: lowerPriorityTasks[0] };
      }
    }
    
    return { shouldBump: false, taskToBump: null };
  };

  // Create context value object
  const value = {
    state,
    dispatch,
    addTask,
    updateTask,
    deleteTask,
    deleteTasks,
    toggleTaskCompletion,
    moveTaskToCategory,
    getTasksByCategory,
    checkTaskLimit,
    shouldBumpTask,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

// Custom hook to use the task context
export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};
