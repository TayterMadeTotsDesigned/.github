// EventHandler.js - Centralized event handling with delegation
import TaskManager from '../taskManager.js';
import { UIRenderer } from '../UI_Renderer.js';
import { generateId } from '../utils.js';

class EventHandler {
    constructor(modalManager, calendarManager, taskRenderer) {
        this.modalManager = modalManager;
        this.calendarManager = calendarManager;
        this.taskRenderer = taskRenderer;
        this.currentCategory = 'today';
        this.categories = ['today', 'tomorrow', 'future', 'pomodoro'];
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
        
        // Make showSection globally available for backwards compatibility
        window.showSection = (sectionId) => this.showSection(sectionId);
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
        
        try {
            if (context?.mode === 'edit') {
                this.updateExistingTask(formData, context.task);
            } else {
                this.createNewTask(formData);
            }
            
            this.modalManager.close();
            this.refreshUI();
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showNotification('Failed to save task. Please try again.', 'error');
        }
    }

    /**
     * Create a new task from form data
     */
    createNewTask(formData) {
        const task = {
            id: this.generateTaskId(),
            name: formData.name.trim(),
            description: formData.description?.trim() || '',
            completed: false,
            createdAt: new Date().toISOString(),
            recurrence: formData.recurrence
        };

        // Set due date based on category
        if (formData.category === 'today') {
            task.dueDate = new Date().toISOString();
        } else if (formData.category === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            task.dueDate = tomorrow.toISOString();
        } else if (formData.category === 'future' && formData.date) {
            task.dueDate = new Date(formData.date).toISOString();
        }

        TaskManager.addTask(task);
        this.showNotification(`Task "${task.name}" created successfully!`);
    }

    /**
     * Update an existing task
     */
    updateExistingTask(formData, originalTask) {
        const updatedTask = {
            ...originalTask,
            name: formData.name.trim(),
            description: formData.description?.trim() || '',
            recurrence: formData.recurrence,
            updatedAt: new Date().toISOString()
        };

        // Update due date based on category
        if (formData.category === 'today') {
            updatedTask.dueDate = new Date().toISOString();
        } else if (formData.category === 'tomorrow') {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            updatedTask.dueDate = tomorrow.toISOString();
        } else if (formData.category === 'future' && formData.date) {
            updatedTask.dueDate = new Date(formData.date).toISOString();
        }

        TaskManager.updateTask(updatedTask);
        this.showNotification(`Task "${updatedTask.name}" updated successfully!`);
    }

    /**
     * Generate a unique task ID
     */
    generateTaskId() {
        return generateId();
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

        // Get main layout elements
        const taskCategories = document.querySelectorAll('.task-categories-container .task-category');
        const sections = document.querySelectorAll('.section-page');
        const taskContainer = document.querySelector('.task-categories-container');
        const dualPanel = document.querySelector('.dual-panel-layout');
        const sectionsContainer = document.querySelector('.sections-container');
        
        // Hide all regular task categories
        taskCategories.forEach(cat => cat.classList.remove('active'));
        
        // Hide all section pages
        sections.forEach(section => section.style.display = 'none');
        
        // Always keep dual panel visible, just hide task-categories-container when not needed
        if (dualPanel) dualPanel.style.display = 'grid';
        
        if (category === 'today') {
            // When today is selected, hide other categories and show dual panel
            if (taskContainer) taskContainer.style.display = 'none';
            if (sectionsContainer) sectionsContainer.style.display = 'none';
        } else if (category === 'pomodoro') {
            // For pomodoro, just show the dual panel (it's already visible)
            if (taskContainer) taskContainer.style.display = 'none';
            if (sectionsContainer) sectionsContainer.style.display = 'none';
        } else {
            // For tomorrow and future, show task-categories-container
            if (taskContainer) taskContainer.style.display = 'block';
            if (sectionsContainer) sectionsContainer.style.display = 'none';
            
            // Activate the correct category
            const targetCategory = document.getElementById(`${category}-section`);
            if (targetCategory) targetCategory.classList.add('active');
        }

        // Update navigation indicators
        this.updateCategoryIndicators();
        
        // Update header text or other UI elements
        this.updateCategoryHeader(category);
    }

    /**
     * Show a specific section (including non-task sections)
     */
    showSection(sectionId) {
        // Map task-list to today for compatibility
        if (sectionId === 'task-list') {
            sectionId = 'today';
        }
        
        // If it's a task category
        if (this.categories.includes(sectionId)) {
            this.showCategory(sectionId);
        } else {
            // It's a regular section
            // Hide all task categories and other sections
            const taskCategories = document.querySelectorAll('.task-category');
            const sections = document.querySelectorAll('.section-page');
            const taskContainer = document.querySelector('.task-categories-container');
            const dualPanel = document.querySelector('.dual-panel-layout');
            const sectionsContainer = document.querySelector('.sections-container');
            
            taskCategories.forEach(cat => cat.classList.remove('active'));
            sections.forEach(section => section.style.display = 'none');
            
            // Hide dual panel layout and task categories
            if (dualPanel) dualPanel.style.display = 'none';
            if (taskContainer) taskContainer.style.display = 'none';
            
            // Show sections container
            if (sectionsContainer) sectionsContainer.style.display = 'block';
            
            // Show the specific section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
            
            // Update category indicators if needed
            const indicators = document.querySelectorAll('.category-dot');
            indicators.forEach(dot => dot.classList.remove('active'));
            
            // Update header
            this.updateCategoryHeader(sectionId);
        }
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
        // Update hero category title
        const heroCategory = document.getElementById('hero-category');
        const headerTitle = document.querySelector('.header-title');
        
        const titles = {
            today: 'Today',
            tomorrow: 'Tomorrow', 
            future: 'Future',
            pomodoro: 'Pomodoro Timer',
            settings: 'Settings',
            help: 'Help & Tutorial',
            about: 'About Dooing.Task',
            contact: 'Contact Us',
            inspo: 'Get Inspired'
        };
        
        const title = titles[category] || category;
        
        if (heroCategory) {
            heroCategory.textContent = title;
        }
        if (headerTitle) {
            headerTitle.textContent = title;
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

    /**
     * Render initial UI state
     */
    renderInitialUI() {
        // Ensure containers are in the correct initial state
        const taskContainer = document.querySelector('.task-categories-container');
        const sectionsContainer = document.querySelector('.sections-container');
        const dualPanel = document.querySelector('.dual-panel-layout');
        
        if (taskContainer) taskContainer.style.display = 'none';
        if (sectionsContainer) sectionsContainer.style.display = 'none';
        if (dualPanel) dualPanel.style.display = 'grid';
        
        // Show default category
        this.showCategory('today');
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
