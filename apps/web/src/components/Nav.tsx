'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { NotificationBell } from '@/components/NotificationBell';

export function Nav() {
  const { usuario, sair, carregando } = useAuth();

  return (
    <header className="nav">
      <nav className="container nav-inner" aria-label="Navegação principal">
        <Link href="/" className="brand" aria-label="Alpha Hub — início">
          <span className="dot" aria-hidden="true" />
          Alpha Hub
        </Link>
        <span className="chip" title="Núcleo gratuito, sem paywall">grátis para participar</span>
        <div className="spacer" />
        <Link href="/" className="navlink">Solicitações</Link>
        <Link href="/comunidade" className="navlink">Comunidade</Link>
        <Link href="/planos" className="navlink">Planos</Link>
        {usuario && <Link href="/indicacoes" className="navlink">Indicações</Link>}
        {usuario && <Link href="/organizacoes" className="navlink">Organizações</Link>}
        {usuario && <Link href="/contratos" className="navlink">Contratos</Link>}
        {usuario && <Link href="/conversas" className="navlink">Conversas</Link>}
        {usuario && (usuario.papelSistema === 'ADMIN' || usuario.papelSistema === 'MODERADOR') && (
          <Link href="/admin" className="navlink">Admin</Link>
        )}
        {!carregando && usuario && (
          <>
            <Link href="/nova" className="btn btn-primary btn-sm">+ Nova solicitação</Link>
            <NotificationBell />
            <span className="row" style={{ marginLeft: 6 }}>
              <Link href="/perfil" aria-label={`Meu perfil — ${usuario.nome}`}>
                <span className="avatar" style={{ width: 30, height: 30 }} aria-hidden="true">
                  {usuario.nome.charAt(0).toUpperCase()}
                </span>
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={sair}>Sair</button>
            </span>
          </>
        )}
        {!carregando && !usuario && (
          <Link href="/login" className="btn btn-primary btn-sm">Entrar</Link>
        )}
      </nav>
    </header>
  );
}
