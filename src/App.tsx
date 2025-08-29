import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { TaskList } from './components/TaskList';
import { Timer } from './components/Timer';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { Calendar } from './components/Calendar';
import { ToastContainer } from './components/Toast';
import { MobileOptimizations } from './components/MobileOptimizations';
import { useTaskStore } from './store/useTaskStore';
import { useTimerStore } from './store/useTimerStore';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTranslation } from './hooks/useTranslation';
import { initializeSampleData } from './utils/sampleData';
import { useAuthStore } from './store/useAuthStore';
import { Auth } from './components/Auth';
import { Profile } from './components/Profile';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { addTask, loadFromRemote } = useTaskStore();
  const { startTimer, pauseTimer, isRunning } = useTimerStore();
  const { toasts, removeToast, success } = useToast();
  const { t } = useTranslation();
  const { token } = useAuthStore();

  // Initialize some sample data on first load
  useEffect(() => {
    // Seed sample data only if Supabase URL is not configured
    if (!import.meta.env.VITE_SUPABASE_URL) {
      initializeSampleData(addTask);
    }
  }, [addTask]);

  useEffect(() => {
    if (token) {
      loadFromRemote();
    }
  }, [token, loadFromRemote]);

  // Auto-refresh data when app comes back into focus (cross-device sync)
  useEffect(() => {
    if (!token) return;

    const handleVisibilityChange = () => {
      if (!document.hidden && token) {
        console.log('🔄 App back in focus - refreshing data for cross-device sync');
        loadFromRemote().catch(console.error);
      }
    };

    const handleFocus = () => {
      if (token) {
        console.log('🔄 Window focused - refreshing data for cross-device sync');
        loadFromRemote().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token, loadFromRemote]);

  // Periodic sync every 30 seconds for cross-device sync
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (token && !document.hidden) {
        console.log('⏰ Periodic sync - refreshing data for cross-device sync');
        loadFromRemote().catch(console.error);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [token, loadFromRemote]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTask: () => {
      setCurrentPage('tasks');
      success('Scorciatoia attivata', 'Navigazione alla pagina Attività');
    },
    onToggleTimer: () => {
      if (isRunning) {
        pauseTimer();
        success('Timer in pausa');
      } else {
        startTimer();
        success('Timer avviato');
      }
    },
    onSettings: () => {
      setCurrentPage('settings');
      success('Scorciatoia attivata', 'Navigazione alle Impostazioni');
    },
  });

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onPageChange={setCurrentPage} />;
      case 'tasks':
        return <TaskList />;
      case 'timer':
        return <Timer />;
      case 'calendar':
        return <Calendar />;
      case 'goals':
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-4">{t('nav.goals')}</h1>
            <div className="card text-center py-12">
              <p className="text-gray-400">{t('goals.comingSoon')}</p>
            </div>
          </div>
        );
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile onClose={() => setCurrentPage('dashboard')} />;
      default:
        return <Dashboard />;
    }
  };

  if (!token) {
    return <Auth />;
  }
  
  return (
    <div className="min-h-screen bg-gray-900 flex">
      <MobileOptimizations />
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <main className="flex-1 lg:ml-0 overflow-auto touch-scroll">
        {renderCurrentPage()}
      </main>

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}

export default App;