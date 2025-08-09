import React, { useState } from 'react';
import { 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Bell,

  Volume2,
  VolumeX
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useTimerStore } from '../store/useTimerStore';
import { useTranslation } from '../hooks/useTranslation';

export const Settings: React.FC = () => {
  const { tasks, categories, addTask, addCategory } = useTaskStore();
  const { settings, updateSettings } = useTimerStore();
  const { t } = useTranslation();
  
  const [timerSettings, setTimerSettings] = useState(settings);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    Notification.permission === 'granted'
  );
  const [soundEnabled, setSoundEnabled] = useState(true);


  const handleSaveTimerSettings = () => {
    updateSettings(timerSettings);
    alert('Timer settings saved successfully!');
  };

  const handleExportData = () => {
    const data = {
      tasks,
      categories,
      settings,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasky-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as {
          tasks?: Parameters<typeof addTask>[0][];
          categories?: Parameters<typeof addCategory>[0][];
          settings?: typeof settings;
        };
        
        if (data.tasks && Array.isArray(data.tasks)) {
          data.tasks.forEach((task) => addTask(task));
        }
        
        if (data.categories && Array.isArray(data.categories)) {
          data.categories.forEach((category) => addCategory(category));
        }
        
        if (data.settings) {
          updateSettings(data.settings);
        }
        
        alert('Data imported successfully!');
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{t('settings.title')}</h1>
        <p className="text-gray-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Timer Settings */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">{t('settings.pomodoroSettings')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
{t('settings.workDuration')}
            </label>
            <input
              type="number"
              value={timerSettings.workDuration}
              onChange={(e) => setTimerSettings({ 
                ...timerSettings, 
                workDuration: parseInt(e.target.value) 
              })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              min="1"
              max="120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
{t('settings.shortBreak')}
            </label>
            <input
              type="number"
              value={timerSettings.shortBreakDuration}
              onChange={(e) => setTimerSettings({ 
                ...timerSettings, 
                shortBreakDuration: parseInt(e.target.value) 
              })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              min="1"
              max="30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
{t('settings.longBreak')}
            </label>
            <input
              type="number"
              value={timerSettings.longBreakDuration}
              onChange={(e) => setTimerSettings({ 
                ...timerSettings, 
                longBreakDuration: parseInt(e.target.value) 
              })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              min="1"
              max="60"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sessions until Long Break
            </label>
            <input
              type="number"
              value={timerSettings.sessionsUntilLongBreak}
              onChange={(e) => setTimerSettings({ 
                ...timerSettings, 
                sessionsUntilLongBreak: parseInt(e.target.value) 
              })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              min="2"
              max="10"
            />
          </div>
        </div>

        <button
          onClick={handleSaveTimerSettings}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={16} />
          {t('settings.saveTimerSettings')}
        </button>
      </div>

      {/* Notifications & Sound */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">{t('settings.notificationsSound')}</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{t('settings.browserNotifications')}</p>
              <p className="text-sm text-gray-400">{t('settings.notificationDescription')}</p>
            </div>
            <button
              onClick={handleNotificationPermission}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                notificationsEnabled 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              <Bell size={16} />
              {notificationsEnabled ? t('settings.enabled') : t('settings.enable')}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{t('settings.soundEffects')}</p>
              <p className="text-sm text-gray-400">{t('settings.soundDescription')}</p>
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                soundEnabled 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {soundEnabled ? t('settings.enabled') : t('settings.disabled')}
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">{t('settings.dataManagement')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleExportData}
            className="btn-secondary flex items-center gap-2 justify-center"
          >
            <Download size={16} />
            {t('settings.exportData')}
          </button>

          <label className="btn-secondary flex items-center gap-2 justify-center cursor-pointer">
            <Upload size={16} />
            {t('settings.importData')}
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>

          <button
            onClick={handleClearAllData}
            className="flex items-center gap-2 justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            <Trash2 size={16} />
            {t('settings.clearAllData')}
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">{t('settings.aboutApp')}</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">{t('settings.version')}</span>
            <span className="text-white">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t('settings.totalTasks')}</span>
            <span className="text-white">{tasks.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t('settings.categories')}</span>
            <span className="text-white">{categories.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t('settings.dataStorage')}</span>
            <span className="text-white">{t('settings.localBrowserStorage')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
