/**
 * Utility Helper Functions
 * Common utility functions used across the application
 */

/**
 * Generate unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
export function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}_${timestamp}_${randomStr}` : `${timestamp}_${randomStr}`;
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    
    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }
    
    if (typeof obj === 'object') {
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = deepClone(obj[key]);
            }
        }
        return cloned;
    }
    
    return obj;
}

/**
 * Check if object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} Is empty
 */
export function isEmpty(obj) {
    if (obj == null) return true;
    if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0;
    if (obj instanceof Map || obj instanceof Set) return obj.size === 0;
    return Object.keys(obj).length === 0;
}

/**
 * Sanitize HTML string
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return str.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Clamp number between min and max
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped number
 */
export function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

/**
 * Get random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
export function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random item from array
 * @param {Array} array - Array to pick from
 * @returns {*} Random item
 */
export function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string|Function} key - Key or function to group by
 * @returns {Object} Grouped object
 */
export function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const group = typeof key === 'function' ? key(item) : item[key];
        groups[group] = groups[group] || [];
        groups[group].push(item);
        return groups;
    }, {});
}

/**
 * Get unique items from array
 * @param {Array} array - Array to process
 * @param {string|Function} key - Optional key or function for uniqueness
 * @returns {Array} Array with unique items
 */
export function unique(array, key) {
    if (!key) {
        return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
        const value = typeof key === 'function' ? key(item) : item[key];
        if (seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert string to camelCase
 * @param {string} str - String to convert
 * @returns {string} camelCase string
 */
export function camelCase(str) {
    return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
}

/**
 * Convert string to kebab-case
 * @param {string} str - String to convert
 * @returns {string} kebab-case string
 */
export function kebabCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
export function truncate(str, length, suffix = '...') {
    if (typeof str !== 'string') return '';
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Check if value is a valid email
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check if value is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} Is valid URL
 */
export function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Parse query string
 * @param {string} queryString - Query string to parse
 * @returns {Object} Parsed parameters
 */
export function parseQueryString(queryString) {
    const params = {};
    const pairs = (queryString.startsWith('?') ? queryString.slice(1) : queryString).split('&');
    
    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) {
            params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
        }
    });
    
    return params;
}

/**
 * Build query string from object
 * @param {Object} params - Parameters object
 * @returns {string} Query string
 */
export function buildQueryString(params) {
    return Object.entries(params)
        .filter(([_, value]) => value != null)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
}

/**
 * Wait for specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after wait time
 */
export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
export async function retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxAttempts) {
                throw lastError;
            }
            
            const delay = baseDelay * Math.pow(2, attempt - 1);
            await wait(delay);
        }
    }
}

/**
 * Create a promise that rejects after timeout
 * @param {Promise} promise - Promise to add timeout to
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Promise with timeout
 */
export function withTimeout(promise, timeout) {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Operation timed out')), timeout)
        )
    ]);
}

/**
 * Measure function execution time
 * @param {Function} fn - Function to measure
 * @param {...any} args - Function arguments
 * @returns {Object} Result and execution time
 */
export function measureTime(fn, ...args) {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    return {
        result,
        time: end - start
    };
}

/**
 * Check if code is running in browser
 * @returns {boolean} Is browser environment
 */
export function isBrowser() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Check if device supports touch
 * @returns {boolean} Supports touch
 */
export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Get viewport dimensions
 * @returns {Object} Viewport width and height
 */
export function getViewport() {
    return {
        width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
        height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
}

/**
 * Download data as file
 * @param {string} data - Data to download
 * @param {string} filename - Filename
 * @param {string} type - MIME type
 */
export function downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Export all utilities as default object
export default {
    generateId,
    debounce,
    throttle,
    deepClone,
    isEmpty,
    sanitizeHTML,
    escapeHTML,
    formatNumber,
    clamp,
    random,
    randomItem,
    shuffle,
    groupBy,
    unique,
    capitalize,
    camelCase,
    kebabCase,
    truncate,
    isValidEmail,
    isValidURL,
    parseQueryString,
    buildQueryString,
    wait,
    retry,
    withTimeout,
    measureTime,
    isBrowser,
    isTouchDevice,
    getViewport,
    downloadFile
};
