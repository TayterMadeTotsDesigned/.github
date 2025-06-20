// types/index.ts - Main types for the Dooing.Task application

export type RepeatType = 'none' | 'daily' | 'weekly';
export type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TaskRepeat {
  type: RepeatType;
  weekDays?: WeekDay[]; // For weekly repeat, the days of the week it repeats
}

export type TaskContext = 'work' | 'personal' | 'home' | 'errands' | 'health' | 'other';

export interface TaskContextInfo {
  color: string;
  icon?: string;
}

export const TaskContextColors: Record<TaskContext, TaskContextInfo> = {
  work: { color: '#4f46e5', icon: '💼' },
  personal: { color: '#8b5cf6', icon: '🧘' },
  home: { color: '#14b8a6', icon: '🏠' },
  errands: { color: '#f59e0b', icon: '🛒' },
  health: { color: '#ef4444', icon: '🏥' },
  other: { color: '#6b7280', icon: '📝' },
};

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate?: Date;
  repeat?: TaskRepeat;
  context?: TaskContext;
  createdAt: Date;
  updatedAt: Date;
  // Pomodoro integration
  estimatedPomodoros?: number;
  completedPomodoros?: number;
  currentlyActive?: boolean; // Currently selected for Pomodoro work
}

export type TaskCategory = 'today' | 'tomorrow' | 'future';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface PomodoroSession {
  id: string;
  type: PomodoroSessionType;
  duration: number; // in minutes
  startTime?: Date;
  endTime?: Date;
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number; // in seconds
  // Task association
  associatedTaskId?: string;
  taskTitle?: string;
  completedSuccessfully?: boolean;
  notes?: string;
}

export type PomodoroSessionType = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  // Task integration settings
  autoSelectNextTask: boolean;
  pauseWhenTasksComplete: boolean;
  suggestTaskMovement: boolean;
}

// New interfaces for task-pomodoro integration
export interface TaskSuggestion {
  type: 'add_tasks' | 'move_from_tomorrow' | 'continue_working';
  message: string;
  actionLabel: string;
  tasks?: Task[]; // For move_from_tomorrow suggestions
}

export interface PomodoroTaskState {
  availableTasks: Task[]; // Today's incomplete tasks
  activeTaskId: string | null;
  suggestions: TaskSuggestion[];
  sessionHistory: PomodoroSession[];
}

export interface AppState {
  tasks: Task[];
  currentCategory: TaskCategory | 'pomodoro';
  pomodoroSession: PomodoroSession | null;
  pomodoroSettings: PomodoroSettings;
  theme: string;
  sidebarOpen: boolean;
  taskLimitEnabled: boolean;
  taskLimit: number;
}

export interface ModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  task?: Task;
  initialDate?: Date;
}

// Component Props Interfaces
export interface HeaderProps {
  currentCategory: string;
  onCategoryChange: (category: TaskCategory | 'pomodoro') => void;
  onNewTask: () => void;
  onToggleSidebar: () => void;
}

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export interface TaskListProps {
  tasks: Task[];
  category: TaskCategory;
  onTaskToggle: (taskId: string) => void;
  onTaskEdit: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  onAddTask: (date?: Date) => void;
  onBatchDelete?: (taskIds: string[]) => void;
}

export interface PomodoroTimerProps {
  session: PomodoroSession | null;
  settings: PomodoroSettings;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onSettingsToggle: () => void;
}

export interface TaskModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  task?: Task;
  category: TaskCategory;
  initialDate?: Date;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}
