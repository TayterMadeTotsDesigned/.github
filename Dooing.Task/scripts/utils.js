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
