import { pubSub } from '../events/PubSub.js';
import { appState } from '../core/AppState.js';
import { debounce } from '../utils/helpers.js';

// Import renderers
import { taskRenderer } from './renderers/TaskRenderer.js';
import { calendarRenderer } from './renderers/CalendarRenderer.js';
import { pomodoroRenderer } from './renderers/PomodoroRenderer.js';

// Import components
import { modalManager } from './components/ModalManager.js';
import { themeManager } from './components/ThemeManager.js';
import { notificationService } from './components/NotificationService.js';

/**
 * UIManager
 * Central UI orchestrator that coordinates all UI components and renderers
 */
class UIManager {
    constructor() {
        this.renderers = new Map();
        this.components = new Map();
        this.initialized = false;
        
        // UI state tracking
        this.ui = {
            currentView: 'today',
            sidebarOpen: true,
            modalStack: [],
            loadingStates: new Set(),
            notifications: []
        };

        // Register all renderers
        this.registerRenderer('taskRenderer', taskRenderer);
        this.registerRenderer('calendarRenderer', calendarRenderer);
        this.registerRenderer('pomodoroRenderer', pomodoroRenderer);
        
        // Register all components
        this.registerComponent('modalManager', modalManager);
        this.registerComponent('themeManager', themeManager);
        this.registerComponent('notificationService', notificationService);

        this.setupEventListeners();
    }

    /**
     * Initialize UIManager
     */
    async init() {
        if (this.initialized) return;

        try {
            // Initialize UI state
            this.syncWithAppState();
            
            // Initialize all components first (they provide services to renderers)
            for (const [name, component] of this.components) {
                if (component.init) {
                    await component.init();
                    console.log(`Initialized component: ${name}`);
                }
            }
            
            // Initialize all renderers
            for (const [name, renderer] of this.renderers) {
                if (renderer.init) {
                    await renderer.init();
                    console.log(`Initialized renderer: ${name}`);
                }
            }
            
            // Setup resize observer
            this.setupResizeObserver();
            
            // Setup intersection observers
            this.setupIntersectionObservers();
            
            this.initialized = true;
            pubSub.publish('uiManager:initialized');
            
        } catch (error) {
            console.error('Failed to initialize UIManager:', error);
            pubSub.publish('uiManager:error', { error, action: 'init' });
        }
    }

    /**
     * Register a renderer
     * @param {string} name - Renderer name
     * @param {Object} renderer - Renderer instance
     */
    registerRenderer(name, renderer) {
        this.renderers.set(name, renderer);
        
        // Initialize renderer if UIManager is already initialized
        if (this.initialized && renderer.init) {
            renderer.init();
        }
        
        pubSub.publish('uiManager:renderer:registered', { name, renderer });
    }

    /**
     * Register a component
     * @param {string} name - Component name
     * @param {Object} component - Component instance
     */
    registerComponent(name, component) {
        this.components.set(name, component);
        
        // Initialize component if UIManager is already initialized
        if (this.initialized && component.init) {
            component.init();
        }
        
        pubSub.publish('uiManager:component:registered', { name, component });
    }

    /**
     * Get renderer by name
     * @param {string} name - Renderer name
     * @returns {Object|null} Renderer instance
     */
    getRenderer(name) {
        return this.renderers.get(name) || null;
    }

