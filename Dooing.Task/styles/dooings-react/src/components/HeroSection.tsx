import { useUIContext } from '../contexts';
import { useEffect, useState } from 'react';

const HeroSection = () => {
  const { state } = useUIContext();
  const { currentCategory, theme } = state;
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const displayCategory = 
    currentCategory === 'today' ? 'Today' :
    currentCategory === 'tomorrow' ? 'Tomorrow' :
    currentCategory === 'future' ? 'Future' : 'Pomodoro';

  const getCategoryIcon = () => {
    switch (displayCategory) {
      case 'Today':
        return '/assets/elephant-svgrepo-com.svg';
      case 'Tomorrow':
        return '/assets/giraffe-svgrepo-com.svg';
      case 'Future':
        return '/assets/bee-svgrepo-com.svg';
      case 'Pomodoro':
        return '/assets/timer-remove-svgrepo-com.svg';
      default:
        return '/assets/bee-svgrepo-com.svg';
    }
  };

  const getCategoryDescription = () => {
    switch (displayCategory) {
      case 'Today':
        return 'Focus on what matters most today';
      case 'Tomorrow':
        return 'Plan ahead for tomorrow\'s success';
      case 'Future':
        return 'Dream big and schedule your goals';
      case 'Pomodoro':
        return 'Stay focused with the Pomodoro Technique';
      default:
        return 'Organize your tasks efficiently';
    }
  };

  const getCategoryEmoji = () => {
    switch (displayCategory) {
      case 'Today': return '🐘';
      case 'Tomorrow': return '🦒';
      case 'Future': return '🐝';
      case 'Pomodoro': return '🍅';
      default: return '📝';
    }
  };

  // Get special classes based on theme
  const getThemeClasses = () => {
    const classes = [];
    if (theme?.includes('rainbow')) classes.push('rainbow-text');
    if (theme?.includes('neon') || theme?.includes('cyber')) classes.push('neon-sign');
    if (theme?.includes('electric')) classes.push('retro-glow');
    if (theme?.includes('candy') || theme?.includes('pop')) classes.push('retro-pulse');
    return classes.join(' ');
  };

  const titleClasses = `hero-title ${getThemeClasses()}`;

  return (
    <section className={`hero ${isVisible ? 'hero-visible' : ''}`}>
      <div className="hero-background">
        <div className="hero-pattern"></div>
      </div>
      <div className="hero-content">
        <div className="glass-bubble">
          <div className="hero-icon">
            <img 
              src={getCategoryIcon()} 
              alt={`${displayCategory} category icon`}
              loading="eager"
            />
          </div>
          <h1 className={titleClasses} data-text={displayCategory}>
            <span className="hero-emoji" aria-hidden="true">{getCategoryEmoji()}</span>
            {displayCategory}
          </h1>
          <p className="hero-subtitle">{getCategoryDescription()}</p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
