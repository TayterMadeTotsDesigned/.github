// app.js
import TaskManager from './taskManager.js';
import Storage from './storage.js';
import { UIRenderer } from './UI_Renderer.js';
import { generateId, getToday, formatDate } from './utils.js';

const App = {
    init() {
        // Load initial data
        this.tasks = TaskManager.getTasks();
        this.settings = Storage.loadSettings();
        
        // Set up event listeners
        this.bindEvents();
        
        // Apply theme
        this.applyTheme(this.settings.theme);
        
        // Render initial UI
        this.renderUI();
    },

    bindEvents() {
        // New task button
        document.getElementById('new-task-btn').addEventListener('click', () => {
            this.openTaskModal();
        });
        
        // Modal close
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeTaskModal();
        });

        document.getElementById('left-arrow-btn').addEventListener('click', () => {
            this.navigateCategories(-1);
        });

        document.getElementById('right-arrow-btn').addEventListener('click', () => {
            this.navigateCategories(1);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.navigateCategories(-1);
            } else if (e.key === 'ArrowRight') {
                this.navigateCategories(1);
            }
        });
    },

   navigateCategories(direction) {
    const categories = ['today', 'tomorrow', 'future'];
    const current = document.querySelector('.task-category.active').dataset.category;
    const currentIndex = categories.indexOf(current);
    const nextIndex = (currentIndex + direction + categories.length) % categories.length;
    
    this.switchCategory(categories[nextIndex]);
},

switchCategory(category) {
    // Hide all categories
    document.querySelectorAll('.task-category').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show selected category
    document.getElementById(`${category}-section`).classList.add('active');
    
    // Update hero section
    document.getElementById('hero-category').textContent = 
        category.charAt(0).toUpperCase() + category.slice(1);
    
    // Update active dot
    document.querySelectorAll('.category-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === categories.indexOf(category));
    });
},

    applyTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
    },

    renderUI() {
        // Initial rendering logic
        this.renderTaskCounts();
        this.renderCurrentDate();
    },

    // More methods to be added...
        openTaskModal() {
        document.getElementById('task-modal').classList.add('active');
    },
    
    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
    },
    
    handleTaskFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const task = {
            id: generateId(),
            name: formData.get('name'),
            description: formData.get('description'),
            dueDate: this.getDueDate(formData),
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        TaskManager.addTask(task);
        this.closeTaskModal();
        this.renderUI();
    },
    
    getDueDate(formData) {
        const category = formData.get('category');
        const today = getToday();
        
        switch(category) {
            case 'today':
                return today.toISOString();
            case 'tomorrow':
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return tomorrow.toISOString();
            case 'future':
                return formData.get('date') || today.toISOString();
            default:
                return today.toISOString();
        }
    },
    
    // Update bindEvents()
    bindEvents() {
        // ... existing bindings
        
        // Task form submission
        document.getElementById('task-form').addEventListener('submit', (e) => {
            this.handleTaskFormSubmit(e);
        });
        
        // Category radio buttons
        document.querySelectorAll('input[name="category"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const futureDateGroup = document.getElementById('future-date-group');
                futureDateGroup.style.display = e.target.value === 'future' ? 'block' : 'none';
            });
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());