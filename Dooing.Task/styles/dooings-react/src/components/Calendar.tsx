import { useState, useMemo, useCallback } from 'react';
import { useTaskContext, useUIContext } from '../contexts';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Task } from '../types';
import '../styles/calendar.css';
import '../styles/calendar-drag-drop.css';

// Drag item type constant
const ITEM_TYPE = 'TASK';

// Date utility functions for immutable operations
const addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

const isSameDate = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString();
};

const formatDateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Draggable task item component
interface DraggableTaskItemProps {
  task: Task;
  viewMode: 'week' | 'month';
  onTaskClick: (taskId: string) => void;
}

const DraggableTaskItem: React.FC<DraggableTaskItemProps> = ({ task, viewMode, onTaskClick }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const dragRef = useCallback((node: HTMLDivElement | null) => {
    drag(node);
  }, [drag]);

  return (
    <div 
      ref={dragRef}
      key={task.id} 
      className={`task-pill ${task.completed ? 'completed' : ''} priority-${task.priority} ${task.repeat ? 'repeating' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={(e) => {
        e.stopPropagation(); // Prevent calendar day click
        onTaskClick(task.id);
      }}
      title={`${task.title}${task.repeat ? ' (Repeating)' : ''}`}
      data-full-title={
        task.repeat 
          ? `${task.title} (Repeating ${task.repeat.type === 'daily' ? 'Daily' : 'Weekly'})`
          : task.title
      }
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      {task.title.length > (viewMode === 'week' ? 25 : 15) 
        ? `${task.title.substring(0, viewMode === 'week' ? 25 : 15)}...` 
        : task.title}
    </div>
  );
};

// Droppable calendar day component
interface DroppableCalendarDayProps {
  date: Date;
  dayTasks: Task[];
  viewMode: 'week' | 'month';
  isToday: boolean;
  isOtherMonth: boolean;
  onDayClick: (date: Date) => void;
  onTaskClick: (taskId: string) => void;
  onAddTaskClick: (e: React.MouseEvent, date: Date) => void;
  onTaskDrop: (taskId: string, date: Date) => void;
}

const DroppableCalendarDay: React.FC<DroppableCalendarDayProps> = ({ 
  date, 
  dayTasks, 
  viewMode, 
  isToday, 
  isOtherMonth, 
  onDayClick,
  onTaskClick,
  onAddTaskClick,
  onTaskDrop
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    drop: (item: { id: string }) => {
      onTaskDrop(item.id, date);
      return { moved: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [date, onTaskDrop]);

  const dropRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
  }, [drop]);

  return (
    <div 
      ref={dropRef}
      className={`calendar-day ${isToday ? 'today' : ''} ${
        isOtherMonth ? 'other-month' : ''
      } ${isOver ? 'drop-target' : ''}`}
      onClick={() => onDayClick(date)}
    >
      <div className="day-number">
        {date.getDate()}
      </div>
      
      {dayTasks.length > 0 && (
        <div className="day-tasks">
          {dayTasks.slice(0, viewMode === 'week' ? 8 : 3).map(task => (
            <DraggableTaskItem
              key={task.id}
              task={task}
              viewMode={viewMode}
              onTaskClick={onTaskClick}
            />
          ))}
          {dayTasks.length > (viewMode === 'week' ? 8 : 3) && (
            <div className="more-tasks">
              +{dayTasks.length - (viewMode === 'week' ? 8 : 3)} more
            </div>
          )}
        </div>
      )}
      
      <button 
        className="add-day-task" 
        onClick={(e) => onAddTaskClick(e, date)}
        title="Add task for this day"
      >
        +
      </button>
    </div>
  );
};

const Calendar: React.FC = () => {
  const { state: taskState, updateTask } = useTaskContext();
  const { openCreateModal, openEditModal } = useUIContext();
  const { tasks } = taskState;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Handler for task drop events
  const handleTaskDrop = useCallback((taskId: string, date: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask({
        ...task,
        dueDate: date,
        updatedAt: new Date()
      });
    }
  }, [tasks, updateTask]);

  // Get start of week (Monday) - immutable version
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    return d;
  };

  // Get start of month - immutable version
  const getStartOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Generate week days - using utility functions
  const weekDays = useMemo(() => {
    const startOfWeek = getStartOfWeek(currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startOfWeek, i));
    }
    return days;
  }, [currentDate]);

  // Generate month days - using utility functions
  const monthDays = useMemo(() => {
    const startOfMonth = getStartOfMonth(currentDate);
    const startOfCalendar = getStartOfWeek(startOfMonth);
    
    const days: Date[] = [];
    // Generate 6 weeks (42 days) for consistent grid
    for (let i = 0; i < 42; i++) {
      days.push(addDays(startOfCalendar, i));
    }
    return days;
  }, [currentDate]);

  // Get tasks for a specific date - improved with utility functions
  const getTasksForDate = useCallback((date: Date) => {
    const dateStr = formatDateToString(date);
    return tasks.filter(task => {
      // Only show tasks from the 'future' category
      if (task.category !== 'future') return false;
      if (!task.dueDate) return false;
      // Handle both Date objects and string dates
      const taskDateStr = task.dueDate instanceof Date 
        ? formatDateToString(task.dueDate)
        : task.dueDate;
      return taskDateStr === dateStr;
    });
  }, [tasks]);

  // Navigate calendar - using utility functions
  const navigatePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Format date display - using utility functions
  const formatDateHeader = () => {
    if (viewMode === 'week') {
      const startOfWeek = getStartOfWeek(currentDate);
      const endOfWeek = addDays(startOfWeek, 6);
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} ${startOfWeek.getDate()}-${endOfWeek.getDate()}`;
      } else {
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return isSameDate(date, today);
  }, []);

  const isCurrentMonth = useCallback((date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  }, [currentDate]);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Handler for task item click
  const handleTaskClick = useCallback((taskId: string) => {
    openEditModal(taskId);
  }, [openEditModal]);

  // Handler for day click
  const handleDayClick = useCallback((date: Date) => {
    openCreateModal(date);
  }, [openCreateModal]);

  // Handler for add task button click
  const handleAddTaskClick = useCallback((e: React.MouseEvent, date: Date) => {
    e.stopPropagation(); // Prevent calendar day click
    openCreateModal(date);
  }, [openCreateModal]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="calendar-container active">
        <div className="calendar-header">
          <div className="calendar-title">
            <h2>Future Tasks Calendar</h2>
            <div className="calendar-date-display">{formatDateHeader()}</div>
          </div>
          
          <div className="calendar-controls">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'week' ? 'active' : ''}`}
                onClick={() => setViewMode('week')}
              >
                Week
              </button>
              <button 
                className={`view-btn ${viewMode === 'month' ? 'active' : ''}`}
                onClick={() => setViewMode('month')}
              >
                Month
              </button>
            </div>
            
            <div className="navigation-controls">
              <button className="nav-btn" onClick={navigatePrevious}>
                <img src="/assets/arrow-left-square-svgrepo-com.svg" alt="Previous" />
              </button>
              <button className="today-btn" onClick={goToToday}>
                Today
              </button>
              <button className="nav-btn" onClick={navigateNext}>
                <img src="/assets/arrow-right-square-svgrepo-com.svg" alt="Next" />
              </button>
            </div>
          </div>
        </div>

        <div className={`calendar-grid ${viewMode}-view`}>
          {/* Day headers */}
          <div className="calendar-day-headers">
            {dayNames.map(day => (
              <div key={day} className="day-header">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="calendar-days">
            {(viewMode === 'week' ? weekDays : monthDays).map((date, index) => {
              const dayTasks = getTasksForDate(date);
              return (
                <DroppableCalendarDay
                  key={index}
                  date={date}
                  dayTasks={dayTasks}
                  viewMode={viewMode}
                  isToday={isToday(date)}
                  isOtherMonth={viewMode === 'month' && !isCurrentMonth(date)}
                  onDayClick={handleDayClick}
                  onTaskClick={handleTaskClick}
                  onAddTaskClick={handleAddTaskClick}
                  onTaskDrop={handleTaskDrop}
                />
              );
            })}
          </div>
        </div>


      </div>
    </DndProvider>
  );
};

export default Calendar;
