# Dooing.Task - A Sensible Planner

![Dooing.Task Logo](Dooing.Task/scripts/svg/Dooing-logo-2.svg)

A modern, responsive task management application with an integrated Pomodoro timer, built using vanilla JavaScript ES6 modules. Dooing.Task helps users maintain a structured daily workflow with smart task categorization, beautiful themes, and productivity features.

## 🌟 Features

### 📋 Task Management
- **Smart Categorization**: Tasks are automatically categorized into Today, Tomorrow, Future, and Overdue
- **Full CRUD Operations**: Create, read, update, and delete tasks with comprehensive form validation
- **Recurring Tasks**: Support for daily, weekly, and monthly recurring tasks with custom day selection
- **Task Limits**: Daily limits (6 tasks for Today/Tomorrow) and weekly limits (42 tasks for Future)
- **Auto-Movement**: Tasks automatically move between categories based on due dates
- **Real-time Updates**: Instant UI updates when tasks are completed, edited, or deleted

### ⏱️ Pomodoro Timer
- **Customizable Sessions**: Adjustable focus (15-90 mins), short break (5-35 mins), and long break (10-45 mins) durations
- **Session Management**: Configurable sessions per cycle (2-6) before triggering long breaks
- **Timer Controls**: Start, pause, reset, and skip functionality with multiple skip actions
- **Auto-start Options**: Automatic progression between work and break sessions
- **Sound Notifications**: Audio feedback for session completion and warnings
- **Settings Persistence**: Timer preferences saved across sessions

### 🎨 Themes & Customization
- **7 Beautiful Themes**:
  - Cool Blues (default)
  - Warm Neutrals
  - Bold Contrast
  - Earthy Greens
  - Pastel Gradient
  - Sunset Gradient
  - Vintage Gold
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: Modern accessibility standards with ARIA labels and keyboard navigation

### 📅 Calendar Views
- **Future Tasks**: Toggle between weekly and monthly calendar views
- **Interactive Calendar**: Click on calendar tasks to edit, complete, or delete
- **Recurring Task Display**: Visual distinction for recurring tasks in calendar
- **Context Menus**: Right-click actions for calendar tasks

### 💾 Data Persistence
- **Local Storage**: All tasks and settings saved locally in the browser
- **Settings Management**: Theme preferences and Pomodoro settings persist across sessions
- **Import/Export Ready**: Modular storage system ready for future cloud sync

## 🚀 Getting Started

### Prerequisites
- Modern web browser with ES6 module support
- Local web server (for development) or static hosting

### Installation
1. Clone or download the repository
2. Navigate to the Dooing.Task directory
3. Serve the files using a local web server:
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (with http-server)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
4. Open `http://localhost:8000` in your browser

### File Structure
```
Dooing.Task/
├── index.html              # Main application entry point
├── scripts/
│   ├── app.js              # Main application logic and initialization
│   ├── taskManager.js      # Task CRUD operations and categorization
│   ├── UI_Renderer.js      # UI rendering and event handling
│   ├── pomodoro.js         # Pomodoro timer functionality
│   ├── storage.js          # Local storage management
│   ├── utils.js            # Utility functions
│   └── svg/                # SVG icons and assets
├── styles/
│   ├── dooing-main.css     # Main styles and theme system
│   ├── pomodoro.css        # Pomodoro timer specific styles
│   └── sidebar.css         # Sidebar and navigation styles
└── POMODORO.md             # Pomodoro implementation details
```

## 📖 Usage

### Creating Tasks
1. Click the "+" button or "Add Task" in any empty category
2. Fill in task details:
   - **Name**: Task title (required)
   - **Description**: Optional task description
   - **Due Date**: Auto-assigned for Today/Tomorrow, date picker for Future
   - **Recurring**: Optional recurring settings (daily, weekly, monthly)
3. Click "Add Task" to create

### Managing Tasks
- **Complete**: Click the checkbox to mark tasks as done
- **Edit**: Click the edit button (✏️) to modify task details
- **Delete**: Click the delete button (🗑️) to remove tasks
- **Navigate**: Use arrow buttons or swipe to switch between categories

