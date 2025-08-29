import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Task, Category, TimeSession, DashboardStats } from '../types';
import { tasksAPI, categoriesAPI, timeSessionsAPI } from '../config/api';
import { useAuthStore } from './useAuthStore';
import { playSound } from '../utils/sounds';

interface TaskState {
  tasks: Task[];
  categories: Category[];
  timeSessions: TimeSession[];
  loadFromRemote: () => Promise<void>;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  playCompletionSound?: () => void;
  
  // Subtask actions
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, title: string) => void;
  
  // Category actions
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Time tracking actions
  addTimeSession: (session: Omit<TimeSession, 'id'>) => void;
  
  // Stats getters
  getDashboardStats: () => DashboardStats;
  getTasksByCategory: (categoryId: string) => Task[];
  getTodayTasks: () => Task[];
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Lavoro', color: '#3B82F6', icon: 'briefcase' },
  { id: '2', name: 'Personale', color: '#10B981', icon: 'user' },
  { id: '3', name: 'Apprendimento', color: '#F59E0B', icon: 'book-open' },
  { id: '4', name: 'Salute', color: '#EF4444', icon: 'heart' },
];

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: defaultCategories,
      timeSessions: [],

      loadFromRemote: async () => {
        const token = useAuthStore.getState().token;
        if (!token || !import.meta.env.VITE_SUPABASE_URL) {
          console.log('🚫 Sync skipped: no token or Supabase URL');
          return;
        }
        
        console.log('🔄 Loading data from remote...');
        
        try {
          const [tasksRes, categoriesRes, timeSessionsRes] = await Promise.all([
            tasksAPI.getAll(token),
            categoriesAPI.getAll(token),
            timeSessionsAPI.getAll(token)
          ]);

          console.log('📥 Remote data received:', {
            tasks: tasksRes?.tasks?.length || 0,
            categories: categoriesRes?.categories?.length || 0,
            sessions: timeSessionsRes?.timeSessions?.length || 0
          });

          const remoteCategories: Category[] = (categoriesRes?.categories || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            color: c.color || '#3B82F6',
            icon: c.icon || 'folder',
          }));

          const remoteTasks: Task[] = (tasksRes?.tasks || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description || undefined,
            completed: t.status === 'completed',
            priority: (t.priority || 'medium') as 'low' | 'medium' | 'high',
            category: t.category_id || '',
            dueDate: t.due_date ? new Date(t.due_date) : undefined,
            createdAt: t.created_at ? new Date(t.created_at) : new Date(),
            updatedAt: t.updated_at ? new Date(t.updated_at) : new Date(),
            estimatedTime: t.estimated_time || undefined,
            actualTime: t.actual_time || undefined,
            subtasks: [],
          }));

          const remoteSessions: TimeSession[] = (timeSessionsRes?.timeSessions || []).map((s: any) => ({
            id: s.id,
            taskId: s.task_id,
            startTime: new Date(s.start_time),
            endTime: s.end_time ? new Date(s.end_time) : undefined,
            duration: s.duration || 0,
            type: 'work',
          }));

          set({ tasks: remoteTasks, categories: remoteCategories, timeSessions: remoteSessions });
          console.log('✅ Data synced successfully!');
        } catch (error) {
          console.error('❌ Sync failed:', error);
        }
      },

      addTask: async (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          subtasks: [],
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
        console.log('📝 Task added locally:', newTask.title);
        
        // Sync to server and refresh
        const token = useAuthStore.getState().token;
        if (token && import.meta.env.VITE_SUPABASE_URL) {
          try {
            await tasksAPI.create(
              {
                title: newTask.title,
                description: newTask.description,
                priority: newTask.priority,
                category: newTask.category,
                dueDate: newTask.dueDate?.toISOString(),
                estimatedTime: newTask.estimatedTime,
                completed: newTask.completed,
              },
              token
            );
            console.log('🔄 Task synced to server, refreshing all data...');
            // Refresh data to ensure cross-device sync
            get().loadFromRemote();
          } catch (error) {
            console.error('❌ Failed to sync task to server:', error);
          }
        }
      },

      updateTask: async (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
          ),
        }));
        console.log('✏️ Task updated locally:', id);
        
        const token = useAuthStore.getState().token;
        if (token && import.meta.env.VITE_SUPABASE_URL) {
          try {
            const payload: any = {
              id,
              title: updates.title,
              description: updates.description,
              category_id: updates.category,
              priority: updates.priority,
              due_date: updates.dueDate ? new Date(updates.dueDate).toISOString() : undefined,
              status: updates.completed === true ? 'completed' : updates.completed === false ? 'pending' : undefined,
            };
            // Clean undefined
            Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
            
            await fetch(`${import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co', '.supabase.co/functions/v1')}/tasks/tasks`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload),
            });
            
            console.log('🔄 Task update synced to server, refreshing all data...');
            // Refresh data to ensure cross-device sync
            get().loadFromRemote();
          } catch (error) {
            console.error('❌ Failed to sync task update to server:', error);
          }
        }
      },

      deleteTask: async (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
        console.log('🗑️ Task deleted locally:', id);
        
        const token = useAuthStore.getState().token;
        if (token && import.meta.env.VITE_SUPABASE_URL) {
          try {
            await tasksAPI.delete(id, token);
            console.log('🔄 Task deletion synced to server, refreshing all data...');
            // Refresh data to ensure cross-device sync
            get().loadFromRemote();
          } catch (error) {
            console.error('❌ Failed to sync task deletion to server:', error);
          }
        }
      },

      toggleTask: async (id) => {
        const currentTask = get().tasks.find(t => t.id === id);
        const willBeCompleted = currentTask && !currentTask.completed;
        
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, completed: !task.completed, updatedAt: new Date() }
              : task
          ),
        }));
        
        // Play completion sound when task is completed
        if (willBeCompleted) {
          playSound('complete');
        }
        
        console.log('✅ Task toggled locally:', id, willBeCompleted ? 'completed' : 'pending');
        
        const token = useAuthStore.getState().token;
        if (token && import.meta.env.VITE_SUPABASE_URL) {
          try {
            const task = get().tasks.find(t => t.id === id);
            const status = task && task.completed ? 'completed' : 'pending';
            
            await fetch(`${import.meta.env.VITE_SUPABASE_URL.replace('.supabase.co', '.supabase.co/functions/v1')}/tasks/tasks`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ id, status }),
            });
            
            console.log('🔄 Task toggle synced to server, refreshing all data...');
            // Refresh data to ensure cross-device sync
            get().loadFromRemote();
          } catch (error) {
            console.error('❌ Failed to sync task toggle to server:', error);
          }
        }
      },

      addCategory: (categoryData) => {
        const newCategory: Category = {
          ...categoryData,
          id: crypto.randomUUID(),
        };
        set((state) => ({ categories: [...state.categories, newCategory] }));
        const token = useAuthStore.getState().token;
        if (token && import.meta.env.VITE_SUPABASE_URL) {
          categoriesAPI.create({ name: newCategory.name, color: newCategory.color }, token).catch(() => {});
        }
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, ...updates } : category
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
        }));
      },

      addTimeSession: (sessionData) => {
        const newSession: TimeSession = {
          ...sessionData,
          id: crypto.randomUUID(),
        };
        set((state) => ({ timeSessions: [...state.timeSessions, newSession] }));
        const token = useAuthStore.getState().token;
        if (token && import.meta.env.VITE_SUPABASE_URL) {
          timeSessionsAPI.create(
            {
              taskId: newSession.taskId,
              startTime: newSession.startTime,
              endTime: newSession.endTime,
              duration: newSession.duration,
              type: newSession.type,
            },
            token
          ).catch(() => {});
        }
      },

      // Subtask actions
      addSubtask: (taskId, title) => {
        const newSubtask = {
          id: crypto.randomUUID(),
          title,
          completed: false,
          createdAt: new Date(),
        };
        
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { 
                  ...task, 
                  subtasks: [...(task.subtasks || []), newSubtask],
                  updatedAt: new Date()
                }
              : task
          ),
        }));
      },

      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks?.map((subtask) =>
                    subtask.id === subtaskId
                      ? { ...subtask, completed: !subtask.completed }
                      : subtask
                  ),
                  updatedAt: new Date()
                }
              : task
          ),
        }));
      },

      deleteSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks?.filter((subtask) => subtask.id !== subtaskId),
                  updatedAt: new Date()
                }
              : task
          ),
        }));
      },

      updateSubtask: (taskId, subtaskId, title) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks?.map((subtask) =>
                    subtask.id === subtaskId
                      ? { ...subtask, title }
                      : subtask
                  ),
                  updatedAt: new Date()
                }
              : task
          ),
        }));
      },

      getDashboardStats: () => {
        const { tasks, timeSessions } = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayTasks = tasks.filter(
          (task) => task.createdAt >= today
        );
        
        const totalTimeSpent = timeSessions.reduce(
          (total, session) => total + session.duration / 60,
          0
        );

        return {
          totalTasks: tasks.length,
          completedTasks: tasks.filter((task) => task.completed).length,
          totalTimeSpent,
          completionRate: tasks.length > 0 ? (tasks.filter((task) => task.completed).length / tasks.length) * 100 : 0,
          todayTasks: todayTasks.length,
          todayCompletedTasks: todayTasks.filter((task) => task.completed).length,
        };
      },

      getTasksByCategory: (categoryId) => {
        return get().tasks.filter((task) => task.category === categoryId);
      },

      getTodayTasks: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get().tasks.filter(
          (task) => task.createdAt >= today || (task.dueDate && task.dueDate >= today)
        );
      },
    }),
    {
      name: 'tasky-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
