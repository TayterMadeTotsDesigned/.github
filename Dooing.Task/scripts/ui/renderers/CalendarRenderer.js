import { pubSub } from '../../events/PubSub.js';
import { appState } from '../../core/AppState.js';
import { taskManager } from '../../core/TaskManager.js';
import { dateService } from '../../core/DateService.js';
import { debounce } from '../../utils/helpers.js';

/**
 * CalendarRenderer
 * Handles all calendar rendering and date navigation using the new architecture
 */
class CalendarRenderer {
    constructor() {
        this.initialized = false;
        this.currentDate = new Date();
        this.currentView = 'month'; // month, week
        this.debouncedRender = debounce(() => this.render(), 100);
        
        this.setupEventListeners();
    }

    /**
     * Initialize the renderer
     */
    init() {
        if (this.initialized) return;

        // Initialize current date from app state
        const selectedDate = appState.get('selectedDate');
        if (selectedDate) {
            this.currentDate = new Date(selectedDate);
        }

        this.initialized = true;
        this.render();
        pubSub.publish('calendarRenderer:initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for calendar navigation events
        pubSub.subscribe('calendar:month:prev', () => {
            this.navigateToPreviousMonth();
        });

        pubSub.subscribe('calendar:month:next', () => {
            this.navigateToNextMonth();
        });

        pubSub.subscribe('calendar:today', () => {
            this.navigateToToday();
        });

        pubSub.subscribe('calendar:date:select', ({ date }) => {
            this.selectDate(date);
        });

        // Listen for task changes that affect calendar
        pubSub.subscribe('tasks:changed', () => {
            this.debouncedRender();
        });

        pubSub.subscribe('task:created', ({ task }) => {
            if (task.dueDate) {
                this.updateDateWithTasks(task.dueDate);
            }
        });

        pubSub.subscribe('task:updated', ({ task }) => {
            if (task.dueDate) {
                this.updateDateWithTasks(task.dueDate);
            }
        });

        pubSub.subscribe('task:deleted', () => {
            this.debouncedRender();
        });

        // Listen for view changes
        pubSub.subscribe('view:switch', ({ view }) => {
            if (view === 'future') {
                this.render();
            }
        });

        // Listen for selected date changes
        appState.observe('selectedDate', (newDate) => {
            if (newDate) {
                this.currentDate = new Date(newDate);
                this.render();
            }
        });
    }

    /**
     * Render the calendar
     */
    render() {
        if (!this.initialized) return;

        try {
            const container = this.getCalendarContainer();
            if (!container) {
                console.warn('Calendar container not found');
                return;
            }

            if (this.currentView === 'month') {
                this.renderMonthView(container);
            } else {
                this.renderWeekView(container);
            }

            this.updateNavigationInfo();
            pubSub.publish('calendarRenderer:rendered', { 
                date: this.currentDate, 
                view: this.currentView 
            });

        } catch (error) {
            console.error('Failed to render calendar:', error);
            pubSub.publish('calendarRenderer:error', { error });
        }
    }

    /**
     * Get calendar container element
     * @returns {HTMLElement|null} Calendar container
     */
    getCalendarContainer() {
        return document.getElementById('calendar-grid') || 
               document.querySelector('.calendar-container .calendar-grid') ||
               document.querySelector('.calendar-grid');
    }

    /**
     * Render month view
     * @param {HTMLElement} container - Calendar container
     */
    renderMonthView(container) {
        const monthData = dateService.getMonthData(this.currentDate);
        
        // Clear existing content
        container.innerHTML = '';
        container.className = 'calendar-grid month-view';

        // Create calendar grid
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-month-grid';

        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-day-header';
            header.textContent = day;
            calendarGrid.appendChild(header);
        });

        // Add calendar days
        monthData.weeks.forEach(week => {
            week.forEach(day => {
                const dayElement = this.createDayElement(day, monthData.month);
                calendarGrid.appendChild(dayElement);
            });
        });