### Using the Pomodoro Timer
1. Click the settings icon to access Pomodoro settings
2. Adjust timer durations and cycle preferences
3. Click play to start a focus session
4. Use pause, reset, or skip as needed
5. Follow the automatic break prompts

### Customizing Themes
1. Access settings via the sidebar or header
2. Select from 7 available themes
3. Theme preference is automatically saved

## 🏗️ Architecture

### Modular Design
- **ES6 Modules**: Clean separation of concerns with import/export
- **Event-Driven**: Reactive UI updates based on data changes
- **Responsive**: Mobile-first CSS with flexible grid layouts
- **Accessible**: WCAG compliant with proper semantic HTML

### Key Components
- **App**: Main application controller and event coordination
- **TaskManager**: Task business logic and data management
- **UIRenderer**: DOM manipulation and rendering
- **PomodoroTimer**: Timer functionality and session management
- **Storage**: Data persistence layer

### Data Flow
1. User interactions trigger events in `app.js`
2. `TaskManager` handles business logic and data updates
3. `Storage` persists changes to localStorage
4. `UIRenderer` updates the interface reactively
5. State changes propagate through the module system

## 🔧 Development

### Adding New Features
1. **New Task Properties**: Extend the task object in `taskManager.js`
2. **UI Components**: Add rendering logic to `UI_Renderer.js`
3. **Styles**: Follow the CSS variable system for consistency
4. **Storage**: Update schema in `storage.js` for persistence

### Theme Development
1. Define CSS variables in the `:root` scope
2. Create a `[data-theme="theme-name"]` selector
3. Add theme option to the settings dropdown
4. Test across all components and views

### Testing
- Test across multiple browsers and devices
- Verify localStorage persistence
- Check theme transitions
- Validate task categorization logic
- Test Pomodoro timer functionality

## 🎯 Current Implementation Status

### ✅ Completed Features
- ✅ Core task management (CRUD operations)
- ✅ Smart task categorization (Today, Tomorrow, Future, Overdue)
- ✅ Recurring tasks with daily, weekly, monthly options
- ✅ Integrated Pomodoro timer with full settings
- ✅ 7 beautiful themes with persistence
- ✅ Responsive design for all devices
- ✅ Calendar views (weekly/monthly) for Future tasks
- ✅ Real-time UI updates and task counts
- ✅ Local storage persistence
- ✅ Task limits and validation
- ✅ Accessibility features

### 🔄 Recently Fixed
- ✅ Delete task button functionality with confirmation prompts
- ✅ Real-time count updates when tasks are completed/deleted
- ✅ Consistent ID handling across all task operations
- ✅ Calendar task interactions (edit, complete, delete)
- ✅ Recurring task display and management in calendar
- ✅ Modal design modernization
- ✅ Empty state styling consistency

## 🎯 Future Enhancements

### Planned Features
- **User Accounts**: Authentication and cloud sync
- **Advanced Analytics**: Task completion tracking and insights
- **Team Collaboration**: Shared workspaces and task assignment
- **Mobile App**: Native iOS and Android applications
- **Integrations**: Calendar sync and third-party productivity tools
- **Gamification**: Achievement system and productivity rewards
- **Virtual Pet**: Companion that grows with productivity

### Technical Improvements
- **Progressive Web App**: Offline support and app-like experience
- **Performance**: Lazy loading and optimized rendering
- **Testing**: Comprehensive unit and integration test suite
- **Accessibility**: Enhanced screen reader support
- **Internationalization**: Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the existing code style and architecture
4. Test your changes thoroughly
5. Commit with descriptive messages
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style
- Use ES6+ features and modern JavaScript
- Follow the existing module structure
- Comment complex logic and business rules
- Use semantic HTML and accessible markup
- Follow the CSS variable system for theming

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Icons provided by [SVG Repo](https://www.svgrepo.com/)
- Inspired by productivity methodologies and modern task management principles
- Built with accessibility and user experience as core principles

---

**Dooing.Task** - Making productivity simple, one task at a time. 🎯