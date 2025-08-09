import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useTranslation } from '../hooks/useTranslation';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore } from 'date-fns';

export const Calendar: React.FC = () => {
  const { tasks, categories } = useTaskStore();
  const { t } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      task.dueDate && isSameDay(new Date(task.dueDate), date)
    );
  };

  const getSelectedDateTasks = () => {
    return getTasksForDate(selectedDate);
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('calendar.title')}</h1>
          <p className="text-gray-400 mt-1">{t('calendar.subtitle')}</p>
        </div>
        <button 
          onClick={goToToday}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <CalendarIcon size={20} />
          {t('calendar.today')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="text-gray-400" size={20} />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="text-gray-400" size={20} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {[t('calendar.sun'), t('calendar.mon'), t('calendar.tue'), t('calendar.wed'), t('calendar.thu'), t('calendar.fri'), t('calendar.sat')].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-400">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {monthDays.map(day => {
              const dayTasks = getTasksForDate(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);
              const isPast = isBefore(day, new Date()) && !isTodayDate;

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative p-2 h-16 rounded-lg transition-colors text-left
                    ${isSelected 
                      ? 'bg-primary-600 text-white' 
                      : isTodayDate 
                      ? 'bg-primary-600/20 text-primary-400 border border-primary-600' 
                      : isPast 
                      ? 'text-gray-500 hover:bg-gray-700' 
                      : 'text-white hover:bg-gray-700'
                    }
                  `}
                >
                  <div className="text-sm font-medium">
                    {format(day, 'd')}
                  </div>
                  
                  {/* Task indicators */}
                  {dayTasks.length > 0 && (
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="flex gap-1 flex-wrap">
                        {dayTasks.slice(0, 3).map((task, index) => {
                          const category = getCategoryById(task.category);
                          return (
                            <div
                              key={index}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: category?.color || '#64748B' }}
                            />
                          );
                        })}
                        {dayTasks.length > 3 && (
                          <div className="text-xs text-gray-400">+{dayTasks.length - 3}</div>
                        )}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {format(selectedDate, 'MMM dd, yyyy')}
            </h3>
            <span className="text-sm text-gray-400">
              {getSelectedDateTasks().length} {t('calendar.tasks')}
            </span>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {getSelectedDateTasks().length > 0 ? (
              getSelectedDateTasks().map(task => {
                const category = getCategoryById(task.category);
                
                return (
                  <div key={task.id} className="p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500' : 
                        task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <span className={`font-medium text-sm ${
                        task.completed ? 'line-through text-gray-400' : 'text-white'
                      }`}>
                        {task.title}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-gray-400 mb-2">{task.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      {category && (
                        <span 
                          className="text-xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.name}
                        </span>
                      )}
                      
                      {task.estimatedTime && (
                        <span className="text-xs text-gray-400">
                          {task.estimatedTime}m
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CalendarIcon size={48} className="mx-auto mb-2 opacity-50" />
                <p>{t('calendar.noTasksForDate')}</p>
                <p className="text-sm">{t('calendar.tasksWithDueDates')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
