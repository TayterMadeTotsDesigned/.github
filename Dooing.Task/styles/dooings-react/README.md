# Dooing.Task - Modern React Task Management Application

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

A modern, feature-rich task management application built with React, TypeScript, and Vite. Dooing.Task combines sleek design with powerful productivity features, including an integrated Pomodoro timer, drag-and-drop functionality, and multiple stunning visual themes inspired by early 2000s design aesthetics.

## 🌟 Features

### ✅ Task Management
- **CRUD Operations**: Create, read, update, and delete tasks with ease
- **Context-Based Organization**: Categorize tasks by work, personal, home, errands, health, and other contexts
- **Priority System**: Set task priorities with visual indicators
- **Due Date Management**: Track deadlines with intuitive date selection
- **Drag & Drop Interface**: Reorder tasks and move between categories seamlessly
- **Recurring Tasks**: Set up daily and weekly recurring tasks
- **Task Notes**: Add detailed descriptions and notes to tasks

### 🍅 Pomodoro Timer Integration
- **Modern Timer Interface**: Sleek, glassmorphic design with progress visualization
- **Session Management**: Work and break intervals with customizable durations
- **Task Integration**: Link timer sessions directly to specific tasks
- **Audio Notifications**: Sound alerts for session completion
- **Statistics Tracking**: Monitor productivity patterns and session history
- **Settings Panel**: Customizable timer intervals and preferences

### 🎨 Visual Design System
- **8 Retro Themes**: Early 2000s-inspired visual themes including:
  - Rainbow Burst
  - Electric Orange
  - Cyber Blue
  - Purple Haze
  - Sunset Blast
  - Ocean Wave
  - Candy Pop
  - Neon Green
- **Modern CSS Features**: Glassmorphism, neumorphism, and advanced animations
- **Responsive Design**: Optimized for all screen sizes and devices
- **Dark/Light Mode**: Automatic system preference detection
- **High Contrast Support**: Accessibility-compliant color schemes

### 📱 Modern UI/UX
- **Mobile-First Design**: Touch-friendly interface with proper target sizes
- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Reader Compatible**: ARIA labels and semantic HTML
- **Progressive Enhancement**: Graceful degradation for older browsers
- **High-DPI Support**: Crisp visuals on retina and 4K displays

## 🏗️ Architecture

### Technology Stack
- **Frontend Framework**: React 19.1.0 with Hooks and Context API
- **Language**: TypeScript 5.8.3 for type safety
- **Build Tool**: Vite 6.3.5 for lightning-fast development
- **Styling**: Modern CSS with custom properties and advanced features
- **State Management**: React Context with custom hooks
- **Drag & Drop**: React DnD for intuitive interactions

### Project Structure
```
src/
├── components/           # React components
│   ├── Calendar.tsx     # Calendar view component
│   ├── Header.tsx       # Application header
│   ├── HeroSection.tsx  # Landing/hero section
│   ├── PomodoroTimer.tsx # Pomodoro timer component
│   ├── Sidebar.tsx      # Navigation sidebar
│   ├── TaskSection.tsx  # Task management area
│   └── ...             # Additional components
├── contexts/            # React contexts for state management
│   ├── AppProvider.tsx  # Main app context provider
│   ├── PomodoroContext.tsx # Pomodoro timer state
│   ├── TaskContext.tsx  # Task management state
│   └── UIContext.tsx    # UI state management
├── hooks/               # Custom React hooks
│   ├── useContexts.ts   # Context convenience hooks
│   └── ...             # Additional custom hooks
├── styles/              # CSS modules and stylesheets
│   ├── animations.css   # Animation definitions
│   ├── themes.css       # Theme system (2000+ lines)
│   ├── pomodoro.css     # Pomodoro timer styles
│   └── ...             # Component-specific styles
├── types/               # TypeScript type definitions
│   └── index.ts         # Shared type definitions
└── utils/               # Utility functions
```

### State Management Architecture
The application uses a context-based state management system with three main contexts:

1. **TaskContext**: Manages task CRUD operations, filtering, and persistence
2. **PomodoroContext**: Handles timer state, sessions, and task integration
3. **UIContext**: Controls UI state, themes, and visual preferences

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- Modern web browser with ES2020+ support

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd dooings-react
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production-ready application
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

## 🎨 Theme System

The application features a comprehensive theme system with 8 unique visual styles:

