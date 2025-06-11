// app.js
import TaskManager from './taskManager.js';
import Storage from './storage.js';
import { UIRenderer } from './UI_Renderer.js';
import { generateId, getToday, formatDate } from './utils.js';
import PomodoroTimer from './pomodoro.js';

const App = {
    currentCategory: 'today',
    
    init() {
        // Load initial data
        this.tasks = TaskManager.getTasks();
        this.settings = Storage.loadSettings();
        
        // Initialize Pomodoro Timer
        this.pomodoroTimer = new PomodoroTimer();
        window.pomodoroTimer = this.pomodoroTimer; // Make accessible globally for modal callbacks
        
        // Set up event listeners
        this.bindEvents();
        
        // Apply theme
        this.applyTheme(this.settings.theme);
        
        // Render initial UI
        this.renderUI();
        
        // Make sure Pomodoro section is visible on startup
        const pomodoroSection = document.getElementById('pomodoro');
        if (pomodoroSection) {
            pomodoroSection.style.display = 'block';
            this.pomodoroTimer.initializeSettingsUI();
            this.updatePomodoroTaskList();
        }
    },

    bindEvents() {
        // New task button
        document.getElementById('new-task-btn').addEventListener('click', () => {
            this.openTaskModal();
        });
        
        // Add task buttons in empty states
        document.querySelectorAll('.add-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.openTaskModal(category);
            });
        });
        
        // Modal close
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // Modal backdrop click to close
        document.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeTaskModal();
        });

        // Task form submission
        document.getElementById('task-form').addEventListener('submit', (e) => {
            this.handleTaskFormSubmit(e);
        });
        
        // Category radio buttons
        document.querySelectorAll('input[name="category"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const futureDateGroup = document.getElementById('future-date-group');
                futureDateGroup.style.display = e.target.value === 'future' ? 'block' : 'none';
            });
        });

        // Recurring task checkbox
        document.getElementById('recurring-task').addEventListener('change', (e) => {
            const recurrenceOptions = document.getElementById('recurrence-options');
            recurrenceOptions.style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('left-arrow-btn').addEventListener('click', () => {
            this.navigateCategories(-1);
        });

        document.getElementById('right-arrow-btn').addEventListener('click', () => {
            this.navigateCategories(1);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.navigateCategories(-1);
            } else if (e.key === 'ArrowRight') {
                this.navigateCategories(1);
            }
        });

        // Sidebar functionality
        this.initSidebar();

        // Theme selector
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            // Populate theme options based on CSS data-theme values
            const themes = [
                { value: 'cool-blues', text: 'Cool Blues' },
                { value: 'warm-neutrals', text: 'Warm Neutrals' },
                { value: 'bold-contrast', text: 'Bold Contrast' },
                { value: 'earthy-greens', text: 'Earthy Greens' },
                { value: 'pastel-gradient', text: 'Pastel Gradient' },
                { value: 'sunset-gradient', text: 'Sunset Gradient' },
                { value: 'vintage-gold', text: 'Vintage Gold' }
            ];
            
            // Clear existing options
            themeSelector.innerHTML = '';
            
            themes.forEach(theme => {
                const option = document.createElement('option');
                option.value = theme.value;
                option.textContent = theme.text;
                themeSelector.appendChild(option);
            });
            
            // Set current theme or default to first theme
            const currentTheme = this.settings.theme || 'cool-blues';
            themeSelector.value = currentTheme;
            
            // Ensure the theme is applied if it wasn't already
            if (document.documentElement.getAttribute('data-theme') !== currentTheme) {
                this.applyTheme(currentTheme);
            }
            
            // Add change listener
            themeSelector.addEventListener('change', (e) => {
                const selectedTheme = e.target.value;
                this.applyTheme(selectedTheme);
            });
        }

        // Date input validation
        const dateInput = document.getElementById('task-date');
        if (dateInput) {
            // Set minimum date to today
            const today = new Date();
            dateInput.min = today.toISOString().split('T')[0];
            
            dateInput.addEventListener('change', (e) => {
                const selectedDate = new Date(e.target.value);
                const todayDate = getToday();
                const tomorrowDate = new Date(todayDate);
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                
                // Show warning if date matches today or tomorrow
                const warningElement = document.getElementById('date-warning');
                if (warningElement) {
                    warningElement.remove();
                }
                
                if (selectedDate.toDateString() === todayDate.toDateString()) {
                    this.showDateWarning('This date matches today. Task will be moved to "Today" category.');
                } else if (selectedDate.toDateString() === tomorrowDate.toDateString()) {
                    this.showDateWarning('This date matches tomorrow. Task will be moved to "Tomorrow" category.');
                }
            });
        }

        // View toggle buttons for future category
        document.getElementById('week-view-btn').addEventListener('click', () => {
            this.toggleFutureView('week');
        });
        
        document.getElementById('month-view-btn').addEventListener('click', () => {
            this.toggleFutureView('month');
        });
    },

    navigateCategories(direction) {
        const categories = ['today', 'tomorrow', 'future'];
        const currentIndex = categories.indexOf(this.currentCategory);
        const nextIndex = (currentIndex + direction + categories.length) % categories.length;
        
        this.switchCategory(categories[nextIndex]);
        
        // Make sure Pomodoro is still visible after navigation
        const pomodoroSection = document.getElementById('pomodoro');
        if (pomodoroSection) {
            pomodoroSection.style.display = 'block';
        }
    },

    switchCategory(category) {
        // Hide all categories
        document.querySelectorAll('.task-category').forEach(el => {
            el.classList.remove('active');
        });
        
        // Show selected category
        document.getElementById(`${category}-section`).classList.add('active');
        
        // Always show the pomodoro section
        document.getElementById('pomodoro').style.display = 'block';
        
        // Update current category
        this.currentCategory = category;
        
        // Update hero section
        document.getElementById('hero-category').textContent = 
            category.charAt(0).toUpperCase() + category.slice(1);
        
        // Update active dots if they exist
        document.querySelectorAll('.category-dot').forEach((dot, index) => {
            const categories = ['today', 'tomorrow', 'future'];
            dot.classList.toggle('active', index === categories.indexOf(category));
        });
    },

    applyTheme(themeName) {
        // Set the data-theme attribute on the document element
        document.documentElement.setAttribute('data-theme', themeName);
        
        // Store theme preference
        this.settings.theme = themeName;
        Storage.saveSettings(this.settings);
        
        // Update theme selector to match if it exists and is different
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector && themeSelector.value !== themeName) {
            themeSelector.value = themeName;
        }
    },

    initSidebar() {
        const sidebarButton = document.querySelector('.sidebar');
        const sidebarMenu = document.getElementById('sidebar');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        const sidebarClose = document.querySelector('.sidebar-close');

        // Open sidebar
        if (sidebarButton) {
            sidebarButton.addEventListener('click', () => {
                this.openSidebar();
            });
        }

        // Close sidebar
        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Close sidebar when clicking backdrop
        if (sidebarBackdrop) {
            sidebarBackdrop.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Close sidebar with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebarMenu && sidebarMenu.classList.contains('active')) {
                this.closeSidebar();
            }
        });

        // Add navigation functionality to sidebar links
        document.querySelectorAll('.sidebar-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = e.currentTarget.getAttribute('href');
                
                // Handle navigation based on href
                if (href) {
                    this.handleSidebarNavigation(href);
                }
                
                // Close sidebar after navigation
                this.closeSidebar();
            });
        });

        // Settings and Help button functionality
        const settingsBtn = document.getElementById('settings-btn');
        const helpBtn = document.getElementById('help-btn');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }

        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showHelp();
            });
        }
    },

    openSidebar() {
        const sidebarMenu = document.getElementById('sidebar');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        
        if (sidebarMenu) {
            sidebarMenu.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
        
        if (sidebarBackdrop) {
            sidebarBackdrop.classList.add('active');
        }
    },

    closeSidebar() {
        const sidebarMenu = document.getElementById('sidebar');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        
        if (sidebarMenu) {
            sidebarMenu.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        }
        
        if (sidebarBackdrop) {
            sidebarBackdrop.classList.remove('active');
        }
    },

    handleSidebarNavigation(href) {
        // Handle different navigation targets
        switch(href) {
            case '#task-list':
                // Focus on task list area
                this.focusOnTaskList();
                break;
            case '#pomodoro':
                // Show pomodoro section and ensure it's visible
                const pomodoroSection = document.getElementById('pomodoro');
                if (pomodoroSection) {
                    pomodoroSection.style.display = 'block';
                    this.pomodoroTimer.initializeSettingsUI();
                    this.updatePomodoroTaskList();
                }
                break;
            case '#inspo':
                this.showNotification('Inspiration section coming soon!', 'info');
                break;
            case '#about':
                this.showAbout();
                break;
            case '#contact':
                this.showContact();
                break;
            default:
                console.log('Navigation not implemented for:', href);
        }
    },

    focusOnTaskList() {
        // Scroll to the main task area
        const taskSection = document.querySelector('.main-content');
        if (taskSection) {
            taskSection.scrollIntoView({ behavior: 'smooth' });
        }
    },

    showSection(sectionId) {
        // For the Pomodoro section, we want to keep it visible alongside task categories
        if (sectionId === 'pomodoro') {
            // Show the Pomodoro section
            const pomodoroSection = document.getElementById('pomodoro');
            if (pomodoroSection) {
                pomodoroSection.style.display = 'block';
                this.pomodoroTimer.initializeSettingsUI();
                this.updatePomodoroTaskList();
            }
        } else {
            // For other sections, hide all non-task sections except Pomodoro
            document.querySelectorAll('section:not(.task-category):not(#pomodoro)').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show the requested section
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'block';
            }
        }
        
        // Close the sidebar
        this.closeSidebar();
    },

    showSettings() {
        this.showNotification('Settings panel coming soon!', 'info');
        // TODO: Implement settings modal
    },

    showHelp() {
        this.showNotification('Help documentation coming soon!', 'info');
        // TODO: Implement help modal
    },

    showAbout() {
        this.showNotification('About page coming soon!', 'info');
        // TODO: Implement about modal
    },

    showContact() {
        this.showNotification('Contact form coming soon!', 'info');
        // TODO: Implement contact modal
    },

    renderUI() {
        // Initial rendering logic
        this.renderTaskCounts();
        this.renderCurrentDate();
        UIRenderer.renderTaskLists();
        this.renderCategoryIndicators();
        
        // Initialize calendar views
        this.initializeMonthCalendar();
    },

    renderTaskCounts() {
        const categorized = TaskManager.categorizeTasks();
        
        // Update task counts
        document.getElementById('today-count').textContent = 
            `${categorized.today.length} ${categorized.today.length === 1 ? 'task' : 'tasks'}`;
        document.getElementById('tomorrow-count').textContent = 
            `${categorized.tomorrow.length} ${categorized.tomorrow.length === 1 ? 'task' : 'tasks'}`;
    },

    renderCurrentDate() {
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dateText = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
        document.getElementById('current-date-text').textContent = dateText;
    },

    renderCategoryIndicators() {
        const container = document.getElementById('category-indicator');
        if (container) {
            container.innerHTML = '';
            ['today', 'tomorrow', 'future'].forEach((category, index) => {
                const dot = document.createElement('div');
                dot.className = `category-dot ${index === 0 ? 'active' : ''}`;
                dot.dataset.category = category;
                dot.addEventListener('click', () => {
                    this.switchCategory(category);
                    // Make sure Pomodoro is still visible
                    const pomodoroSection = document.getElementById('pomodoro');
                    if (pomodoroSection) {
                        pomodoroSection.style.display = 'block';
                    }
                });
                container.appendChild(dot);
            });
        }
    },
    openTaskModal(category = null, selectedDate = null) {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        
        // Reset form
        form.reset();
        
        // Set category if provided
        if (category) {
            document.querySelector(`input[name="category"][value="${category}"]`).checked = true;
            // Show date picker if future category
            const futureDateGroup = document.getElementById('future-date-group');
            futureDateGroup.style.display = category === 'future' ? 'block' : 'none';
            
            // Set the date if provided (for clicking on calendar days)
            if (selectedDate && category === 'future') {
                const dateInput = document.getElementById('task-date');
                if (dateInput) {
                    // Format date as YYYY-MM-DD for input
                    const formattedDate = selectedDate instanceof Date 
                        ? selectedDate.toISOString().split('T')[0]
                        : new Date(selectedDate).toISOString().split('T')[0];
                    dateInput.value = formattedDate;
                }
            }
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    },
    
    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    },
    
    handleTaskFormSubmit(e) {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const taskName = formData.get('name');
            
            if (!taskName || taskName.trim() === '') {
                alert('Please enter a task name');
                return;
            }
            
            // Get smart category assignment
            const originalCategory = formData.get('category');
            const smartCategory = this.getSmartCategory(formData);
            
            const task = {
                id: generateId(),
                name: taskName.trim(),
                description: formData.get('description') || '',
                category: smartCategory,
                originalCategory: originalCategory, // Keep track of user's original choice
                dueDate: this.getDueDate(formData),
                completed: false,
                createdAt: new Date().toISOString(),
                recurring: formData.get('recurring') ? formData.get('recurrence-type') : null
            };
            
            // Validate task limits for the final category
            if (!TaskManager.canAddTask(task.category)) {
                alert(`Cannot add more tasks to ${task.category}. Task limit reached.`);
                return;
            }
            
            console.log('Adding task:', task); // Debug log
            TaskManager.addTask(task);
            this.closeTaskModal();
            this.renderUI();
            
            // Show success message with category reassignment info
            let message = `Task "${task.name}" added successfully!`;
            if (originalCategory !== smartCategory) {
                message += ` (Moved to ${smartCategory} based on selected date)`;
            }
            this.showNotification(message);
            
        } catch (error) {
            console.error('Error adding task:', error);
            alert('An error occurred while adding the task. Please try again.');
        }
    },

    showNotification(message) {
        // Enhanced notification styling
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span>✅</span>
                <span>${message}</span>
            </div>
        `;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--accent, #006d77);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-weight: 500;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add slide-in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 300);
        }, 3000);
    },
    
    getDueDate(formData) {
        const category = formData.get('category');
        const today = getToday();
        
        switch(category) {
            case 'today':
                return today.toISOString();
            case 'tomorrow':
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return tomorrow.toISOString();
            case 'future':
                const selectedDate = formData.get('date');
                return selectedDate ? new Date(selectedDate).toISOString() : today.toISOString();
            default:
                return today.toISOString();
        }
    },

    // Smart category assignment based on selected date
    getSmartCategory(formData) {
        const selectedCategory = formData.get('category');
        const selectedDate = formData.get('date');
        
        // If not future category, return as is
        if (selectedCategory !== 'future' || !selectedDate) {
            return selectedCategory;
        }
        
        const today = getToday();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const selected = new Date(selectedDate);
        
        // Compare dates (ignore time)
        const todayStr = today.toDateString();
        const tomorrowStr = tomorrow.toDateString();
        const selectedStr = selected.toDateString();
        
        if (selectedStr === todayStr) {
            return 'today';
        } else if (selectedStr === tomorrowStr) {
            return 'tomorrow';
        } else {
            return 'future';
        }
    },

    showDateWarning(message) {
        const futureDateGroup = document.getElementById('future-date-group');
        let warningElement = document.getElementById('date-warning');
        
        if (!warningElement) {
            warningElement = document.createElement('div');
            warningElement.id = 'date-warning';
            warningElement.style.cssText = `
                color: #e28413;
                font-size: 0.875rem;
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: rgba(226, 132, 19, 0.1);
                border-radius: 4px;
                border-left: 3px solid #e28413;
            `;
            futureDateGroup.appendChild(warningElement);
        }
        
        warningElement.textContent = message;
    },

    toggleFutureView(viewType) {
        // Get the calendar containers
        const weekView = document.getElementById('week-calendar');
        const monthView = document.getElementById('month-calendar');
        
        // Get toggle buttons
        const weekBtn = document.getElementById('week-view-btn');
        const monthBtn = document.getElementById('month-view-btn');
        
        if (viewType === 'week') {
            // Show week view, hide month view
            weekView.style.display = 'block';
            monthView.style.display = 'none';
            
            // Update active button state
            weekBtn.classList.add('active');
            monthBtn.classList.remove('active');
        } else {
            // Show month view, hide week view
            weekView.style.display = 'none';
            monthView.style.display = 'block';
            
            // Update active button state
            weekBtn.classList.remove('active');
            monthBtn.classList.add('active');
            
            // Initialize month calendar if not already done
            this.initializeMonthCalendar();
        }
    },

    initializeMonthCalendar() {
        const monthDaysGrid = document.getElementById('month-days-grid');
        if (!monthDaysGrid) return;
        
        // Clear existing content
        monthDaysGrid.innerHTML = '';
        
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Get first day of the month
        const firstDay = new Date(currentYear, currentMonth, 1);
        // Get last day of the month
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        
        // Get day of week for first day (0 = Sunday, 6 = Saturday)
        const firstDayOfWeek = firstDay.getDay();
        
        // Create days from previous month to fill the first row
        for (let i = 0; i < firstDayOfWeek; i++) {
            const prevMonthDate = new Date(currentYear, currentMonth, -firstDayOfWeek + i + 1);
            const dayEl = this.createMonthDayElement(prevMonthDate, 'other-month');
            monthDaysGrid.appendChild(dayEl);
        }
        
        // Create days for current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(currentYear, currentMonth, i);
            const isToday = date.toDateString() === today.toDateString();
            const dayEl = this.createMonthDayElement(date, isToday ? 'today' : '');
            monthDaysGrid.appendChild(dayEl);
        }
        
        // Fill remaining slots with next month's days
        const totalDaysDisplayed = monthDaysGrid.children.length;
        const remainingSlots = 42 - totalDaysDisplayed; // 6 rows x 7 days
        
        for (let i = 1; i <= remainingSlots; i++) {
            const nextMonthDate = new Date(currentYear, currentMonth + 1, i);
            const dayEl = this.createMonthDayElement(nextMonthDate, 'other-month');
            monthDaysGrid.appendChild(dayEl);
        }
    },
    
    createMonthDayElement(date, className) {
        const dayEl = document.createElement('div');
        dayEl.className = `month-day ${className || ''}`;
        dayEl.dataset.date = date.toISOString().split('T')[0];
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        
        const dayTasks = document.createElement('div');
        dayTasks.className = 'day-tasks';
        
        dayEl.appendChild(dayNumber);
        dayEl.appendChild(dayTasks);
        
        // Add click event to add a task for this date
        dayEl.addEventListener('click', () => {
            this.openTaskModal('future', date);
        });
        
        return dayEl;
    },

    updatePomodoroTaskList() {
        const todayTasks = TaskManager.getTasksByCategory('today');
        const taskList = document.getElementById('pomodoro-task-list');
        
        if (!taskList) return;
        
        if (todayTasks.length === 0) {
            taskList.innerHTML = `
                <li class="active-task-item">
                    <span class="task-title">No tasks for today. Add some tasks to get started!</span>
                </li>
            `;
            return;
        }
        
        taskList.innerHTML = '';
        todayTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = 'active-task-item';
            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" id="pomodoro-task-${task.id}" 
                       ${task.completed ? 'checked' : ''}>
                <label for="pomodoro-task-${task.id}" class="task-title ${task.completed ? 'completed' : ''}">
                    ${task.title}
                </label>
            `;
            
            // Add event listener for task completion
            const checkbox = li.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                task.completed = e.target.checked;
                TaskManager.updateTask(task);
                this.updatePomodoroTaskList();
                this.renderUI(); // Update main task view
            });
            
            taskList.appendChild(li);
        });
    }
};

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    window.App = App; // Make App globally accessible
});