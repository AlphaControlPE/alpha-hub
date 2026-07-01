'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { NotificationBell } from '@/components/NotificationBell';

export function Nav() {
  const { usuario, sair, carregando } = useAuth();

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand">
          <span className="dot" />
          Alpha Hub
        </Link>
        <span className="chip" title="Núcleo gratuito, sem paywall">grátis para participar</span>
        <div className="spacer" />
        <Link href="/" className="navlink">Solicitações</Link>
        <Link href="/comunidade" className="navlink">Comunidade</Link>
        <Link href="/planos" className="navlink">Planos</Link>
        {usuario && <Link href="/indicacoes" className="navlink">Indicações</Link>}
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
              <span className="avatar" style={{ width: 30, height: 30 }}>
                {usuario.nome.charAt(0).toUpperCase()}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={sair}>Sair</button>
            </span>
          </>
        )}
        {!carregando && !usuario && (
          <Link href="/login" className="btn btn-primary btn-sm">Entrar</Link>
        )}
      </div>
    </header>
  );
}
