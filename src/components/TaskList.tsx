import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
 
  CheckCircle2, 
  Circle, 
  Calendar,
  Clock,

  Edit,
  Trash2,
  Play
} from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';
import { useTimerStore } from '../store/useTimerStore';
import { useTranslation } from '../hooks/useTranslation';
import type { Task, Category } from '../types';
import { format } from 'date-fns';
import { SubtaskList } from './SubtaskList';

export const TaskList: React.FC = () => {
  const { 
    tasks, 
    categories, 
    addTask, 
    updateTask, 
    deleteTask, 
    toggleTask 
  } = useTaskStore();
  const { startTimer } = useTimerStore();
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showCompleted, setShowCompleted] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesCompleted = showCompleted || !task.completed;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesCompleted;
  });

  const handleAddTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    addTask(taskData);
    setShowAddModal(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowAddModal(true);
  };

  const handleUpdateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
      setEditingTask(null);
      setShowAddModal(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTask(taskId);
    }
  };

  const handleStartTimer = (taskId: string) => {
    startTimer(taskId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('tasks.title')}</h1>
          <p className="text-gray-400 mt-1">{t('tasks.subtitle')}</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <Plus size={20} />
          {t('tasks.addTask')}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={t('tasks.searchTasks')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">{t('tasks.allCategories')}</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
          >
            <option value="all">{t('tasks.allPriorities')}</option>
            <option value="high">{t('tasks.highPriority')}</option>
            <option value="medium">{t('tasks.mediumPriority')}</option>
            <option value="low">{t('tasks.lowPriority')}</option>
          </select>

          {/* Show Completed */}
          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
            />
            {t('tasks.showCompleted')}
          </label>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const category = getCategoryById(task.category);
            
            return (
              <div key={task.id} className="card hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="text-primary-500" size={24} />
                    ) : (
                      <Circle className="text-gray-400 hover:text-primary-500" size={24} />
                    )}
                  </button>

                  {/* Priority Indicator */}
                  <div className={`w-1 h-12 rounded-full ${getPriorityColor(task.priority)}`} />

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${task.completed ? 'line-through text-gray-400' : 'text-white'}`}>
                        {task.title}
                      </h3>
                      {category && (
                        <span 
                          className="px-2 py-1 text-xs rounded-full text-white"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.name}
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className={`text-sm ${task.completed ? 'text-gray-500' : 'text-gray-400'} mb-2`}>
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {task.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {task.estimatedTime && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{task.estimatedTime}m {t('tasks.estimated')}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Subtasks */}
                    <SubtaskList taskId={task.id} subtasks={task.subtasks || []} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!task.completed && (
                      <button
                        onClick={() => handleStartTimer(task.id)}
                        className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-600 rounded-lg transition-colors"
                        title={t('tasks.startTimer')}
                      >
                        <Play size={16} />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-gray-600 rounded-lg transition-colors"
                      title={t('tasks.editTask')}
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-600 rounded-lg transition-colors"
                      title={t('tasks.deleteTask')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card text-center py-12">
            <CheckCircle2 size={64} className="mx-auto mb-4 text-gray-600" />
            <h3 className="text-xl font-medium text-white mb-2">{t('tasks.noTasksFound')}</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedPriority !== 'all' 
                ? t('tasks.adjustFilters')
                : t('tasks.createFirstTask')
              }
            </p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary"
            >
              {t('tasks.addTask')}
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Task Modal */}
      {showAddModal && (
        <TaskModal
          task={editingTask}
          categories={categories}
          onSave={editingTask ? handleUpdateTask : handleAddTask}
          onClose={() => {
            setShowAddModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

// Task Modal Component
interface TaskModalProps {
  task?: Task | null;
  categories: Category[];
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ task, categories, onSave, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    category: task?.category || categories[0]?.id || '',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    estimatedTime: task?.estimatedTime || '',
    completed: task?.completed || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      priority: formData.priority as 'low' | 'medium' | 'high',
      category: formData.category,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime.toString()) : undefined,
      completed: formData.completed,
    };

    onSave(taskData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-white mb-4">
          {task ? t('tasks.editTaskTitle') : t('tasks.addNewTask')}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('tasks.taskTitle')} *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
              placeholder={t('tasks.titlePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('tasks.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
              placeholder={t('tasks.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
{t('tasks.priority')}
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                <option value="low">{t('tasks.low')}</option>
                <option value="medium">{t('tasks.medium')}</option>
                <option value="high">{t('tasks.high')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
{t('tasks.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
{t('tasks.dueDate')}
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
{t('tasks.estimatedTime')}
              </label>
              <input
                type="number"
                value={formData.estimatedTime}
                onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder={t('tasks.estimatedTimePlaceholder')}
                min="1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              {t('tasks.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              {task ? t('tasks.updateTask') : t('tasks.addTask')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
