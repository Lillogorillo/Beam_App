import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Calendar,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useTimerStore } from '../store/useTimerStore';
import { useTranslation } from '../hooks/useTranslation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';



interface DashboardProps {
  onPageChange?: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const { t } = useTranslation();
  const { getDashboardStats, getTodayTasks, categories, getTasksByCategory } = useTaskStore();
  const { timeLeft, sessionType, isRunning, currentSession, startTimer, pauseTimer, resetTimer } = useTimerStore();

  
  const stats = getDashboardStats();
  const todayTasks = getTodayTasks();
  const recentTasks = todayTasks.slice(0, 5);

  // Chart data
  const categoryData = categories.map(category => ({
    name: category.name,
    value: getTasksByCategory(category.id).length,
    color: category.color
  }));

  const weeklyData = [
    { name: 'Lun', completed: 8, total: 12 },
    { name: 'Mar', completed: 6, total: 10 },
    { name: 'Mer', completed: 10, total: 15 },
    { name: 'Gio', completed: 7, total: 9 },
    { name: 'Ven', completed: 12, total: 16 },
    { name: 'Sab', completed: 5, total: 8 },
    { name: 'Dom', completed: 4, total: 6 },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('dashboard.title')}</h1>
          <p className="text-gray-400 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <button 
          onClick={() => onPageChange?.('tasks')}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <Plus size={20} />
          {t('dashboard.addTask')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('dashboard.totalTasks')}</p>
              <p className="text-2xl font-bold text-white">{stats.totalTasks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('dashboard.completed')}</p>
              <p className="text-2xl font-bold text-white">{stats.completedTasks}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('dashboard.timeSpent')}</p>
              <p className="text-2xl font-bold text-white">{Math.round(stats.totalTimeSpent)}m</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="text-yellow-500" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('dashboard.completionRate')}</p>
              <p className="text-2xl font-bold text-white">{Math.round(stats.completionRate)}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="text-purple-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Widget */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{t('dashboard.pomodoroTimer')}</h3>
            <div className="text-sm text-gray-400">{t('dashboard.session')} {currentSession}</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-white mb-2">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-400 mb-4 capitalize">
              {sessionType === 'shortBreak' ? t('dashboard.shortBreak') : sessionType === 'longBreak' ? t('dashboard.longBreak') : t('dashboard.workSession')}
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${timeLeft > 0 ? ((1500 - timeLeft) / 1500) * 100 : 0}%` 
                }}
              />
            </div>
            
            <div className="flex gap-2 justify-center">
              <button 
                onClick={() => isRunning ? pauseTimer() : startTimer()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'
                } text-white`}
              >
                {isRunning ? t('dashboard.pause') : t('dashboard.start')}
              </button>
              <button 
                onClick={resetTimer}
                className="btn-secondary"
              >
                {t('dashboard.reset')}
              </button>
              <button 
                onClick={() => onPageChange?.('timer')}
                className="btn-secondary text-sm"
              >
                {t('dashboard.fullTimer')}
              </button>
            </div>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{t('dashboard.weeklyProgress')}</h3>
            <button>
              <MoreHorizontal className="text-gray-400" size={20} />
            </button>
          </div>
          
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="completed" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="total" fill="#374151" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{t('dashboard.todayTasks')}</h3>
            <span className="text-sm text-gray-400">{todayTasks.length} {t('dashboard.tasks')}</span>
          </div>
          
          <div className="space-y-3">
            {recentTasks.length > 0 ? (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' : 
                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500">{task.category}</p>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 ${
                    task.completed ? 'bg-primary-600 border-primary-600' : 'border-gray-400'
                  }`}>
                    {task.completed && <CheckCircle size={16} className="text-white" />}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                <p>{t('dashboard.noTasksToday')}</p>
                <p className="text-sm">{t('dashboard.createTaskToStart')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">{t('dashboard.taskCategories')}</h3>
            <button>
              <MoreHorizontal className="text-gray-400" size={20} />
            </button>
          </div>
          
          {categoryData.some(cat => cat.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData.filter(cat => cat.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.filter(cat => cat.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-2">
                {categoryData.filter(cat => cat.value > 0).map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-300">{category.name}</span>
                    </div>
                    <span className="text-sm text-white font-medium">{category.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <CheckCircle size={48} className="mx-auto mb-2 opacity-50" />
              <p>{t('dashboard.noTasksYet')}</p>
              <p className="text-sm">{t('dashboard.startCreatingTasks')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
