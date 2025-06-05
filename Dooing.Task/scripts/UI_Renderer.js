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
            container.style.display = "block";
            emptyState.classList.add("hidden");

            // Clear existing tasks
            list.innerHTML = "";

            // Add new tasks
            tasks.forEach((task) => {
                const taskElement = this.createTaskElement(task);
                list.appendChild(taskElement);
            });
        } else {
            container.style.display = "none";
            emptyState.classList.remove("hidden");
        }

        // Update count
        document.getElementById(`${categoryId}-count`).textContent = `${tasks.length
            } ${tasks.length === 1 ? "task" : "tasks"}`;
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
        // Implement checkbox, edit, delete handlers

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
                applyTheme.openEditModal(taskId);
            });

        taskElement
            .querySelector(".task-delete-btn")
            .addEventListener("click", (e) => {
                e.stopPropagation();
                if (confirm("Lets delete this task?")) {
                    TaskManager.deleteTask(taskId);
                    this.renderTaskLists();
                }
            });
        taskElement.addEventListener("click", () => {
            applyTheme.openTaskDetails(taskId);
        });
    },

    renderCategoryIndicators() {
        const container = document.getElementById("category-indicator");
        container.innerHTML = "";
        ["today", "tomorrow", "future"].forEach((category, index) => {
            const dot = document.createElement("div");
            dot.className = `category-dot ${index === 0 ? "active" : ""}`;
            dot.dataset.category = category;
            dot.addEventListener("click", () => App.switchCategory(category));
            container.appendChild(dot);
        });
    },
};

export default UIRenderer;
