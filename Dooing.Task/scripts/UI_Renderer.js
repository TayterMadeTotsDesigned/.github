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

        // Toggle visibility
        if (tasks.length > 0) {
            if (container) container.style.display = "block";
            if (emptyState) emptyState.style.display = "none";

            // Clear existing tasks
            if (list) {
                list.innerHTML = "";

                // Add new tasks
                tasks.forEach((task) => {
                    const taskElement = this.createTaskElement(task);
                    list.appendChild(taskElement);
                });
            }
        } else {
            if (container) container.style.display = "none";
            if (emptyState) emptyState.style.display = "block";
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
        taskElement.querySelector(".task-description").textContent =
            task.description || "";

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
        
        taskElement
            .querySelector(".task-checkbox")
            .addEventListener("click", (e) => {
                e.stopPropagation();
                TaskManager.toggleTaskCompletion(taskId);
                this.renderTaskLists();
            });

        taskElement
            .querySelector(".task-edit-btn")
            .addEventListener("click", (e) => {
                e.stopPropagation();
                // For now, just alert - you can implement edit modal later
                alert('Edit functionality coming soon!');
            });

        taskElement
            .querySelector(".task-delete-btn")
            .addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm("Delete this task?")) {
                    TaskManager.deleteTask(taskId);
                    this.renderTaskLists();
                }
            });
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
        
        // Show/hide empty state based on tasks
        const emptyState = document.getElementById('future-empty');
        if (emptyState) {
            if (tasks.length === 0) {
                emptyState.style.display = 'block';
                // Show the add task button in the empty state
                const addTaskBtn = emptyState.querySelector('.add-task-btn');
                if (addTaskBtn) {
                    addTaskBtn.style.display = 'block';
                }
            } else {
                emptyState.style.display = 'none';
            }
        }
    }
};

export { UIRenderer };
