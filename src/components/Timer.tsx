import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  CheckCircle2
} from 'lucide-react';
import { useTimerStore } from '../store/useTimerStore';
import { useTaskStore } from '../store/useTaskStore';
import { useNotifications } from '../hooks/useNotifications';
import { useTranslation } from '../hooks/useTranslation';

export const Timer: React.FC = () => {
  const {
    isRunning,
    currentTaskId,
    sessionType,
    timeLeft,
    currentSession,
    totalSessions,
    settings,
    startTimer,
    pauseTimer,
    stopTimer,
    resetTimer,
    tick,
    completeSession,
    skipSession,
    updateSettings
  } = useTimerStore();

  const { tasks, addTimeSession } = useTaskStore();
  const { showNotification, playSound } = useNotifications();
  const { t } = useTranslation();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const currentTask = currentTaskId ? tasks.find(t => t.id === currentTaskId) : null;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, tick]);

  // Timer completion listener
  useEffect(() => {
    const handleTimerComplete = (event: CustomEvent) => {
      const { sessionType: completedType } = event.detail;
      
      if (soundEnabled) {
        playSound('timer');
      }
      
      showNotification(
        completedType === 'work' ? t('notifications.workSessionCompleted') : t('notifications.breakCompleted'),
        {
          body: completedType === 'work' 
            ? t('notifications.timeForBreak')
            : t('notifications.readyForWork'),
        }
      );
    };

    window.addEventListener('timerComplete', handleTimerComplete as EventListener);
    
    return () => {
      window.removeEventListener('timerComplete', handleTimerComplete as EventListener);
    };
  }, [soundEnabled, showNotification, playSound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionDuration = () => {
    switch (sessionType) {
      case 'work': return settings.workDuration * 60;
      case 'shortBreak': return settings.shortBreakDuration * 60;
      case 'longBreak': return settings.longBreakDuration * 60;
      default: return settings.workDuration * 60;
    }
  };

  const getProgress = () => {
    const totalDuration = getSessionDuration();
    return ((totalDuration - timeLeft) / totalDuration) * 100;
  };

  const handleStart = () => {
    if (!isRunning) {
      startTimer(currentTaskId);
    } else {
      pauseTimer();
    }
  };

  const handleStop = () => {
    if (isRunning && currentTaskId && sessionType === 'work') {
      // Record time session
      const sessionDuration = getSessionDuration() - timeLeft;
      addTimeSession({
        taskId: currentTaskId,
        startTime: new Date(Date.now() - sessionDuration * 1000),
        endTime: new Date(),
        duration: sessionDuration,
        type: 'work'
      });
    }
    stopTimer();
  };

  const handleReset = () => {
    resetTimer();
  };

  const handleComplete = () => {
    if (isRunning && currentTaskId && sessionType === 'work') {
      // Record full session
      const sessionDuration = getSessionDuration();
      addTimeSession({
        taskId: currentTaskId,
        startTime: new Date(Date.now() - sessionDuration * 1000),
        endTime: new Date(),
        duration: sessionDuration,
        type: 'work'
      });
    }
    completeSession();
  };

  const getSessionTypeDisplay = () => {
    switch (sessionType) {
      case 'work': return t('timer.workSession');
      case 'shortBreak': return t('timer.shortBreak');
      case 'longBreak': return t('timer.longBreak');
      default: return t('timer.workSession');
    }
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case 'work': return 'text-primary-500';
      case 'shortBreak': return 'text-green-500';
      case 'longBreak': return 'text-blue-500';
      default: return 'text-primary-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('timer.title')}</h1>
          <p className="text-gray-400 mt-1">{t('timer.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            {soundEnabled ? <Volume2 className="text-white" size={20} /> : <VolumeX className="text-gray-400" size={20} />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <SettingsIcon className="text-white" size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timer Display */}
        <div className="card text-center">
          <div className="mb-6">
            <h2 className={`text-xl font-semibold mb-2 ${getSessionColor()}`}>
              {getSessionTypeDisplay()}
            </h2>
            <p className="text-gray-400">{t('timer.session')} {currentSession}</p>
          </div>

          {/* Circular Progress */}
          <div className="relative w-64 h-64 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-700"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                className={sessionType === 'work' ? 'text-primary-500' : sessionType === 'shortBreak' ? 'text-green-500' : 'text-blue-500'}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Time display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-white">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-sm text-gray-400 mt-1">
                  {Math.round(getProgress())}% {t('timer.complete')}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-3 mb-4">
            <button
              onClick={handleStart}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isRunning 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {isRunning ? <Pause size={20} /> : <Play size={20} />}
              {isRunning ? t('timer.pause') : t('timer.start')}
            </button>
            
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              disabled={!isRunning && timeLeft === getSessionDuration()}
            >
              <Square size={20} />
              {t('timer.stop')}
            </button>
            
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              <RotateCcw size={20} />
              Reset
            </button>
          </div>

          {/* Quick actions */}
          <div className="flex justify-center gap-2">
            <button
              onClick={handleComplete}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              {t('timer.completeSession')}
            </button>
            <span className="text-gray-600">•</span>
            <button
              onClick={skipSession}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              {t('timer.skipSession')}
            </button>
          </div>
        </div>

        {/* Session Info & Task Selection */}
        <div className="space-y-6">
          {/* Current Task */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">{t('timer.currentTask')}</h3>
            {currentTask ? (
              <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  currentTask.priority === 'high' ? 'bg-red-500' : 
                  currentTask.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
                <div className="flex-1">
                  <p className="text-white font-medium">{currentTask.title}</p>
                  {currentTask.description && (
                    <p className="text-gray-400 text-sm">{currentTask.description}</p>
                  )}
                </div>
                <CheckCircle2 
                  className={`${currentTask.completed ? 'text-primary-500' : 'text-gray-400'}`} 
                  size={20} 
                />
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p>{t('timer.noTaskSelected')}</p>
                <p className="text-sm">{t('timer.selectTaskToTrack')}</p>
              </div>
            )}
          </div>

          {/* Session Stats */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">{t('timer.sessionStats')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{currentSession}</div>
                <div className="text-sm text-gray-400">{t('timer.currentSession')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{totalSessions}</div>
                <div className="text-sm text-gray-400">{t('timer.totalSessions')}</div>
              </div>
            </div>
          </div>

          {/* Quick Task List */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">{t('timer.quickStart')}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasks.filter(t => !t.completed).slice(0, 5).map(task => (
                <button
                  key={task.id}
                  onClick={() => startTimer(task.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentTaskId === task.id 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' : 
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="font-medium truncate">{task.title}</span>
                  </div>
                </button>
              ))}
              
              {tasks.filter(t => !t.completed).length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <p className="text-sm">{t('timer.noPendingTasks')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <TimerSettings
          settings={settings}
          onSave={updateSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

// Timer Settings Modal
interface TimerSettingsProps {
  settings: {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
  };
  onSave: (settings: {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
  }) => void;
  onClose: () => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({ settings, onSave, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    workDuration: settings.workDuration,
    shortBreakDuration: settings.shortBreakDuration,
    longBreakDuration: settings.longBreakDuration,
    sessionsUntilLongBreak: settings.sessionsUntilLongBreak,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">{t('timer.timerSettings')}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('timer.workDuration')}
            </label>
            <input
              type="number"
              value={formData.workDuration}
              onChange={(e) => setFormData({ ...formData, workDuration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              min="1"
              max="120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('timer.shortBreakDuration')}
            </label>
            <input
              type="number"
              value={formData.shortBreakDuration}
              onChange={(e) => setFormData({ ...formData, shortBreakDuration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              min="1"
              max="30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('timer.longBreakDuration')}
            </label>
            <input
              type="number"
              value={formData.longBreakDuration}
              onChange={(e) => setFormData({ ...formData, longBreakDuration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              min="1"
              max="60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('timer.sessionsUntilLongBreak')}
            </label>
            <input
              type="number"
              value={formData.sessionsUntilLongBreak}
              onChange={(e) => setFormData({ ...formData, sessionsUntilLongBreak: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              min="2"
              max="10"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              {t('timer.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {t('timer.saveSettings')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
