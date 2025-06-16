// app.js - Main Application Entry Point
console.log('📝 Starting app-new.js loading...');

// Add visual indicator
document.addEventListener('DOMContentLoaded', () => {
    const indicator = document.createElement('div');
    indicator.id = 'init-indicator';
    indicator.style.cssText = `
        position: fixed; top: 10px; right: 10px; 
        background: #4CAF50; color: white; 
        padding: 10px; border-radius: 5px; 
        font-family: monospace; z-index: 9999;
        font-size: 12px;
    `;
    indicator.textContent = '🚀 App Loading...';
    document.body.appendChild(indicator);
});

import { pubSub } from './events/PubSub.js';
import { appState } from './core/AppState.js';
import { taskManager } from './core/TaskManager.js';
import { pomodoroManager } from './core/PomodoroManager.js';
import { storageService } from './core/StorageService.js';
import { domEventManager } from './events/DomEventManager.js';
import { uiManager } from './ui/UIManager.js';

console.log('📦 All imports loaded successfully');

/**
 * Application Class
 * Main application orchestrator using the new modular architecture
 */
class App {
    constructor() {
        console.log('🏗️ Creating App instance...');
        this.initialized = false;
        this.version = '3.0.0';
        this.modules = new Map();
        
        // Error handling
        this.setupErrorHandling();
        console.log('✅ App instance created');
    }

