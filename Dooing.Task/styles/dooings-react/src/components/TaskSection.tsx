import { useState } from 'react';
import { useTaskContext, useUIContext } from '../contexts';
import type { TaskCategory } from '../types';
import TaskItem from './TaskItem';
import Calendar from './Calendar';
import TaskLimitWarning from './TaskLimitWarning';

interface TaskSectionProps {
  category: TaskCategory;
}

const TaskSection = ({ category }: TaskSectionProps) => {
  const { state: taskState, deleteTasks } = useTaskContext();
  const { openCreateModal } = useUIContext();
  
  // State for task selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  const tasks = taskState.tasks.filter(task => task.category === category);
  const { taskLimit, taskLimitEnabled } = taskState;
  const TASK_WARNING_THRESHOLD = 5; // When to start showing warnings

  const getCategoryTitle = () => {
    switch (category) {
      case 'today': return 'Today';
      case 'tomorrow': return 'Tomorrow';
      case 'future': return 'Future';
      default: return 'Tasks';
    }
  };

  const getEmptyStateMessage = () => {
    switch (category) {
      case 'today': return 'No tasks for today. Lets get started! ';
      case 'tomorrow': return 'No tasks for tomorrow. Look Ahead!';
      case 'future': return 'No tasks for the future. Plan Ahead!';
      default: return 'No tasks found.';
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    // Clear selections when toggling off
    if (selectionMode) {
      setSelectedTaskIds([]);
    }
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length) {
      // If all are selected, deselect all
      setSelectedTaskIds([]);
    } else {
      // Otherwise select all
      setSelectedTaskIds(tasks.map(task => task.id));
    }
  };

  const handleSelectionChange = (taskId: string, selected: boolean) => {
    if (selected) {
      setSelectedTaskIds(prev => [...prev, taskId]);
    } else {
      setSelectedTaskIds(prev => prev.filter(id => id !== taskId));
    }
  };

  const handleBatchDelete = () => {
    if (selectedTaskIds.length > 0) {
      deleteTasks(selectedTaskIds);
      setSelectedTaskIds([]);
      setSelectionMode(false);
    }
  };

  const handleDeleteAll = () => {
    if (tasks.length > 0) {
      deleteTasks(tasks.map(task => task.id));
    }
  };

  // If this is the future category, render the calendar instead
  if (category === 'future') {
    return (
      <div className={`task-category ${category}-category active`} id={`${category}-category`}>
        <Calendar />
      </div>
    );
  }

  return (
    <div className={`task-category ${category}-category active`} id={`${category}-category`}>
      <div className="category-header">
        <h2 className="category-title">{getCategoryTitle()}</h2>
        <div className="task-count">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </div>
      </div>

      {category === 'today' && taskLimitEnabled && (
        <TaskLimitWarning 
          currentCount={tasks.length} 
          limit={taskLimit} 
          warningThreshold={TASK_WARNING_THRESHOLD} 
        />
      )}

      {tasks.length > 0 && (
        <div className="category-actions">
          <button 
            className="select-mode-btn" 
            onClick={toggleSelectionMode}
            aria-pressed={selectionMode}
          >
            {selectionMode ? 'Cancel Selection' : 'Select Tasks'}
          </button>
          {tasks.length > 1 && (
            <button 
              className="delete-all-btn" 
              onClick={handleDeleteAll}
              aria-label={`Delete all ${tasks.length} tasks`}
            >
              Delete All
            </button>
          )}
        </div>
      )}

      {selectionMode && tasks.length > 0 && (
        <div className="batch-operations">
          <button onClick={handleSelectAll}>
            {selectedTaskIds.length === tasks.length ? 'Deselect All' : 'Select All'}
          </button>
          <button 
            className="delete-selected" 
            onClick={handleBatchDelete}
            disabled={selectedTaskIds.length === 0}
          >
            Delete Selected
          </button>
          <div className="batch-count">
            {selectedTaskIds.length} of {tasks.length} selected
          </div>
        </div>
      )}

      <div className="task-list" id={`${category}-task-list`}>
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <img src="/assets/task-done-svgrepo-com.svg" alt="No tasks" />
            </div>
            <h3 className="empty-title">No Tasks Yet</h3>
            <p className="empty-message">{getEmptyStateMessage()}</p>
            <button 
              className="add-task-btn" 
              data-category={category}
              onClick={() => openCreateModal()}
            >
              Add Task
            </button>
          </div>
        ) : (
          <>
            {tasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                isSelectable={selectionMode}
                isSelected={selectedTaskIds.includes(task.id)}
                onSelectionChange={handleSelectionChange}
              />
            ))}
            <button 
              className="add-task-btn" 
              data-category={category}
              onClick={() => openCreateModal()}
            >
              Add Task
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TaskSection;
