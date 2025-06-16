import { pubSub } from './PubSub.js';
import { debounce, throttle } from '../utils/helpers.js';

/**
 * DomEventManager
 * Centralized DOM event handling with delegation and performance optimization
 */
class DomEventManager {
    constructor() {
        this.listeners = new Map();
        this.delegatedListeners = new Map();
        this.initialized = false;
        
        // Event categories for organization
        this.eventCategories = {
            TASK: 'task',
            POMODORO: 'pomodoro',
            UI: 'ui',
            CALENDAR: 'calendar',
            MODAL: 'modal',
            THEME: 'theme'
        };
    }

    /**
     * Initialize DOM event manager
     */
    init() {
        if (this.initialized) return;

        this.setupGlobalEventDelegation();
        this.setupGlobalEventListeners();
        this.initialized = true;
        
        pubSub.publish('domEventManager:initialized');
    }

    /**
     * Setup global event delegation
     */
    setupGlobalEventDelegation() {
        // Click event delegation
        document.addEventListener('click', (event) => {
            this.handleDelegatedEvent('click', event);
        });

        // Input event delegation (debounced)
        document.addEventListener('input', debounce((event) => {
            this.handleDelegatedEvent('input', event);
        }, 300));

        // Change event delegation
        document.addEventListener('change', (event) => {
            this.handleDelegatedEvent('change', event);
        });

        // Submit event delegation
        document.addEventListener('submit', (event) => {
            this.handleDelegatedEvent('submit', event);
        });

        // Keydown event delegation
        document.addEventListener('keydown', (event) => {
            this.handleDelegatedEvent('keydown', event);
        });

        // Focus/Blur event delegation
        document.addEventListener('focus', (event) => {
            this.handleDelegatedEvent('focus', event);
        }, true);

        document.addEventListener('blur', (event) => {
            this.handleDelegatedEvent('blur', event);
        }, true);
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Window resize (throttled)
        window.addEventListener('resize', throttle(() => {
            pubSub.publish('window:resize', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }, 250));

        // Keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardShortcuts(event);
        });

        // Page visibility changes
        document.addEventListener('visibilitychange', () => {
            pubSub.publish('page:visibility:change', {
                hidden: document.hidden,
                visibilityState: document.visibilityState
            });
        });

        // Before unload (for unsaved changes warning)
        window.addEventListener('beforeunload', (event) => {
            pubSub.publish('page:before:unload', { event });
        });

        // Mouse events for drag and drop
        document.addEventListener('dragstart', (event) => {
            this.handleDelegatedEvent('dragstart', event);
        });

        document.addEventListener('dragover', (event) => {
            event.preventDefault(); // Allow drop
            this.handleDelegatedEvent('dragover', event);
        });

