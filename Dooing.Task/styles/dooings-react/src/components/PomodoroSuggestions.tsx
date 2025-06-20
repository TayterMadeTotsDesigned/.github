import React from 'react';
import type { TaskSuggestion, Task } from '../types';

interface PomodoroSuggestionsProps {
  suggestions: TaskSuggestion[];
  tomorrowTasks?: Task[];
  onAddTasks: () => void;
  onMoveTasksFromTomorrow: (tasks: Task[]) => void;
  onSelectTask: () => void;
  onDismiss: () => void;
  className?: string;
}

const PomodoroSuggestions: React.FC<PomodoroSuggestionsProps> = ({
  suggestions,
  tomorrowTasks = [],
  onAddTasks,
  onMoveTasksFromTomorrow,
  onSelectTask,
  onDismiss,
  className = ''
}) => {
  if (suggestions.length === 0) {
    return null;
  }

  const handleSuggestionAction = (suggestion: TaskSuggestion) => {
    switch (suggestion.type) {
      case 'add_tasks':
        onAddTasks();
        break;
      case 'move_from_tomorrow': {
        // Get high priority tasks from tomorrow or first few tasks
        const tasksToMove = tomorrowTasks
          .filter(task => !task.completed)
          .sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          })
          .slice(0, 3);
        onMoveTasksFromTomorrow(tasksToMove);
        break;
      }
      case 'continue_working':
        onSelectTask();
        break;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'add_tasks': return '➕';
      case 'move_from_tomorrow': return '⏭️';
      case 'continue_working': return '🎯';
      default: return '💡';
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'add_tasks': return 'suggestion-add';
      case 'move_from_tomorrow': return 'suggestion-move';
      case 'continue_working': return 'suggestion-focus';
      default: return 'suggestion-default';
    }
  };

  return (
    <div className={`pomodoro-suggestions ${className}`}>
      <div className="suggestions-header">
        <h4>💡 Smart Suggestions</h4>
        <button 
          className="dismiss-suggestions"
          onClick={onDismiss}
          title="Dismiss suggestions"
        >
          ×
        </button>
      </div>
      
      <div className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <div 
            key={index}
            className={`suggestion-item ${getSuggestionColor(suggestion.type)}`}
          >
            <div className="suggestion-content">
              <span className="suggestion-icon">
                {getSuggestionIcon(suggestion.type)}
              </span>
              <div className="suggestion-text">
                <p className="suggestion-message">{suggestion.message}</p>
                {suggestion.type === 'move_from_tomorrow' && tomorrowTasks.length > 0 && (
                  <div className="preview-tasks">
                    <span className="preview-label">Available tasks:</span>
                    {tomorrowTasks.slice(0, 2).map(task => (
                      <span key={task.id} className="preview-task">
                        {task.title}
                      </span>
                    ))}
                    {tomorrowTasks.length > 2 && (
                      <span className="preview-more">+{tomorrowTasks.length - 2} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button 
              className="suggestion-action"
              onClick={() => handleSuggestionAction(suggestion)}
            >
              {suggestion.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PomodoroSuggestions;
