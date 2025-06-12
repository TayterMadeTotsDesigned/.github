import { getToday } from './utils.js';

const Storage = {

    saveTasks: (tasks) => {
        localStorage.setItem('dooingTasks',JSON.stringify(tasks));
    },

    // Load tasks from localStorage
    loadTasks: () => {
        const tasks = localStorage.getItem('dooingTasks');
        return tasks ? JSON.parse(tasks) : [];
    },

    //Save settings
    saveSettings: (settings) => {
        localStorage.setItem('dooingSettings', JSON.stringify(settings));
    },

    // Load settings
    loadSettings: () => {
        const settings = localStorage.getItem('dooingSettings');
        return settings ? JSON.parse(settings) : {
            theme: 'cool-blues',
            weekStart: 'sunday'
        };
    },

    // Generic save method
    save: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Generic load method
    load: (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }
};

export default Storage;