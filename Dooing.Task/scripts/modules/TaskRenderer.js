// TaskRenderer.js - Handles all task rendering and UI display logic
import TaskManager from '../taskManager.js';
import { formatDate } from '../utils.js';

class TaskRenderer {
    constructor() {
        this.taskMenuTimeout = null;
    }

    /**
     * Create a task element from task data
     */
    createTaskElement(task) {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.taskId = task.id;

        const isVirtualRecurring = task.isVirtualRecurring;
        const displayClass = isVirtualRecurring ? 'recurring-task' : '';

        taskItem.innerHTML = `
            <div class="task-content">
                <button class="task-checkbox ${task.completed ? 'checked' : ''}" aria-label="Mark as complete">
                    <span class="checkbox-icon"></span>
                </button>
                <div class="task-details">
                    <h4 class="task-title ${displayClass}">
                        ${isVirtualRecurring ? '↻ ' : ''}${this.escapeHtml(task.name)}
                    </h4>
                    <p class="task-description" style="font-style: ${task.description ? 'normal' : 'italic'}; opacity: ${task.description ? '1' : '0.6'};">
                        ${this.escapeHtml(task.description) || 'No description provided'}
                    </p>
                    <div class="task-meta">
                        <span class="task-time">${this.formatTaskTime(task)}</span>
                        ${this.renderTaskBadges(task)}
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-edit-btn" aria-label="Edit task">✏️</button>
                <button class="task-delete-btn" aria-label="Delete task">🗑️</button>
            </div>
        `;

        return taskItem;
    }

