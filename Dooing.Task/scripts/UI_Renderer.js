// uiRenderer.js
import TaskManager from "./taskManager.js";
import { formatDate } from "./utils.js";

const UIRenderer = {
    renderTaskLists() {
        const categories = TaskManager.categorizeTasks();

        // Render each category
        this.renderCategory("today", categories.today);
        this.renderCategory("tomorrow", categories.tomorrow);
        this.renderFutureTasks(categories.future);
    },

    renderCategory(categoryId, tasks) {
        const container = document.getElementById(`${categoryId}-tasks`);
        const list = document.getElementById(`${categoryId}-tasks-list`);
        const emptyState = document.getElementById(`${categoryId}-empty`);

        // Always ensure both elements exist before proceeding
        if (!container || !emptyState) {
            console.warn(`Missing elements for category ${categoryId}`);
            return;
        }

        // Toggle visibility based on task count
        if (tasks.length > 0) {
            // Show task container, hide empty state
            container.style.display = "block";
            emptyState.style.display = "none";

            // Clear existing tasks and add new ones
            if (list) {
                list.innerHTML = "";
                tasks.forEach((task) => {
                    const taskElement = this.createTaskElement(task);
                    list.appendChild(taskElement);
                });
            }
        } else {
            // Hide task container, show empty state
            container.style.display = "none";
            emptyState.style.display = "block";
        }

        // Update count
        const countElement = document.getElementById(`${categoryId}-count`);
        if (countElement) {
            countElement.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
        }
    },

    createTaskElement(task) {
        const template = document.getElementById("task-item-template");
        const clone = template.content.cloneNode(true);
        const taskElement = clone.querySelector(".task-item");

        taskElement.dataset.taskId = task.id;
        taskElement.querySelector(".task-title").textContent = task.name;
        
        // Handle task description with fallback text
        const descriptionElement = taskElement.querySelector(".task-description");
        if (task.description && task.description.trim()) {
            descriptionElement.textContent = task.description;
            descriptionElement.style.fontStyle = "normal";
        } else {
            descriptionElement.textContent = "No description provided";
            descriptionElement.style.fontStyle = "italic";
            descriptionElement.style.opacity = "0.6";
        }

        if (task.completed) {
            taskElement.classList.add("completed");
            taskElement.querySelector(".task-checkbox").classList.add("checked");
        }

        // Add event listeners
        this.addTaskEventListeners(taskElement);

        return taskElement;
    },

    addTaskEventListeners(taskElement) {
        const taskId = taskElement.dataset.taskId;
        
        // Checkbox event listener
        const checkbox = taskElement.querySelector(".task-checkbox");
        if (checkbox) {
            checkbox.addEventListener("click", (e) => {
                e.stopPropagation();
                const success = TaskManager.toggleTaskCompletion(taskId);
                if (success) {
                    // Update UI immediately for better UX
                    this.renderTaskLists();
                    // Also update calendar views if App is available
                    if (window.App && window.App.updateCalendarViews) {
                        window.App.updateCalendarViews();
                    }
                } else {
                    console.error('Failed to toggle task completion');
                }
            });
        }

        // Edit button event listener
        const editBtn = taskElement.querySelector(".task-edit-btn");
        if (editBtn) {
            editBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.openEditModal(taskId);
            });
        }

        // Delete button event listener
        const deleteBtn = taskElement.querySelector(".task-delete-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this task?")) {
                    const deleted = TaskManager.deleteTask(taskId);
                    if (deleted) {
                        // Update UI immediately
                        this.renderTaskLists();
                        // Also update calendar views if App is available
                        if (window.App && window.App.updateCalendarViews) {
                            window.App.updateCalendarViews();
                        }
                    } else {
                        alert('Failed to delete task. Please try again.');
                    }
                }
            });
        }
    },

    renderCategoryIndicators() {
        const container = document.getElementById("category-indicator");
        if (container) {
            container.innerHTML = "";
            ["today", "tomorrow", "future"].forEach((category, index) => {
                const dot = document.createElement("div");
                dot.className = `category-dot ${index === 0 ? "active" : ""}`;
                dot.dataset.category = category;
                container.appendChild(dot);
            });
        }
    },
    
    renderFutureTasks(tasks) {
        // For now, just update the count - calendar rendering can be added later
        const futureCount = document.querySelector('#future-section .task-count');
        if (futureCount) {
            futureCount.textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
        }
    },

    openEditModal(taskId) {
        const task = TaskManager.getTaskById(taskId);
        if (!task) {
            alert('Task not found');
            return;
        }
        
        // Use the main App's openTaskModal method but for editing
        if (window.App) {
            window.App.openEditTaskModal(task);
        } else {
            alert('Edit functionality not available');
        }
    }
};

export { UIRenderer };