### Theme Categories
- **Rainbow Burst**: Vibrant multi-color gradients with dynamic animations
- **Electric Orange**: High-energy orange and amber color scheme
- **Cyber Blue**: Futuristic blue tones with digital aesthetics
- **Purple Haze**: Rich purple gradients with mystical effects
- **Sunset Blast**: Warm sunset colors with gradient transitions
- **Ocean Wave**: Cool blue-green tones with flowing animations
- **Candy Pop**: Playful pink and bright color combinations
- **Neon Green**: Electric green with retro-futuristic styling

### Theme Features
- **CSS Custom Properties**: Dynamic theme switching without page reload
- **Animation Integration**: Theme-specific background animations and effects
- **Responsive Adaptation**: Themes adapt to different screen sizes
- **Accessibility Compliance**: Proper contrast ratios maintained across all themes
- **Performance Optimized**: GPU-accelerated animations with fallbacks

## � Responsive Design

### Breakpoint System
- **Extra Small** (320px+): Mobile phones in portrait
- **Small** (576px+): Large phones and small tablets
- **Medium** (768px+): Tablets and small laptops
- **Large** (992px+): Laptops and desktops
- **Extra Large** (1200px+): Large desktops
- **Ultra Wide** (1920px+): Ultra-wide and 4K displays

### Modern CSS Features
- **Container Queries**: Component-based responsive design
- **Fluid Typography**: Responsive text scaling with clamp()
- **CSS Grid & Flexbox**: Modern layout techniques
- **Logical Properties**: Internationalization-ready spacing
- **High-DPI Support**: Optimized for retina displays
- **Safe Area Support**: Modern device notch/cutout handling

## ♿ Accessibility

### Standards Compliance
- **WCAG 2.1 AA**: Meets Web Content Accessibility Guidelines
- **Keyboard Navigation**: Full keyboard support with proper focus management
- **Screen Reader Support**: Semantic HTML with ARIA labels
- **Color Contrast**: 4.5:1 minimum contrast ratio across all themes
- **Motion Preferences**: Respects user's reduced motion preferences
- **High Contrast Mode**: Support for OS-level high contrast settings

### Accessibility Features
- **Focus Indicators**: Clear visual focus states
- **Touch Targets**: Minimum 48px touch targets on mobile
- **Alternative Text**: Descriptive text for all visual elements
- **Color Independence**: Information not conveyed by color alone
- **Scalable Interface**: Supports up to 200% zoom without horizontal scrolling

## 🔧 Configuration

### Environment Variables
```env
# Development
VITE_APP_TITLE=Dooing.Task
VITE_APP_VERSION=0.0.0

# Production (optional)
VITE_ANALYTICS_ID=your-analytics-id
VITE_API_BASE_URL=your-api-url
```

### Theme Customization
Themes can be customized by modifying CSS custom properties in `src/styles/themes.css`:

```css
[data-theme="custom"] {
  --accent: #your-color;
  --accent-rgb: r, g, b;
  --bg: #background-color;
  --text: #text-color;
  /* Additional theme variables */
}
```

## 🧪 Testing

### Current Testing Setup
- **ESLint**: Code quality and consistency checks
- **TypeScript**: Compile-time type checking
- **Browser Testing**: Manual testing across modern browsers

### Future Testing Plans
- Unit tests with Jest and React Testing Library
- Integration tests for component interactions
- E2E tests with Playwright or Cypress
- Visual regression testing

## 📦 Build & Deployment

### Production Build
```bash
npm run build
```

This creates an optimized production build in the `dist/` directory with:
- Code splitting and tree shaking
- Asset optimization and compression
- CSS minification and purging
- TypeScript compilation and checking

### Deployment Options
- **Vercel**: Zero-config deployment for Vite projects
- **Netlify**: Drag-and-drop deployment with form handling
- **GitHub Pages**: Free hosting for static sites
- **Docker**: Containerized deployment for any platform

## 🏗️ Development Roadmap & Blueprint

Based on the current build state, here's a comprehensive blueprint for future development:

### Phase 1: Core Functionality Enhancement (Weeks 1-4)

#### 🔄 Data Persistence & Sync
**Priority: High**
- **Local Storage Enhancement**
  - Implement robust localStorage with data migration
  - Add import/export functionality for task data
  - Create backup and restore mechanisms

- **Cloud Sync Integration**
  - Design API integration layer for cloud storage
  - Implement user authentication system
  - Add real-time sync across devices
  - **Technologies**: Firebase, Supabase, or custom REST API

#### 🧪 Testing Infrastructure
**Priority: High**
- **Unit Testing Setup**
  - Configure Jest and React Testing Library
  - Write tests for all context providers
  - Test utility functions and custom hooks
  - Target: 80%+ code coverage

