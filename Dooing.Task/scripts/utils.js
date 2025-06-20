export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
export const formatDate = (date) => {
    const options = {month: 'short', day: 'numeric', year: 'numeric'};
    return new Date(date).toLocaleDateString(undefined, options);
};

export const getToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
};
export const getTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
};
export const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
};

export const formatTaskTime = (task) => {
    if (!task.dueDate) return '';
    return formatDate(task.dueDate);
};

export const getDaysInWeek = (startDate) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
    }
    return days;
};

export const getMonthName = (monthIndex) => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
};

export const getDayName = (dayIndex) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
};

export const getDayNameShort = (dayIndex) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
};