        container.appendChild(calendarGrid);
    }

    /**
     * Render week view
     * @param {HTMLElement} container - Calendar container
     */
    renderWeekView(container) {
        const weekStart = this.getWeekStart(this.currentDate);
        const weekDays = this.generateWeekDays(weekStart);

        // Clear existing content
        container.innerHTML = '';
        container.className = 'calendar-grid week-view';

        // Create week grid
        const weekGrid = document.createElement('div');
        weekGrid.className = 'calendar-week-grid';

        weekDays.forEach(day => {
            const dayElement = this.createDayElement(day, day.getMonth(), true);
            weekGrid.appendChild(dayElement);
        });

        container.appendChild(weekGrid);
    }

    /**
     * Create a day element
     * @param {Date|null} date - Date for the day (null for empty cells)
     * @param {number} currentMonth - Current month being displayed
     * @param {boolean} isWeekView - Whether this is for week view
     * @returns {HTMLElement} Day element
     */
    createDayElement(date, currentMonth, isWeekView = false) {
        const dayElement = document.createElement('div');
        
        if (!date) {
            // Empty cell for month view padding
            dayElement.className = 'calendar-day empty';
            return dayElement;
        }

        const isToday = dateService.isToday(date);
        const isCurrentMonth = date.getMonth() === currentMonth;
        const isSelected = this.isDateSelected(date);
        const dateString = dateService.formatDate(date, 'iso');

        // Set up classes
        const classes = ['calendar-day'];
        if (isToday) classes.push('today');
        if (!isCurrentMonth && !isWeekView) classes.push('other-month');
        if (isSelected) classes.push('selected');

        dayElement.className = classes.join(' ');
        dayElement.dataset.calendarDate = dateString;

        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);

        // Add tasks for this day
        this.addTasksToDay(dayElement, date);

        // Add click handler
        dayElement.addEventListener('click', () => {
            this.selectDate(dateString);
        });

        return dayElement;
    }

    /**
     * Add tasks to a day element
     * @param {HTMLElement} dayElement - Day element
     * @param {Date} date - Date for the day
     */
    addTasksToDay(dayElement, date) {
        try {
            const tasks = taskManager.getTasksForDate(date);
            
            // Remove existing task indicators
            dayElement.querySelectorAll('.task-indicator, .task-dot').forEach(el => el.remove());

            if (tasks.length === 0) return;

            // Add task indicators
            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'day-tasks';

            // Show up to 3 task dots, then a count
            const maxDots = 3;
            const pendingTasks = tasks.filter(t => !t.completed);
            const completedTasks = tasks.filter(t => t.completed);

            // Add pending task dots
            for (let i = 0; i < Math.min(pendingTasks.length, maxDots); i++) {
                const dot = document.createElement('div');
                dot.className = 'task-dot pending';
                dot.title = pendingTasks[i].title || pendingTasks[i].name;
                tasksContainer.appendChild(dot);
            }

            // Add completed task dots
            for (let i = 0; i < Math.min(completedTasks.length, maxDots - pendingTasks.length); i++) {
                const dot = document.createElement('div');
                dot.className = 'task-dot completed';
                dot.title = `${completedTasks[i].title || completedTasks[i].name} (completed)`;
                tasksContainer.appendChild(dot);
            }

            // Add count if more tasks exist
            const totalShown = Math.min(tasks.length, maxDots);
            if (tasks.length > maxDots) {
                const countIndicator = document.createElement('div');
                countIndicator.className = 'task-count';
                countIndicator.textContent = `+${tasks.length - totalShown}`;
                countIndicator.title = `${tasks.length} total tasks`;
                tasksContainer.appendChild(countIndicator);
            }

            dayElement.appendChild(tasksContainer);

            // Add completion status
            if (tasks.length > 0 && completedTasks.length === tasks.length) {
                dayElement.classList.add('all-completed');
            } else {
                dayElement.classList.remove('all-completed');
            }

        } catch (error) {
            console.error('Failed to add tasks to day:', error);
        }
    }

    /**
     * Update a specific date with tasks
     * @param {string|Date} date - Date to update
     */
    updateDateWithTasks(date) {
        const dateString = dateService.formatDate(date, 'iso');
        const dayElement = document.querySelector(`[data-calendar-date="${dateString}"]`);
        
        if (dayElement) {
            this.addTasksToDay(dayElement, new Date(date));
        }
    }

    /**
     * Check if a date is currently selected
     * @param {Date} date - Date to check
     * @returns {boolean} Is selected
     */
    isDateSelected(date) {
        const selectedDate = appState.get('selectedDate');
        if (!selectedDate) return false;
        
        return dateService.formatDate(date, 'iso') === selectedDate;
    }

    /**
     * Select a date
     * @param {string|Date} date - Date to select
     */
    selectDate(date) {
        const dateString = typeof date === 'string' ? date : dateService.formatDate(date, 'iso');
        
        // Update selected date in state
        appState.set('selectedDate', dateString);
        
        // Update visual selection
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        const dayElement = document.querySelector(`[data-calendar-date="${dateString}"]`);
        if (dayElement) {
            dayElement.classList.add('selected');
        }

        // Publish selection event
        pubSub.publish('calendar:date:selected', { 
            date: dateString,
            tasks: taskManager.getTasksForDate(dateString)
        });
    }

    /**
     * Navigate to previous month
     */
    navigateToPreviousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.render();
        pubSub.publish('calendar:navigation', { 
            direction: 'prev', 
            date: this.currentDate 
        });
    }

    /**
     * Navigate to next month
     */
    navigateToNextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.render();
        pubSub.publish('calendar:navigation', { 
            direction: 'next', 
            date: this.currentDate 
        });
    }

    /**
     * Navigate to today
     */
    navigateToToday() {
        this.currentDate = new Date();
        this.selectDate(this.currentDate);
        this.render();
        pubSub.publish('calendar:navigation', { 
            direction: 'today', 
            date: this.currentDate 
        });
    }

    /**
     * Update navigation info display
     */
    updateNavigationInfo() {
        // Update month/year display
        const monthYearElement = document.querySelector('.calendar-month-year');
        if (monthYearElement) {
            const monthName = this.currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
            });
            monthYearElement.textContent = monthName;
        }

        // Update today button state
        const todayButton = document.querySelector('[data-action="calendar-today"]');
        if (todayButton) {
            const isCurrentMonth = this.currentDate.getMonth() === new Date().getMonth() &&
                                  this.currentDate.getFullYear() === new Date().getFullYear();
            todayButton.disabled = isCurrentMonth;
        }
    }

    /**
     * Get week start date (Sunday)
     * @param {Date} date - Reference date
     * @returns {Date} Week start date
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    /**
     * Generate array of 7 days starting from given date
     * @param {Date} startDate - Week start date
     * @returns {Array<Date>} Array of 7 dates
     */
    generateWeekDays(startDate) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            days.push(day);
        }
        return days;
    }

    /**
     * Switch calendar view
     * @param {string} view - View type (month, week)
     */
    switchView(view) {
        if (this.currentView === view) return;
        
        this.currentView = view;
        this.render();
        
        pubSub.publish('calendar:view:changed', { view });
    }

    /**
     * Get current date
     * @returns {Date} Current date
     */
    getCurrentDate() {
        return new Date(this.currentDate);
    }

    /**
     * Set current date
     * @param {Date|string} date - New date
     */
    setCurrentDate(date) {
        this.currentDate = new Date(date);
        this.render();
    }

    /**
     * Get renderer statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        return {
            initialized: this.initialized,
            currentDate: this.currentDate.toISOString(),
            currentView: this.currentView,
            renderedDays: document.querySelectorAll('.calendar-day').length
        };
    }

    /**
     * Cleanup renderer
     */
    cleanup() {
        this.initialized = false;
        pubSub.publish('calendarRenderer:cleanup');
    }
}

// Create and export singleton instance
export const calendarRenderer = new CalendarRenderer();
export default calendarRenderer;