    /**
     * Get component by name
     * @param {string} name - Component name
     * @returns {Object|null} Component instance
     */
    getComponent(name) {
        return this.components.get(name) || null;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // App state changes
        appState.observe('currentView', (newView) => {
            this.handleViewChange(newView);
        });

        appState.observe('ui', (newUI) => {
            this.syncUIState(newUI);
        });

        // Task-related events
        pubSub.subscribe('tasks:changed', ({ tasks }) => {
            this.handleTasksChanged(tasks);
        });

        pubSub.subscribe('task:created', ({ task }) => {
            this.handleTaskCreated(task);
        });

        pubSub.subscribe('task:updated', ({ task }) => {
            this.handleTaskUpdated(task);
        });

        pubSub.subscribe('task:deleted', ({ taskId }) => {
            this.handleTaskDeleted(taskId);
        });

        // Task UI events
        pubSub.subscribe('task:create:open', ({ category }) => {
            this.openTaskModal({ category });
        });

        pubSub.subscribe('task:edit:open', ({ taskId }) => {
            this.openTaskEditModal(taskId);
        });

        // Pomodoro events
        pubSub.subscribe('pomodoro:started', (data) => {
            this.handlePomodoroStarted(data);
        });

        pubSub.subscribe('pomodoro:tick', (data) => {
            this.handlePomodoroTick(data);
        });

        pubSub.subscribe('pomodoro:session:completed', (data) => {
            this.handlePomodoroCompleted(data);
        });

        // UI events
        pubSub.subscribe('view:switch', ({ view }) => {
            this.switchView(view);
        });

        pubSub.subscribe('modal:open', (data) => {
            this.openModal(data);
        });

        pubSub.subscribe('modal:close', () => {
            this.closeModal();
        });

        pubSub.subscribe('sidebar:toggle', () => {
            this.toggleSidebar();
        });

        pubSub.subscribe('navigation:previous', () => {
            this.navigatePrevious();
        });

        pubSub.subscribe('navigation:next', () => {
            this.navigateNext();
        });

        pubSub.subscribe('notification:show', (data) => {
            this.showNotification(data);
        });

        pubSub.subscribe('loading:start', ({ id }) => {
            this.showLoading(id);
        });

        pubSub.subscribe('loading:stop', ({ id }) => {
            this.hideLoading(id);
        });

        // Error handling
        pubSub.subscribe('app:error', (error) => {
            this.handleError(error);
        });

        // Keyboard shortcuts
        pubSub.subscribe('keyboard:shortcut', ({ shortcut, event }) => {
            this.handleKeyboardShortcut(shortcut, event);
        });

        // Settings and Help
        pubSub.subscribe('ui:showSettings', () => {
            this.showSettings();
        });

        pubSub.subscribe('ui:showHelp', () => {
            this.showHelp();
        });

        // Window events
        pubSub.subscribe('window:resize', debounce(() => {
            this.handleResize();
        }, 250));

        pubSub.subscribe('page:visibility:change', ({ hidden }) => {
            this.handleVisibilityChange(hidden);
        });
    }

    /**
     * Sync with app state
     */
    syncWithAppState() {
        const state = appState.getState();
        
        this.ui.currentView = state.currentView;
        this.ui.sidebarOpen = !state.ui.sidebarCollapsed;
        
        // Update UI elements
        this.updateViewState();
        this.updateSidebarState();
    }

    /**
     * Sync UI state with app state
     * @param {Object} uiState - New UI state
     */
    syncUIState(uiState) {
        if (uiState.sidebarCollapsed !== undefined) {
            this.ui.sidebarOpen = !uiState.sidebarCollapsed;
            this.updateSidebarState();
        }

        if (uiState.isModalOpen !== undefined && !uiState.isModalOpen) {
            this.closeAllModals();
        }
    }

    /**
     * Navigate to previous category/view
     */
    navigatePrevious() {
        const views = ['today', 'tomorrow', 'future'];
        const currentIndex = views.indexOf(this.ui.currentView);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : views.length - 1;
        const previousView = views[previousIndex];
        
        this.switchView(previousView);
        
        pubSub.publish('ui:navigation:previous', { 
            from: this.ui.currentView, 
            to: previousView 
        });
    }

    /**
     * Navigate to next category/view
     */
    navigateNext() {
        const views = ['today', 'tomorrow', 'future'];
        const currentIndex = views.indexOf(this.ui.currentView);
        const nextIndex = (currentIndex + 1) % views.length;
        const nextView = views[nextIndex];
        
        this.switchView(nextView);
        
        pubSub.publish('ui:navigation:next', { 
            from: this.ui.currentView, 
            to: nextView 
        });
    }

