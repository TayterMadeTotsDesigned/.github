import React from 'react';
import type { Task } from '../types';

interface PomodoroTaskSelectorProps {
  availableTasks: Task[];
  activeTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
  onClearTask: () => void;
  className?: string;
}

const PomodoroTaskSelector: React.FC<PomodoroTaskSelectorProps> = ({
  availableTasks,
  activeTaskId,
  onTaskSelect,
  onClearTask,
  className = ''
}) => {
  const activeTask = availableTasks.find(task => task.id === activeTaskId);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getContextIcon = (context: string) => {
    switch (context) {
      case 'work': return '💼';
      case 'personal': return '🧘';
      case 'home': return '🏠';
      case 'errands': return '🛒';
      case 'health': return '🏥';
      default: return '📝';
    }
  };

  if (availableTasks.length === 0) {
    return (
      <div className={`pomodoro-task-selector no-tasks ${className}`}>
        <div className="no-tasks-message">
          <p>No tasks available for today</p>
          <span className="suggestion-text">Add tasks or move some from tomorrow to get started!</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`pomodoro-task-selector ${className}`}>
      <div className="task-selector-header">
        <h4>Focus Task</h4>
        {activeTask && (
          <button 
            className="clear-task-btn"
            onClick={onClearTask}
            title="Clear selected task"
          >
            ×
          </button>
        )}
      </div>

      {activeTask ? (
        <div className="active-task-display">
          <div className="task-info">
            <span className="task-priority">{getPriorityIcon(activeTask.priority)}</span>
            <span className="task-context">{getContextIcon(activeTask.context || 'other')}</span>
            <div className="task-details">
              <h5 className="task-title">{activeTask.title}</h5>
              {activeTask.description && (
                <p className="task-description">{activeTask.description}</p>
              )}
            </div>
          </div>
          <div className="task-progress">
            <span className="pomodoro-count">
              {activeTask.completedPomodoros || 0} / {activeTask.estimatedPomodoros || '?'} 🍅
            </span>
          </div>
        </div>
      ) : (
        <div className="task-selection-area">
          <p className="selection-prompt">Select a task to focus on:</p>
          <div className="task-options">
            {availableTasks.slice(0, 3).map(task => (
              <button
                key={task.id}
                className={`task-option priority-${task.priority}`}
                onClick={() => onTaskSelect(task.id)}
              >
                <div className="task-option-header">
                  <span className="task-priority">{getPriorityIcon(task.priority)}</span>
                  <span className="task-context">{getContextIcon(task.context || 'other')}</span>
                  <span className="task-title">{task.title}</span>
                </div>
                {task.description && (
                  <span className="task-description">{task.description.substring(0, 50)}...</span>
                )}
                <div className="task-pomodoros">
                  {task.completedPomodoros || 0} / {task.estimatedPomodoros || '?'} 🍅
                </div>
              </button>
            ))}
            {availableTasks.length > 3 && (
              <div className="more-tasks-indicator">
                +{availableTasks.length - 3} more tasks available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTaskSelector;
