import { pubSub } from '../events/PubSub.js';
import { appState } from './AppState.js';
import { storageService } from './StorageService.js';
import { dateService } from './DateService.js';
import { generateId } from '../utils/helpers.js';

/**
 * TaskManager
 * Core business logic for task management
 */
class TaskManager {
    constructor() {
        this.initialized = false;
        this.taskLimits = {
            today: 6,
            tomorrow: 6,
            future: 42
        };
        
        this.setupEventListeners();
    }

    /**
     * Initialize TaskManager
     */
    async init() {
        if (this.initialized) return;
        
        try {
            // Load tasks from storage
            const savedTasks = storageService.getTasks();
            appState.set('tasks', savedTasks, true);
            
            // Process recurring tasks and midnight updates
            await this.processRecurringTasks();
            await this.processMidnightUpdates();
            
            this.initialized = true;
            pubSub.publish('taskManager:initialized');
            
        } catch (error) {
            console.error('Failed to initialize TaskManager:', error);
            pubSub.publish('taskManager:error', { error, action: 'init' });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for state changes
        appState.observe('tasks', (tasks) => {
            storageService.saveTasks(tasks);
            pubSub.publish('tasks:changed', { tasks });
        });

        // Auto-save on task changes
        pubSub.subscribe('task:created', ({ task }) => this.handleTaskCreated(task));
        pubSub.subscribe('task:updated', ({ task }) => this.handleTaskUpdated(task));
        pubSub.subscribe('task:deleted', ({ taskId }) => this.handleTaskDeleted(taskId));
    }

    /**
     * Get all tasks
     * @returns {Array} Array of tasks
     */
    getTasks() {
        return appState.get('tasks') || [];
    }

    /**
     * Get task by ID
     * @param {string} id - Task ID
     * @returns {Object|null} Task or null if not found
     */
    getTaskById(id) {
        const tasks = this.getTasks();
        return tasks.find(task => String(task.id) === String(id)) || null;
    }

    /**
     * Create new task
     * @param {Object} taskData - Task data
     * @returns {Object} Created task
     */
    createTask(taskData) {
        const task = {
            id: generateId('task'),
            title: taskData.title || '',
            description: taskData.description || '',
            dueDate: taskData.dueDate || null,
            completed: false,
            priority: taskData.priority || 'medium',
            tags: taskData.tags || [],
            recurrence: taskData.recurrence || null,
            parentRecurringId: taskData.parentRecurringId || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...taskData
        };

        // Validate task before adding
        if (!this.validateTask(task)) {
            throw new Error('Invalid task data');
        }

        // Check category limits
        const category = this.getTaskCategory(task);
        if (!this.canAddTask(category)) {
            throw new Error(`Cannot add more tasks to ${category}. Limit reached.`);
        }

        const tasks = this.getTasks();
        tasks.push(task);
        appState.set('tasks', tasks);

        pubSub.publish('task:created', { task });
        return task;
    }

    /**
     * Update existing task
     * @param {string} id - Task ID
     * @param {Object} updates - Task updates
     * @returns {Object|null} Updated task or null if not found
     */
    updateTask(id, updates) {
        const tasks = this.getTasks();
        const index = tasks.findIndex(task => String(task.id) === String(id));
        
        if (index === -1) {
            return null;
        }

        const updatedTask = {
            ...tasks[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        // Validate updated task
        if (!this.validateTask(updatedTask)) {
            throw new Error('Invalid task data');
        }

        tasks[index] = updatedTask;
        appState.set('tasks', tasks);

        pubSub.publish('task:updated', { task: updatedTask });
        return updatedTask;
    }

    /**
     * Delete task
     * @param {string} id - Task ID
     * @returns {boolean} Success status
     */
    deleteTask(id) {
        const tasks = this.getTasks();
        const initialLength = tasks.length;
        const filteredTasks = tasks.filter(task => String(task.id) !== String(id));
        
        if (filteredTasks.length < initialLength) {
            appState.set('tasks', filteredTasks);
            pubSub.publish('task:deleted', { taskId: id });
            return true;
        }
        
        return false;
    }

    /**
     * Toggle task completion
     * @param {string} id - Task ID
     * @returns {boolean} Success status
     */
    toggleTaskCompletion(id) {
        const task = this.getTaskById(id);
        if (!task) return false;

        return this.updateTask(id, { completed: !task.completed }) !== null;
    }

    /**
     * Get task category based on due date
     * @param {Object} task - Task object
     * @returns {string} Category (today, tomorrow, future, overdue)
     */
    getTaskCategory(task) {
        if (!task.dueDate) return 'future';
        
        const taskDate = new Date(task.dueDate);
        const today = dateService.getStartOfDay(new Date());
        const tomorrow = dateService.addDays(today, 1);
        
        if (dateService.isToday(taskDate)) {
            return 'today';
        } else if (dateService.isTomorrow(taskDate)) {
            return 'tomorrow';
        } else if (taskDate > tomorrow) {
            return 'future';
        } else {
            return 'overdue';
        }
    }

    /**
     * Categorize all tasks
     * @returns {Object} Categorized tasks
     */
    categorizeTasks() {
        const tasks = this.getTasks();
        const categorized = {
            today: [],
            tomorrow: [],
            future: [],
            overdue: []
        };
        
        tasks.forEach(task => {
            const category = this.getTaskCategory(task);
            categorized[category].push(task);
        });
        
        return categorized;
    }

    /**
     * Get tasks by category
     * @param {string} category - Category name
     * @returns {Array} Tasks in category
     */
    getTasksByCategory(category) {
        const tasks = this.getTasks();
        const today = dateService.getStartOfDay(new Date());
        const tomorrow = dateService.addDays(today, 1);
        
        switch (category) {
            case 'today':
                return tasks.filter(task => 
                    task.dueDate && dateService.isToday(new Date(task.dueDate))
                );
            case 'tomorrow':
                return tasks.filter(task => 
                    task.dueDate && dateService.isTomorrow(new Date(task.dueDate))
                );
            case 'future':
                return tasks.filter(task => {
                    if (!task.dueDate) return true;
                    const taskDate = new Date(task.dueDate);
                    return taskDate > tomorrow;
                });
            case 'overdue':
                return tasks.filter(task => 
                    task.dueDate && dateService.isPast(new Date(task.dueDate)) && !task.completed
                );
            default:
                return [];
        }
    }

    /**
     * Get tasks for specific date
     * @param {Date|string} date - Target date
     * @returns {Array} Tasks for the date
     */
    getTasksForDate(date) {
        const targetDate = new Date(date);
        const tasks = this.getTasks();
        
        // Get regular tasks for this date
        const regularTasks = tasks.filter(task => 
            task.dueDate && dateService.isToday(new Date(task.dueDate), targetDate)
        );
        
        // Get recurring tasks for this date
        const recurringTasks = this.getRecurringTasksForDate(targetDate);
        
        // Combine and deduplicate
        const allTasks = [...regularTasks, ...recurringTasks];
        return this.deduplicateTasks(allTasks);
    }

    /**
     * Get recurring tasks for specific date
     * @param {Date} date - Target date
     * @returns {Array} Recurring tasks for the date
     */
    getRecurringTasksForDate(date) {
        const tasks = this.getTasks();
        const recurringTasks = tasks.filter(task => 
            task.recurrence && task.recurrence.enabled && !task.parentRecurringId
        );
        
        const tasksForDate = [];
        
        recurringTasks.forEach(task => {
            if (this.shouldCreateRecurringInstance(task, date)) {
                // Check if instance already exists
                const existingInstance = tasks.find(t => 
                    t.parentRecurringId === task.id && 
                    dateService.isToday(new Date(t.dueDate), date)
                );
                
                if (!existingInstance) {
                    // Create virtual instance
                    const virtualInstance = {
                        ...task,
                        id: `${task.id}_${date.toISOString().split('T')[0]}`,
                        dueDate: date.toISOString(),
                        completed: false,
                        isVirtualRecurring: true,
                        parentRecurringId: task.id
                    };
                    tasksForDate.push(virtualInstance);
                } else {
                    tasksForDate.push(existingInstance);
                }
            }
        });
        
        return tasksForDate;
    }

    /**
     * Check if can add task to category
     * @param {string} category - Category name
     * @returns {boolean} Can add task
     */
    canAddTask(category) {
        const categorized = this.categorizeTasks();
        const currentCount = categorized[category]?.length || 0;
        const limit = this.taskLimits[category] || Infinity;
        
        return currentCount < limit;
    }

    /**
     * Validate task data
     * @param {Object} task - Task to validate
     * @returns {boolean} Is valid
     */
    validateTask(task) {
        if (!task || typeof task !== 'object') return false;
        if (!task.title || typeof task.title !== 'string') return false;
        if (task.dueDate && isNaN(new Date(task.dueDate).getTime())) return false;
        
        return true;
    }

    /**
     * Process recurring tasks
     */
    async processRecurringTasks() {
        const today = new Date();
        const tasks = this.getTasks();
        const recurringTasks = tasks.filter(task => 
            task.recurrence && task.recurrence.enabled && !task.parentRecurringId
        );
        
        let newTasks = [];
        
        recurringTasks.forEach(task => {
            if (this.shouldCreateRecurringInstance(task, today)) {
                const newTask = this.createRecurringTaskInstance(task, today);
                newTasks.push(newTask);
            }
        });
        
        if (newTasks.length > 0) {
            const allTasks = [...tasks, ...newTasks];
            appState.set('tasks', allTasks);
            pubSub.publish('tasks:recurring:created', { tasks: newTasks });
        }
    }

    /**
     * Check if should create recurring instance
     * @param {Object} task - Recurring task
     * @param {Date} date - Target date
     * @returns {boolean} Should create instance
     */
    shouldCreateRecurringInstance(task, date) {
        if (!task.recurrence || !task.recurrence.enabled) return false;
        
        const taskDate = new Date(task.dueDate);
        const recurrence = task.recurrence;
        
        // Check if instance already exists
        const tasks = this.getTasks();
        const existingInstance = tasks.find(t => 
            t.parentRecurringId === task.id && 
            dateService.isToday(new Date(t.dueDate), date)
        );
        
        if (existingInstance) return false;
        
        switch (recurrence.type) {
            case 'daily':
                return date >= taskDate;
            
            case 'weekly':
                if (!recurrence.days || recurrence.days.length === 0) return false;
                return recurrence.days.includes(date.getDay()) && date >= taskDate;
            
            case 'monthly':
                if (recurrence.monthlyType === 'weekday') {
                    const taskWeekday = taskDate.getDay();
                    const taskWeekOfMonth = Math.ceil(taskDate.getDate() / 7);
                    const dateWeekOfMonth = Math.ceil(date.getDate() / 7);
                    
                    return date.getDay() === taskWeekday && 
                           dateWeekOfMonth === taskWeekOfMonth && 
                           date >= taskDate;
                } else {
                    return date.getDate() === taskDate.getDate() && date >= taskDate;
                }
            
            default:
                return false;
        }
    }

    /**
     * Create recurring task instance
     * @param {Object} parentTask - Parent recurring task
     * @param {Date} date - Instance date
     * @returns {Object} New task instance
     */
    createRecurringTaskInstance(parentTask, date) {
        return {
            ...parentTask,
            id: generateId('recurring'),
            parentRecurringId: parentTask.id,
            dueDate: date.toISOString(),
            completed: false,
            recurrence: null, // Don't inherit recurrence
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Process midnight updates
     */
    async processMidnightUpdates() {
        const lastProcessed = storageService.getItem('lastMidnightProcess');
        const now = new Date();
        
        if (!lastProcessed || new Date(lastProcessed).getDate() !== now.getDate()) {
            // Process any midnight logic here
            storageService.setItem('lastMidnightProcess', now.toISOString());
            pubSub.publish('tasks:midnight:processed', { date: now });
        }
    }

    /**
     * Remove duplicate tasks
     * @param {Array} tasks - Tasks array
     * @returns {Array} Deduplicated tasks
     */
    deduplicateTasks(tasks) {
        const seen = new Set();
        return tasks.filter(task => {
            if (seen.has(task.id)) {
                return false;
            }
            seen.add(task.id);
            return true;
        });
    }

    /**
     * Event handlers
     */
    handleTaskCreated(task) {
        console.log('Task created:', task.title);
    }

    handleTaskUpdated(task) {
        console.log('Task updated:', task.title);
    }

    handleTaskDeleted(taskId) {
        console.log('Task deleted:', taskId);
    }

    /**
     * Export tasks data
     * @returns {Object} Export data
     */
    exportTasks() {
        return {
            tasks: this.getTasks(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * Import tasks data
     * @param {Object} data - Import data
     * @returns {boolean} Success status
     */
    importTasks(data) {
        try {
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('Invalid import data');
            }

            // Validate all tasks
            const validTasks = data.tasks.filter(task => this.validateTask(task));
            
            appState.set('tasks', validTasks);
            pubSub.publish('tasks:imported', { count: validTasks.length });
            
            return true;
        } catch (error) {
            console.error('Failed to import tasks:', error);
            pubSub.publish('taskManager:error', { error, action: 'import' });
            return false;
        }
    }

    /**
     * Get task statistics
     * @returns {Object} Task statistics
     */
    getStatistics() {
        const tasks = this.getTasks();
        const categorized = this.categorizeTasks();
        
        return {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            pending: tasks.filter(t => !t.completed).length,
            today: categorized.today.length,
            tomorrow: categorized.tomorrow.length,
            future: categorized.future.length,
            overdue: categorized.overdue.length,
            withDueDate: tasks.filter(t => t.dueDate).length,
            recurring: tasks.filter(t => t.recurrence?.enabled).length
        };
    }
}

// Export singleton instance
export const taskManager = new TaskManager();
export default taskManager;
