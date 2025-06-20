import React from 'react';
import { TaskProvider } from './TaskContext';
import { UIProvider } from './UIContext';
import { PomodoroProvider } from './PomodoroContext';

// Combine all providers into a single provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TaskProvider>
      <UIProvider>
        <PomodoroProvider>
          {children}
        </PomodoroProvider>
      </UIProvider>
    </TaskProvider>
  );
};
