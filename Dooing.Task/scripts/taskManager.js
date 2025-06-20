// Add to taskManager.js
import Storage from './storage.js';
import { getToday, generateId } from './utils.js';
const TaskManager = {
    tasks: [],
    init(){
        this.tasks = Storage.loadTasks();
        // Process recurring tasks and midnight updates on initialization
        this.processRecurringTasks();
        this.processMidnightUpdates();
        return this;
    },
    
    // Prioritize dates over manual selection - determine category based on due date
    getTaskCategory(task) {
        if (!task.dueDate) return 'future'; // No date = future by default
        
        const today = getToday();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const taskDate = new Date(task.dueDate);
        
        if (this.isSameDay(taskDate, today)) {
            return 'today';
        } else if (this.isSameDay(taskDate, tomorrow)) {
            return 'tomorrow';
        } else if (taskDate > tomorrow) {
            return 'future';
        } else {
            return 'overdue'; // Past dates
        }
    },
    
    categorizeTasks() {
        const categorized = {
            today: [],
            tomorrow: [],
            future: [],
            overdue: []
        };
        
        this.tasks.forEach(task => {
            const category = this.getTaskCategory(task);
            categorized[category].push(task);
        });
        
        return categorized;
    },
    
    // Get tasks filtered by category based on due date (not manual category)
    getTasksByDateCategory(category) {
        const today = getToday();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        switch (category) {
            case 'today':
                return this.tasks.filter(task => 
                    task.dueDate && this.isSameDay(new Date(task.dueDate), today)
                );
            case 'tomorrow':
                return this.tasks.filter(task => 
                    task.dueDate && this.isSameDay(new Date(task.dueDate), tomorrow)
                );
            case 'future':
                return this.tasks.filter(task => {
                    if (!task.dueDate) return true; // No date = future
                    const taskDate = new Date(task.dueDate);
                    return taskDate > tomorrow;
                });
            case 'overdue':
                return this.tasks.filter(task => 
                    task.dueDate && new Date(task.dueDate) < today && !task.completed
                );
            default:
                return [];
        }
    },
    
    // Get tasks for a specific date (for calendar rendering)
    getTasksForDate(date) {
        const targetDate = new Date(date);
        
        // Get regular tasks for this date
        const regularTasks = this.tasks.filter(task => 
            task.dueDate && this.isSameDay(new Date(task.dueDate), targetDate)
        );
        
        // Get recurring tasks that should appear on this date
        const recurringTasks = this.getRecurringTasksForDate(targetDate);
        
        // Combine and return unique tasks
        const allTasks = [...regularTasks, ...recurringTasks];
        
        // Remove duplicates based on task ID
        const uniqueTasks = allTasks.filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
        );
        
        return uniqueTasks;
    },

    // Get recurring tasks that should appear on a specific date
    getRecurringTasksForDate(date) {
        const recurringTasks = this.tasks.filter(task => 
            task.recurrence && task.recurrence.enabled && !task.parentRecurringId
        );
        
        const tasksForDate = [];
        
        recurringTasks.forEach(task => {
            if (this.shouldCreateRecurringInstance(task, date)) {
                // Check if we already have an instance for this date
                const existingInstance = this.tasks.find(t => 
                    t.parentRecurringId === task.id && 
                    this.isSameDay(new Date(t.dueDate), date)
                );
                
                if (!existingInstance) {
                    // Create a virtual instance for display (not saved to storage yet)
                    const virtualInstance = {
                        ...task,
                        id: `${task.id}_${date.toDateString()}`, // Temporary ID for rendering
                        dueDate: date.toISOString(),
                        completed: false,
                        isVirtualRecurring: true, // Flag to identify virtual instances
                        parentRecurringId: task.id
                    };
                    tasksForDate.push(virtualInstance);
                } else {
                    tasksForDate.push(existingInstance);
                }
            }
        });
        
        return tasksForDate;
    },
    
    // Get all future tasks for calendar (includes today and beyond)
    getFutureTasksForCalendar() {
        const today = getToday();
        return this.tasks.filter(task => {
            if (!task.dueDate) return true; // No date = future
            return new Date(task.dueDate) >= today;
        });
    },
    
    isSameDay(date1, date2) {
        return new Date(date1).toDateString() === new Date(date2).toDateString();
    },
    
    // Auto-move tasks at midnight
    processMidnightUpdates() {
        const lastProcessed = localStorage.getItem('lastMidnightProcess');
        const now = new Date();
        
        if (!lastProcessed || new Date(lastProcessed).getDate() !== now.getDate()) {
            // Move tasks between categories
            this.tasks.forEach(task => {
                // Implementation of auto-movement logic
            });
            
            localStorage.setItem('lastMidnightProcess', now.toISOString());
            Storage.saveTasks(this.tasks);
        }
    },

    canAddTask(category) {
        const limits = {
            today: 6,
            tomorrow: 6,
            future: 42
        };
        
        // Use date-based categorization instead of manual category
        const categorized = this.categorizeTasks();
        const currentCount = categorized[category] ? categorized[category].length : 0;
        return currentCount < limits[category];
    },
    
    validateTaskAddition(category) {
        if (!this.canAddTask(category)) {
            // Show error to user
            return false;
        }
        return true;
    },
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => String(t.id) === String(taskId));
        if (task) {
            task.completed = !task.completed;
            Storage.saveTasks(this.tasks);
            return true;
        }
        return false;
    },

    getTaskById(id){
        return this.tasks.find(t => String(t.id) === String(id));
    },
    addTask(task){
        this.tasks.push(task);
        Storage.saveTasks(this.tasks);
        return task;
    },
    
    getTasks(filterFn) {
        if (filterFn) {
            return this.tasks.filter(filterFn);
        }
        return this.tasks;
    },
    
    getTasksByCategory(category) {
        // Use the new date-based categorization
        return this.getTasksByDateCategory(category);
    },
    
    getTasksForCategory(category) {
        // Use the existing date-based categorization method
        return this.getTasksByDateCategory(category);
    },
    
    updateTask(updatedTask) {
        const index = this.tasks.findIndex(t => String(t.id) === String(updatedTask.id));
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updatedTask };
            Storage.saveTasks(this.tasks);
            return true;
        }
        return false;
    },
    
    deleteTask(id){
        const initialLength = this.tasks.length;
        // Convert both to strings for comparison to handle any data type inconsistencies
        this.tasks = this.tasks.filter(t => String(t.id) !== String(id));
        const deleted = this.tasks.length < initialLength;
        if (deleted) {
            Storage.saveTasks(this.tasks);
        }
        return deleted;
    },
    
    // Recurring task management
    processRecurringTasks() {
        const today = getToday();
        const recurringTasks = this.tasks.filter(task => task.recurrence && task.recurrence.enabled);
        
        recurringTasks.forEach(task => {
            if (this.shouldCreateRecurringInstance(task, today)) {
                this.createRecurringTaskInstance(task, today);
            }
        });
    },

    shouldCreateRecurringInstance(task, date) {
        if (!task.recurrence || !task.recurrence.enabled) return false;
        
        const taskDate = new Date(task.dueDate);
        const recurrence = task.recurrence;
        
        // Check if we already have an instance for this date
        const existingInstance = this.tasks.find(t => 
            t.parentRecurringId === task.id && 
            this.isSameDay(new Date(t.dueDate), date)
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
                    // Same weekday of the month (e.g., first Monday)
                    const taskWeekday = taskDate.getDay();
                    const taskWeekOfMonth = Math.ceil(taskDate.getDate() / 7);
                    const dateWeekOfMonth = Math.ceil(date.getDate() / 7);
                    
                    return date.getDay() === taskWeekday && 
                           dateWeekOfMonth === taskWeekOfMonth && 
                           date >= taskDate;
                } else {
                    // Same date each month
                    return date.getDate() === taskDate.getDate() && date >= taskDate;
                }
            
            default:
                return false;
        }
    },

    createRecurringTaskInstance(parentTask, date) {
        const newTask = {
            ...parentTask,
            id: generateId(),
            parentRecurringId: parentTask.id,
            dueDate: date.toISOString(),
            completed: false,
            createdAt: new Date().toISOString(),
            // Don't copy recurrence to instances to avoid infinite recursion
            recurrence: null
        };
        
        this.tasks.push(newTask);
        Storage.saveTasks(this.tasks);
        
        return newTask;
    },
};

export default TaskManager.init();