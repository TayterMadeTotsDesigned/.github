import { useContext } from 'react';
import { PomodoroContext } from '../contexts/PomodoroContext';

export const usePomodoroContext = () => {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider');
  }
  return context;
};
