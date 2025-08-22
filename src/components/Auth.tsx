import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const Auth: React.FC = () => {
  const { login, register, isAuthenticating, error } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Auth attempt:', { mode, email });
    
    try {
      if (mode === 'login') {
        console.log('Attempting login...');
        await login(email, password);
        console.log('Login successful!');
      } else {
        console.log('Attempting registration...');
        await register(name, email, password);
        console.log('Registration successful!');
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <form onSubmit={onSubmit} className="bg-gray-800 rounded-xl p-6 w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-white">{mode === 'login' ? 'Accedi' : 'Registrati'}</h1>

        {mode === 'register' && (
          <div>
            <label className="block text-sm text-gray-300 mb-1">Nome</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-300 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white" />
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        <button disabled={isAuthenticating} type="submit" className="btn-primary w-full">
          {isAuthenticating ? 'Attendere...' : (mode === 'login' ? 'Accedi' : 'Registrati')}
        </button>

        <button type="button" className="btn-secondary w-full" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Crea un account' : 'Hai già un account? Accedi'}
        </button>
      </form>
    </div>
  );
};




