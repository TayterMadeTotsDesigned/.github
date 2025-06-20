import { useTaskContext, useUIContext } from '../contexts';
import { TaskContextColors, type Task } from '../types';

interface TaskItemProps {
  task: Task;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (taskId: string, selected: boolean) => void;
}

const TaskItem = ({ 
  task,
  isSelectable = false,
  isSelected = false,
  onSelectionChange
}: TaskItemProps) => {
  const { toggleTaskCompletion, deleteTask } = useTaskContext();
  const { openEditModal, state: uiState } = useUIContext();
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const handleToggle = () => {
    toggleTaskCompletion(task.id);
  };

  const handleEdit = () => {
    openEditModal(task.id);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(task.id);
    }
  };

  // Get retro classes based on theme and task state
  const getTaskClasses = () => {
    const classes = [];
    const theme = uiState.theme;
    
    if (task.completed) {
      if (theme?.includes('rainbow')) {
        classes.push('rainbow-text');
      }
      if (theme?.includes('neon') || theme?.includes('cyber')) {
        classes.push('neon-sign');
      }
      if (theme?.includes('disco')) {
        classes.push('disco-ball');
      }
    } else {
      if (theme?.includes('candy') || theme?.includes('pop')) {
        classes.push('retro-pulse');
      }
      if (theme?.includes('electric')) {
        classes.push('retro-glow');
      }
    }
    
    return classes.join(' ');
  };

  return (
    <div 
      className={`task-item ${task.completed ? 'completed' : ''} ${isSelected ? 'selected' : ''} ${getTaskClasses()}`}
      data-priority={task.priority}
      data-context={task.context || 'other'}
      style={{
        borderLeftColor: getPriorityColor(task.priority)
      }}
    >
      {task.context && TaskContextColors[task.context] && (
        <div 
          className="task-context-indicator" 
          style={{ backgroundColor: TaskContextColors[task.context].color }}
          title={`${task.context.charAt(0).toUpperCase() + task.context.slice(1)} context`}
        >
          {TaskContextColors[task.context].icon}
        </div>
      )}
      {isSelectable && (
        <div className="task-selection">
          <input 
            type="checkbox" 
            checked={isSelected} 
            onChange={(e) => onSelectionChange?.(task.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="selection-checkbox"
          />
        </div>
      )}
      <div className="task-content">
        <div className="task-checkbox-container">
          <input
            type="checkbox"
            className="task-checkbox"
            checked={task.completed}
            onChange={handleToggle}
            aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          />
        </div>
        
        <div className="task-details">
          <div className="task-title">{task.title}</div>
          {task.description && (
            <div className="task-description">{task.description}</div>
          )}
          <div className="task-meta">
            <span className="task-priority">{task.priority}</span>
            {task.dueDate && (
              <span className="task-due-date">Due: {formatDate(task.dueDate)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="task-actions">
        <button 
          className="task-edit-btn" 
          aria-label="Edit task"
          onClick={handleEdit}
        >
          ✏️
        </button>
        <button 
          className="task-delete-btn" 
          aria-label="Delete task"
          onClick={handleDelete}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