    /**
     * Format task time display
     */
    formatTaskTime(task) {
        if (task.date) {
            const date = new Date(task.date);
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
            });
        }
        return '';
    }

    /**
     * Render task badges (recurring, priority, etc.)
     */
    renderTaskBadges(task) {
        const badges = [];
        
        if (task.recurrence && task.recurrence.enabled) {
            badges.push(`<span class="task-badge recurring">Repeats ${task.recurrence.type}</span>`);
        }
        
        if (task.priority) {
            badges.push(`<span class="task-badge priority-${task.priority}">${task.priority.toUpperCase()}</span>`);
        }
        
        return badges.length > 0 ? `<div class="task-badges">${badges.join('')}</div>` : '';
    }

    /**
     * Render a list of tasks in a container
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

        this.hideEmptyState(container);
        
        // Render each task
        tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            tasksList.appendChild(taskElement);
        });

        this.updateTaskCount(container, tasks.length);
    }

    /**
     * Render tasks in calendar view
     */
    renderCalendarTasks(date, tasks) {
        const dateStr = this.formatDateForCalendar(date);
        const dayElement = document.querySelector(`[data-date="${dateStr}"]`);
        
        if (!dayElement) return;

        const tasksContainer = dayElement.querySelector('.day-tasks');
        if (!tasksContainer) return;

        tasksContainer.innerHTML = '';

        tasks.forEach(task => {
            const taskElement = this.createCalendarTaskElement(task);
            tasksContainer.appendChild(taskElement);
        });

        // Add task count indicator
        if (tasks.length > 0) {
            dayElement.classList.add('has-tasks');
            const countElement = dayElement.querySelector('.task-count') || this.createTaskCountElement();
            countElement.textContent = tasks.length > 9 ? '9+' : tasks.length.toString();
            if (!dayElement.querySelector('.task-count')) {
                dayElement.appendChild(countElement);
            }
        } else {
            dayElement.classList.remove('has-tasks');
            const countElement = dayElement.querySelector('.task-count');
            if (countElement) countElement.remove();
        }
    }

    /**
     * Create a calendar task element
     */
    createCalendarTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `calendar-task ${task.isVirtualRecurring ? 'recurring-task' : ''} ${task.completed ? 'completed' : ''}`;
        taskElement.dataset.taskId = task.id;
        taskElement.innerHTML = `
            <span class="task-indicator ${task.priority ? `priority-${task.priority}` : ''}"></span>
            <span class="task-name">${this.escapeHtml(task.name)}</span>
        `;
        
        if (task.isVirtualRecurring) {
            taskElement.title = `Recurring: ${task.name}`;
        }

        return taskElement;
    }

    /**
     * Create task count element for calendar
     */
    createTaskCountElement() {
        const countElement = document.createElement('div');
        countElement.className = 'task-count';
        return countElement;
    }

    /**
     * Show empty state for a container
     */
    showEmptyState(container) {
        const emptyState = container.querySelector('.empty-state');
        const tasksContainer = container.querySelector('.tasks-container');
        
        if (emptyState) emptyState.style.display = 'block';
        if (tasksContainer) tasksContainer.style.display = 'none';
    }

    /**
     * Hide empty state for a container
     */
    hideEmptyState(container) {
        const emptyState = container.querySelector('.empty-state');
        const tasksContainer = container.querySelector('.tasks-container');
        
        if (emptyState) emptyState.style.display = 'none';
        if (tasksContainer) tasksContainer.style.display = 'block';
    }

    /**
     * Update task count display
     */
    updateTaskCount(container, count) {
        const countElement = container.querySelector('.task-count');
        if (countElement) {
            countElement.textContent = `${count} task${count !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Show context menu for task
     */
    showTaskMenu(taskElement, event) {
        event.preventDefault();
        
        // Clear any existing menu
        this.hideTaskMenu();
        
        const taskId = taskElement.dataset.taskId;
        const task = TaskManager.getTaskById(taskId);
        
        if (!task) return;

        const menu = document.createElement('div');
        menu.className = 'task-context-menu';
        menu.innerHTML = `
            <button class="context-menu-item" data-action="edit">
                <span class="menu-icon">✏️</span>
                Edit Task
            </button>
            <button class="context-menu-item" data-action="complete">
                <span class="menu-icon">${task.completed ? '↶' : '✓'}</span>
                ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            <button class="context-menu-item delete-action" data-action="delete">
                <span class="menu-icon">🗑️</span>
                Delete Task
            </button>
        `;

        // Position menu relative to click
        menu.style.position = 'fixed';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        menu.style.zIndex = '10000';

        // Adjust position if menu would go off-screen
        document.body.appendChild(menu);
        this.adjustMenuPosition(menu, event.clientX, event.clientY);

        // Store reference to the task element
        menu.dataset.taskId = taskId;

        // Auto-hide menu after 5 seconds
        this.taskMenuTimeout = setTimeout(() => {
            this.hideTaskMenu();
        }, 5000);

        return menu;
    }

    /**
     * Adjust menu position to stay on screen
     */
    adjustMenuPosition(menu, x, y) {
        const rect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Adjust horizontal position
        if (x + rect.width > windowWidth) {
            menu.style.left = `${x - rect.width}px`;
        }

        // Adjust vertical position
        if (y + rect.height > windowHeight) {
            menu.style.top = `${y - rect.height}px`;
        }
    }

    /**
     * Hide task context menu
     */
    hideTaskMenu() {
        const existingMenu = document.querySelector('.task-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        if (this.taskMenuTimeout) {
            clearTimeout(this.taskMenuTimeout);
            this.taskMenuTimeout = null;
        }
    }

    /**
     * Render week calendar view
     */
    renderWeekView(weekStart, tasks) {
        const weekContainer = document.getElementById('week-calendar');
        if (!weekContainer) return;

        const days = this.generateWeekDays(weekStart);
        weekContainer.innerHTML = this.generateWeekHTML(days);

        // Render tasks for each day
        days.forEach(day => {
            const dayTasks = tasks.filter(task => {
                const taskDate = new Date(task.date || task.dueDate);
                return this.isSameDate(day, taskDate);
            });
            this.renderCalendarTasks(day, dayTasks);
        });
    }

    /**
     * Render month calendar view
     */
    renderMonthView(year, month, tasks) {
        const monthContainer = document.getElementById('month-calendar');
        if (!monthContainer) return;

        const days = this.generateMonthDays(year, month);
        monthContainer.innerHTML = this.generateMonthHTML(days, month, year);

        // Render tasks for each day
        days.forEach(({ date, isCurrentMonth }) => {
            if (isCurrentMonth) {
                const dayTasks = tasks.filter(task => {
                    const taskDate = new Date(task.date || task.dueDate);
                    return this.isSameDate(date, taskDate);
                });
                this.renderCalendarTasks(date, dayTasks);
            }
        });
    }

    /**
     * Generate week HTML structure
     */
    generateWeekHTML(days) {
        return `
            <div class="calendar-header">
                ${days.map(day => `
                    <div class="day-header">
                        <span class="day-name">${this.getDayName(day.getDay())}</span>
                        <span class="day-number">${day.getDate()}</span>
                    </div>
                `).join('')}
            </div>
            <div class="calendar-body">
                ${days.map(day => `
                    <div class="calendar-day ${this.isToday(day) ? 'today' : ''}" data-date="${this.formatDateForCalendar(day)}">
                        <div class="day-tasks"></div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Generate month HTML structure
     */
    generateMonthHTML(days, month, year) {
        const weekRows = [];
        for (let i = 0; i < days.length; i += 7) {
            weekRows.push(days.slice(i, i + 7));
        }

        return `
            <div class="calendar-header">
                <div class="month-title">${this.getMonthName(month)} ${year}</div>
                <div class="day-names">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
                        `<div class="day-name">${day}</div>`
                    ).join('')}
                </div>
            </div>
            <div class="calendar-body">
                ${weekRows.map(week => `
                    <div class="calendar-week">
                        ${week.map(({ date, isCurrentMonth }) => `
                            <div class="calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${this.isToday(date) ? 'today' : ''}" 
                                 data-date="${this.formatDateForCalendar(date)}">
                                <span class="day-number">${date.getDate()}</span>
                                <div class="day-tasks"></div>
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Utility methods
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDateForCalendar(date) {
        return date.toISOString().split('T')[0];
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    isSameDate(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    getDayName(dayIndex) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[dayIndex];
    }

    getMonthName(monthIndex) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthIndex];
    }

    generateWeekDays(startDate) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            days.push(day);
        }
        return days;
    }

    generateMonthDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();
        
        const days = [];
        
        // Previous month days
        for (let i = startDay - 1; i >= 0; i--) {
            const day = new Date(firstDay);
            day.setDate(day.getDate() - i - 1);
            days.push({ date: day, isCurrentMonth: false });
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ 
                date: new Date(year, month, i), 
                isCurrentMonth: true 
            });
        }
        
        // Next month days
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            const day = new Date(year, month + 1, i);
            days.push({ date: day, isCurrentMonth: false });
        }
        
        return days;
    }
}

export default TaskRenderer;
