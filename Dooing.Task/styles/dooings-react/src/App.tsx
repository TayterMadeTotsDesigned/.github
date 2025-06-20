import { useState } from 'react';
import { useUIContext, useTaskContext } from './contexts';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TaskSection from './components/TaskSection';
import PomodoroTimer from './components/PomodoroTimer';
import PomodoroSettingsPanel from './components/PomodoroSettingsPanel';
import TaskModal from './components/TaskModal';
import Footer from './components/Footer';
import HeroSection from './components/HeroSection';
import './styles/main.css';

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const { state: uiState } = useUIContext();
  const { state: taskState } = useTaskContext();
  
  // Derived state
  const isShowingDualPanel = uiState.currentCategory === 'today' || uiState.currentCategory === 'tomorrow';

  return (
    <div className="content-container">
      <Header />

      <PomodoroSettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <Sidebar />

      <HeroSection />

      <main className="main-container">
        {uiState.currentCategory === 'pomodoro' ? (
          <div className="pomodoro-standalone-layout" id="pomodoro-standalone">
            <PomodoroTimer
              onSettingsToggle={() => setShowSettings(!showSettings)}
              isStandalone={true}
            />
          </div>
        ) : isShowingDualPanel ? (
          <div className="dual-panel-layout" id="dual-panel">
            <TaskSection
              category={uiState.currentCategory as 'today' | 'tomorrow'}
            />
            
            <div className="pomodoro-container" id="pomodoro-container">
              <PomodoroTimer
                onSettingsToggle={() => setShowSettings(!showSettings)}
                isStandalone={false}
              />
            </div>
          </div>
        ) : (
          <div className="task-categories-container">
            <TaskSection
              category={uiState.currentCategory as 'future'}
            />
          </div>
        )}
      </main>

      <TaskModal
        isOpen={uiState.isModalOpen}
        mode={uiState.modalType}
        task={uiState.editingTaskId ? taskState.tasks.find(t => t.id === uiState.editingTaskId) : undefined}
        initialDate={uiState.initialModalDate}
        category={uiState.currentCategory === 'pomodoro' ? 'today' : uiState.currentCategory as 'today' | 'tomorrow' | 'future'}
      />

      <Footer />
    </div>
  );
}

export default App;
