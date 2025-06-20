import { useState, useEffect } from 'react';
import { useTaskContext, useUIContext } from '../contexts';
import type { 
  Task, 
  TaskPriority, 
  RepeatType, 
  WeekDay, 
  TaskRepeat,
  TaskContext,
  TaskCategory
} from '../types';

interface TaskModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  task?: Task;
  category: TaskCategory;
  initialDate?: Date;
}

const TaskModal = ({ isOpen, mode, task, category, initialDate }: TaskModalProps) => {
  const { addTask, updateTask } = useTaskContext();
  const { closeModal } = useUIContext();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    dueDate: '',
    completed: false,
    category: category,
    repeatType: 'none' as RepeatType,
    repeatWeekDays: [] as WeekDay[],
    context: 'other' as TaskContext,
  });

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && task) {
        setFormData({
          title: task.title,
          description: task.description || '',
          priority: task.priority,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          completed: task.completed,
          category: task.category,
          repeatType: task.repeat?.type || 'none',
          repeatWeekDays: task.repeat?.weekDays || [],
          context: task.context || 'other',
        });
      } else {
        // For new tasks, determine category based on initialDate
        let taskCategory = category;
        if (initialDate) {
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(today.getDate() + 1);
          
          // Compare dates (ignoring time)
          const selectedDateStr = initialDate.toDateString();
          const todayStr = today.toDateString();
          const tomorrowStr = tomorrow.toDateString();
          
          if (selectedDateStr === todayStr) {
            taskCategory = 'today';
          } else if (selectedDateStr === tomorrowStr) {
            taskCategory = 'tomorrow';
          } else {
            taskCategory = 'future';
          }
        }
        
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          dueDate: initialDate ? initialDate.toISOString().split('T')[0] : '',
          completed: false,
          category: taskCategory,
          repeatType: 'none',
          repeatWeekDays: [],
          context: 'other',
        });
      }
    }
  }, [isOpen, mode, task, category, initialDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      if (name === 'weekDay') {
        // Handle weekday checkboxes for weekly repeat
        const weekDay = value as WeekDay;
        setFormData(prev => {
          const weekDays = [...prev.repeatWeekDays];
          if (checkbox.checked) {
            if (!weekDays.includes(weekDay)) {
              weekDays.push(weekDay);
            }
          } else {
            const index = weekDays.indexOf(weekDay);
            if (index !== -1) {
              weekDays.splice(index, 1);
            }
          }
          return {
            ...prev,
            repeatWeekDays: weekDays
          };
        });
      } else {
        // Handle regular checkboxes
        setFormData(prev => ({
          ...prev,
          [name]: checkbox.checked,
        }));
      }
    } else {
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: value,
        };
        
        // Clear due date if category is changed to one that doesn't typically use due dates
        // Keep due date for future, and for today/tomorrow if originally set from calendar
        if (name === 'category' && !['future', 'today', 'tomorrow'].includes(value)) {
          newData.dueDate = '';
        }
        
        return newData;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    // Create repeat object if repeat type is not none
    let repeat: TaskRepeat | undefined;
    if (formData.repeatType !== 'none') {
      repeat = {
        type: formData.repeatType,
      };
      
      // Add weekDays for weekly repeat
      if (formData.repeatType === 'weekly' && formData.repeatWeekDays.length > 0) {
        repeat.weekDays = formData.repeatWeekDays;
      }
    }

    const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      completed: formData.completed,
      category: formData.category,
      context: formData.context,
      repeat: repeat,
    };

    if (mode === 'create') {
      addTask(taskData);
    } else if (mode === 'edit' && task) {
      updateTask({ ...task, ...taskData });
    }
    
    closeModal();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-container" role="dialog" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {mode === 'create' ? 'Add New Task' : 'Edit Task'}
          </h2>
          <button 
            type="button" 
            className="modal-close"
            onClick={closeModal}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form className="task-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="task-title" className="form-label">
              Title *
            </label>
            <input
              type="text"
              id="task-title"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter task title"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="task-description" className="form-label">
              Description
            </label>
            <textarea
              id="task-description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-category" className="form-label">
                Category
              </label>
              <select
                id="task-category"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="future">Future</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-repeat" className="form-label">
                Repeat
              </label>
              <select
                id="task-repeat"
                name="repeatType"
                className="form-select"
                value={formData.repeatType}
                onChange={handleInputChange}
              >
                <option value="none">Don't repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-priority" className="form-label">
                Priority
              </label>
              <select
                id="task-priority"
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-context" className="form-label">
                Context
              </label>
              <select
                id="task-context"
                name="context"
                className="form-select"
                value={formData.context}
                onChange={handleInputChange}
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="home">Home</option>
                <option value="errands">Errands</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {(formData.category === 'future' || (formData.category === 'today' && formData.dueDate) || (formData.category === 'tomorrow' && formData.dueDate)) && (
            <div className="form-group">
              <label htmlFor="task-due-date" className="form-label">
                Due Date
              </label>
              <input
                type="date"
                id="task-due-date"
                name="dueDate"
                className="form-input"
                value={formData.dueDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          {formData.repeatType === 'weekly' && (
            <div className="form-group">
              <label className="form-label">Repeat on days</label>
              <div className="weekday-selector">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <label key={day} className="weekday-checkbox">
                    <input
                      type="checkbox"
                      name="weekDay"
                      value={day}
                      checked={formData.repeatWeekDays.includes(day as WeekDay)}
                      onChange={handleInputChange}
                    />
                    <span>{day.charAt(0).toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {mode === 'edit' && (
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="completed"
                  checked={formData.completed}
                  onChange={handleInputChange}
                />
                Mark as completed
              </label>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={closeModal}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary"
            >
              {mode === 'create' ? 'Add Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