        document.addEventListener('drop', (event) => {
            event.preventDefault();
            this.handleDelegatedEvent('drop', event);
        });
    }

    /**
     * Handle delegated events
     * @param {string} eventType - Event type
     * @param {Event} event - DOM event
     */
    handleDelegatedEvent(eventType, event) {
        const target = event.target;
        const delegatedKey = `${eventType}:delegated`;
        
        if (!this.delegatedListeners.has(delegatedKey)) return;

        const handlers = this.delegatedListeners.get(delegatedKey);
        
        handlers.forEach(({ selector, handler, options = {} }) => {
            // Check if target matches selector
            const matchedElement = this.findMatchingElement(target, selector);
            
            if (matchedElement) {
                try {
                    // Add matched element to event
                    event.matchedElement = matchedElement;
                    
                    // Check if should prevent default
                    if (options.preventDefault) {
                        event.preventDefault();
                    }
                    
                    // Check if should stop propagation
                    if (options.stopPropagation) {
                        event.stopPropagation();
                    }
                    
                    handler(event);
                } catch (error) {
                    console.error(`Error in delegated ${eventType} handler:`, error);
                    pubSub.publish('domEventManager:error', { error, eventType, selector });
                }
            }
        });
    }

    /**
     * Find element that matches selector (bubbling up)
     * @param {Element} element - Starting element
     * @param {string} selector - CSS selector
     * @returns {Element|null} Matching element
     */
    findMatchingElement(element, selector) {
        let current = element;
        
        while (current && current !== document) {
            if (current.matches && current.matches(selector)) {
                return current;
            }
            current = current.parentElement;
        }
        
        return null;
    }

    /**
     * Register delegated event listener
     * @param {string} eventType - Event type (click, input, etc.)
     * @param {string} selector - CSS selector
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {Function} Unregister function
     */
    on(eventType, selector, handler, options = {}) {
        const key = `${eventType}:delegated`;
        
        if (!this.delegatedListeners.has(key)) {
            this.delegatedListeners.set(key, []);
        }
        
        const handlerInfo = { selector, handler, options };
        this.delegatedListeners.get(key).push(handlerInfo);
        
        // Return unregister function
        return () => {
            const handlers = this.delegatedListeners.get(key);
            const index = handlers.indexOf(handlerInfo);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        };
    }

    /**
     * Register direct event listener
     * @param {Element} element - Target element
     * @param {string} eventType - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {Function} Unregister function
     */
    addListener(element, eventType, handler, options = {}) {
        const key = this.generateListenerKey(element, eventType);
        
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        
        const wrappedHandler = (event) => {
            try {
                handler(event);
            } catch (error) {
                console.error(`Error in ${eventType} handler:`, error);
                pubSub.publish('domEventManager:error', { error, eventType, element });
            }
        };
        
        element.addEventListener(eventType, wrappedHandler, options);
        
        const handlerInfo = { handler: wrappedHandler, originalHandler: handler, options };
        this.listeners.get(key).push(handlerInfo);
        
        // Return unregister function
        return () => {
            element.removeEventListener(eventType, wrappedHandler, options);
            const handlers = this.listeners.get(key);
            const index = handlers.findIndex(h => h.originalHandler === handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        };
    }

    /**
     * Remove all listeners for an element
     * @param {Element} element - Target element
     */
    removeAllListeners(element) {
        for (const [key, handlers] of this.listeners.entries()) {
            if (key.startsWith(this.getElementId(element))) {
                handlers.forEach(({ handler, options }) => {
                    const eventType = key.split(':')[1];
                    element.removeEventListener(eventType, handler, options);
                });
                this.listeners.delete(key);
            }
        }
    }

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyboardShortcuts(event) {
        const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
        const modifierKey = ctrlKey || metaKey; // Support both Ctrl and Cmd
        
        // Create shortcut string
        const shortcuts = [];
        if (modifierKey) shortcuts.push('mod');
        if (shiftKey) shortcuts.push('shift');
        if (altKey) shortcuts.push('alt');
        shortcuts.push(key.toLowerCase());
        
        const shortcut = shortcuts.join('+');
        
        // Publish shortcut event
        pubSub.publish('keyboard:shortcut', {
            shortcut,
            key,
            modifierKey,
            shiftKey,
            altKey,
            event
        });

        // Handle common shortcuts
        this.handleCommonShortcuts(shortcut, event);
    }

    /**
     * Handle common keyboard shortcuts
     * @param {string} shortcut - Shortcut string
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleCommonShortcuts(shortcut, event) {
        const shortcuts = {
            'mod+s': () => {
                event.preventDefault();
                pubSub.publish('app:save');
            },
            'mod+z': () => {
                event.preventDefault();
                pubSub.publish('app:undo');
            },
            'mod+shift+z': () => {
                event.preventDefault();
                pubSub.publish('app:redo');
            },
            'mod+n': () => {
                event.preventDefault();
                pubSub.publish('task:create:new');
            },
            'mod+f': () => {
                event.preventDefault();
                pubSub.publish('app:search:open');
            },
            'escape': () => {
                pubSub.publish('app:escape');
            },
            'mod+enter': () => {
                event.preventDefault();
                pubSub.publish('pomodoro:toggle');
            },
            'mod+shift+p': () => {
                event.preventDefault();
                pubSub.publish('pomodoro:settings:open');
            }
        };

        if (shortcuts[shortcut]) {
            shortcuts[shortcut]();
        }
    }

    /**
     * Setup task-related events
     */
    setupTaskEvents() {
        // Task completion toggle
        this.on('click', '[data-action="toggle-task"]', (event) => {
            const taskId = event.matchedElement.dataset.taskId;
            if (taskId) {
                pubSub.publish('task:toggle:completion', { taskId });
            }
        });

        // Task edit
        this.on('click', '[data-action="edit-task"]', (event) => {
            const taskId = event.matchedElement.dataset.taskId;
            if (taskId) {
                pubSub.publish('task:edit:open', { taskId });
            }
        });

        // Task delete
        this.on('click', '[data-action="delete-task"]', (event) => {
            const taskId = event.matchedElement.dataset.taskId;
            if (taskId) {
                pubSub.publish('task:delete:request', { taskId });
            }
        }, { preventDefault: true, stopPropagation: true });

        // Task creation
        this.on('click', '[data-action="add-task"]', (event) => {
            const category = event.matchedElement.dataset.category;
            pubSub.publish('task:create:open', { category });
        });

        // Task form submission
        this.on('submit', '[data-form="task"]', (event) => {
            const formData = new FormData(event.target);
            const taskData = Object.fromEntries(formData.entries());
            pubSub.publish('task:form:submit', { taskData, form: event.target });
        }, { preventDefault: true });

        // Task drag start
        this.on('dragstart', '[data-draggable="task"]', (event) => {
            const taskId = event.matchedElement.dataset.taskId;
            event.dataTransfer.setData('text/plain', taskId);
            pubSub.publish('task:drag:start', { taskId });
        });

        // Task drop
        this.on('drop', '[data-drop-zone="task"]', (event) => {
            const taskId = event.dataTransfer.getData('text/plain');
            const targetCategory = event.matchedElement.dataset.category;
            pubSub.publish('task:drag:drop', { taskId, targetCategory });
        });
    }

    /**
     * Setup Pomodoro-related events
     */
    setupPomodoroEvents() {
        // Start/pause toggle
        this.on('click', '[data-action="pomodoro-toggle"]', () => {
            pubSub.publish('pomodoro:toggle');
        });

        // Reset timer
        this.on('click', '[data-action="pomodoro-reset"]', () => {
            pubSub.publish('pomodoro:reset');
        });

        // Skip session
        this.on('click', '[data-action="pomodoro-skip"]', () => {
            pubSub.publish('pomodoro:skip');
        });

        // Settings toggle
        this.on('click', '[data-action="pomodoro-settings"]', () => {
            pubSub.publish('pomodoro:settings:toggle');
        });

        // Settings changes
        this.on('input', '[data-setting]', (event) => {
            const setting = event.target.dataset.setting;
            const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
            pubSub.publish('pomodoro:setting:change', { setting, value });
        });
    }

    /**
     * Setup UI-related events
     */
    setupUIEvents() {
        // Modal close
        this.on('click', '[data-action="close-modal"]', () => {
            pubSub.publish('modal:close');
        });

        // Modal backdrop click
        this.on('click', '.modal-backdrop', (event) => {
            if (event.target === event.matchedElement) {
                pubSub.publish('modal:close');
            }
        });

        // Theme toggle
        this.on('click', '[data-action="toggle-theme"]', () => {
            pubSub.publish('theme:toggle');
        });

        // Sidebar toggle
        this.on('click', '[data-action="toggle-sidebar"]', () => {
            pubSub.publish('sidebar:toggle');
        });

        // Sidebar backdrop click
        this.on('click', '.sidebar-backdrop', () => {
            pubSub.publish('sidebar:toggle');
        });

        // View switching
        this.on('click', '[data-action="switch-view"]', (event) => {
            const view = event.matchedElement.dataset.view;
            if (view) {
                pubSub.publish('view:switch', { view });
            }
        });

        // Navigation arrows
        this.on('click', '[data-action="navigate-prev"]', () => {
            pubSub.publish('navigation:previous');
        });

        this.on('click', '[data-action="navigate-next"]', () => {
            pubSub.publish('navigation:next');
        });

        // Settings and Help
        this.on('click', '[data-action="show-settings"]', () => {
            pubSub.publish('ui:showSettings');
        });

        this.on('click', '[data-action="show-help"]', () => {
            pubSub.publish('ui:showHelp');
        });

        // Search input
        this.on('input', '[data-search]', (event) => {
            const query = event.target.value;
            const searchType = event.target.dataset.search;
            pubSub.publish('search:input', { query, searchType });
        });
    }

    /**
     * Setup calendar-related events
     */
    setupCalendarEvents() {
        // Date selection
        this.on('click', '[data-calendar-date]', (event) => {
            const date = event.matchedElement.dataset.calendarDate;
            pubSub.publish('calendar:date:select', { date });
        });

        // Month navigation
        this.on('click', '[data-action="calendar-prev"]', () => {
            pubSub.publish('calendar:month:prev');
        });

        this.on('click', '[data-action="calendar-next"]', () => {
            pubSub.publish('calendar:month:next');
        });

        // Today button
        this.on('click', '[data-action="calendar-today"]', () => {
            pubSub.publish('calendar:today');
        });
    }

    /**
     * Generate unique listener key
     * @param {Element} element - Target element
     * @param {string} eventType - Event type
     * @returns {string} Listener key
     */
    generateListenerKey(element, eventType) {
        return `${this.getElementId(element)}:${eventType}`;
    }

    /**
     * Get unique element identifier
     * @param {Element} element - Target element
     * @returns {string} Element identifier
     */
    getElementId(element) {
        if (element.id) return element.id;
        if (element.dataset?.uid) return element.dataset.uid;
        
        // Generate unique ID if none exists
        const uid = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        element.dataset.uid = uid;
        return uid;
    }

    /**
     * Setup all event handlers
     */
    setupAllEvents() {
        this.setupTaskEvents();
        this.setupPomodoroEvents();
        this.setupUIEvents();
        this.setupCalendarEvents();
        
        pubSub.publish('domEventManager:events:setup');
    }

    /**
     * Cleanup all event listeners
     */
    cleanup() {
        // Remove all direct listeners
        for (const [key, handlers] of this.listeners.entries()) {
            handlers.forEach(({ handler, options }) => {
                const [elementId, eventType] = key.split(':');
                const element = document.querySelector(`[data-uid="${elementId}"]`) || 
                                document.getElementById(elementId);
                if (element) {
                    element.removeEventListener(eventType, handler, options);
                }
            });
        }
        
        this.listeners.clear();
        this.delegatedListeners.clear();
        this.initialized = false;
        
        pubSub.publish('domEventManager:cleanup');
    }

    /**
     * Get event statistics
     * @returns {Object} Event statistics
     */
    getStatistics() {
        return {
            directListeners: this.listeners.size,
            delegatedListeners: this.delegatedListeners.size,
            totalHandlers: Array.from(this.listeners.values())
                .reduce((total, handlers) => total + handlers.length, 0) +
                Array.from(this.delegatedListeners.values())
                .reduce((total, handlers) => total + handlers.length, 0)
        };
    }
}

// Export singleton instance
export const domEventManager = new DomEventManager();
export default domEventManager;
