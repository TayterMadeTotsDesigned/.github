import { useState } from 'react';
import { useTaskContext } from '../contexts/TaskContext';

interface PomodoroTaskInputProps {
  onTaskAdded?: () => void;
}

const PomodoroTaskInput = ({ onTaskAdded }: PomodoroTaskInputProps) => {
  const [taskTitle, setTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const taskContext = useTaskContext();

  if (!taskContext) {
    throw new Error('PomodoroTaskInput must be used within a TaskProvider');
  }

  const { addTask } = taskContext;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsAdding(true);
    try {
      await addTask({
        title: taskTitle.trim(),
        description: '',
        completed: false,
        category: 'today',
        priority: 'medium',
        estimatedPomodoros: 1 // Default to one pomodoro
      });
      
      setTaskTitle('');
      onTaskAdded?.();
    } catch (error) {
      console.error('Failed to add task:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="pomodoro-task-input-section">
      <div className="task-input-header">
        <h3 className="task-input-title">Add Task for Today</h3>
        <p className="task-input-subtitle">Add tasks to your today list to work on during pomodoro sessions</p>
      </div>
      
      <form onSubmit={handleSubmit} className="task-input-form">
        <div className="task-input-container">
          <div className="task-input-wrapper">
            <input
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a task to add to Today..."
              className="task-input-field"
              disabled={isAdding}
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!taskTitle.trim() || isAdding}
              className="task-input-btn"
              aria-label="Add task"
            >
              <div className="btn-icon">
                <img src="/assets/todo-add-svgrepo-com.svg" alt="Add" />
              </div>
              {isAdding ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PomodoroTaskInput;
