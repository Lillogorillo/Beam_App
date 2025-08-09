import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  BarChart3
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useTranslation } from '../hooks/useTranslation';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

export const Analytics: React.FC = () => {
  const { tasks, timeSessions, getDashboardStats, categories } = useTaskStore();
  const { t } = useTranslation();
  const stats = getDashboardStats();

  // Generate last 7 days data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = startOfDay(subDays(new Date(), 6 - i));
    const dayTasks = tasks.filter(task => 
      startOfDay(new Date(task.createdAt)).getTime() === date.getTime()
    );
    const completedTasks = dayTasks.filter(task => task.completed);
    
    return {
      date: format(date, 'MMM dd'),
      created: dayTasks.length,
      completed: completedTasks.length,
      productivity: dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0,
    };
  });

  // Category distribution
  const categoryStats = categories.map(category => {
    const categoryTasks = tasks.filter(task => task.category === category.id);
    return {
      name: category.name,
      value: categoryTasks.length,
      completed: categoryTasks.filter(task => task.completed).length,
      color: category.color,
    };
  }).filter(cat => cat.value > 0);

  // Priority distribution
  const priorityStats = [
    { name: t('analytics.highPriority'), value: tasks.filter(t => t.priority === 'high').length, color: '#EF4444' },
    { name: t('analytics.mediumPriority'), value: tasks.filter(t => t.priority === 'medium').length, color: '#F59E0B' },
    { name: t('analytics.lowPriority'), value: tasks.filter(t => t.priority === 'low').length, color: '#10B981' },
  ].filter(p => p.value > 0);

  // Time tracking stats
  const totalTrackedTime = timeSessions.reduce((total, session) => total + session.duration, 0);
  const averageSessionTime = timeSessions.length > 0 ? totalTrackedTime / timeSessions.length : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{t('analytics.title')}</h1>
        <p className="text-gray-400 mt-1">{t('analytics.subtitle')}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('analytics.productivityScore')}</p>
              <p className="text-2xl font-bold text-white">{Math.round(stats.completionRate)}%</p>
              <p className="text-xs text-green-400 mt-1">{t('analytics.fromLastWeek')}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('analytics.avgSessionTime')}</p>
              <p className="text-2xl font-bold text-white">{Math.round(averageSessionTime / 60)}m</p>
              <p className="text-xs text-blue-400 mt-1">{t('analytics.basedOnSessions', { count: timeSessions.length })}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="text-blue-500" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('analytics.totalFocusTime')}</p>
              <p className="text-2xl font-bold text-white">{Math.round(totalTrackedTime / 3600)}h</p>
              <p className="text-xs text-purple-400 mt-1">{t('analytics.thisMonth')}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Target className="text-purple-500" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t('analytics.activeStreak')}</p>
              <p className="text-2xl font-bold text-white">7</p>
              <p className="text-xs text-yellow-400 mt-1">{t('analytics.days')}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="text-yellow-500" size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">{t('analytics.productivityTrend')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="productivity" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Creation vs Completion */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">{t('analytics.taskCreationVsCompletion')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={last7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="created" fill="#64748B" radius={[2, 2, 0, 0]} />
              <Bar dataKey="completed" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">{t('analytics.tasksByCategory')}</h3>
          {categoryStats.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-2 mt-4">
                {categoryStats.map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-gray-300">{category.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-white font-medium">{category.value}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({category.completed} {t('analytics.completed')})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
              <p>{t('analytics.noDataAvailable')}</p>
            </div>
          )}
        </div>

        {/* Priority Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">{t('analytics.tasksByPriority')}</h3>
          {priorityStats.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityStats} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="name" type="category" stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {priorityStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              <div className="space-y-2 mt-4">
                {priorityStats.map((priority) => (
                  <div key={priority.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: priority.color }}
                      />
                      <span className="text-sm text-gray-300">{priority.name} Priority</span>
                    </div>
                    <span className="text-sm text-white font-medium">{priority.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Target size={48} className="mx-auto mb-2 opacity-50" />
              <p>{t('analytics.noDataAvailable')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
