# Dooing.Task Modules Documentation

## 📁 Module Architecture

The Dooing.Task application follows a modular ES6 architecture with clear separation of concerns. Each module has a specific responsibility and communicates through well-defined interfaces.

## 🏗️ Core Application Structure

```
scripts/
├── app.js                  # Main application orchestrator
├── taskManager.js          # Core task CRUD operations
├── UI_Renderer.js          # UI rendering and updates
├── pomodoro.js            # Pomodoro timer functionality
├── storage.js             # Local storage management
├── utils.js               # Utility functions
└── modules/
    ├── CalendarManager.js     # Calendar logic and date operations
    ├── EventHandler.js        # Centralized event handling
    ├── ModalManager.js        # Modal interactions and forms
    ├── TaskRenderer.js        # Task UI rendering
    └── ThemeManager.js        # Theme switching and persistence
```

## 🧩 Module Descriptions

### **app.js** - Main Application Orchestrator
- **Purpose**: Initializes and coordinates all modules
- **Responsibilities**:
  - Module dependency injection
  - Application lifecycle management
  - Error handling and recovery
  - Global app state management
- **Key Methods**:
  - `init()` - Initialize the entire application
  - `initializeModules()` - Load all modules in correct order
  - `validateModules()` - Ensure modules loaded correctly
  - `setupModuleIntegrations()` - Wire up inter-module communications

### **CalendarManager.js** - Calendar Logic
- **Purpose**: Handles all calendar-related operations and date calculations
- **Responsibilities**:
  - Week/month view generation
  - Date navigation logic
  - Calendar grid calculations
  - Date formatting and utilities
- **Key Methods**:
  - `generateWeekDays(startDate)` - Generate 7-day week array
  - `generateMonthDays(year, month)` - Generate month calendar grid
  - `navigateWeek(direction)` - Navigate calendar weeks
  - `navigateMonth(direction)` - Navigate calendar months

### **EventHandler.js** - Centralized Event Management
- **Purpose**: Manages all user interactions and events using delegation
- **Responsibilities**:
  - Global event delegation for performance
  - Task CRUD event handling
  - Navigation between categories
  - Keyboard shortcuts and accessibility
- **Key Methods**:
  - `setupGlobalEventDelegation()` - Efficient event handling
  - `handleTaskToggle()` - Task completion events
  - `handleTaskEdit()` - Task editing events
  - `showCategory(category)` - Category navigation

### **ModalManager.js** - Modal and Form Management
- **Purpose**: Handles all modal interactions and form processing
- **Responsibilities**:
  - Modal open/close lifecycle
  - Form validation and submission
  - Recurring task form logic
  - Date picker management
- **Key Methods**:
  - `open(context)` - Open modal with context
  - `close()` - Close modal and cleanup
  - `setupRecurringTaskToggles()` - Handle recurring task UI
  - `populateFormForEditing(task)` - Populate edit forms

### **TaskRenderer.js** - Task UI Rendering
- **Purpose**: Renders individual tasks and task-related UI components
- **Responsibilities**:
  - Task element creation
  - Task list rendering
  - Calendar task display
  - Task state visualization
- **Key Methods**:
  - `createTaskElement(task)` - Create task DOM element
  - `renderTaskBadges(task)` - Display task metadata
  - `createCalendarTask(task)` - Render tasks in calendar
  - `updateTaskDisplay(task)` - Update existing task UI

### **ThemeManager.js** - Theme System
- **Purpose**: Manages application themes and visual customization
- **Responsibilities**:
  - Theme switching logic
  - Theme persistence
  - CSS custom property management
  - Theme preview generation
- **Key Methods**:
  - `applyTheme(themeName)` - Apply selected theme
  - `setupThemeSelector()` - Initialize theme dropdown
  - `saveTheme(themeName)` - Persist theme choice
  - `getThemePreview(themeName)` - Generate theme previews

## 🔄 Module Communication Flow

```
app.js (Orchestrator)
├── Initializes TaskManager
├── Creates Module Instances
│   ├── ThemeManager.init()
│   ├── CalendarManager.init()
│   ├── TaskRenderer.init()
│   ├── ModalManager.init()
│   └── EventHandler.init(dependencies)
├── Sets up Inter-module Communication
├── Renders Initial UI
└── Provides Global Access Points
```

## 🎯 Event System

The application uses a custom event system for loose coupling:

```javascript
// Theme changes
document.dispatchEvent(new CustomEvent('themeChanged', {
    detail: { theme: 'cool-blues' }
}));

// Task updates
document.dispatchEvent(new CustomEvent('tasksUpdated', {
    detail: { category: 'today', action: 'add' }
}));
```

## 🚀 Initialization Sequence

1. **Dependency Validation** - Verify core dependencies are loaded
2. **Module Creation** - Instantiate all module classes
3. **Module Initialization** - Call init() on each module
4. **Module Validation** - Verify modules loaded correctly
5. **TaskManager Setup** - Initialize task management system
6. **Pomodoro Timer** - Set up timer functionality
7. **Integration Setup** - Wire up inter-module communications
8. **UI Rendering** - Render initial application state

## 🛠️ Error Handling

Each module includes comprehensive error handling:

- **Graceful Degradation** - App continues functioning if non-critical modules fail
- **User Feedback** - Clear error messages for users
- **Developer Tools** - Detailed console logging for debugging
- **Recovery Mechanisms** - Automatic retry and fallback systems

## 📱 Usage Examples

### Opening a Task Modal
```javascript
window.App.openTaskModal('today');
```

### Updating Calendar Views
```javascript
window.App.updateCalendarViews();
```

### Editing a Task
```javascript
window.App.openEditTaskModal(taskObject);
```

## 🔧 Development Guidelines

### Adding New Modules
1. Create module file in `/scripts/modules/`
2. Follow the class-based pattern
3. Include `init()` method
4. Export as default
5. Add to app.js module initialization
6. Update this documentation

### Module Best Practices
- **Single Responsibility** - Each module has one clear purpose
- **Dependency Injection** - Pass dependencies through constructor
- **Event-Driven Communication** - Use custom events for loose coupling
- **Error Boundaries** - Handle errors gracefully within modules
- **Memory Management** - Clean up resources in destroy() methods

This modular architecture ensures maintainability, testability, and scalability of the Dooing.Task application.
