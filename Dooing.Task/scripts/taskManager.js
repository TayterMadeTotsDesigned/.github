// Add to taskManager.js
import Storage from './storage.js';
import { getToday } from './utils.js';
const TaskManager = {
    tasks: [],
    init(){
        this.tasks = Storage.loadTasks();
        return this;
    },
    
    categorizeTasks() {
        const today = getToday();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return {
            today: this.getTasks(task => this.isSameDay(task.dueDate, today)),
            tomorrow: this.getTasks(task => this.isSameDay(task.dueDate, tomorrow)),
            future: this.getTasks(task => new Date(task.dueDate) > tomorrow),
            overdue: this.getTasks(task => new Date(task.dueDate) < today && !task.completed)
        };
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
        
        const categorized = this.categorizeTasks();
        return categorized[category].length < limits[category];
    },
    
    validateTaskAddition(category) {
        if (!this.canAddTask(category)) {
            // Show error to user
            return false;
        }
        return true;
    },
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            Storage.saveTasks(this.tasks);
            return true;
        }
        return false;
    },

    getTaskById(id){
        return this.tasks.find(t => t.id === id);
    },
    addTask(task){
        this.tasks.push(task);
        Storage.saveTasks(this.tasks);
        return task;
    },
    deleteTask(id){
        this.tasks = this.tasks.filter(t => t.id != id);
        Storage.saveTasks(this.tasks);
    }
};

export default TaskManager.init();