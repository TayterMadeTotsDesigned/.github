// NotificationService.js - Handles user notifications and feedback
import { pubSub } from '../../events/PubSub.js';
import { appState } from '../../core/AppState.js';

class NotificationService {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.subscribers = [];
        this.isInitialized = false;
        this.defaultDuration = 4000;
        this.maxNotifications = 5;
    }

    /**
     * Initialize the notification service
     */
    init() {
        if (this.isInitialized) return;
        
        this.createContainer();
        this.subscribeToEvents();
        
        this.isInitialized = true;
        pubSub.publish('notification:initialized', { service: this });
    }

    /**
     * Subscribe to relevant events
     */
    subscribeToEvents() {
        // Listen for notification requests
        this.subscribers.push(
            pubSub.subscribe('notification:show', (data) => this.show(data))
        );
        
        // Listen for notification dismissal requests
        this.subscribers.push(
            pubSub.subscribe('notification:dismiss', (data) => this.dismiss(data.id))
        );
        
        // Listen for clear all requests
        this.subscribers.push(
            pubSub.subscribe('notification:clear', () => this.clearAll())
        );
        
        // Listen for task events to show automatic notifications
        this.subscribers.push(
            pubSub.subscribe('task:added', (data) => {
                this.show({
                    type: 'success',
                    message: `Task "${data.task.name}" added successfully`,
                    duration: 3000
                });
            })
        );
        
        this.subscribers.push(
            pubSub.subscribe('task:updated', (data) => {
                this.show({
                    type: 'success',
                    message: `Task "${data.task.name}" updated successfully`,
                    duration: 3000
                });
            })
        );
        
        this.subscribers.push(
            pubSub.subscribe('task:deleted', (data) => {
                this.show({
                    type: 'info',
                    message: `Task deleted`,
                    duration: 3000,
                    action: {
                        text: 'Undo',
                        callback: () => pubSub.publish('task:restore', { task: data.task })
                    }
                });
            })
        );
        
        this.subscribers.push(
            pubSub.subscribe('task:completed', (data) => {
                this.show({
                    type: 'success',
                    message: `Great job! Task "${data.task.name}" completed`,
                    duration: 3000
                });
            })
        );
        
        // Listen for pomodoro events
        this.subscribers.push(
            pubSub.subscribe('pomodoro:completed', (data) => {
                this.show({
                    type: 'success',
                    message: `Pomodoro session completed! Time for a break.`,
                    duration: 5000
                });
            })
        );
        
        this.subscribers.push(
            pubSub.subscribe('pomodoro:breakCompleted', (data) => {
                this.show({
                    type: 'info',
                    message: `Break over! Ready for the next session?`,
                    duration: 5000
                });
            })
        );
        
        // Listen for error events
        this.subscribers.push(
            pubSub.subscribe('error:occurred', (data) => {
                this.show({
                    type: 'error',
                    message: data.message || 'An error occurred',
                    duration: 6000
                });
            })
        );
    }

    /**
     * Create the notification container
     */
    createContainer() {
        // Check if container already exists
        this.container = document.getElementById('notification-container');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.className = 'notification-container';
            this.container.setAttribute('aria-live', 'polite');
            this.container.setAttribute('aria-label', 'Notifications');
            
            // Add to page
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a notification
     */
    show(options = {}) {
        if (!this.isInitialized) {
            console.warn('NotificationService not initialized');
            return null;
        }

        const notification = this.createNotification(options);
        const id = notification.id;
        
        // Store notification
        this.notifications.set(id, notification);
        
        // Add to container
        this.container.appendChild(notification.element);
        
        // Trigger animation
        requestAnimationFrame(() => {
            notification.element.classList.add('show');
        });
        
        // Auto-dismiss if duration is set
        if (notification.duration > 0) {
            notification.timeoutId = setTimeout(() => {
                this.dismiss(id);
            }, notification.duration);
        }
        
        // Limit number of notifications
        this.enforceMaxNotifications();
        
        // Publish event
        pubSub.publish('notification:shown', { 
            id, 
            type: notification.type,
            message: notification.message 
        });
        
        return id;
    }

    /**
     * Create a notification object
     */
    createNotification(options) {
        const id = this.generateId();
        const type = options.type || 'info';
        const message = options.message || '';
        const duration = options.duration !== undefined ? options.duration : this.defaultDuration;
        const action = options.action || null;
        
        // Create element
        const element = document.createElement('div');
        element.className = `notification notification-${type}`;
        element.setAttribute('role', 'alert');
        element.setAttribute('data-notification-id', id);
        
        // Create content
        const content = document.createElement('div');
        content.className = 'notification-content';
        
        // Add icon
        const icon = document.createElement('span');
        icon.className = 'notification-icon';
        icon.innerHTML = this.getIcon(type);
        content.appendChild(icon);
        
        // Add message
        const messageEl = document.createElement('span');
        messageEl.className = 'notification-message';
        messageEl.textContent = message;
        content.appendChild(messageEl);
        
        element.appendChild(content);
        
        // Add action button if provided
        if (action) {
            const actionBtn = document.createElement('button');
            actionBtn.className = 'notification-action';
            actionBtn.textContent = action.text;
            actionBtn.addEventListener('click', () => {
                if (action.callback) action.callback();
                this.dismiss(id);
            });
            element.appendChild(actionBtn);
        }
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.addEventListener('click', () => this.dismiss(id));
        element.appendChild(closeBtn);
        
        return {
            id,
            type,
            message,
            duration,
            action,
            element,
            timeoutId: null,
            timestamp: Date.now()
        };
    }

    /**
     * Dismiss a notification
     */
    dismiss(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;
        
        // Clear timeout
        if (notification.timeoutId) {
            clearTimeout(notification.timeoutId);
        }
        
        // Remove from DOM with animation
        notification.element.classList.add('hide');
        
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.delete(id);
            
            pubSub.publish('notification:dismissed', { id });
        }, 300);
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        const ids = Array.from(this.notifications.keys());
        ids.forEach(id => this.dismiss(id));
        
        pubSub.publish('notification:clearedAll');
    }

    /**
     * Get icon for notification type
     */
    getIcon(type) {
        const icons = {
            'success': '✓',
            'error': '✕',
            'warning': '⚠',
            'info': 'ℹ'
        };
        
        return icons[type] || icons.info;
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Enforce maximum number of notifications
     */
    enforceMaxNotifications() {
        const notifications = Array.from(this.notifications.values());
        
        if (notifications.length > this.maxNotifications) {
            // Sort by timestamp and remove oldest
            notifications
                .sort((a, b) => a.timestamp - b.timestamp)
                .slice(0, notifications.length - this.maxNotifications)
                .forEach(notification => this.dismiss(notification.id));
        }
    }

    /**
     * Get all active notifications
     */
    getActiveNotifications() {
        return Array.from(this.notifications.values());
    }

    /**
     * Get notification count by type
     */
    getNotificationCount(type = null) {
        if (type) {
            return Array.from(this.notifications.values())
                .filter(n => n.type === type).length;
        }
        return this.notifications.size;
    }

    /**
     * Update notification settings
     */
    updateSettings(settings = {}) {
        if (settings.defaultDuration !== undefined) {
            this.defaultDuration = settings.defaultDuration;
        }
        
        if (settings.maxNotifications !== undefined) {
            this.maxNotifications = Math.max(1, settings.maxNotifications);
        }
        
        pubSub.publish('notification:settingsUpdated', { settings });
    }

    /**
     * Show success notification (convenience method)
     */
    success(message, duration) {
        return this.show({ type: 'success', message, duration });
    }

    /**
     * Show error notification (convenience method)
     */
    error(message, duration) {
        return this.show({ type: 'error', message, duration });
    }

    /**
     * Show warning notification (convenience method)
     */
    warning(message, duration) {
        return this.show({ type: 'warning', message, duration });
    }

    /**
     * Show info notification (convenience method)
     */
    info(message, duration) {
        return this.show({ type: 'info', message, duration });
    }

    /**
     * Destroy the notification service and clean up
     */
    destroy() {
        this.clearAll();
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        this.subscribers.forEach(unsubscribe => unsubscribe());
        this.subscribers = [];
        this.isInitialized = false;
        
        pubSub.publish('notification:destroyed');
    }
}

// Create and export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
