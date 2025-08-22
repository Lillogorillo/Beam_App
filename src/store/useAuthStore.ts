import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authAPI } from '../config/api';
import { supabase } from '../config/supabaseClient';

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
  success: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearMessages: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticating: false,
      error: null,
      success: null,

      async login(email: string, password: string) {
        try {
          console.log('Login attempt started', { email, supabaseAvailable: !!supabase });
          set({ isAuthenticating: true, error: null, success: null });
          
          // Primo tentativo: Supabase Auth client (diretto)
          if (supabase) {
            console.log('Trying Supabase direct auth...');
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            console.log('Supabase auth result:', { data: !!data, error: error?.message });
            
            if (!error && data?.session?.access_token) {
              const accessToken = data.session.access_token;
              const user: AuthUser | null = data.user ? { id: data.user.id, email: data.user.email!, name: (data.user.user_metadata as any)?.name } : null;
              console.log('Login successful via Supabase direct', { user });
              set({ token: accessToken, user, isAuthenticating: false });
              return;
            }
            if (error) {
              console.log('Supabase direct auth failed, trying Edge Function fallback:', error.message);
            }
          }
          
          // Fallback: Edge Function auth/login
          console.log('Trying Edge Function auth...');
          const res = await authAPI.login({ email, password });
          console.log('Edge Function auth result:', res);
          
          const accessToken: string | undefined = res?.session?.access_token;
          const user: AuthUser | null = res?.user
            ? { id: res.user.id, email: res.user.email, name: (res.user.user_metadata as any)?.name }
            : null;
          if (!accessToken) throw new Error('Token non ricevuto');
          
          console.log('Login successful via Edge Function', { user });
          set({ token: accessToken, user, isAuthenticating: false });
        } catch (err: any) {
          console.error('Login failed:', err);
          set({ error: err?.message || 'Errore di autenticazione', isAuthenticating: false });
          throw err;
        }
      },

      async register(name: string, email: string, password: string) {
        try {
          console.log('Registration attempt started', { name, email, supabaseAvailable: !!supabase });
          set({ isAuthenticating: true, error: null, success: null });
          
          // Primo tentativo: Supabase Auth client (diretto)
          if (supabase) {
            console.log('Trying Supabase direct registration...');
            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { name }
              }
            });
            console.log('Supabase registration result:', { data: !!data, error: error?.message });
            
            if (!error && data?.user) {
              // Se la registrazione è riuscita e l'utente è confermato, facciamo login automatico
              if (data.session?.access_token) {
                const user: AuthUser = {
                  id: data.user.id,
                  email: data.user.email!,
                  name: data.user.user_metadata?.name || name
                };
                console.log('Registration and login successful via Supabase direct', { user });
                set({ token: data.session.access_token, user, isAuthenticating: false });
                return;
              } else {
                // Utente creato ma deve confermare email
                set({ 
                  success: 'Registrazione completata! Controlla la tua email per confermare l\'account, poi effettua il login.', 
                  error: null,
                  isAuthenticating: false 
                });
                return;
              }
            }
            if (error) {
              console.log('Supabase direct registration failed, trying Edge Function fallback:', error.message);
            }
          }
          
          // Fallback: Edge Function auth/register
          console.log('Trying Edge Function registration...');
          const result = await authAPI.register({ name, email, password });
          console.log('Edge Function registration result:', result);
          
          // Dopo registrazione, effettua login automatico
          console.log('Auto-login after registration...');
          await (useAuthStore.getState().login(email, password));
          set({ isAuthenticating: false });
        } catch (err: any) {
          console.error('Registration failed:', err);
          set({ error: err?.message || 'Errore di registrazione', isAuthenticating: false });
          throw err;
        }
      },

      logout() {
        set({ token: null, user: null, error: null, success: null });
      },

      clearMessages() {
        set({ error: null, success: null });
      },
    }),
    {
      name: 'tasky-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);


