import type { Task } from '../types';

export const sampleTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Completare proposta progetto',
    description: 'Finire la proposta Q1 per la dashboard del nuovo cliente',
    completed: false,
    priority: 'high',
    category: '1', // Work
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    estimatedTime: 120,
  },
  {
    title: 'Revisionare pull request',
    description: 'Revisionare e approvare le pull request in sospeso del team',
    completed: false,
    priority: 'medium',
    category: '1', // Work
    estimatedTime: 45,
  },
  {
    title: 'Aggiornare sito portfolio',
    description: 'Aggiungere progetti recenti e aggiornare il design',
    completed: false,
    priority: 'medium',
    category: '2', // Personal
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    estimatedTime: 180,
  },
  {
    title: 'Imparare React Server Components',
    description: 'Studiare la nuova documentazione dei React Server Components',
    completed: false,
    priority: 'low',
    category: '3', // Learning
    estimatedTime: 90,
  },
  {
    title: 'Allenamento mattutino',
    description: '30 minuti di cardio e allenamento della forza',
    completed: true,
    priority: 'medium',
    category: '4', // Health
    estimatedTime: 30,
  },
  {
    title: 'Riunione standup team',
    description: 'Standup giornaliero con il team di sviluppo',
    completed: true,
    priority: 'medium',
    category: '1', // Work
    estimatedTime: 15,
  },
  {
    title: 'Pianificare viaggio weekend',
    description: 'Cercare e prenotare alloggio per la gita del weekend',
    completed: false,
    priority: 'low',
    category: '2', // Personal
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    estimatedTime: 60,
  },
  {
    title: 'Leggere "Clean Code" capitolo 3',
    description: 'Continuare a leggere il libro Clean Code',
    completed: false,
    priority: 'low',
    category: '3', // Learning
    estimatedTime: 45,
  },
];

export const initializeSampleData = (addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void) => {
  const hasData = localStorage.getItem('tasky-has-sample-data');
  
  if (!hasData) {
    sampleTasks.forEach(task => addTask(task));
    localStorage.setItem('tasky-has-sample-data', 'true');
  }
};
