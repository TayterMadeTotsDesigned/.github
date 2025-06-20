import { useUIContext } from '../contexts';
import type { TaskCategory } from '../types';

const Sidebar = () => {
  const { state, closeSidebar, setCategory } = useUIContext();
  const { isSidebarOpen } = state;
  
  const handleNavigate = (page: string) => {
    // Handle navigation to different pages
    if (page === 'today' || page === 'tomorrow' || page === 'future') {
      setCategory(page as TaskCategory);
    } else if (page === 'pomodoro') {
      setCategory('pomodoro');
    } else {
      // For other navigation targets like settings, help, notes
      console.log('Navigation to', page, 'not fully implemented yet');
    }
    
    closeSidebar(); // Close sidebar after navigation
  };

  return (
    <div className={`sidebar-menu ${isSidebarOpen ? 'active' : ''}`}>
      <div className="sidebar-header">
        <button 
          className="sidebar-close" 
          aria-label="Close menu" 
          type="button"
          onClick={closeSidebar}
        >
          <div className="hamburger-bar"></div>
          <div className="hamburger-bar"></div>
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-actions">
          <button 
            id="settings-btn" 
            className="settings-btn"
            onClick={() => handleNavigate('settings')}
          >
            Settings
          </button>
          <button 
            id="help-btn" 
            className="help-btn"
            onClick={() => handleNavigate('help')}
          >
            Help
          </button>
        </div>

        <ul className="sidebar-nav-list">
          {/* Task Management Section */}
          <li className="sidebar-section-header">Task Management</li>
          <li className="sidebar-nav-item">
            <a 
              href="#" 
              className="sidebar-nav-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('today');
              }}
            >
              <div className="nav-dot"></div>
              <span className="nav-text">Today</span>
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a 
              href="#" 
              className="sidebar-nav-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('tomorrow');
              }}
            >
              <div className="nav-dot"></div>
              <span className="nav-text">Tomorrow</span>
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a 
              href="#" 
              className="sidebar-nav-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('future');
              }}
            >
              <div className="nav-dot"></div>
              <span className="nav-text">Calendar</span>
            </a>
          </li>

          {/* Productivity Tools Section */}
          <li className="sidebar-section-header">Productivity Tools</li>
          <li className="sidebar-nav-item">
            <a 
              href="#" 
              className="sidebar-nav-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('pomodoro');
              }}
            >
              <div className="nav-dot"></div>
              <span className="nav-text">Pomodoro</span>
            </a>
          </li>
          <li className="sidebar-nav-item">
            <a 
              href="#" 
              className="sidebar-nav-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavigate('notes');
              }}
            >
              <div className="nav-dot"></div>
              <span className="nav-text">Notes</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