- **Integration Testing**
  - Component interaction tests
  - Context integration tests
  - Drag-and-drop functionality tests

- **E2E Testing**
  - User workflow automation
  - Cross-browser compatibility testing
  - Performance regression testing

#### 📊 Analytics & Insights
**Priority: Medium**
- **Productivity Analytics**
  - Task completion rates and trends
  - Pomodoro session effectiveness metrics
  - Time tracking and reporting
  - Weekly/monthly productivity reports

- **Data Visualization**
  - Interactive charts with Chart.js or D3.js
  - Productivity heatmaps
  - Goal tracking visualizations

### Phase 2: Advanced Features (Weeks 5-8)

#### 🤖 AI Integration
**Priority: Medium**
- **Smart Task Suggestions**
  - AI-powered task prioritization
  - Deadline prediction and warnings
  - Workload balancing recommendations

- **Natural Language Processing**
  - Voice-to-task conversion
  - Smart task parsing from text input
  - Automated categorization

#### 🔗 Integrations & API
**Priority: Medium**
- **Calendar Integration**
  - Google Calendar sync
  - Outlook integration
  - Apple Calendar support

- **Third-Party Tools**
  - Slack/Discord notifications
  - GitHub issue integration
  - Notion/Obsidian sync

#### 🌐 Collaboration Features
**Priority: Low**
- **Team Workspaces**
  - Shared task lists and projects
  - Team member assignments
  - Real-time collaboration

- **Communication Tools**
  - Task comments and mentions
  - Activity feeds and notifications
  - File sharing and attachments

### Phase 3: Platform Expansion (Weeks 9-12)

#### 📱 Mobile Applications
**Priority: High**
- **Progressive Web App (PWA)**
  - Offline functionality
  - Push notifications
  - App store distribution

- **Native Mobile Apps**
  - React Native implementation
  - iOS and Android optimization
  - Native notifications and widgets

#### 🖥️ Desktop Applications
**Priority: Medium**
- **Electron Desktop App**
  - Cross-platform desktop application
  - System tray integration
  - Global hotkeys and shortcuts

- **Browser Extensions**
  - Chrome/Firefox extensions
  - Quick task capture from any webpage
  - Integration with existing workflows

### Phase 4: Advanced Customization (Weeks 13-16)

#### 🎨 Enhanced Theming
**Priority: Low**
- **Theme Editor**
  - Visual theme customization interface
  - Custom color picker and preview
  - Community theme sharing

- **Dynamic Themes**
  - Time-based theme switching
  - Weather-responsive themes
  - Seasonal theme variations

#### ⚡ Performance Optimization
**Priority: High**
- **Code Optimization**
  - Bundle size reduction
  - Lazy loading implementation
  - Service worker caching

- **Advanced Features**
  - Virtual scrolling for large task lists
  - Predictive loading and caching
  - WebAssembly integration for complex calculations

### Implementation Priority Matrix

| Feature Category | Priority | Estimated Effort | Business Impact |
|-----------------|----------|------------------|-----------------|
| Data Persistence | High | 3 weeks | Critical for user retention |
| Testing Infrastructure | High | 2 weeks | Essential for reliability |
| Mobile PWA | High | 4 weeks | Massive user base expansion |
| Analytics Dashboard | Medium | 3 weeks | High user engagement |
| AI Integration | Medium | 4 weeks | Competitive differentiation |
| Team Collaboration | Low | 6 weeks | Enterprise market entry |
| Desktop Apps | Medium | 3 weeks | Power user retention |
| Theme Editor | Low | 2 weeks | Community engagement |

### Technical Debt & Refactoring

#### Code Quality Improvements
- **Component Optimization**
  - Extract reusable UI components
  - Implement proper error boundaries
  - Add loading states and skeletons

- **State Management Enhancement**
  - Implement state persistence middleware
  - Add state debugging tools
  - Optimize context re-renders

- **Performance Monitoring**
  - Add React DevTools profiling
  - Implement performance metrics
  - Monitor bundle size and loading times

#### Documentation & Developer Experience
- **API Documentation**
  - Component documentation with Storybook
  - Context API usage guides
  - TypeScript type documentation

- **Development Tools**
  - Pre-commit hooks with Husky
  - Automated code formatting with Prettier
  - Continuous integration pipeline

### Success Metrics & KPIs

#### User Engagement
- Daily/Monthly Active Users (DAU/MAU)
- Session duration and frequency
- Feature adoption rates
- User retention by cohort

