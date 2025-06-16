import { pubSub } from '../../events/PubSub.js';
import { appState } from '../../core/AppState.js';
import { taskManager } from '../../core/TaskManager.js';
import { dateService } from '../../core/DateService.js';
import { escapeHTML, debounce } from '../../utils/helpers.js';

/**
 * TaskRenderer
 * Handles all task rendering and UI display logic using the new architecture
 */
class TaskRenderer {
    constructor() {
        this.initialized = false;
        this.renderQueue = new Set();
        this.debouncedRender = debounce(() => this.processRenderQueue(), 100);
        
        this.setupEventListeners();
    }

    /**
     * Initialize the renderer
     */
    init() {
        if (this.initialized) return;

        this.initialized = true;
        pubSub.publish('taskRenderer:initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for task changes
        pubSub.subscribe('tasks:changed', ({ tasks }) => {
            this.scheduleRender('all');
        });

        pubSub.subscribe('task:created', ({ task }) => {
            this.scheduleRender('all');
            this.highlightNewTask(task.id);
        });

        pubSub.subscribe('task:updated', ({ task }) => {
            this.scheduleRender('task', task.id);
        });

        pubSub.subscribe('task:deleted', ({ taskId }) => {
            this.removeTaskElement(taskId);
        });

        // Listen for view changes
        pubSub.subscribe('view:switch', ({ view }) => {
            this.renderCategory(view);
        });

        // Listen for app render requests
        pubSub.subscribe('app:render:initial', () => {
            this.renderCurrentView();
        });

        // Listen for task interactions
        pubSub.subscribe('task:toggle:completion', ({ taskId }) => {
            this.handleTaskToggle(taskId);
        });

        pubSub.subscribe('task:edit:open', ({ taskId }) => {
            this.handleTaskEdit(taskId);
        });

        pubSub.subscribe('task:delete:request', ({ taskId }) => {
            this.handleTaskDelete(taskId);
        });
    }

    /**
     * Schedule a render operation
     * @param {string} type - Render type (all, category, task)
     * @param {string} target - Target identifier
     */
    scheduleRender(type, target = null) {
        this.renderQueue.add({ type, target });
        this.debouncedRender();
    }

    /**
     * Process the render queue
     */
    processRenderQueue() {
        const queue = Array.from(this.renderQueue);
        this.renderQueue.clear();

        // Group render operations by type
        const operations = {
            all: queue.filter(op => op.type === 'all'),
            category: queue.filter(op => op.type === 'category'),
            task: queue.filter(op => op.type === 'task')
        };

        // Process operations efficiently
        if (operations.all.length > 0) {
            this.renderAllCategories();
        } else {
            operations.category.forEach(op => this.renderCategory(op.target));
            operations.task.forEach(op => this.renderSingleTask(op.target));
        }
    }

    /**
     * Render current view
     */
    renderCurrentView() {
        const currentView = appState.get('currentView') || 'today';
        this.renderCategory(currentView);
    }

    /**
     * Render all task categories
     */
    renderAllCategories() {
        this.renderCategory('today');
        this.renderCategory('tomorrow');
        this.renderCategory('future');
    }

    /**
     * Render tasks for a specific category
     * @param {string} category - Category name (today, tomorrow, future)
     */
    renderCategory(category) {
        try {
            const tasks = taskManager.getTasksByCategory(category);
            const containerId = `${category}-tasks`;
            
            this.renderTaskList(containerId, tasks);
            this.updateTaskCounts();
            
            pubSub.publish('taskRenderer:category:rendered', { category, tasks });
            
        } catch (error) {
            console.error(`Failed to render category ${category}:`, error);
            pubSub.publish('taskRenderer:error', { error, category });
        }
    }

    /**
     * Render tasks for a specific date (used by calendar)
     * @param {Date|string} date - Target date
     */
    renderTasksForDate(date) {
        try {
            const tasks = taskManager.getTasksForDate(date);
            const dateString = dateService.formatDate(date, 'iso');
            
            // Find calendar day element
            const dayElement = document.querySelector(`[data-calendar-date="${dateString}"]`);
            if (dayElement) {
                this.renderCalendarDayTasks(dayElement, tasks);
            }
            
            pubSub.publish('taskRenderer:date:rendered', { date, tasks });
            
        } catch (error) {
            console.error(`Failed to render tasks for date ${date}:`, error);
            pubSub.publish('taskRenderer:error', { error, date });
        }
    }

    /**
     * Render a list of tasks in a container
     * @param {string} containerId - Container element ID
     * @param {Array} tasks - Array of tasks
     */
    renderTaskList(containerId, tasks) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        const tasksList = container.querySelector('.tasks-list');
        if (!tasksList) {
            console.warn(`Tasks list not found in ${containerId}`);
            return;
        }

        // Clear existing tasks
        tasksList.innerHTML = '';

        if (tasks.length === 0) {
            this.showEmptyState(container);
            return;
        }

        // Hide empty state
        this.hideEmptyState(container);

        // Render tasks
        const fragment = document.createDocumentFragment();
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            fragment.appendChild(taskElement);
        });

        tasksList.appendChild(fragment);
    }

    /**
     * Create a task element from task data
     * @param {Object} task - Task object
     * @returns {HTMLElement} Task element
     */
    createTaskElement(task) {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.taskId = task.id;
        taskItem.dataset.draggable = 'task';

        const isVirtualRecurring = task.isVirtualRecurring;
        const displayClass = isVirtualRecurring ? 'recurring-task' : '';

        taskItem.innerHTML = `
            <div class="task-content">
                <button class="task-checkbox ${task.completed ? 'checked' : ''}" 
                        data-action="toggle-task" 
                        data-task-id="${task.id}"
                        aria-label="Mark as complete">
                    <span class="checkbox-icon"></span>
                </button>
                <div class="task-details">
                    <h4 class="task-title ${displayClass}">
                        ${isVirtualRecurring ? '↻ ' : ''}${escapeHTML(task.title || task.name)}
                    </h4>
                    <p class="task-description" 
                       style="font-style: ${task.description ? 'normal' : 'italic'}; opacity: ${task.description ? '1' : '0.6'};">
                        ${escapeHTML(task.description) || 'No description provided'}
                    </p>
                    <div class="task-meta">
                        <span class="task-time">${this.formatTaskTime(task)}</span>
                        ${this.renderTaskBadges(task)}
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-edit-btn" 
                        data-action="edit-task" 
                        data-task-id="${task.id}"
                        aria-label="Edit task">✏️</button>
                <button class="task-delete-btn" 
                        data-action="delete-task" 
                        data-task-id="${task.id}"
                        aria-label="Delete task">🗑️</button>
            </div>
        `;

        // Add drag and drop support
        taskItem.draggable = true;

        return taskItem;
    }

    /**
     * Format task time display
     * @param {Object} task - Task object
     * @returns {string} Formatted time
     */
    formatTaskTime(task) {
        if (task.dueDate || task.date) {
            const date = new Date(task.dueDate || task.date);
            return dateService.formatDate(date, 'medium');
        }
        return '';
    }

    /**
     * Render task badges (recurring, priority, etc.)
     * @param {Object} task - Task object
     * @returns {string} HTML for badges
     */
    renderTaskBadges(task) {
        const badges = [];
        
        if (task.recurrence && task.recurrence.enabled) {
            badges.push(`<span class="task-badge recurring">Repeats ${task.recurrence.type}</span>`);
        }
        
        if (task.priority && task.priority !== 'medium') {
            badges.push(`<span class="task-badge priority-${task.priority}">${task.priority.toUpperCase()}</span>`);
        }

        if (task.tags && task.tags.length > 0) {
            task.tags.forEach(tag => {
                badges.push(`<span class="task-badge tag">${escapeHTML(tag)}</span>`);
            });
        }
        
        return badges.length > 0 ? `<div class="task-badges">${badges.join('')}</div>` : '';
    }

    /**
     * Render tasks in calendar day element
     * @param {HTMLElement} dayElement - Calendar day element
     * @param {Array} tasks - Tasks for the day
     */
    renderCalendarDayTasks(dayElement, tasks) {
        // Remove existing task indicators
        dayElement.querySelectorAll('.task-indicator').forEach(el => el.remove());

        if (tasks.length === 0) return;

        // Add task count indicator
        const indicator = document.createElement('div');
        indicator.className = 'task-indicator';
        indicator.textContent = tasks.length;
        indicator.title = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
        
        dayElement.appendChild(indicator);

        // Add completed task indicator if all tasks are done
        const completedTasks = tasks.filter(t => t.completed);
        if (completedTasks.length === tasks.length) {
            dayElement.classList.add('all-completed');
        } else {
            dayElement.classList.remove('all-completed');
        }
    }

    /**
     * Show empty state for a container
     * @param {HTMLElement} container - Container element
     */
    showEmptyState(container) {
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = 'block';
        }

        const tasksList = container.querySelector('.tasks-list');
        if (tasksList) {
            tasksList.style.display = 'none';
        }
    }

    /**
     * Hide empty state for a container
     * @param {HTMLElement} container - Container element
     */
    hideEmptyState(container) {
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        const tasksList = container.querySelector('.tasks-list');
        if (tasksList) {
            tasksList.style.display = 'block';
        }
    }

    /**
     * Update task counts in navigation
     */
    updateTaskCounts() {
        try {
            const categorized = taskManager.categorizeTasks();
            
            Object.entries(categorized).forEach(([category, tasks]) => {
                const countElement = document.querySelector(`[data-task-count="${category}"]`);
                if (countElement) {
                    const pendingTasks = tasks.filter(t => !t.completed);
                    countElement.textContent = pendingTasks.length;
                    countElement.style.display = pendingTasks.length > 0 ? 'block' : 'none';
                }
            });
            
        } catch (error) {
            console.error('Failed to update task counts:', error);
        }
    }

    /**
     * Render a single task (update existing element)
     * @param {string} taskId - Task ID
     */
    renderSingleTask(taskId) {
        const task = taskManager.getTaskById(taskId);
        if (!task) return;

        const existingElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (existingElement) {
            const newElement = this.createTaskElement(task);
            existingElement.parentNode.replaceChild(newElement, existingElement);
        }
    }

    /**
     * Remove task element from DOM
     * @param {string} taskId - Task ID
     */
    removeTaskElement(taskId) {
        const element = document.querySelector(`[data-task-id="${taskId}"]`);
        if (element) {
            element.remove();
            this.updateTaskCounts();
        }
    }

    /**
     * Highlight newly created task
     * @param {string} taskId - Task ID
     */
    highlightNewTask(taskId) {
        setTimeout(() => {
            const element = document.querySelector(`[data-task-id="${taskId}"]`);
            if (element) {
                element.classList.add('new-task');
                setTimeout(() => {
                    element.classList.remove('new-task');
                }, 2000);
            }
        }, 100);
    }

    /**
     * Event handlers
     */
    handleTaskToggle(taskId) {
        taskManager.toggleTaskCompletion(taskId);
    }

    handleTaskEdit(taskId) {
        pubSub.publish('modal:open', {
            type: 'editTask',
            data: { taskId }
        });
    }

    handleTaskDelete(taskId) {
        const task = taskManager.getTaskById(taskId);
        if (!task) return;

        pubSub.publish('modal:open', {
            type: 'confirmDelete',
            data: { 
                taskId,
                taskTitle: task.title || task.name,
                onConfirm: () => {
                    taskManager.deleteTask(taskId);
                    pubSub.publish('modal:close');
                }
            }
        });
    }

    /**
     * Get renderer statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        return {
            initialized: this.initialized,
            renderQueueSize: this.renderQueue.size,
            renderedTasks: document.querySelectorAll('.task-item').length
        };
    }

    /**
     * Cleanup renderer
     */
    cleanup() {
        this.renderQueue.clear();
        this.initialized = false;
        pubSub.publish('taskRenderer:cleanup');
    }
}

// Create and export singleton instance
export const taskRenderer = new TaskRenderer();
export default taskRenderer;
