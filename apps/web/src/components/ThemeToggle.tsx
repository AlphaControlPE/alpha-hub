'use client';

import { useEffect, useState } from 'react';

// Alterna o tema (dark padrão / light) e persiste em localStorage['acTheme'],
// a mesma chave compartilhada por todos os produtos Alpha Control. O atributo
// data-theme já é aplicado ANTES da hidratação por um script inline no <head>
// (evita flash); aqui só sincronizamos o estado do ícone e o toggle.
type Tema = 'dark' | 'light';

export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>('dark');

  useEffect(() => {
    const atual = (document.documentElement.getAttribute('data-theme') as Tema) || 'dark';
    setTema(atual);
  }, []);

  const alternar = () => {
    setTema((anterior) => {
      const novo: Tema = anterior === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', novo);
      try {
        localStorage.setItem('acTheme', novo);
      } catch {
        /* ignore */
      }
      return novo;
    });
  };

  const escuro = tema === 'dark';

  return (
    <button
      type="button"
      onClick={alternar}
      className="theme-toggle"
      aria-label={escuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title="Alternar tema"
    >
      {escuro ? (
        // Sol (mostrado no dark → clica para clarear)
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        // Lua (mostrada no light → clica para escurecer)
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