    /**
     * Initialize the application
     */
    async init() {
        const updateIndicator = (text, color = '#4CAF50') => {
            const indicator = document.getElementById('init-indicator');
            if (indicator) {
                indicator.textContent = text;
                indicator.style.backgroundColor = color;
            }
        };

        try {
            console.log(`🚀 Initializing Dooing.Task v${this.version}...`);
            updateIndicator('🚀 Initializing...');
            
            // Phase 1: Core Infrastructure
            console.log('Phase 1: Core Infrastructure...');
            updateIndicator('📦 Phase 1: Core...');
            await this.initializeCore();
            console.log('✅ Phase 1 complete');
            
            // Phase 2: Event System
            console.log('Phase 2: Event System...');
            updateIndicator('🔗 Phase 2: Events...');
            await this.initializeEvents();
            console.log('✅ Phase 2 complete');
            
            // Phase 3: Business Logic
            console.log('Phase 3: Business Logic...');
            updateIndicator('🧠 Phase 3: Logic...');
            await this.initializeDomainLayer();
            console.log('✅ Phase 3 complete');
            
            // Phase 4: UI Layer
            console.log('Phase 4: UI Layer...');
            updateIndicator('🎨 Phase 4: UI...');
            await this.initializeUILayer();
            console.log('✅ Phase 4 complete');
            
            // Phase 5: Integration
            console.log('Phase 5: Integration...');
            updateIndicator('🏁 Phase 5: Final...');
            await this.finalizeInitialization();
            console.log('✅ Phase 5 complete');
            
            this.initialized = true;
            console.log('✅ Application initialized successfully');
            updateIndicator('✅ App Ready!', '#4CAF50');
            
            // Hide indicator after 3 seconds
            setTimeout(() => {
                const indicator = document.getElementById('init-indicator');
                if (indicator) indicator.remove();
            }, 3000);
            
            // Publish initialization complete event
            pubSub.publish('app:initialized', {
                version: this.version,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            const indicator = document.getElementById('init-indicator');
            if (indicator) {
                indicator.textContent = `❌ Error: ${error.message}`;
                indicator.style.backgroundColor = '#f44336';
            }
            await this.handleInitializationError(error);
        }
    }

    /**
     * Phase 1: Initialize core infrastructure
     */
    async initializeCore() {
        console.log('📦 Phase 1: Initializing core infrastructure...');
        
        try {
            // Initialize AppState singleton
            console.log('✓ AppState initialized');
            this.modules.set('appState', appState);
            
            // Initialize StorageService
            console.log('✓ StorageService initialized');
            this.modules.set('storageService', storageService);
            
            // Initialize PubSub event bus
            console.log('✓ PubSub event bus initialized');
            this.modules.set('pubSub', pubSub);
            
            // Load saved state
            await this.loadApplicationState();
            
        } catch (error) {
            console.error('Core initialization failed:', error);
            throw new Error(`Core initialization failed: ${error.message}`);
        }
    }

    /**
     * Phase 2: Initialize event system
     */
    async initializeEvents() {
        console.log('🔗 Phase 2: Initializing event system...');
        
        try {
            // Initialize DOM Event Manager
            domEventManager.init();
            console.log('✓ DomEventManager initialized');
            this.modules.set('domEventManager', domEventManager);
            
            // Setup application-level event handlers
            this.setupApplicationEvents();
            
        } catch (error) {
            console.error('Event system initialization failed:', error);
            throw new Error(`Event system initialization failed: ${error.message}`);
        }
    }

    /**
     * Phase 3: Initialize domain layer
     */
    async initializeDomainLayer() {
        console.log('⚙️ Phase 3: Initializing domain layer...');
        
        try {
            // Initialize TaskManager
            await taskManager.init();
            console.log('✓ TaskManager initialized');
            this.modules.set('taskManager', taskManager);
            
            // Initialize PomodoroManager
            await pomodoroManager.init();
            console.log('✓ PomodoroManager initialized');
            this.modules.set('pomodoroManager', pomodoroManager);
            
        } catch (error) {
            console.error('Domain layer initialization failed:', error);
            throw new Error(`Domain layer initialization failed: ${error.message}`);
        }
    }

    /**
     * Phase 4: Initialize UI layer
     */
    async initializeUILayer() {
        console.log('🎨 Phase 4: Initializing UI layer...');
        
        try {
            // Initialize UIManager
            await uiManager.init();
            console.log('✓ UIManager initialized');
            this.modules.set('uiManager', uiManager);
            
            // Setup DOM event handlers
            domEventManager.setupAllEvents();
            console.log('✓ DOM events configured');
            
            // Initialize UI components (will be loaded dynamically)
            await this.initializeUIComponents();
            
        } catch (error) {
            console.error('UI layer initialization failed:', error);
            throw new Error(`UI layer initialization failed: ${error.message}`);
        }
    }

    /**
     * Phase 5: Finalize initialization
     */
    async finalizeInitialization() {
        console.log('🏁 Phase 5: Finalizing initialization...');
        
        try {
            // Setup auto-save
            this.setupAutoSave();
            
            // Setup periodic tasks
            this.setupPeriodicTasks();
            
            // Initial render
            await this.performInitialRender();
            
            // Setup error recovery
            this.setupErrorRecovery();
            
            console.log('✓ Initialization finalized');
            
        } catch (error) {
            console.error('Finalization failed:', error);
            throw new Error(`Finalization failed: ${error.message}`);
        }
    }

    /**
     * Setup error handling
     */
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                reason: event.reason
            });
        });

        // PubSub error handler
        pubSub.subscribe('app:error', (error) => {
            this.handleError(error);
        });
    }

    /**
     * Setup application-level events
     */
    setupApplicationEvents() {
        // State persistence
        pubSub.subscribe('state:changed', () => {
            this.saveApplicationState();
        });

        // Error handling
        pubSub.subscribe('*:error', (error) => {
            this.handleError(error);
        });

        // Performance monitoring
        pubSub.subscribe('performance:measure', (data) => {
            this.trackPerformance(data);
        });

        // Auto-save triggers
        pubSub.subscribe('tasks:changed', () => {
            this.scheduleAutoSave();
        });

        // Keyboard shortcuts
        pubSub.subscribe('keyboard:shortcut', ({ shortcut, event }) => {
            this.handleGlobalShortcut(shortcut, event);
        });
    }

    /**
     * Initialize UI components dynamically
     */
    async initializeUIComponents() {
        try {
            // Load and initialize renderers
            const renderers = [
                'TaskRenderer',
                'CalendarRenderer', 
                'PomodoroRenderer'
            ];

            for (const rendererName of renderers) {
                try {
                    const module = await import(`./ui/renderers/${rendererName}.js`);
                    const renderer = new module.default();
                    uiManager.registerRenderer(rendererName.toLowerCase(), renderer);
                    console.log(`✓ ${rendererName} loaded`);
                } catch (error) {
                    console.warn(`⚠️ Failed to load ${rendererName}:`, error.message);
                }
            }

            // Load and initialize components
            const components = [
                'ModalManager',
                'ThemeManager',
                'NotificationService'
            ];

            for (const componentName of components) {
                try {
                    const module = await import(`./ui/components/${componentName}.js`);
                    const component = new module.default();
                    uiManager.registerComponent(componentName.toLowerCase(), component);
                    console.log(`✓ ${componentName} loaded`);
                } catch (error) {
                    console.warn(`⚠️ Failed to load ${componentName}:`, error.message);
                }
            }

        } catch (error) {
            console.error('UI components initialization failed:', error);
            // Continue with basic functionality
        }
    }

    /**
     * Load application state
     */
    async loadApplicationState() {
        try {
            const savedState = storageService.getState();
            if (savedState) {
                appState.deserialize(JSON.stringify(savedState));
                console.log('✓ Application state loaded');
            }
        } catch (error) {
            console.warn('Failed to load application state:', error);
        }
    }

    /**
     * Save application state
     */
    saveApplicationState() {
        try {
            const state = appState.getState();
            storageService.saveState(state);
        } catch (error) {
            console.error('Failed to save application state:', error);
        }
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        this.autoSaveTimer = null;
        
        pubSub.subscribe('app:save', () => {
            this.saveApplicationState();
            pubSub.publish('app:saved', { timestamp: new Date() });
        });
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        this.autoSaveTimer = setTimeout(() => {
            this.saveApplicationState();
        }, 5000); // Auto-save after 5 seconds of inactivity
    }

    /**
     * Setup periodic tasks
     */
    setupPeriodicTasks() {
        // Check for recurring tasks every minute
        setInterval(() => {
            taskManager.processRecurringTasks();
        }, 60000);

        // Check for midnight updates every 10 minutes
        setInterval(() => {
            taskManager.processMidnightUpdates();
        }, 600000);

        // Performance cleanup every 5 minutes
        setInterval(() => {
            this.performCleanup();
        }, 300000);
    }

    /**
     * Perform initial render
     */
    async performInitialRender() {
        // Trigger initial view render
        const currentView = appState.get('currentView') || 'today';
        pubSub.publish('view:switch', { view: currentView });
        
        // Update UI with current state
        pubSub.publish('app:render:initial');
    }

    /**
     * Setup error recovery
     */
    setupErrorRecovery() {
        pubSub.subscribe('app:recover', () => {
            this.recoverFromError();
        });
    }

    /**
     * Handle global keyboard shortcuts
     */
    handleGlobalShortcut(shortcut, event) {
        const shortcuts = {
            'mod+shift+r': () => {
                event.preventDefault();
                this.restart();
            },
            'mod+shift+i': () => {
                event.preventDefault();
                console.log('App Info:', this.getInfo());
            }
        };

        if (shortcuts[shortcut]) {
            shortcuts[shortcut]();
        }
    }

    /**
     * Handle errors
     */
    handleError(error) {
        console.error('Application Error:', error);
        
        // Publish error event for UI handling
        pubSub.publish('ui:error', {
            type: 'error',
            title: 'Application Error',
            message: error.message || 'An unexpected error occurred',
            error
        });

        // Track error for debugging
        this.trackError(error);
    }

    /**
     * Handle initialization errors
     */
    async handleInitializationError(error) {
        // Show fallback UI
        document.body.innerHTML = `
            <div class="error-container">
                <div class="error-content">
                    <h1>🚨 Application Failed to Load</h1>
                    <p>We're sorry, but there was an error loading the application.</p>
                    <details>
                        <summary>Technical Details</summary>
                        <pre>${error.message}</pre>
                        <pre>${error.stack}</pre>
                    </details>
                    <div class="error-actions">
                        <button onclick="location.reload()">Reload Page</button>
                        <button onclick="localStorage.clear(); location.reload()">Reset & Reload</button>
                    </div>
                </div>
            </div>
        `;

        // Basic error styling
        const style = document.createElement('style');
        style.textContent = `
            .error-container {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 20px;
                background: #f5f5f5;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .error-content {
                max-width: 600px;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                text-align: center;
            }
            .error-actions {
                margin-top: 20px;
            }
            .error-actions button {
                margin: 0 10px;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                background: #007bff;
                color: white;
                cursor: pointer;
            }
            .error-actions button:hover {
                background: #0056b3;
            }
            details {
                text-align: left;
                margin: 20px 0;
            }
            pre {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 4px;
                overflow-x: auto;
                font-size: 12px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Performance cleanup
     */
    performCleanup() {
        // Clean up old notifications
        const notifications = uiManager.ui?.notifications || [];
        const oldNotifications = notifications.filter(n => 
            Date.now() - new Date(n.createdAt).getTime() > 300000 // 5 minutes
        );
        
        oldNotifications.forEach(n => uiManager.removeNotification(n.id));

        // Trigger garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * Track performance metrics
     */
    trackPerformance(data) {
        // Log performance data
        console.log('Performance:', data);
    }

    /**
     * Track errors for debugging
     */
    trackError(error) {
        // Store error in local storage for debugging
        try {
            const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            errors.push({
                ...error,
                timestamp: new Date().toISOString(),
                version: this.version
            });
            
            // Keep only last 10 errors
            if (errors.length > 10) {
                errors.splice(0, errors.length - 10);
            }
            
            localStorage.setItem('app_errors', JSON.stringify(errors));
        } catch (e) {
            console.warn('Failed to track error:', e);
        }
    }

    /**
     * Recover from error
     */
    recoverFromError() {
        try {
            // Reset to safe state
            appState.reset();
            
            // Re-render UI
            pubSub.publish('app:render:initial');
            
            console.log('✓ Application recovered');
        } catch (error) {
            console.error('Recovery failed:', error);
            location.reload();
        }
    }

    /**
     * Restart application
     */
    async restart() {
        try {
            // Cleanup
            this.cleanup();
            
            // Reinitialize
            this.initialized = false;
            await this.init();
            
        } catch (error) {
            console.error('Restart failed:', error);
            location.reload();
        }
    }

    /**
     * Cleanup application
     */
    cleanup() {
        // Clear timers
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        // Cleanup modules
        domEventManager.cleanup();
        uiManager.cleanup();
        
        // Clear PubSub
        pubSub.clearAll();
    }

    /**
     * Get module by name
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * Check if application is initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Get application info
     */
    getInfo() {
        return {
            version: this.version,
            initialized: this.initialized,
            modules: Array.from(this.modules.keys()),
            state: appState.getState(),
            statistics: {
                tasks: taskManager.getStatistics(),
                pomodoro: pomodoroManager.getStatistics(),
                ui: uiManager.getStatistics(),
                events: domEventManager.getStatistics()
            },
            timestamp: new Date().toISOString()
        };
    }
}

// Create application instance
const app = new App();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
    });
} else {
    app.init();
}

// Export for debugging and testing
window.DooingApp = app;
window.AppState = appState;
window.PubSub = pubSub;

export default app;