    /**
     * Switch to a specific view
     */
    switchView(view) {
        if (!view || view === this.ui.currentView) return;
        
        const validViews = ['today', 'tomorrow', 'future'];
        if (!validViews.includes(view)) {
            console.warn(`Invalid view: ${view}`);
            return;
        }
        
        const previousView = this.ui.currentView;
        this.ui.currentView = view;
        
        // Update app state
        appState.set('currentView', view);
        
        // Hide all sections
        validViews.forEach(viewName => {
            const section = document.getElementById(`${viewName}-section`);
            if (section) {
                section.classList.remove('active');
            }
        });
        
        // Show current section
        const currentSection = document.getElementById(`${view}-section`);
        if (currentSection) {
            currentSection.classList.add('active');
        }
        
        // Update hero category text
        const heroCategory = document.getElementById('hero-category');
        if (heroCategory) {
            heroCategory.textContent = view.charAt(0).toUpperCase() + view.slice(1);
        }
        
        // Update category indicators
        this.updateCategoryIndicators(view);
        
        pubSub.publish('ui:view:switched', { 
            from: previousView, 
            to: view 
        });
    }

    /**
     * Update category indicator dots
     */
    updateCategoryIndicators(currentView) {
        const indicators = document.querySelectorAll('.category-indicator .dot');
        const views = ['today', 'tomorrow', 'future'];
        
        indicators.forEach((dot, index) => {
            dot.classList.toggle('active', views[index] === currentView);
        });
    }

    /**
     * Update view state in UI
     */
    updateViewState() {
        // Update navigation active state
        document.querySelectorAll('[data-view]').forEach(element => {
            element.classList.toggle('active', element.dataset.view === this.ui.currentView);
        });

        // Update view containers
        document.querySelectorAll('[data-view-container]').forEach(container => {
            const isActive = container.dataset.viewContainer === this.ui.currentView;
            container.classList.toggle('active', isActive);
            container.style.display = isActive ? 'block' : 'none';
        });

        // Update document title
        const titles = {
            today: 'Today - Dooing',
            tomorrow: 'Tomorrow - Dooing',
            future: 'Future - Dooing'
        };
        
        document.title = titles[this.ui.currentView] || 'Dooing';
    }

