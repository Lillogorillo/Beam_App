// Configurazione API per Supabase Edge Functions
export const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace('.supabase.co', '.supabase.co/functions/v1') || '';

// Funzioni helper per le chiamate API
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}/${endpoint}`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('API Call:', { endpoint, url, API_BASE_URL, hasAnonKey: !!anonKey, options: { ...options, body: options.body ? 'HIDDEN' : undefined } });
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    console.log('API Response:', { status: response.status, ok: response.ok, endpoint });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API Success:', { endpoint, result: result ? 'RECEIVED' : 'EMPTY' });
    return result;
  } catch (error) {
    console.error('API call failed:', { endpoint, error });
    throw error;
  }
};

// Funzioni per l'autenticazione
export const authAPI = {
  register: (data: { email: string; password: string; name: string }) =>
    apiCall('auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  login: (data: { email: string; password: string }) =>
    apiCall('auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Funzioni per le task
type AuthHeader = { Authorization: string };

export interface TaskPayload {
  id?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueDate?: string | Date;
  estimatedTime?: number;
  completed: boolean;
}

export const tasksAPI = {
  getAll: (token: string) =>
    apiCall('tasks/tasks', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
    }),
  
  create: (data: TaskPayload, token: string) =>
    apiCall('tasks/tasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify(data),
    }),
  
  update: (data: TaskPayload, token: string) =>
    apiCall('tasks/tasks', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify(data),
    }),
  
  delete: (id: string, token: string) =>
    apiCall('tasks/tasks', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify({ id }),
    }),
};

// Funzioni per le categorie
export interface CategoryPayload {
  id?: string;
  name: string;
  color?: string;
}

export const categoriesAPI = {
  getAll: (token: string) =>
    apiCall('categories/categories', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
    }),
  
  create: (data: CategoryPayload, token: string) =>
    apiCall('categories/categories', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify(data),
    }),
  
  update: (data: CategoryPayload, token: string) =>
    apiCall('categories/categories', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify(data),
    }),
  
  delete: (id: string, token: string) =>
    apiCall('categories/categories', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify({ id }),
    }),
};

// Funzioni per le sessioni di tempo
export interface TimeSessionPayload {
  id?: string;
  taskId?: string;
  startTime: string | Date;
  endTime?: string | Date;
  duration?: number;
  type: 'work' | 'break';
}

export const timeSessionsAPI = {
  getAll: (token: string) =>
    apiCall('time-sessions/time-sessions', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
    }),
  
  create: (data: TimeSessionPayload, token: string) =>
    apiCall('time-sessions/time-sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify(data),
    }),
  
  update: (data: TimeSessionPayload, token: string) =>
    apiCall('time-sessions/time-sessions', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify(data),
    }),
  
  delete: (id: string, token: string) =>
    apiCall('time-sessions/time-sessions', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify({ id }),
    }),
};

// Funzioni per gli obiettivi
export interface GoalPayload {
  id?: string;
  title: string;
  description?: string;
  target: number;
  current?: number;
  unit: string;
  deadline?: string | Date;
  completed?: boolean;
}

export const goalsAPI = {
  getAll: (token: string) =>
    apiCall('goals/goals', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
    }),
  
  create: (data: GoalPayload, token: string) =>
    apiCall('goals/goals', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify(data),
    }),
  
  update: (data: GoalPayload, token: string) =>
    apiCall('goals/goals', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify(data),
    }),
  
  delete: (id: string, token: string) =>
    apiCall('goals/goals', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify({ id }),
    }),
};

// Funzioni per le subtask
export interface SubtaskPayload {
  id?: string;
  taskId: string;
  title: string;
  completed?: boolean;
}

export const subtasksAPI = {
  getByTask: (taskId: string, token: string) =>
    apiCall(`subtasks/subtasks?task_id=${taskId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
    }),
  
  create: (data: SubtaskPayload, token: string) =>
    apiCall('subtasks/subtasks', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify(data),
    }),
  
  update: (data: SubtaskPayload, token: string) =>
    apiCall('subtasks/subtasks', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify(data),
    }),
  
  delete: (id: string, token: string) =>
    apiCall('subtasks/subtasks', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` } as AuthHeader,
      body: JSON.stringify({ id }),
    }),
};
