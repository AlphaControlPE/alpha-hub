'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, getToken, setToken } from './api';
import { Usuario } from './types';

interface AuthState {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  registrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

interface AuthResposta {
  token: string;
  usuario: Usuario;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setCarregando(false);
      return;
    }
    api<Usuario>('/auth/me')
      .then(setUsuario)
      .catch(() => setToken(null))
      .finally(() => setCarregando(false));
  }, []);

  async function entrar(email: string, senha: string) {
    const r = await api<AuthResposta>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    setToken(r.token);
    setUsuario(r.usuario);
  }

  async function registrar(nome: string, email: string, senha: string) {
    const r = await api<AuthResposta>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha }),
    });
    setToken(r.token);
    setUsuario(r.usuario);
  }

  function sair() {
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, registrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