    /**
     * Update sidebar state
     */
    updateSidebarState() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar) {
            sidebar.classList.toggle('collapsed', !this.ui.sidebarOpen);
        }
        
        if (mainContent) {
            mainContent.classList.toggle('sidebar-collapsed', !this.ui.sidebarOpen);
        }
        
        // Update toggle button
        const toggleBtn = document.querySelector('[data-action="toggle-sidebar"]');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', this.ui.sidebarOpen);
        }
    }

    /**
     * Toggle sidebar visibility
     */
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        
        if (!sidebar || !backdrop) {
            console.warn('Sidebar elements not found');
            return;
        }
        
        const isOpen = sidebar.classList.contains('open');
        
        if (isOpen) {
            // Close sidebar
            sidebar.classList.remove('open');
            backdrop.classList.remove('show');
            document.body.style.overflow = '';
            this.ui.sidebarOpen = false;
        } else {
            // Open sidebar
            sidebar.classList.add('open');
            backdrop.classList.add('show');
            document.body.style.overflow = 'hidden';
            this.ui.sidebarOpen = true;
        }
        
        // Update app state
        appState.set('ui.sidebarOpen', this.ui.sidebarOpen);
        
        // Publish event
        pubSub.publish('ui:sidebar:toggled', { 
            isOpen: this.ui.sidebarOpen 
        });
    }

    /**
     * Render current view
     */
    renderCurrentView() {
        const renderer = this.getRenderer(`${this.ui.currentView}Renderer`);
        
        if (renderer && renderer.render) {
            renderer.render();
        } else {
            // Fallback to task renderer
            const taskRenderer = this.getRenderer('taskRenderer');
            if (taskRenderer && taskRenderer.renderCategory) {
                taskRenderer.renderCategory(this.ui.currentView);
            }
        }
    }

    /**
     * Open modal
     * @param {Object} modalData - Modal configuration
     */
    openModal(modalData) {
        const { type, data = {}, options = {} } = modalData;
        
        const modal = {
            id: `modal_${Date.now()}`,
            type,
            data,
            options,
            openedAt: new Date()
        };

        this.ui.modalStack.push(modal);
        
        // Update app state
        appState.set('ui.isModalOpen', true);
        appState.set('ui.currentModal', type);
        
        // Get modal component
        const modalComponent = this.getComponent('modalManager');
        if (modalComponent && modalComponent.open) {
            modalComponent.open(modal);
        }
        
        pubSub.publish('ui:modal:opened', { modal });
    }

    /**
     * Close current modal
     */
    closeModal() {
        if (this.ui.modalStack.length === 0) return;
        
        const modal = this.ui.modalStack.pop();
        
        // Update app state if no more modals
        if (this.ui.modalStack.length === 0) {
            appState.set('ui.isModalOpen', false);
            appState.set('ui.currentModal', null);
        }
        
        // Get modal component
        const modalComponent = this.getComponent('modalManager');
        if (modalComponent && modalComponent.close) {
            modalComponent.close(modal);
        }
        
        pubSub.publish('ui:modal:closed', { modal });
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        while (this.ui.modalStack.length > 0) {
            this.closeModal();
        }
    }

    /**
     * Show notification
     * @param {Object} notification - Notification data
     */
    showNotification(notification) {
        const notificationData = {
            id: `notification_${Date.now()}`,
            type: notification.type || 'info',
            title: notification.title || '',
            message: notification.message || '',
            duration: notification.duration || 5000,
            persistent: notification.persistent || false,
            actions: notification.actions || [],
            createdAt: new Date(),
            ...notification
        };

        this.ui.notifications.push(notificationData);
        
        // Get notification component
        const notificationComponent = this.getComponent('notificationService');
        if (notificationComponent && notificationComponent.show) {
            notificationComponent.show(notificationData);
        }
        
        // Auto-remove if not persistent
        if (!notificationData.persistent && notificationData.duration > 0) {
            setTimeout(() => {
                this.removeNotification(notificationData.id);
            }, notificationData.duration);
        }
        
        pubSub.publish('ui:notification:shown', { notification: notificationData });
    }

    /**
     * Remove notification
     * @param {string} id - Notification ID
     */
    removeNotification(id) {
        const index = this.ui.notifications.findIndex(n => n.id === id);
        if (index === -1) return;
        
        const notification = this.ui.notifications[index];
        this.ui.notifications.splice(index, 1);
        
        // Get notification component
        const notificationComponent = this.getComponent('notificationService');
        if (notificationComponent && notificationComponent.remove) {
            notificationComponent.remove(id);
        }
        
        pubSub.publish('ui:notification:removed', { notification });
    }

    /**
     * Show loading state
     * @param {string} id - Loading ID
     */
    showLoading(id) {
        this.ui.loadingStates.add(id);
        
        // Update UI
        this.updateLoadingState();
        
        pubSub.publish('ui:loading:shown', { id });
    }

    /**
     * Hide loading state
     * @param {string} id - Loading ID
     */
    hideLoading(id) {
        this.ui.loadingStates.delete(id);
        
        // Update UI
        this.updateLoadingState();
        
        pubSub.publish('ui:loading:hidden', { id });
    }

    /**
     * Update global loading state
     */
    updateLoadingState() {
        const isLoading = this.ui.loadingStates.size > 0;
        
        document.body.classList.toggle('loading', isLoading);
        
        // Update loading indicator
        const loadingIndicator = document.querySelector('.loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    }

    /**
     * Handle error
     * @param {Object} error - Error object
     */
    handleError(error) {
        console.error('Application error:', error);
        
        this.showNotification({
            type: 'error',
            title: 'Error',
            message: error.message || 'An unexpected error occurred',
            duration: 10000,
            actions: [
                {
                    label: 'Dismiss',
                    action: () => {}
                }
            ]
        });
    }

    /**
     * Handle keyboard shortcuts
     * @param {string} shortcut - Shortcut string
     * @param {Event} event - Keyboard event
     */
    handleKeyboardShortcut(shortcut, event) {
        const shortcuts = {
            'escape': () => {
                if (this.ui.modalStack.length > 0) {
                    this.closeModal();
                }
            },
            'mod+1': () => this.switchView('today'),
            'mod+2': () => this.switchView('tomorrow'),
            'mod+3': () => this.switchView('future'),
            'mod+b': () => {
                this.ui.sidebarOpen = !this.ui.sidebarOpen;
                appState.set('ui.sidebarCollapsed', !this.ui.sidebarOpen);
                this.updateSidebarState();
            }
        };

        if (shortcuts[shortcut]) {
            event.preventDefault();
            shortcuts[shortcut]();
        }
    }

    /**
     * Setup resize observer
     */
    setupResizeObserver() {
        if (typeof ResizeObserver === 'undefined') return;

        this.resizeObserver = new ResizeObserver(debounce((entries) => {
            entries.forEach(entry => {
                const { target } = entry;
                pubSub.publish('ui:element:resized', {
                    element: target,
                    size: entry.contentRect
                });
            });
        }, 100));

        // Observe main containers
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            this.resizeObserver.observe(mainContainer);
        }
    }

    /**
     * Setup intersection observers
     */
    setupIntersectionObservers() {
        if (typeof IntersectionObserver === 'undefined') return;

        // Lazy loading observer
        this.lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    pubSub.publish('ui:element:visible', {
                        element: entry.target
                    });
                }
            });
        }, {
            rootMargin: '50px'
        });
    }

    /**
     * Event handlers
     */
    handleViewChange(newView) {
        this.switchView(newView);
    }

    handleTasksChanged(tasks) {
        // Re-render current view
        this.renderCurrentView();
        
        // Update task counts in navigation
        const taskRenderer = this.getRenderer('taskRenderer');
        if (taskRenderer && taskRenderer.updateTaskCounts) {
            taskRenderer.updateTaskCounts();
        }
    }

    handleTaskCreated(task) {
        this.showNotification({
            type: 'success',
            title: 'Task Created',
            message: `"${task.title}" has been added`,
            duration: 3000
        });
    }

    handleTaskUpdated(task) {
        // Re-render affected views
        this.renderCurrentView();
    }

    handleTaskDeleted(taskId) {
        this.showNotification({
            type: 'info',
            title: 'Task Deleted',
            message: 'Task has been removed',
            duration: 3000
        });
    }

    handlePomodoroStarted(data) {
        this.showNotification({
            type: 'info',
            title: 'Pomodoro Started',
            message: `${data.cycle} session has begun`,
            duration: 3000
        });
    }

    handlePomodoroTick(data) {
        // Update pomodoro renderer
        const pomodoroRenderer = this.getRenderer('pomodoroRenderer');
        if (pomodoroRenderer && pomodoroRenderer.updateTimer) {
            pomodoroRenderer.updateTimer(data);
        }
    }

    handlePomodoroCompleted(data) {
        this.showNotification({
            type: 'success',
            title: 'Session Complete',
            message: `${data.completedCycle} session finished!`,
            duration: 5000
        });
    }

    handleResize() {
        // Trigger re-layout for components that need it
        this.renderCurrentView();
    }

    handleVisibilityChange(hidden) {
        if (hidden) {
            // Page is hidden, pause any animations
            document.body.classList.add('page-hidden');
        } else {
            // Page is visible, resume animations
            document.body.classList.remove('page-hidden');
        }
    }

    /**
     * Get UI statistics
     * @returns {Object} UI statistics
     */
    getStatistics() {
        return {
            currentView: this.ui.currentView,
            sidebarOpen: this.ui.sidebarOpen,
            modalsOpen: this.ui.modalStack.length,
            activeNotifications: this.ui.notifications.length,
            loadingStates: this.ui.loadingStates.size,
            registeredRenderers: this.renderers.size,
            registeredComponents: this.components.size
        };
    }

    /**
     * Show settings modal
     */
    showSettings() {
        pubSub.publish('modal:open', {
            type: 'settings',
            title: 'Settings',
            content: this.createSettingsContent(),
            actions: [
                { 
                    text: 'Save', 
                    action: 'save-settings',
                    primary: true 
                },
                { 
                    text: 'Cancel', 
                    action: 'close-modal' 
                }
            ]
        });
    }

    /**
     * Show help modal
     */
    showHelp() {
        pubSub.publish('modal:open', {
            type: 'help',
            title: 'Help & Shortcuts',
            content: this.createHelpContent(),
            actions: [
                { 
                    text: 'Close', 
                    action: 'close-modal',
                    primary: true 
                }
            ]
        });
    }

    /**
     * Create settings modal content
     */
    createSettingsContent() {
        return `
            <div class="settings-content">
                <div class="setting-group">
                    <h3>Appearance</h3>
                    <label class="setting-item">
                        <span>Theme</span>
                        <select id="theme-select">
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="auto">Auto</option>
                        </select>
                    </label>
                </div>
                <div class="setting-group">
                    <h3>Pomodoro</h3>
                    <label class="setting-item">
                        <span>Work Duration (minutes)</span>
                        <input type="number" id="work-duration" min="1" max="60" value="25">
                    </label>
                    <label class="setting-item">
                        <span>Short Break (minutes)</span>
                        <input type="number" id="short-break" min="1" max="30" value="5">
                    </label>
                    <label class="setting-item">
                        <span>Long Break (minutes)</span>
                        <input type="number" id="long-break" min="1" max="60" value="15">
                    </label>
                </div>
                <div class="setting-group">
                    <h3>Notifications</h3>
                    <label class="setting-item">
                        <span>Desktop Notifications</span>
                        <input type="checkbox" id="desktop-notifications" checked>
                    </label>
                    <label class="setting-item">
                        <span>Sound Notifications</span>
                        <input type="checkbox" id="sound-notifications" checked>
                    </label>
                </div>
            </div>
        `;
    }

    /**
     * Create help modal content
     */
    createHelpContent() {
        return `
            <div class="help-content">
                <div class="help-section">
                    <h3>Keyboard Shortcuts</h3>
                    <div class="shortcut-list">
                        <div class="shortcut-item">
                            <kbd>Ctrl</kbd> + <kbd>N</kbd> <span>New Task</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Escape</kbd> <span>Close Modal</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>Space</kbd> <span>Start/Stop Pomodoro</span>
                        </div>
                        <div class="shortcut-item">
                            <kbd>←</kbd> / <kbd>→</kbd> <span>Navigate Days</span>
                        </div>
                    </div>
                </div>
                <div class="help-section">
                    <h3>Getting Started</h3>
                    <ol>
                        <li>Add your first task using the "+" button</li>
                        <li>Start a Pomodoro session to focus on your task</li>
                        <li>Take breaks when the timer completes</li>
                        <li>Mark tasks as complete when finished</li>
                    </ol>
                </div>
                <div class="help-section">
                    <h3>Tips</h3>
                    <ul>
                        <li>Use the calendar to plan future tasks</li>
                        <li>Toggle the sidebar for more navigation options</li>
                        <li>Change themes in Settings to match your preference</li>
                        <li>Tasks can be edited by clicking on them</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Cleanup UI manager
     */
    cleanup() {
        // Close all modals
        this.closeAllModals();
        
        // Remove all notifications
        this.ui.notifications.forEach(n => this.removeNotification(n.id));
        
        // Disconnect observers
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        if (this.lazyObserver) {
            this.lazyObserver.disconnect();
        }
        
        this.initialized = false;
        pubSub.publish('uiManager:cleanup');
    }
}

// Export singleton instance
export const uiManager = new UIManager();
export default uiManager;
