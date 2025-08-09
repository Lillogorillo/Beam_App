import { create } from 'zustand';
import type { TimerState, PomodoroSettings } from '../types';

interface TimerStore extends TimerState {
  settings: PomodoroSettings;
  
  // Timer actions
  startTimer: (taskId?: string) => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  
  // Settings actions
  updateSettings: (settings: Partial<PomodoroSettings>) => void;
  
  // Session management
  completeSession: () => void;
  skipSession: () => void;
}

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
};

export const useTimerStore = create<TimerStore>((set, get) => ({
  isRunning: false,
  currentTaskId: undefined,
  sessionType: 'work',
  timeLeft: defaultSettings.workDuration * 60,
  currentSession: 1,
  totalSessions: 0,
  settings: defaultSettings,

  startTimer: (taskId) => {
    set((state) => ({
      isRunning: true,
      currentTaskId: taskId || state.currentTaskId,
    }));
  },

  pauseTimer: () => {
    set({ isRunning: false });
  },

  stopTimer: () => {
    set((state) => ({
      isRunning: false,
      currentTaskId: undefined,
      timeLeft: state.sessionType === 'work' 
        ? state.settings.workDuration * 60
        : state.sessionType === 'shortBreak'
        ? state.settings.shortBreakDuration * 60
        : state.settings.longBreakDuration * 60,
    }));
  },

  resetTimer: () => {
    const { settings } = get();
    set({
      isRunning: false,
      currentTaskId: undefined,
      sessionType: 'work',
      timeLeft: settings.workDuration * 60,
      currentSession: 1,
      totalSessions: 0,
    });
  },

  tick: () => {
    const state = get();
    if (!state.isRunning || state.timeLeft <= 0) return;

    const newTimeLeft = state.timeLeft - 1;
    
    if (newTimeLeft <= 0) {
      // Session completed
      state.completeSession();
    } else {
      set({ timeLeft: newTimeLeft });
    }
  },

  completeSession: () => {
    const { currentSession, sessionType, settings, totalSessions } = get();
    
    let nextSessionType: 'work' | 'shortBreak' | 'longBreak';
    let nextTimeLeft: number;
    let nextCurrentSession: number;
    
    if (sessionType === 'work') {
      // Decide break type
      if (currentSession % settings.sessionsUntilLongBreak === 0) {
        nextSessionType = 'longBreak';
        nextTimeLeft = settings.longBreakDuration * 60;
      } else {
        nextSessionType = 'shortBreak';
        nextTimeLeft = settings.shortBreakDuration * 60;
      }
      nextCurrentSession = currentSession;
    } else {
      // Break completed, start work
      nextSessionType = 'work';
      nextTimeLeft = settings.workDuration * 60;
      nextCurrentSession = currentSession + 1;
    }

    set({
      isRunning: false,
      sessionType: nextSessionType,
      timeLeft: nextTimeLeft,
      currentSession: nextCurrentSession,
      totalSessions: totalSessions + 1,
    });

    // Trigger notification event (will be handled by components)
    window.dispatchEvent(new CustomEvent('timerComplete', {
      detail: {
        sessionType,
        nextSessionType,
        currentSession: nextCurrentSession,
      }
    }));
  },

  skipSession: () => {
    get().completeSession();
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },
}));
