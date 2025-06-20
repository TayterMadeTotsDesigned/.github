import { useState, useRef, useEffect } from 'react';
import { usePomodoroContext } from '../hooks/usePomodoroContext';

interface PomodoroSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PomodoroSettingsPanel = ({ isOpen, onClose }: PomodoroSettingsProps) => {
  const { state, updateSettings } = usePomodoroContext();
  const { settings } = state;
  
  const [localSettings, setLocalSettings] = useState(settings);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Handle outside click to save and close settings
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && 
          settingsRef.current && 
          !settingsRef.current.contains(event.target as Node)) {
        updateSettings(localSettings);
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, localSettings, updateSettings, onClose]);

  const handleSettingsChange = (key: keyof typeof localSettings, value: number | boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
  };

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="pomodoro-settings-overlay">
      <div ref={settingsRef} className="pomodoro-settings">
        <div className="settings-header">
          <h3>Timer Settings</h3>
          <p className="settings-subtitle">Customize your Pomodoro experience</p>
        </div>
        
        <div className="settings-content">
          {/* Duration Settings Section */}
          <div className="settings-section">
            <h4 className="section-title">Duration Settings</h4>
            <div className="settings-grid">
              <div className="setting-card">
                <div className="setting-icon">🍅</div>
                <div className="setting-content">
                  <label className="setting-label" htmlFor="work-duration">
                    Work Duration
                  </label>
                  <div className="setting-value">{localSettings.workDuration} min</div>
                  <input 
                    type="range" 
                    id="work-duration" 
                    min="5" 
                    max="90" 
                    step="5"
                    value={localSettings.workDuration}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSettingsChange('workDuration', parseInt(e.target.value));
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="setting-slider"
                  />
                </div>
              </div>
              
              <div className="setting-card">
                <div className="setting-icon">☕</div>
                <div className="setting-content">
                  <label className="setting-label" htmlFor="short-break-duration">
                    Short Break
                  </label>
                  <div className="setting-value">{localSettings.shortBreakDuration} min</div>
                  <input 
                    type="range" 
                    id="short-break-duration" 
                    min="3" 
                    max="30" 
                    step="2"
                    value={localSettings.shortBreakDuration}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSettingsChange('shortBreakDuration', parseInt(e.target.value));
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="setting-slider"
                  />
                </div>
              </div>
              
              <div className="setting-card">
                <div className="setting-icon">🏖️</div>
                <div className="setting-content">
                  <label className="setting-label" htmlFor="long-break-duration">
                    Long Break
                  </label>
                  <div className="setting-value">{localSettings.longBreakDuration} min</div>
                  <input 
                    type="range" 
                    id="long-break-duration" 
                    min="10" 
                    max="60" 
                    step="5"
                    value={localSettings.longBreakDuration}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSettingsChange('longBreakDuration', parseInt(e.target.value));
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="setting-slider"
                  />
                </div>
              </div>
              
              <div className="setting-card">
                <div className="setting-icon">🔄</div>
                <div className="setting-content">
                  <label className="setting-label" htmlFor="sessions-until-long">
                    Sessions until Long Break
                  </label>
                  <div className="setting-value">{localSettings.sessionsUntilLongBreak}</div>
                  <input 
                    type="range" 
                    id="sessions-until-long" 
                    min="2" 
                    max="10" 
                    step="1"
                    value={localSettings.sessionsUntilLongBreak}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleSettingsChange('sessionsUntilLongBreak', parseInt(e.target.value));
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="setting-slider"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Automation Settings Section */}
          <div className="settings-section">
            <h4 className="section-title">Automation & Notifications</h4>
            <div className="settings-toggles">
              <div className="setting-toggle">
                <div className="toggle-icon">🚀</div>
                <div className="toggle-content">
                  <label className="toggle-label">
                    <span className="toggle-text">Auto-start breaks</span>
                    <span className="toggle-description">Automatically start break sessions</span>
                  </label>
                  <div className="modern-toggle">
                    <input 
                      type="checkbox" 
                      id="auto-start-breaks"
                      checked={localSettings.autoStartBreaks}
                      onChange={(e) => handleSettingsChange('autoStartBreaks', e.target.checked)}
                    />
                    <label htmlFor="auto-start-breaks" className="toggle-switch"></label>
                  </div>
                </div>
              </div>
              
              <div className="setting-toggle">
                <div className="toggle-icon">⚡</div>
                <div className="toggle-content">
                  <label className="toggle-label">
                    <span className="toggle-text">Auto-start work sessions</span>
                    <span className="toggle-description">Automatically start work sessions</span>
                  </label>
                  <div className="modern-toggle">
                    <input 
                      type="checkbox" 
                      id="auto-start-work"
                      checked={localSettings.autoStartPomodoros}
                      onChange={(e) => handleSettingsChange('autoStartPomodoros', e.target.checked)}
                    />
                    <label htmlFor="auto-start-work" className="toggle-switch"></label>
                  </div>
                </div>
              </div>
              
              <div className="setting-toggle">
                <div className="toggle-icon">🔔</div>
                <div className="toggle-content">
                  <label className="toggle-label">
                    <span className="toggle-text">Sound notifications</span>
                    <span className="toggle-description">Play sound when sessions complete</span>
                  </label>
                  <div className="modern-toggle">
                    <input 
                      type="checkbox" 
                      id="sound-notifications"
                      checked={localSettings.soundEnabled}
                      onChange={(e) => handleSettingsChange('soundEnabled', e.target.checked)}
                    />
                    <label htmlFor="sound-notifications" className="toggle-switch"></label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="settings-actions">
          <button className="settings-save-btn" onClick={handleSave}>
            <span className="btn-icon">💾</span>
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default PomodoroSettingsPanel;
