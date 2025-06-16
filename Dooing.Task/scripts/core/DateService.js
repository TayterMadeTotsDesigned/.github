/**
 * DateService
 * Utility functions for date manipulation and formatting
 */
class DateService {
    constructor() {
        this.dateFormats = {
            SHORT: 'MM/DD/YYYY',
            LONG: 'MMMM DD, YYYY',
            ISO: 'YYYY-MM-DD',
            TIME: 'HH:mm',
            DATETIME: 'MM/DD/YYYY HH:mm'
        };
    }

    /**
     * Get current date in ISO format
     * @returns {string} Current date (YYYY-MM-DD)
     */
    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Get current time in ISO format
     * @returns {string} Current time (HH:mm:ss)
     */
    getCurrentTime() {
        return new Date().toTimeString().split(' ')[0];
    }

    /**
     * Get current datetime in ISO format
     * @returns {string} Current datetime
     */
    getCurrentDateTime() {
        return new Date().toISOString();
    }

    /**
     * Format date to readable string
     * @param {Date|string} date - Date to format
     * @param {string} format - Format type (short, long, iso)
     * @returns {string} Formatted date
     */
    formatDate(date, format = 'short') {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        if (isNaN(dateObj.getTime())) {
            return 'Invalid Date';
        }

        const options = {
            short: { month: 'numeric', day: 'numeric', year: 'numeric' },
            long: { month: 'long', day: 'numeric', year: 'numeric' },
            medium: { month: 'short', day: 'numeric', year: 'numeric' },
            iso: null // Will return ISO string
        };

        if (format === 'iso') {
            return dateObj.toISOString().split('T')[0];
        }

        return dateObj.toLocaleDateString('en-US', options[format] || options.short);
    }

    /**
     * Format time to readable string
     * @param {Date|string} time - Time to format
     * @param {boolean} includeSeconds - Include seconds in output
     * @returns {string} Formatted time
     */
    formatTime(time, includeSeconds = false) {
        const timeObj = typeof time === 'string' ? new Date(time) : time;
        
        if (isNaN(timeObj.getTime())) {
            return 'Invalid Time';
        }

        const options = {
            hour: '2-digit',
            minute: '2-digit',
            ...(includeSeconds && { second: '2-digit' })
        };

        return timeObj.toLocaleTimeString('en-US', options);
    }

    /**
     * Get relative time string (e.g., "2 hours ago", "in 3 days")
     * @param {Date|string} date - Date to compare
     * @param {Date} baseDate - Base date for comparison (default: now)
     * @returns {string} Relative time string
     */
    getRelativeTime(date, baseDate = new Date()) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const diffMs = dateObj.getTime() - baseDate.getTime();
        const absDiffMs = Math.abs(diffMs);
        
        const minute = 60 * 1000;
        const hour = minute * 60;
        const day = hour * 24;
        const week = day * 7;
        const month = day * 30;
        const year = day * 365;

        const future = diffMs > 0;
        const prefix = future ? 'in ' : '';
        const suffix = future ? '' : ' ago';

