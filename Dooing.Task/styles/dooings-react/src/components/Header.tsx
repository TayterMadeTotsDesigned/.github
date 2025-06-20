import { useState, useEffect, useMemo } from 'react';
import { useUIContext } from '../contexts';
import type { TaskCategory } from '../types';

const Header = () => {
  const { state, setCategory, toggleSidebar, openCreateModal, setTheme } = useUIContext();
  const { currentCategory } = state;
  
  const [currentDate, setCurrentDate] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(state.theme || 'default');

  const categories = [
    { id: 'today', label: 'Today' },
    { id: 'tomorrow', label: 'Tomorrow' },
    { id: 'future', label: 'Future' },
  ];

  const themes = useMemo(() => [
    { value: 'default', label: 'Default' },
    { value: 'rainbow-burst', label: '🌈 Rainbow Burst' },
    { value: 'electric-orange', label: '🔥 Electric Orange' },
    { value: 'cyber-blue', label: '💙 Cyber Blue' },
    { value: 'purple-haze', label: '💜 Purple Haze' },
    { value: 'sunset-blast', label: '🌅 Sunset Blast' },
    { value: 'ocean-wave', label: '🌊 Ocean Wave' },
    { value: 'candy-pop', label: '🍭 Candy Pop' },
    { value: 'neon-green', label: '🔋 Neon Green' },
  ], []);

  // Update current date
  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      setCurrentDate(now.toLocaleDateString('en-US', options));
    };

    updateDate();
    const interval = setInterval(updateDate, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Theme handling
  useEffect(() => {
    const applyTheme = (theme: string) => {
      const body = document.body;
      
      if (theme !== 'default') {
        body.setAttribute('data-theme', theme);
      } else {
        body.removeAttribute('data-theme');
      }
    };

    const savedTheme = localStorage.getItem('dooing-theme') || 'default';
    setSelectedTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme: string) => {
    const body = document.body;
    
    if (theme !== 'default') {
      body.setAttribute('data-theme', theme);
    } else {
      body.removeAttribute('data-theme');
    }
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value;
    setSelectedTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('dooing-theme', newTheme);
    setTheme(newTheme);
  };

  const currentIndex = categories.findIndex(cat => cat.id === currentCategory);

  const handlePrevCategory = () => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : categories.length - 1;
    setCategory(categories[prevIndex].id as TaskCategory);
  };

  const handleNextCategory = () => {
    const nextIndex = currentIndex < categories.length - 1 ? currentIndex + 1 : 0;
    setCategory(categories[nextIndex].id as TaskCategory);
  };

  return (
    <header className="header">
      {/* Left section: Logo + Tagline */}
      <div className="header-left">
        <div className="header-logo">
          <img src="/assets/Dooing-logo-2.svg" alt="Dooing.Task" />
        </div>
        <p className="header-text">A Sensible Planner</p>
      </div>

      {/* Center section: Date + Navigation + Theme */}
      <div className="header-center">
        <button 
          id="left-arrow-btn" 
          className="arrow-btn" 
          aria-label="Previous Category"
          onClick={handlePrevCategory}
        >
          <img src="/assets/arrow-left-square-svgrepo-com.svg" alt="Previous" />
        </button>

        <div className="current-date" id="current-date">
          <span id="current-date-text">{currentDate}</span>
        </div>

        <button 
          id="right-arrow-btn" 
          className="arrow-btn" 
          aria-label="Next Category"
          onClick={handleNextCategory}
        >
          <img src="/assets/arrow-right-square-svgrepo-com.svg" alt="Next" />
        </button>

        <div className="theme-selector-container">
          <label htmlFor="theme-selector" className="theme-label">Theme:</label>
          <select 
            id="theme-selector" 
            className="theme-selector"
            value={selectedTheme}
            onChange={handleThemeChange}
            aria-label="Select theme"
          >
            {themes.map(theme => (
              <option key={theme.value} value={theme.value}>
                {theme.label}
              </option>
            ))}
          </select>
        </div>

        <button 
          id="new-task-btn" 
          className="new-task-btn" 
          aria-label="New Task"
          onClick={() => openCreateModal()}
        >
          <img src="/assets/todo-add-svgrepo-com.svg" alt="Add task" />
        </button>
      </div>

      {/* Right section: Action Buttons */}
      <div className="header-right">
        <button 
          className="sidebar" 
          aria-label="Toggle menu" 
          type="button"
          onClick={toggleSidebar}
        >
          <div className="hamburger-bar"></div>
          <div className="hamburger-bar"></div>
          <div className="hamburger-bar"></div>
        </button>
      </div>
    </header>
  );
};

export default Header;
