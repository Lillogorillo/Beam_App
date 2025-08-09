export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  subtasks?: Subtask[]; // subtasks array
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface TimeSession {
  id: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in seconds
  type: 'work' | 'break';
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  totalTimeSpent: number; // in minutes
  completionRate: number;
  todayTasks: number;
  todayCompletedTasks: number;
}

export interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  sessionsUntilLongBreak: number;
}

export interface TimerState {
  isRunning: boolean;
  currentTaskId?: string;
  sessionType: 'work' | 'shortBreak' | 'longBreak';
  timeLeft: number; // in seconds
  currentSession: number;
  totalSessions: number;
}
