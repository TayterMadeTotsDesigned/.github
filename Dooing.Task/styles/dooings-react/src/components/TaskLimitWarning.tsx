import React from 'react';

interface TaskLimitWarningProps {
  currentCount: number;
  limit: number;
  warningThreshold: number;
}

const TaskLimitWarning: React.FC<TaskLimitWarningProps> = ({ 
  currentCount, 
  limit, 
  warningThreshold 
}) => {
  // Don't show anything if we're below the warning threshold
  if (currentCount < warningThreshold) {
    return null;
  }

  const isAtLimit = currentCount >= limit;
  const tasksRemaining = limit - currentCount;
  
  return (
    <div className={`task-limit-warning ${isAtLimit ? 'critical' : ''}`}>
      <span className="task-limit-warning-icon">
        {isAtLimit ? '⚠️' : '⚠️'}
      </span>
      <span>
        {isAtLimit 
          ? `You've reached your daily task limit of ${limit}.` 
          : `You have ${tasksRemaining} task${tasksRemaining === 1 ? '' : 's'} remaining for today.`
        }
      </span>
    </div>
  );
};

export default TaskLimitWarning;