        if (absDiffMs < minute) {
            return 'just now';
        } else if (absDiffMs < hour) {
            const minutes = Math.floor(absDiffMs / minute);
            return `${prefix}${minutes} minute${minutes !== 1 ? 's' : ''}${suffix}`;
        } else if (absDiffMs < day) {
            const hours = Math.floor(absDiffMs / hour);
            return `${prefix}${hours} hour${hours !== 1 ? 's' : ''}${suffix}`;
        } else if (absDiffMs < week) {
            const days = Math.floor(absDiffMs / day);
            return `${prefix}${days} day${days !== 1 ? 's' : ''}${suffix}`;
        } else if (absDiffMs < month) {
            const weeks = Math.floor(absDiffMs / week);
            return `${prefix}${weeks} week${weeks !== 1 ? 's' : ''}${suffix}`;
        } else if (absDiffMs < year) {
            const months = Math.floor(absDiffMs / month);
            return `${prefix}${months} month${months !== 1 ? 's' : ''}${suffix}`;
        } else {
            const years = Math.floor(absDiffMs / year);
            return `${prefix}${years} year${years !== 1 ? 's' : ''}${suffix}`;
        }
    }

    /**
     * Check if date is today
     * @param {Date|string} date - Date to check
     * @returns {boolean} Is today
     */
    isToday(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();
        
        return dateObj.getDate() === today.getDate() &&
               dateObj.getMonth() === today.getMonth() &&
               dateObj.getFullYear() === today.getFullYear();
    }

    /**
     * Check if date is tomorrow
     * @param {Date|string} date - Date to check
     * @returns {boolean} Is tomorrow
     */
    isTomorrow(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return dateObj.getDate() === tomorrow.getDate() &&
               dateObj.getMonth() === tomorrow.getMonth() &&
               dateObj.getFullYear() === tomorrow.getFullYear();
    }

    /**
     * Check if date is yesterday
     * @param {Date|string} date - Date to check
     * @returns {boolean} Is yesterday
     */
    isYesterday(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        return dateObj.getDate() === yesterday.getDate() &&
               dateObj.getMonth() === yesterday.getMonth() &&
               dateObj.getFullYear() === yesterday.getFullYear();
    }

    /**
     * Check if date is in the past
     * @param {Date|string} date - Date to check
     * @returns {boolean} Is past date
     */
    isPast(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return dateObj < today;
    }

    /**
     * Check if date is in the future
     * @param {Date|string} date - Date to check
     * @returns {boolean} Is future date
     */
    isFuture(date) {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        
        return dateObj > today;
    }

    /**
     * Add days to a date
     * @param {Date|string} date - Base date
     * @param {number} days - Days to add (can be negative)
     * @returns {Date} New date
     */
    addDays(date, days) {
        const dateObj = new Date(typeof date === 'string' ? date : date);
        dateObj.setDate(dateObj.getDate() + days);
        return dateObj;
    }

    /**
     * Get start of day
     * @param {Date|string} date - Date
     * @returns {Date} Start of day
     */
    getStartOfDay(date) {
        const dateObj = new Date(typeof date === 'string' ? date : date);
        dateObj.setHours(0, 0, 0, 0);
        return dateObj;
    }

    /**
     * Get end of day
     * @param {Date|string} date - Date
     * @returns {Date} End of day
     */
    getEndOfDay(date) {
        const dateObj = new Date(typeof date === 'string' ? date : date);
        dateObj.setHours(23, 59, 59, 999);
        return dateObj;
    }

    /**
     * Get days between two dates
     * @param {Date|string} startDate - Start date
     * @param {Date|string} endDate - End date
     * @returns {number} Number of days
     */
    getDaysBetween(startDate, endDate) {
        const start = new Date(typeof startDate === 'string' ? startDate : startDate);
        const end = new Date(typeof endDate === 'string' ? endDate : endDate);
        
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Get calendar month data
     * @param {Date|string} date - Date in the month
     * @returns {Object} Month data with weeks and days
     */
    getMonthData(date) {
        const dateObj = new Date(typeof date === 'string' ? date : date);
        const year = dateObj.getFullYear();
        const month = dateObj.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayOfWeek = firstDay.getDay();
        const daysInMonth = lastDay.getDate();
        
        const weeks = [];
        let currentWeek = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfWeek; i++) {
            currentWeek.push(null);
        }
        
        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            currentWeek.push(new Date(year, month, day));
            
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }
        
        // Add remaining empty cells
        while (currentWeek.length < 7 && currentWeek.length > 0) {
            currentWeek.push(null);
        }
        
        if (currentWeek.length > 0) {
            weeks.push(currentWeek);
        }
        
        return {
            year,
            month,
            monthName: firstDay.toLocaleDateString('en-US', { month: 'long' }),
            weeks,
            firstDay,
            lastDay,
            daysInMonth
        };
    }

    /**
     * Parse date from various formats
     * @param {string} dateString - Date string to parse
     * @returns {Date|null} Parsed date or null if invalid
     */
    parseDate(dateString) {
        if (!dateString) return null;
        
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    }

    /**
     * Format duration in milliseconds to human readable string
     * @param {number} milliseconds - Duration in milliseconds
     * @returns {string} Formatted duration
     */
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}

// Export singleton instance
export const dateService = new DateService();
export default dateService;
