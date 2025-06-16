// ModalManager.js - Handles all modal interactions and form management
import { pubSub } from '../../events/PubSub.js';
import { appState } from '../../core/AppState.js';
import { taskManager } from '../../core/TaskManager.js';
import { generateId } from '../../utils/helpers.js';

class ModalManager {
    constructor() {
        this.modal = null;
        this.currentContext = null;
        this.isInitialized = false;
        this.subscribers = [];
    }

    /**
     * Initialize the modal manager
     */
    init() {
        if (this.isInitialized) return;
        
        this.modal = document.getElementById('task-modal');
        if (!this.modal) {
            console.warn('Task modal not found');
            return;
        }

        this.setupEventListeners();
        this.subscribeToEvents();
        this.isInitialized = true;
        
        pubSub.publish('modal:initialized', { manager: this });
    }

    /**
     * Subscribe to relevant events
     */
    subscribeToEvents() {
        // Listen for modal open requests
        this.subscribers.push(
            pubSub.subscribe('modal:open', (data) => this.open(data))
        );
        
        // Listen for modal close requests
        this.subscribers.push(
            pubSub.subscribe('modal:close', () => this.close())
        );
        
        // Listen for task edit requests
        this.subscribers.push(
            pubSub.subscribe('task:edit', (data) => this.open({ mode: 'edit', task: data.task }))
        );
        
        // Listen for quick add requests
        this.subscribers.push(
            pubSub.subscribe('task:quickAdd', (data) => this.open({ 
                category: data.category,
                date: data.date 
            }))
        );
    }

