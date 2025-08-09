import { useEffect } from 'react';

interface KeyboardShortcuts {
  onNewTask?: () => void;
  onSearch?: () => void;
  onToggleTimer?: () => void;
  onSettings?: () => void;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcuts) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // Cmd/Ctrl + N - New Task
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        shortcuts.onNewTask?.();
      }

      // Cmd/Ctrl + K - Search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        shortcuts.onSearch?.();
      }

      // Space - Toggle Timer
      if (event.key === ' ') {
        event.preventDefault();
        shortcuts.onToggleTimer?.();
      }

      // Cmd/Ctrl + , - Settings
      if ((event.metaKey || event.ctrlKey) && event.key === ',') {
        event.preventDefault();
        shortcuts.onSettings?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};