#### Technical Performance
- Page load speed (< 2 seconds)
- Time to interactive (< 3 seconds)
- Error rates (< 1%)
- Accessibility score (> 95%)

#### Business Metrics
- User conversion rates
- Feature usage analytics
- Support ticket volume
- User satisfaction scores

---

This roadmap provides a structured approach to evolving Dooing.Task from its current solid foundation into a comprehensive productivity platform. The phased approach ensures steady progress while maintaining code quality and user experience standards.

- ⌨️ **Keyboard Shortcuts**: Quick navigation and task management
- 🔄 **State Management**: Clean React hooks-based state management

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Navigation header with category switching
│   ├── Sidebar.tsx     # Sidebar navigation menu
│   ├── TaskSection.tsx # Task list container
│   ├── TaskItem.tsx    # Individual task component
│   ├── TaskModal.tsx   # Task creation/editing modal
│   ├── PomodoroTimer.tsx # Pomodoro timer component
│   ├── HeroSection.tsx # Hero section with category info
│   └── Footer.tsx      # Application footer
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── styles/             # CSS stylesheets
│   ├── dooing-main.css # Main application styles
│   ├── sidebar.css     # Sidebar-specific styles
│   └── pomodoro.css    # Pomodoro timer styles
└── App.tsx             # Main application component
```

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Component Architecture

### Main Components

- **App.tsx**: Root component managing global state and routing
- **Header.tsx**: Navigation with category switching and new task button
- **Sidebar.tsx**: Collapsible navigation menu
- **TaskSection.tsx**: Container for task lists with category-specific rendering
- **TaskItem.tsx**: Individual task with edit/delete actions
- **TaskModal.tsx**: Form modal for creating and editing tasks
- **PomodoroTimer.tsx**: Full-featured Pomodoro timer with settings

### State Management

The application uses React's built-in state management with hooks:
- `useState` for component-level state
- `useEffect` for side effects and data persistence
- Props drilling for passing data between components
- Local storage for data persistence

### TypeScript Types

All components are fully typed with TypeScript interfaces defined in `src/types/index.ts`:
- `Task`: Core task data structure
- `PomodoroSession`: Timer session state
- Component props interfaces for type safety

## Styling

The application maintains the original design system:
- CSS custom properties for theming
- Modern glass morphism effects
- Smooth animations and transitions
- Responsive grid layouts
- Mobile-first design approach

## Data Persistence

- Tasks and settings are automatically saved to browser's localStorage
- Data is loaded on application startup
- Real-time sync between components

## Browser Support

- Modern browsers with ES6+ support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

Contributions are welcome! This project is designed for developers of all skill levels to learn and contribute to modern React development.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the coding guidelines
4. **Add tests** for new functionality
5. **Ensure all tests pass**: `npm run test`
6. **Commit your changes**: `git commit -m 'Add amazing feature'`
7. **Push to the branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Add JSDoc comments for complex functions
- Ensure TypeScript types are properly defined
- Test your changes across different browsers
- Update documentation when adding new features

### Learning Opportunities

This project is perfect for developers to learn:

1. **Component Composition**: Breaking UI into reusable components
2. **Props and State**: Data flow and state management
3. **TypeScript**: Type safety and better developer experience
4. **Modern CSS**: Advanced styling techniques and responsive design
5. **Build Tools**: Vite for fast development and building
6. **Context API**: Global state management patterns
7. **Custom Hooks**: Reusable stateful logic
8. **Accessibility**: WCAG guidelines and inclusive design

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow open source best practices

## 📞 Support & Contact

### Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions and share ideas
- **Documentation**: Check the project wiki for detailed guides
- **Code Review**: Submit PRs for feedback and learning

### Community

This project welcomes developers of all experience levels. Whether you're a beginner learning React or an experienced developer wanting to contribute, your input is valuable.

### Bug Reports

When reporting bugs, please include:
- Steps to reproduce the issue
- Expected vs actual behavior
- Browser and version information
- Screenshots or error messages
- Code snippets if relevant

### Feature Requests

For new features, please provide:
- Clear description of the proposed feature
- Use case and business value
- Implementation suggestions
- Mockups or examples if applicable

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**MIT License Summary:**
- ✅ Commercial use allowed
- ✅ Modification allowed  
- ✅ Distribution allowed
- ✅ Private use allowed
- ⚠️ License and copyright notice required
- ❌ No warranty provided

---

**Built with ❤️ using modern web technologies for the developer community**

*Happy coding! 🚀*
