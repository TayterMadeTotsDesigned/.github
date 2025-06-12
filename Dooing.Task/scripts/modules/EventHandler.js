// EventHandler.js - Centralized event handling with delegation
import TaskManager from '../taskManager.js';
import { UIRenderer } from '../UI_Renderer.js';

class EventHandler {
    constructor(modalManager, calendarManager, taskRenderer) {
        this.modalManager = modalManager;
        this.calendarManager = calendarManager;
        this.taskRenderer = taskRenderer;
        this.currentCategory = 'today';
        this.categories = ['today', 'tomorrow', 'future'];
    }

    /**
     * Initialize all event handlers
     */
    init() {
        this.setupGlobalEventDelegation();
        this.setupFormHandlers();
        this.setupCalendarHandlers();
        this.setupNavigationHandlers();
        this.setupKeyboardHandlers();
    }

    /**
     * Set up global event delegation for better performance
     */
    setupGlobalEventDelegation() {
        // Handle all clicks with event delegation
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Task checkbox clicks
            if (target.matches('.task-checkbox, .task-checkbox *')) {
                this.handleTaskToggle(target.closest('.task-checkbox'));
                return;
            }
            
            // Task edit button clicks
            if (target.matches('.task-edit-btn, .task-edit-btn *')) {
                this.handleTaskEdit(target.closest('.task-edit-btn'));
                return;
            }
            
            // Task delete button clicks
            if (target.matches('.task-delete-btn, .task-delete-btn *')) {
                this.handleTaskDelete(target.closest('.task-delete-btn'));
                return;
            }
            
            // Add task button clicks
            if (target.matches('.add-task-btn, .add-task-btn *')) {
                this.handleAddTask(target.closest('.add-task-btn'));
                return;
            }
            
            // Calendar task clicks
            if (target.matches('.calendar-task, .calendar-task *')) {
                this.handleCalendarTaskClick(target.closest('.calendar-task'));
                return;
            }

            // Context menu clicks
            if (target.matches('.context-menu-item, .context-menu-item *')) {
                this.handleContextMenuClick(target.closest('.context-menu-item'));
                return;
            }

            // New task button
            if (target.matches('#new-task-btn, #new-task-btn *')) {
                this.modalManager.open();
                return;
            }

            // Modal close
            if (target.matches('#close-modal, #close-modal *')) {
                this.modalManager.close();
                return;
            }

            // Modal backdrop
            if (target.matches('.modal-backdrop')) {
                this.modalManager.close();
                return;
            }
            
            // Click outside context menu to close
            if (!target.closest('.task-context-menu')) {
                this.taskRenderer.hideTaskMenu();
            }
        });

        // Right-click context menu
        document.addEventListener('contextmenu', (e) => {
            const taskItem = e.target.closest('.task-item, .calendar-task');
            if (taskItem) {
                this.taskRenderer.showTaskMenu(taskItem, e);
            }
        });
    }

    /**
     * Set up form submission handlers
     */
    setupFormHandlers() {
        const taskForm = document.getElementById('task-form');
        taskForm?.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    /**
     * Set up calendar navigation handlers
     */
    setupCalendarHandlers() {
        // Calendar navigation buttons
        const prevWeekBtn = document.getElementById('prev-week');
        const nextWeekBtn = document.getElementById('next-week');
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');

        prevWeekBtn?.addEventListener('click', () => {
            this.calendarManager.navigateWeek('prev');
            this.renderCurrentCalendarView();
        });

        nextWeekBtn?.addEventListener('click', () => {
            this.calendarManager.navigateWeek('next');
            this.renderCurrentCalendarView();
        });

        prevMonthBtn?.addEventListener('click', () => {
            this.calendarManager.navigateMonth('prev');
            this.renderCurrentCalendarView();
        });

        nextMonthBtn?.addEventListener('click', () => {
            this.calendarManager.navigateMonth('next');
            this.renderCurrentCalendarView();
        });

        // View toggle buttons
        const weekViewBtn = document.getElementById('week-view-btn');
        const monthViewBtn = document.getElementById('month-view-btn');

        weekViewBtn?.addEventListener('click', () => {
            this.calendarManager.setView('week');
            this.updateViewButtons();
            this.renderCurrentCalendarView();
        });

        monthViewBtn?.addEventListener('click', () => {
            this.calendarManager.setView('month');
            this.updateViewButtons();
            this.renderCurrentCalendarView();
        });
    }

    /**
     * Set up category navigation handlers
     */
    setupNavigationHandlers() {
        // Arrow button navigation
        const leftArrow = document.getElementById('left-arrow-btn');
        const rightArrow = document.getElementById('right-arrow-btn');

        leftArrow?.addEventListener('click', () => {
            this.navigateCategories(-1);
        });

        rightArrow?.addEventListener('click', () => {
            this.navigateCategories(1);
        });

        // Category indicator dots (if present)
        document.addEventListener('click', (e) => {
            if (e.target.matches('.category-dot')) {
                const category = e.target.dataset.category;
                if (category) {
                    this.showCategory(category);
                }
            }
        });
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardHandlers() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when modal is not open
            if (this.modalManager.isOpen()) return;

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.navigateCategories(-1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.navigateCategories(1);
                    break;
                case 'n':
                case 'N':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.modalManager.open({ category: this.currentCategory });
                    }
                    break;
                case 'Escape':
                    this.taskRenderer.hideTaskMenu();
                    break;
            }
        });
    }

    // Event handler methods

    /**
     * Handle task completion toggle
     */
    handleTaskToggle(checkboxElement) {
        const taskItem = checkboxElement.closest('.task-item, .calendar-task');
        const taskId = taskItem?.dataset.taskId;
        
        if (!taskId) return;

        const success = TaskManager.toggleTaskCompletion(taskId);
        if (success) {
            this.refreshUI();
        } else {
            console.error('Failed to toggle task completion');
        }
    }

    /**
     * Handle task edit action
     */
    handleTaskEdit(editButton) {
        const taskItem = editButton.closest('.task-item, .calendar-task');
        const taskId = taskItem?.dataset.taskId;
        
        if (!taskId) return;

        const task = TaskManager.getTaskById(taskId);
        if (task) {
            // Handle virtual recurring tasks
            if (task.isVirtualRecurring) {
                const parentTask = TaskManager.getTaskById(task.parentRecurringId);
                if (parentTask) {
                    this.modalManager.open({
                        mode: 'edit',
                        task: parentTask
                    });
                } else {
                    alert('Parent recurring task not found');
                }
            } else {
                this.modalManager.open({
                    mode: 'edit',
                    task: task
                });
            }
        }
    }

    /**
     * Handle task deletion
     */
    handleTaskDelete(deleteButton) {
        const taskItem = deleteButton.closest('.task-item, .calendar-task');
        const taskId = taskItem?.dataset.taskId;
        
        if (!taskId) return;

        const task = TaskManager.getTaskById(taskId);
        if (!task) return;

        const taskName = task.name;
        const isVirtual = task.isVirtualRecurring;
        
        const confirmMessage = isVirtual 
            ? `Delete this recurring task instance for "${taskName}"?`
            : `Are you sure you want to delete "${taskName}"?`;
            
        if (confirm(confirmMessage)) {
            if (isVirtual) {
                // Create a real instance and mark it as deleted
                const actualTask = TaskManager.createRecurringTaskInstance(
                    TaskManager.getTaskById(task.parentRecurringId),
                    new Date(task.date)
                );
                if (actualTask) {
                    TaskManager.deleteTask(actualTask.id);
                }
            } else {
                TaskManager.deleteTask(taskId);
            }
            
            this.refreshUI();
        }
    }

    /**
     * Handle add task button click
     */
    handleAddTask(addButton) {
        const category = addButton.dataset.category || this.currentCategory;
        this.modalManager.open({ category });
    }

    /**
     * Handle calendar task click
     */
    handleCalendarTaskClick(taskElement) {
        const taskId = taskElement.dataset.taskId;
        const task = TaskManager.getTaskById(taskId);
        
        if (task && task.isVirtualRecurring) {
            // Create real instance from virtual recurring task
            const parentTask = TaskManager.getTaskById(task.parentRecurringId);
            if (parentTask) {
                const actualTask = TaskManager.createRecurringTaskInstance(
                    parentTask,
                    new Date(task.date)
                );
                if (actualTask) {
                    this.refreshUI();
                }
            }
        }
    }

    /**
     * Handle context menu item click
     */
    handleContextMenuClick(menuItem) {
        const action = menuItem.dataset.action;
        const menu = menuItem.closest('.task-context-menu');
        
        if (!action || !menu) return;

        const taskId = menu.dataset.taskId;
        const taskItem = document.querySelector(`[data-task-id="${taskId}"]`);
        
        if (!taskItem) return;

        switch (action) {
            case 'edit':
                this.handleTaskEdit(taskItem);
                break;
            case 'complete':
                this.handleTaskToggle(taskItem.querySelector('.task-checkbox'));
                break;
            case 'delete':
                this.handleTaskDelete(taskItem);
                break;
        }

        this.taskRenderer.hideTaskMenu();
    }

    /**
     * Handle form submission
     */
    handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.modalManager.validateForm()) {
            return;
        }

        const formData = this.modalManager.getFormData();
        const context = this.modalManager.getCurrentContext();
        
        if (context?.mode === 'edit') {
            // Update existing task
            const success = TaskManager.updateTask(context.task.id, formData);
            if (success) {
                this.refreshUI();
                this.modalManager.close();
            } else {
                alert('Failed to update task. Please try again.');
            }
        } else {
            // Create new task
            const task = TaskManager.addTask(formData);
            if (task) {
                this.refreshUI();
                this.modalManager.close();
                
                // Show success feedback
                this.showNotification(`Task "${task.name}" created successfully!`);
            } else {
                alert('Failed to create task. Please try again.');
            }
        }
    }

    // Navigation methods

    /**
     * Navigate between categories
     */
    navigateCategories(direction) {
        const currentIndex = this.categories.indexOf(this.currentCategory);
        const newIndex = (currentIndex + direction + this.categories.length) % this.categories.length;
        const newCategory = this.categories[newIndex];
        
        this.showCategory(newCategory);
    }

    /**
     * Show a specific category
     */
    showCategory(category) {
        if (!this.categories.includes(category)) return;

        this.currentCategory = category;

        // Update category display
        const categories = document.querySelectorAll('.task-category');
        categories.forEach(cat => cat.classList.remove('active'));
        
        const targetCategory = document.getElementById(`${category}-section`);
        targetCategory?.classList.add('active');

        // Update navigation indicators
        this.updateCategoryIndicators();
        
        // Update header text or other UI elements
        this.updateCategoryHeader(category);
    }

    /**
     * Update category indicator dots
     */
    updateCategoryIndicators() {
        const indicators = document.querySelectorAll('.category-dot');
        indicators.forEach((dot, index) => {
            const isActive = this.categories[index] === this.currentCategory;
            dot.classList.toggle('active', isActive);
        });
    }

    /**
     * Update category header
     */
    updateCategoryHeader(category) {
        const headerTitle = document.querySelector('.header-title');
        if (headerTitle) {
            const titles = {
                today: 'Today',
                tomorrow: 'Tomorrow', 
                future: 'Future'
            };
            headerTitle.textContent = titles[category] || category;
        }
    }

    // Calendar methods

    /**
     * Render the current calendar view
     */
    renderCurrentCalendarView() {
        if (this.currentCategory !== 'future') return;

        const view = this.calendarManager.getCurrentView();
        const tasks = TaskManager.getTasksForCategory('future');
        
        if (view === 'week') {
            const weekStart = this.calendarManager.getCurrentWeekStart();
            this.taskRenderer.renderWeekView(weekStart, tasks);
        } else {
            const { month, year } = this.calendarManager.getCurrentMonth();
            this.taskRenderer.renderMonthView(year, month, tasks);
        }
    }

    /**
     * Update view toggle buttons
     */
    updateViewButtons() {
        const view = this.calendarManager.getCurrentView();
        const weekBtn = document.getElementById('week-view-btn');
        const monthBtn = document.getElementById('month-view-btn');

        weekBtn?.classList.toggle('active', view === 'week');
        monthBtn?.classList.toggle('active', view === 'month');
    }

    // Utility methods

    /**
     * Refresh all UI components
     */
    refreshUI() {
        UIRenderer.renderTaskLists();
        this.renderCurrentCalendarView();
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Add to DOM
        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Get current category
     */
    getCurrentCategory() {
        return this.currentCategory;
    }
}

export default EventHandler;
