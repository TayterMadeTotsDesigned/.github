// app.js - Refactored main application orchestrator
import TaskManager from './taskManager.js';
import { UIRenderer } from './UI_Renderer.js';
import PomodoroTimer from './pomodoro.js';

// Import modular components
import CalendarManager from './modules/CalendarManager.js';
import ModalManager from './modules/ModalManager.js';
import TaskRenderer from './modules/TaskRenderer.js';
import EventHandler from './modules/EventHandler.js';
import ThemeManager from './modules/ThemeManager.js';

/**
 * Main Application Class
 * Orchestrates all modules and handles initialization
 */
class DooingTaskApp {
    constructor() {
        this.isInitialized = false;
        this.modules = {};
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Starting Dooing.Task initialization...');
            
            // Initialize core modules
            await this.initializeModules();
            
            // Initialize TaskManager
            await TaskManager.init();
            
            // Initialize Pomodoro Timer
            this.pomodoroTimer = new PomodoroTimer();
            this.pomodoroTimer.initializeSettingsUI();
            window.pomodoroTimer = this.pomodoroTimer; // Global access for callbacks
            
            // Set up module integrations
            this.setupModuleIntegrations();
            
            // Set up debug functionality (development only)
            this.setupDebugHandlers();
            
            // Render initial UI
            this.renderInitialUI();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ Dooing.Task initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Dooing.Task:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Initialize all modular components
     */
    async initializeModules() {
        // Initialize modules in dependency order
        this.modules.themeManager = new ThemeManager();
        this.modules.calendarManager = new CalendarManager();
        this.modules.taskRenderer = new TaskRenderer();
        this.modules.modalManager = new ModalManager();
        
        // EventHandler depends on other modules
        this.modules.eventHandler = new EventHandler(
            this.modules.modalManager,
            this.modules.calendarManager,
            this.modules.taskRenderer
        );

        // Initialize modules
        this.modules.themeManager.init();
        this.modules.modalManager.init();
        this.modules.eventHandler.init();
        
        console.log('📦 Modules initialized');
    }

    /**
     * Set up integrations between modules
     */
    setupModuleIntegrations() {
        // Theme change listener
        document.addEventListener('themeChanged', (e) => {
            console.log(`🎨 Theme changed to: ${e.detail.theme}`);
        });

        // Task update listeners
        this.setupTaskUpdateListeners();
        
        // Sidebar functionality
        this.setupSidebarHandlers();
    }

    /**
     * Set up task update event listeners
     */
    setupTaskUpdateListeners() {
        // Listen for task changes and update UI accordingly
        document.addEventListener('tasksUpdated', () => {
            this.modules.eventHandler.refreshUI();
        });
    }

    /**
     * Set up sidebar functionality
     */
    setupSidebarHandlers() {
        // Sidebar toggle
        const hamburgerBtn = document.querySelector('.sidebar');
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        const closeBtn = document.querySelector('.sidebar-close');
        
        hamburgerBtn?.addEventListener('click', () => {
            sidebar?.classList.add('active');
            backdrop?.classList.add('active');
        });

        // Close sidebar on close button click
        closeBtn?.addEventListener('click', () => {
            sidebar?.classList.remove('active');
            backdrop?.classList.remove('active');
        });

        // Close sidebar on backdrop click
        backdrop?.addEventListener('click', () => {
            sidebar?.classList.remove('active');
            backdrop?.classList.remove('active');
        });

        // Sidebar navigation
        const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                
                // Use the new showSection method that handles both task categories and other sections
                this.modules.eventHandler.showSection(target);
                
                // Close sidebar
                sidebar?.classList.remove('active');
                backdrop?.classList.remove('active');
            });
        });

        // Sidebar action buttons
        const settingsBtn = document.getElementById('settings-btn');
        const helpBtn = document.getElementById('help-btn');
        
        settingsBtn?.addEventListener('click', () => {
            this.modules.eventHandler.showSection('settings');
            sidebar?.classList.remove('active');
            backdrop?.classList.remove('active');
        });
        
        helpBtn?.addEventListener('click', () => {
            this.modules.eventHandler.showSection('help');
            sidebar?.classList.remove('active');
            backdrop?.classList.remove('active');
        });
    }

    /**
     * Render initial UI state
     */
    renderInitialUI() {
        // Render task lists
        UIRenderer.renderTaskLists();
        
        // Initialize UI state through EventHandler
        this.modules.eventHandler.renderInitialUI();
        
        // Render calendar if in future view
        this.modules.eventHandler.renderCurrentCalendarView();
        
        console.log('🎨 Initial UI rendered');
    }

    /**
     * Handle initialization errors gracefully
     */
    handleInitializationError(error) {
        // Show user-friendly error message
        const errorContainer = document.createElement('div');
        errorContainer.className = 'init-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h2>⚠️ Initialization Error</h2>
                <p>Dooing.Task failed to start properly. Please refresh the page.</p>
                <button onclick="window.location.reload()">Refresh Page</button>
                <details>
                    <summary>Technical Details</summary>
                    <pre>${error.message}</pre>
                </details>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
    }

    /**
     * Show settings modal/page
     */
    showSettings() {
        // Implementation for settings view
        console.log('Settings requested');
        // Could open a settings modal or navigate to settings page
    }

    /**
     * Show help modal/page
     */
    showHelp() {
        // Implementation for help view
        console.log('Help requested');
        // Could open a help modal or navigate to help page
    }

    /**
     * Add debug functionality
     */
    setupDebugHandlers() {
        // Add global debugging access
        window.debugApp = {
            app: this,
            taskManager: TaskManager,
            modules: this.modules,
            getStatus: () => this.getAppStatus(),
            testAddTask: () => {
                const testTask = {
                    id: Date.now().toString(),
                    name: 'Test Task',
                    description: 'This is a test task',
                    dueDate: new Date().toISOString(),
                    completed: false,
                    recurrence: { enabled: false }
                };
                TaskManager.addTask(testTask);
                this.modules.eventHandler.refreshUI();
                console.log('Test task added:', testTask);
            }
        };
        
        // Log initialization status
        console.log('🔧 Debug handlers set up. Access via window.debugApp');
    }

    /**
     * Debug function to check current application state
     */
    getAppStatus() {
        return {
            isInitialized: this.isInitialized,
            currentCategory: this.modules.eventHandler?.currentCategory,
            sidebarVisible: document.querySelector('.sidebar-menu')?.classList.contains('active'),
            taskContainerVisible: window.getComputedStyle(document.querySelector('.task-categories-container'))?.display !== 'none',
            sectionsContainerVisible: window.getComputedStyle(document.querySelector('.sections-container'))?.display !== 'none'
        };
    }

    /**
     * Get module instance
     */
    getModule(moduleName) {
        return this.modules[moduleName];
    }

    /**
     * Check if app is initialized
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * Cleanup and destroy app instance
     */
    destroy() {
        // Clean up event listeners and resources
        Object.values(this.modules).forEach(module => {
            if (module.destroy && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        this.isInitialized = false;
        console.log('🧹 App cleaned up');
    }
}

// Create and initialize app instance
const app = new DooingTaskApp();

// Make app globally accessible
window.App = app;

// Add convenient methods to global App object
window.App.openTaskModal = (category) => {
    app.getModule('modalManager')?.open({ category });
};

window.App.updateCalendarViews = () => {
    app.getModule('eventHandler')?.renderCurrentCalendarView();
};

window.App.openEditTaskModal = (task) => {
    app.getModule('modalManager')?.open({ mode: 'edit', task });
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    app.destroy();
});

export default app;
