import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../config/api';

interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticating: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticating: false,
      error: null,

      async login(email: string, password: string) {
        try {
          set({ isAuthenticating: true, error: null });
          const res = await authAPI.login({ email, password });
          const accessToken: string | undefined = res?.session?.access_token;
          const user: AuthUser | null = res?.user
            ? { id: res.user.id, email: res.user.email, name: (res.user.user_metadata as any)?.name }
            : null;
          if (!accessToken) throw new Error('Token non ricevuto');
          set({ token: accessToken, user, isAuthenticating: false });
        } catch (err: any) {
          set({ error: err?.message || 'Errore di autenticazione', isAuthenticating: false });
          throw err;
        }
      },

      async register(name: string, email: string, password: string) {
        try {
          set({ isAuthenticating: true, error: null });
          await authAPI.register({ name, email, password });
          // Dopo registrazione, effettua login automatico
          await (useAuthStore.getState().login(email, password));
          set({ isAuthenticating: false });
        } catch (err: any) {
          set({ error: err?.message || 'Errore di registrazione', isAuthenticating: false });
          throw err;
        }
      },

      logout() {
        set({ token: null, user: null });
      },
    }),
    {
      name: 'tasky-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);


