'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { NotificationBell } from '@/components/NotificationBell';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Nav() {
  const { usuario, sair, carregando } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const fechar = () => setMenuAberto(false);

  return (
    <header className="nav">
      <nav className="container nav-inner" aria-label="Navegação principal">
        <Link href="/" className="brand" aria-label="Alpha Hub — início" onClick={fechar}>
          <span className="dot" aria-hidden="true" />
          <span className="logo-lockup" aria-hidden="true">
            <span className="logo-alpha">ALPHA</span>
            <span className="logo-control">CONTROL</span>
          </span>
          <span className="logo-tag" aria-hidden="true">HUB</span>
        </Link>
        <span className="chip nav-chip-hide" title="Núcleo gratuito, sem paywall">grátis para participar</span>
        <div className="spacer" />

        <div className={`nav-collapse${menuAberto ? ' aberto' : ''}`}>
          <Link href="/" className="navlink" onClick={fechar}>Solicitações</Link>
          <Link href="/comunidade" className="navlink" onClick={fechar}>Comunidade</Link>
          <Link href="/planos" className="navlink" onClick={fechar}>Planos</Link>
          {usuario && <Link href="/indicacoes" className="navlink" onClick={fechar}>Indicações</Link>}
          {usuario && <Link href="/organizacoes" className="navlink" onClick={fechar}>Organizações</Link>}
          {usuario && <Link href="/contratos" className="navlink" onClick={fechar}>Contratos</Link>}
          {usuario && <Link href="/conversas" className="navlink" onClick={fechar}>Conversas</Link>}
          {usuario && (usuario.papelSistema === 'ADMIN' || usuario.papelSistema === 'MODERADOR') && (
            <Link href="/admin" className="navlink" onClick={fechar}>Admin</Link>
          )}
          {!carregando && usuario && (
            <>
              <Link href="/nova" className="btn btn-primary btn-sm" onClick={fechar}>+ Nova solicitação</Link>
              <NotificationBell />
              <span className="row" style={{ marginLeft: 6 }}>
                <Link href="/perfil" aria-label={`Meu perfil — ${usuario.nome}`} onClick={fechar}>
                  <span className="avatar" style={{ width: 30, height: 30 }} aria-hidden="true">
                    {usuario.nome.charAt(0).toUpperCase()}
                  </span>
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={() => { fechar(); sair(); }}>Sair</button>
              </span>
            </>
          )}
          {!carregando && !usuario && (
            <Link href="/login" className="btn btn-primary btn-sm" onClick={fechar}>Entrar</Link>
          )}
        </div>

        <ThemeToggle />
        <button
          type="button"
          className="nav-hamburger"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto((v) => !v)}
        >
          {menuAberto ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </nav>
    </header>
  );
}
