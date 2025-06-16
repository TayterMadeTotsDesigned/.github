/**
 * PubSub Event Bus
 * Central event communication system for inter-module communication
 */
class PubSub {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        
        this.events[event].push(callback);
        
        // Return unsubscribe function
        return () => {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        };
    }

    /**
     * Publish an event
     * @param {string} event - Event name
     * @param {*} data - Data to pass to subscribers
     */
    publish(event, data) {
        if (!this.events[event]) {
            return;
        }

        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }

    /**
     * Subscribe to an event only once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
        const unsubscribe = this.subscribe(event, (data) => {
            callback(data);
            unsubscribe();
        });
    }

    /**
     * Clear all subscribers for an event
     * @param {string} event - Event name
     */
    clear(event) {
        if (this.events[event]) {
            delete this.events[event];
        }
    }

    /**
     * Clear all events
     */
    clearAll() {
        this.events = {};
    }

    /**
     * Get list of events
     * @returns {Array} Array of event names
     */
    getEvents() {
        return Object.keys(this.events);
    }

    /**
     * Get subscriber count for an event
     * @param {string} event - Event name
     * @returns {number} Number of subscribers
     */
    getSubscriberCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    }
}

// Export singleton instance
export const pubSub = new PubSub();
export default pubSub;