    /**
     * Set up all modal-related event listeners
     */
    setupEventListeners() {
        // Close modal events
        const closeBtn = document.getElementById('close-modal');
        
        closeBtn?.addEventListener('click', () => this.close());
        
        // Close on backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) this.close();
        });

        // Setup form submission
        const form = document.getElementById('task-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Setup form-related listeners
        this.setupRecurringTaskToggles();
        this.setupCategoryToggles();
        this.setupDateValidation();
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();
        
        try {
            if (this.currentContext?.mode === 'edit') {
                // Update existing task
                const updatedTask = await taskManager.updateTask(
                    this.currentContext.task.id, 
                    formData
                );
                pubSub.publish('task:updated', { task: updatedTask });
            } else {
                // Create new task
                const newTask = await taskManager.addTask(formData);
                pubSub.publish('task:added', { task: newTask });
            }
            
            this.close();
        } catch (error) {
            console.error('Error submitting task:', error);
            pubSub.publish('notification:show', {
                type: 'error',
                message: 'Failed to save task. Please try again.'
            });
        }
    }

    /**
     * Setup recurring task form interactions
     */
    setupRecurringTaskToggles() {
        const recurringCheckbox = document.getElementById('recurring-task');
        const recurrenceOptions = document.getElementById('recurrence-options');
        const recurrenceTypes = document.getElementsByName('recurrence-type');
        const daySelection = document.getElementById('day-selection');

        recurringCheckbox?.addEventListener('change', (e) => {
            const isVisible = e.target.checked;
            recurrenceOptions.style.display = isVisible ? 'block' : 'none';
            if (!isVisible) {
                this.resetRecurrenceOptions();
            }
            
            pubSub.publish('modal:recurrenceToggled', { enabled: isVisible });
        });

        recurrenceTypes.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const showDays = e.target.value === 'weekly';
                daySelection.style.display = showDays ? 'block' : 'none';
                
                pubSub.publish('modal:recurrenceTypeChanged', { 
                    type: e.target.value,
                    showDays 
                });
            });
        });
    }

    /**
     * Setup category selection interactions
     */
    setupCategoryToggles() {
        const categoryRadios = document.querySelectorAll('input[name="category"]');
        const futureDateGroup = document.getElementById('future-date-group');

        categoryRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const showDate = e.target.value === 'future';
                futureDateGroup.style.display = showDate ? 'block' : 'none';
                
                pubSub.publish('modal:categoryChanged', { 
                    category: e.target.value,
                    showDate 
                });
            });
        });
    }

    /**
     * Setup date input validation
     */
    setupDateValidation() {
        const dateInput = document.getElementById('task-date');
        if (dateInput) {
            // Set minimum date to today
            const today = new Date();
            dateInput.min = today.toISOString().split('T')[0];
            
            dateInput.addEventListener('change', (e) => {
                pubSub.publish('modal:dateChanged', { date: e.target.value });
            });
        }
    }

    /**
     * Open the modal with optional context
     */
    open(context = {}) {
        if (!this.isInitialized) {
            console.warn('ModalManager not initialized');
            return;
        }

        this.currentContext = context;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (context.mode === 'edit') {
            this.populateEditForm(context.task);
        } else {
            this.resetForm();
            if (context.category) {
                this.preselectCategory(context.category);
            }
            if (context.date) {
                this.preselectDate(context.date);
            }
        }

        // Focus on first input
        const firstInput = this.modal.querySelector('input, textarea');
        firstInput?.focus();
        
        pubSub.publish('modal:opened', { context });
    }

    /**
     * Close the modal
     */
    close() {
        if (!this.modal) return;
        
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentContext = null;
        this.resetForm();
        
        pubSub.publish('modal:closed');
    }

    /**
     * Check if modal is currently open
     */
    isOpen() {
        return this.modal?.classList.contains('active') || false;
    }

    /**
     * Reset the form to default state
     */
    resetForm() {
        const form = document.getElementById('task-form');
        if (!form) return;

        form.reset();
        
        // Reset visibility states
        document.getElementById('future-date-group').style.display = 'none';
        document.getElementById('recurrence-options').style.display = 'none';
        document.getElementById('day-selection').style.display = 'none';
        
        // Update UI text
        document.getElementById('submit-text').textContent = 'Add Task';
        document.getElementById('modal-title').textContent = 'Add New Task';

        // Clear validation states
        this.clearValidationErrors();
    }

    /**
     * Populate form with task data for editing
     */
    populateEditForm(task) {
        if (!task) return;

        document.getElementById('task-name').value = task.name || '';
        document.getElementById('task-desc').value = task.description || '';
        
        // Set category
        const categoryRadio = document.querySelector(`input[name="category"][value="${task.category}"]`);
        if (categoryRadio) {
            categoryRadio.checked = true;
            if (task.category === 'future' && task.date) {
                document.getElementById('future-date-group').style.display = 'block';
                document.getElementById('task-date').value = task.date;
            }
        }

        // Set recurring options
        if (task.recurrence && task.recurrence.enabled) {
            document.getElementById('recurring-task').checked = true;
            document.getElementById('recurrence-options').style.display = 'block';
            
            const recurrenceRadio = document.querySelector(`input[name="recurrence-type"][value="${task.recurrence.type}"]`);
            if (recurrenceRadio) {
                recurrenceRadio.checked = true;
                
                if (task.recurrence.type === 'weekly' && task.recurrence.days) {
                    document.getElementById('day-selection').style.display = 'block';
                    task.recurrence.days.forEach(day => {
                        const dayCheckbox = document.querySelector(`input[name="days"][value="${day}"]`);
                        if (dayCheckbox) dayCheckbox.checked = true;
                    });
                }
            }
        }

        // Update UI text
        document.getElementById('submit-text').textContent = 'Update Task';
        document.getElementById('modal-title').textContent = 'Edit Task';
    }

    /**
     * Pre-select a category
     */
    preselectCategory(category) {
        const categoryRadio = document.querySelector(`input[name="category"][value="${category}"]`);
        if (categoryRadio) {
            categoryRadio.checked = true;
            if (category === 'future') {
                document.getElementById('future-date-group').style.display = 'block';
            }
        }
    }

    /**
     * Pre-select a date
     */
    preselectDate(date) {
        const dateInput = document.getElementById('task-date');
        if (dateInput) {
            dateInput.value = date;
            document.getElementById('future-date-group').style.display = 'block';
            const futureRadio = document.querySelector('input[name="category"][value="future"]');
            if (futureRadio) futureRadio.checked = true;
        }
    }

    /**
     * Get form data as an object
     */
    getFormData() {
        const form = document.getElementById('task-form');
        if (!form) return null;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Handle recurring task data
        if (data.recurring === 'on') {
            data.recurrence = {
                enabled: true,
                type: data['recurrence-type'] || 'daily',
                days: data['recurrence-type'] === 'weekly' ? 
                    formData.getAll('days') : null
            };
        } else {
            data.recurrence = { enabled: false };
        }
        
        // Clean up form-specific fields
        delete data.recurring;
        delete data['recurrence-type'];
        delete data.days;
        
        return data;
    }

    /**
     * Get current modal context
     */
    getCurrentContext() {
        return this.currentContext;
    }

    /**
     * Validate form data
     */
    validateForm() {
        const data = this.getFormData();
        const errors = [];

        // Validate task name
        if (!data.name || data.name.trim().length === 0) {
            errors.push({ field: 'task-name', message: 'Task name is required' });
        }

        // Validate future date
        if (data.category === 'future') {
            if (!data.date) {
                errors.push({ field: 'task-date', message: 'Date is required for future tasks' });
            } else {
                const selectedDate = new Date(data.date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    errors.push({ field: 'task-date', message: 'Date cannot be in the past' });
                }
            }
        }

        // Validate weekly recurrence
        if (data.recurrence.enabled && data.recurrence.type === 'weekly') {
            if (!data.recurrence.days || data.recurrence.days.length === 0) {
                errors.push({ field: 'day-selection', message: 'Please select at least one day for weekly recurrence' });
            }
        }

        this.displayValidationErrors(errors);
        
        // Publish validation result
        pubSub.publish('modal:validated', { 
            isValid: errors.length === 0, 
            errors 
        });
        
        return errors.length === 0;
    }

    /**
     * Display validation errors
     */
    displayValidationErrors(errors) {
        this.clearValidationErrors();

        errors.forEach(error => {
            const field = document.getElementById(error.field);
            if (field) {
                field.classList.add('error');
                
                // Add error message
                const errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.textContent = error.message;
                field.parentNode.appendChild(errorElement);
            }
        });
    }

    /**
     * Clear all validation errors
     */
    clearValidationErrors() {
        const errorFields = this.modal.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));

        const errorMessages = this.modal.querySelectorAll('.error-message');
        errorMessages.forEach(message => message.remove());
    }

    /**
     * Reset recurrence options
     */
    resetRecurrenceOptions() {
        const recurrenceTypes = document.getElementsByName('recurrence-type');
        recurrenceTypes.forEach(radio => radio.checked = false);
        
        const dayCheckboxes = document.querySelectorAll('input[name="days"]');
        dayCheckboxes.forEach(checkbox => checkbox.checked = false);
        
        document.getElementById('day-selection').style.display = 'none';
    }

    /**
     * Destroy the modal manager and clean up subscriptions
     */
    destroy() {
        this.subscribers.forEach(unsubscribe => unsubscribe());
        this.subscribers = [];
        this.isInitialized = false;
        
        pubSub.publish('modal:destroyed');
    }
}

// Create and export singleton instance
export const modalManager = new ModalManager();
export default modalManager;
