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
            
            // Reset recurrence options when unchecked
            if (!e.target.checked) {
                this.resetRecurrenceOptions();
            }
        });

        // Handle recurrence type changes
        document.addEventListener('change', (e) => {
            if (e.target.name === 'recurrence-type') {
                this.handleRecurrenceTypeChange(e.target.value);
            }
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
        const categories = ['today', 'tomorrow', 'future', 'pomodoro'];
        const currentIndex = categories.indexOf(this.currentCategory);
        const nextIndex = (currentIndex + direction + categories.length) % categories.length;
        
        this.switchCategory(categories[nextIndex]);
    },

    switchCategory(category) {
        // Hide all task categories first
        document.querySelectorAll('.task-category').forEach(el => {
            el.classList.remove('active');
        });
        
        // Hide all non-task sections (but not task categories)
        document.querySelectorAll('section:not(.hero-section):not(.task-category)').forEach(el => {
            el.style.display = 'none';
        });
        
        // Update current category
        this.currentCategory = category;
        
        if (category === 'pomodoro') {
            // Show Pomodoro section
            const pomodoroSection = document.getElementById('pomodoro');
            if (pomodoroSection) {
                pomodoroSection.style.display = 'block';
                if (this.pomodoroTimer) {
                    this.pomodoroTimer.initializeSettingsUI();
                }
            }
            
            // Update hero section
            document.getElementById('hero-category').textContent = 'Pomodoro Timer';
        } else {
            // Hide the Pomodoro section
            const pomodoroSection = document.getElementById('pomodoro');
            if (pomodoroSection) {
                pomodoroSection.style.display = 'none';
            }
            
            // Show selected task category
            document.getElementById(`${category}-section`).classList.add('active');
            
            // Update hero section
            document.getElementById('hero-category').textContent = 
                category.charAt(0).toUpperCase() + category.slice(1);
        }
        
        // Always re-render task lists when switching categories to ensure proper empty state display
        UIRenderer.renderTaskLists();
        
        // Update active dots if they exist
        document.querySelectorAll('.category-dot').forEach((dot, index) => {
            const categories = ['today', 'tomorrow', 'future', 'pomodoro'];
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
                // Focus on task list area - go back to Today
                this.switchCategory('today');
                break;
            case '#pomodoro':
                this.switchCategory('pomodoro');
                break;
            case '#inspo':
                this.showSection('inspo');
                break;
            case '#about':
                this.showSection('about');
                break;
            case '#contact':
                this.showSection('contact');
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
        // Hide all task categories
        document.querySelectorAll('.task-category').forEach(el => {
            el.classList.remove('active');
        });
        
        // Hide all non-task sections except hero
        document.querySelectorAll('section:not(.hero-section):not(.task-category)').forEach(el => {
            el.style.display = 'none';
        });
        
        // Show the requested section
        const section = document.getElementById(sectionId);
        if (section) {
            section.style.display = 'block';
        }
        
        // Update hero category
        const heroCategory = document.getElementById('hero-category');
        if (heroCategory) {
            heroCategory.textContent = sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
        }
        
        this.currentCategory = sectionId;
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
        
        // Ensure the current category is visible
        this.switchCategory(this.currentCategory);
        
        // Initialize calendar views on first load
        if (!this.currentWeekStart && !this.currentMonth) {
            this.renderWeekView();
            this.renderMonthView();
        } else {
            // Update calendar views with current tasks
            this.updateCalendarViews();
        }
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
            ['today', 'tomorrow', 'future', 'pomodoro'].forEach((category, index) => {
                const dot = document.createElement('div');
                dot.className = `category-dot ${index === 0 ? 'active' : ''}`;
                dot.dataset.category = category;
                dot.addEventListener('click', () => this.switchCategory(category));
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
    
    openEditTaskModal(task) {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        
        // Reset form
        form.reset();
        
        // Fill form with existing task data
        document.getElementById('task-name').value = task.name;
        document.getElementById('task-desc').value = task.description || '';
        
        // Set category
        const categoryRadio = document.querySelector(`input[name="category"][value="${task.category}"]`);
        if (categoryRadio) {
            categoryRadio.checked = true;
        }
        
        // Show date picker if future category and set date
        const futureDateGroup = document.getElementById('future-date-group');
        if (task.category === 'future') {
            futureDateGroup.style.display = 'block';
            const dateInput = document.getElementById('task-date');
            if (dateInput && task.dueDate) {
                const formattedDate = new Date(task.dueDate).toISOString().split('T')[0];
                dateInput.value = formattedDate;
            }
        } else {
            futureDateGroup.style.display = 'none';
        }
        
        // Store task ID for editing (instead of creating new)
        form.dataset.editTaskId = task.id;
        
        // Update modal title
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Task';
        }
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    },
    
    closeTaskModal() {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');
        
        // Reset edit mode
        delete form.dataset.editTaskId;
        
        // Reset modal title
        const modalTitle = document.getElementById('modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Add New Task';
        }
        
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
    },
    
    handleTaskFormSubmit(e) {
        e.preventDefault();
        
        try {
            const form = e.target;
            const formData = new FormData(form);
            const taskName = formData.get('name');
            
            if (!taskName || taskName.trim() === '') {
                alert('Please enter a task name');
                return;
            }
            
            // Check if we're editing an existing task
            const editTaskId = form.dataset.editTaskId;
            
            if (editTaskId) {
                // Editing existing task
                const originalCategory = formData.get('category');
                const smartCategory = this.getSmartCategory(formData);
                
                const updatedTask = {
                    id: editTaskId,
                    name: taskName.trim(),
                    description: formData.get('description') || '',
                    category: smartCategory,
                    originalCategory: originalCategory,
                    dueDate: this.getDueDate(formData),
                    recurrence: this.getRecurrenceData(formData)
                };
                
                console.log('Updating task:', updatedTask); // Debug log
                TaskManager.updateTask(updatedTask);
                this.closeTaskModal();
                this.renderUI();
                
                // Show success message
                let message = `Task "${updatedTask.name}" updated successfully!`;
                if (originalCategory !== smartCategory) {
                    message += ` (Moved to ${smartCategory} based on selected date)`;
                }
                this.showNotification(message);
                
            } else {
                // Creating new task
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
                    recurrence: this.getRecurrenceData(formData)
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
            }
            
        } catch (error) {
            console.error('Error saving task:', error);
            alert('An error occurred while saving the task. Please try again.');
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
        const selectedDate = formData.get('date');
        const today = getToday();
        
        // If a specific date is selected, use it regardless of category
        if (selectedDate) {
            return new Date(selectedDate).toISOString();
        }
        
        // Otherwise, use category defaults
        switch(category) {
            case 'today':
                return today.toISOString();
            case 'tomorrow':
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return tomorrow.toISOString();
            case 'future':
                // For future without specific date, default to tomorrow + 1
                const futureDefault = new Date(today);
                futureDefault.setDate(today.getDate() + 2);
                return futureDefault.toISOString();
            default:
                return today.toISOString();
        }
    },

    // Prioritize dates over manual selection - determine category based on due date
    getSmartCategory(formData) {
        const selectedDate = formData.get('date');
        
        // If a date is provided, always use date-based categorization
        if (selectedDate) {
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
            } else if (selected > tomorrow) {
                return 'future';
            } else {
                return 'overdue'; // Past dates
            }
        }
        
        // If no date is provided, use manual selection but default to future
        const selectedCategory = formData.get('category');
        return selectedCategory || 'future';
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

    // Calendar functionality
    currentWeekStart: null,
    currentMonth: null,
    currentYear: null,
    
    toggleFutureView(view) {
        const weekView = document.getElementById('week-calendar');
        const monthView = document.getElementById('month-calendar');
        const weekBtn = document.getElementById('week-view-btn');
        const monthBtn = document.getElementById('month-view-btn');
        
        // Toggle view containers
        if (view === 'week') {
            weekView.style.display = 'block';
            monthView.style.display = 'none';
            weekBtn.classList.add('active');
            monthBtn.classList.remove('active');
            this.renderWeekView();
        } else {
            weekView.style.display = 'none';
            monthView.style.display = 'block';
            weekBtn.classList.remove('active');
            monthBtn.classList.add('active');
            this.renderMonthView();
        }
    },
    
    renderWeekView() {
        const today = new Date();
        
        // Initialize current week if not set
        if (!this.currentWeekStart) {
            const dayOfWeek = today.getDay(); // 0 = Sunday
            this.currentWeekStart = new Date(today);
            this.currentWeekStart.setDate(today.getDate() - dayOfWeek);
        }
        
        // Update week title
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(this.currentWeekStart.getDate() + 6);
        
        const titleEl = document.getElementById('week-title');
        if (titleEl) {
            const startStr = this.currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            titleEl.textContent = `${startStr} - ${endStr}`;
        }
        
        // Render week days
        const weekDays = document.querySelectorAll('.week-day');
        weekDays.forEach((dayEl, index) => {
            const date = new Date(this.currentWeekStart);
            date.setDate(this.currentWeekStart.getDate() + index);
            
            // Update day info
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNumber = date.getDate();
            
            dayEl.querySelector('.day-name').textContent = dayName;
            dayEl.querySelector('.day-number').textContent = dayNumber;
            dayEl.dataset.date = date.toISOString().split('T')[0];
            
            // Check if it's today
            if (date.toDateString() === today.toDateString()) {
                dayEl.classList.add('today');
            } else {
                dayEl.classList.remove('today');
            }
            
            // Render tasks for this day
            this.renderDayTasks(dayEl, date);
        });
        
        // Add navigation event listeners
        this.setupWeekNavigation();
    },
    
    renderMonthView() {
        const today = new Date();
        
        // Initialize current month if not set
        if (!this.currentMonth || !this.currentYear) {
            this.currentMonth = today.getMonth();
            this.currentYear = today.getFullYear();
        }
        
        // Update month title
        const titleEl = document.getElementById('month-title');
        if (titleEl) {
            const date = new Date(this.currentYear, this.currentMonth);
            titleEl.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        
        // Clear and render month days
        const monthDaysGrid = document.getElementById('month-days-grid');
        if (monthDaysGrid) {
            monthDaysGrid.innerHTML = '';
            
            const firstDay = new Date(this.currentYear, this.currentMonth, 1);
            const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
            const firstDayOfWeek = firstDay.getDay();
            
            // Add days from previous month
            for (let i = 0; i < firstDayOfWeek; i++) {
                const prevDate = new Date(this.currentYear, this.currentMonth, -firstDayOfWeek + i + 1);
                const dayEl = this.createMonthDayElement(prevDate, 'other-month');
                monthDaysGrid.appendChild(dayEl);
            }
            
            // Add days of current month
            for (let i = 1; i <= lastDay.getDate(); i++) {
                const date = new Date(this.currentYear, this.currentMonth, i);
                const isToday = date.toDateString() === today.toDateString();
                const dayEl = this.createMonthDayElement(date, isToday ? 'today' : '');
                monthDaysGrid.appendChild(dayEl);
            }
            
            // Fill remaining slots with next month days
            const totalDays = monthDaysGrid.children.length;
            const remainingSlots = 42 - totalDays; // 6 rows x 7 days
            
            for (let i = 1; i <= remainingSlots; i++) {
                const nextDate = new Date(this.currentYear, this.currentMonth + 1, i);
                const dayEl = this.createMonthDayElement(nextDate, 'other-month');
                monthDaysGrid.appendChild(dayEl);
            }
        }
        
        // Add navigation event listeners
        this.setupMonthNavigation();
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
        
        // Render tasks for this day
        this.renderDayTasks(dayEl, date);
        
        // Add click event to add a task for this date
        dayEl.addEventListener('click', () => {
            this.openTaskModal('future', date);
        });
        
        return dayEl;
    },
    
    renderDayTasks(dayEl, date) {
        const tasksContainer = dayEl.querySelector('.day-tasks');
        if (!tasksContainer) return;
        
        tasksContainer.innerHTML = '';
        
        // Use the new filtered task method to get tasks for this specific date
        const tasks = TaskManager.getTasksForDate(date);
        
        // Render each task
        tasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `calendar-task ${task.completed ? 'completed' : ''}`;
            
            // Add special styling for recurring tasks
            if (task.isVirtualRecurring) {
                taskEl.classList.add('recurring-task');
                taskEl.title = `Recurring: ${task.name}`;
            }
            
            taskEl.textContent = task.name;
            taskEl.dataset.taskId = task.id;
            
            // Add click event for task interaction
            taskEl.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showTaskMenu(task, e);
            });
            
            tasksContainer.appendChild(taskEl);
        });
    },
    
    showTaskMenu(task, event) {
        // Create a simple context menu for task actions
        const existingMenu = document.querySelector('.task-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }
        
        const menu = document.createElement('div');
        menu.className = 'task-context-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${event.clientY}px;
            left: ${event.clientX}px;
            background: white;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            min-width: 120px;
        `;
        
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = task.completed ? 'Mark Incomplete' : 'Mark Complete';
        toggleBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 8px 12px;
            border: none;
            background: none;
            text-align: left;
            cursor: pointer;
            border-bottom: 1px solid #eee;
        `;
        toggleBtn.addEventListener('click', () => {
            // Handle virtual recurring tasks
            if (task.isVirtualRecurring) {
                // Create an actual instance for this recurring task
                const actualTask = TaskManager.createRecurringTaskInstance(
                    TaskManager.getTaskById(task.parentRecurringId),
                    new Date(task.dueDate)
                );
                TaskManager.toggleTaskCompletion(actualTask.id);
            } else {
                TaskManager.toggleTaskCompletion(task.id);
            }
            this.renderUI();
            this.updateCalendarViews();
            menu.remove();
        });
        
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit Task';
        editBtn.style.cssText = toggleBtn.style.cssText;
        editBtn.addEventListener('click', () => {
            // Handle virtual recurring tasks
            if (task.isVirtualRecurring) {
                // Edit the parent recurring task instead
                const parentTask = TaskManager.getTaskById(task.parentRecurringId);
                if (parentTask) {
                    this.openEditTaskModal(parentTask);
                } else {
                    alert('Parent recurring task not found');
                }
            } else {
                this.openEditTaskModal(task);
            }
            menu.remove();
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete Task';
        deleteBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 8px 12px;
            border: none;
            background: none;
            text-align: left;
            cursor: pointer;
            color: #dc3545;
        `;
        deleteBtn.addEventListener('click', () => {
            if (task.isVirtualRecurring) {
                if (confirm('Delete this recurring task instance?')) {
                    // For virtual tasks, we need to create an instance first, then delete it
                    const actualTask = TaskManager.createRecurringTaskInstance(
                        TaskManager.getTaskById(task.parentRecurringId),
                        new Date(task.dueDate)
                    );
                    const deleted = TaskManager.deleteTask(actualTask.id);
                    if (deleted) {
                        this.renderUI();
                        this.updateCalendarViews();
                    } else {
                        alert('Failed to delete task. Please try again.');
                    }
                }
            } else {
                if (confirm('Delete this task?')) {
                    const deleted = TaskManager.deleteTask(task.id);
                    if (deleted) {
                        this.renderUI();
                        this.updateCalendarViews();
                    } else {
                        alert('Failed to delete task. Please try again.');
                    }
                }
            }
            menu.remove();
        });
        
        menu.appendChild(toggleBtn);
        menu.appendChild(editBtn);
        menu.appendChild(deleteBtn);
        document.body.appendChild(menu);
        
        // Remove menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function removeMenu() {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            });
        }, 0);
    },
    
    setupWeekNavigation() {
        const prevBtn = document.getElementById('prev-week');
        const nextBtn = document.getElementById('next-week');
        
        // Remove existing listeners
        const newPrevBtn = prevBtn.cloneNode(true);
        const newNextBtn = nextBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        
        // Add new listeners
        newPrevBtn.addEventListener('click', () => {
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
            this.renderWeekView();
        });
        
        newNextBtn.addEventListener('click', () => {
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
            this.renderWeekView();
        });
    },
    
    setupMonthNavigation() {
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        
        // Remove existing listeners
        const newPrevBtn = prevBtn.cloneNode(true);
        const newNextBtn = nextBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        
        // Add new listeners
        newPrevBtn.addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.renderMonthView();
        });
        
        newNextBtn.addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.renderMonthView();
        });
    },

    updateCalendarViews() {
        // Update both week and month views when tasks change
        if (this.currentCategory === 'future') {
            const weekView = document.getElementById('week-calendar');
            const monthView = document.getElementById('month-calendar');
            
            if (weekView && weekView.style.display !== 'none') {
                this.renderWeekView();
            }
            if (monthView && monthView.style.display !== 'none') {
                this.renderMonthView();
            }
        }
    },

    // Recurrence helper methods
    resetRecurrenceOptions() {
        // Reset all recurrence selections
        const daysGroup = document.getElementById('recurrence-days-group');
        const monthlyGroup = document.getElementById('recurrence-monthly-group');
        
        if (daysGroup) daysGroup.style.display = 'none';
        if (monthlyGroup) monthlyGroup.style.display = 'none';
        
        // Uncheck all day checkboxes
        document.querySelectorAll('input[name="recurrence-days"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Reset to default recurrence type
        const dailyRadio = document.querySelector('input[name="recurrence-type"][value="daily"]');
        if (dailyRadio) dailyRadio.checked = true;
    },

    handleRecurrenceTypeChange(type) {
        const daysGroup = document.getElementById('recurrence-days-group');
        const monthlyGroup = document.getElementById('recurrence-monthly-group');
        
        // Hide all groups first
        if (daysGroup) daysGroup.style.display = 'none';
        if (monthlyGroup) monthlyGroup.style.display = 'none';
        
        // Show relevant group based on type
        switch (type) {
            case 'weekly':
                if (daysGroup) {
                    daysGroup.style.display = 'block';
                    // Set default to current day if none selected
                    const checkedDays = document.querySelectorAll('input[name="recurrence-days"]:checked');
                    if (checkedDays.length === 0) {
                        const today = new Date().getDay();
                        const todayCheckbox = document.querySelector(`input[name="recurrence-days"][value="${today}"]`);
                        if (todayCheckbox) todayCheckbox.checked = true;
                    }
                }
                break;
            case 'monthly':
                if (monthlyGroup) monthlyGroup.style.display = 'block';
                break;
            case 'daily':
            default:
                // No additional options needed for daily
                break;
        }
    },

    getRecurrenceData(formData) {
        const isRecurring = formData.get('recurring');
        if (!isRecurring) return null;

        const recurrenceType = formData.get('recurrence-type');
        const recurrenceData = {
            type: recurrenceType,
            enabled: true
        };

        switch (recurrenceType) {
            case 'daily':
                // No additional data needed
                break;
            case 'weekly':
                const selectedDays = [];
                document.querySelectorAll('input[name="recurrence-days"]:checked').forEach(checkbox => {
                    selectedDays.push(parseInt(checkbox.value));
                });
                recurrenceData.days = selectedDays.length > 0 ? selectedDays : [new Date().getDay()];
                break;
            case 'monthly':
                const monthlyType = formData.get('monthly-type');
                recurrenceData.monthlyType = monthlyType || 'date';
                break;
        }

        return recurrenceData;
    },

    // ...existing code...
};

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
    window.App = App; // Make App globally accessible
});