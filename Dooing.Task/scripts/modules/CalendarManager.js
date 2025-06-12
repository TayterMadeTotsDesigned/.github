// CalendarManager.js - Handles all calendar-related logic and date operations
import { getToday, formatDate } from '../utils.js';

class CalendarManager {
    constructor() {
        this.currentWeekStart = this.getWeekStart(new Date());
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.currentView = 'week';
    }

    /**
     * Get the start of the week (Sunday) for a given date
     */
    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    /**
     * Get the first day of a month
     */
    getMonthStart(year, month) {
        return new Date(year, month, 1);
    }

    /**
     * Generate an array of 7 days starting from the given date
     */
    generateWeekDays(startDate) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + i);
            days.push(day);
        }
        return days;
    }

    /**
     * Generate calendar grid for a month (42 days including prev/next month)
     */
    generateMonthDays(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();
        
        const days = [];
        
        // Previous month days to fill grid
        for (let i = startDay - 1; i >= 0; i--) {
            const day = new Date(firstDay);
            day.setDate(day.getDate() - i - 1);
            days.push({ date: day, isCurrentMonth: false });
        }
        
        // Current month days
        for (let i = 1; i <= daysInMonth; i++) {
            days.push({ 
                date: new Date(year, month, i), 
                isCurrentMonth: true 
            });
        }
        
        // Next month days to complete 6-week grid
        const remainingCells = 42 - days.length;
        for (let i = 1; i <= remainingCells; i++) {
            const day = new Date(year, month + 1, i);
            days.push({ date: day, isCurrentMonth: false });
        }
        
        return days;
    }

    /**
     * Navigate to next/previous week
     */
    navigateWeek(direction) {
        const days = direction === 'next' ? 7 : -7;
        this.currentWeekStart.setDate(this.currentWeekStart.getDate() + days);
        return new Date(this.currentWeekStart);
    }

    /**
     * Navigate to next/previous month
     */
    navigateMonth(direction) {
        if (direction === 'next') {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
        } else {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
        }
        return { month: this.currentMonth, year: this.currentYear };
    }

    /**
     * Set the current view (week or month)
     */
    setView(view) {
        if (view === 'week' || view === 'month') {
            this.currentView = view;
        }
    }

    /**
     * Get the current view
     */
    getCurrentView() {
        return this.currentView;
    }

    /**
     * Get current week start date
     */
    getCurrentWeekStart() {
        return new Date(this.currentWeekStart);
    }

    /**
     * Get current month info
     */
    getCurrentMonth() {
        return { month: this.currentMonth, year: this.currentYear };
    }

    /**
     * Format date to YYYY-MM-DD string
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Check if a date is today
     */
    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    /**
     * Check if two dates are the same day
     */
    isSameDate(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    /**
     * Get month name
     */
    getMonthName(monthIndex) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return months[monthIndex];
    }

    /**
     * Get day name
     */
    getDayName(dayIndex) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayIndex];
    }
}

export default CalendarManager;
