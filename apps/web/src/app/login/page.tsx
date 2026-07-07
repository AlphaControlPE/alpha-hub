'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { entrar, registrar } = useAuth();
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [temEsqueciSenha, setTemEsqueciSenha] = useState(false);

  // O link "esqueci a senha" só aparece se o recurso estiver habilitado no servidor.
  useEffect(() => {
    api<{ esqueciSenha: boolean }>('/auth/recursos')
      .then((r) => setTemEsqueciSenha(r.esqueciSenha))
      .catch(() => {});
  }, []);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      if (modo === 'entrar') await entrar(email, senha);
      else await registrar(nome, email, senha);
      router.push('/');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha na autenticação');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="center-screen">
      <div className="card card-pad" style={{ width: 'min(420px, 92vw)' }}>
        <h2 className="h2">{modo === 'entrar' ? 'Entrar no Alpha Hub' : 'Criar sua conta'}</h2>
        <div className="tabs">
          <button className={modo === 'entrar' ? 'active' : ''} onClick={() => setModo('entrar')} type="button">Entrar</button>
          <button className={modo === 'criar' ? 'active' : ''} onClick={() => setModo('criar')} type="button">Criar conta</button>
        </div>

        <form onSubmit={submeter}>
          {modo === 'criar' && (
            <label className="field">
              <span className="lbl">Nome</span>
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" required />
            </label>
          )}
          <label className="field">
            <span className="lbl">E-mail</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" required />
          </label>
          <label className="field">
            <span className="lbl">Senha</span>
            <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="mínimo 8 caracteres" required />
          </label>

          {erro && <p className="error" style={{ marginBottom: 12 }}>{erro}</p>}

          <button className="btn btn-primary" style={{ width: '100%' }} disabled={enviando}>
            {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta grátis'}
          </button>

          {modo === 'entrar' && temEsqueciSenha && (
            <p style={{ textAlign: 'center', marginTop: 14, marginBottom: 0 }}>
              <Link href="/esqueci" className="muted" style={{ fontSize: 13, textDecoration: 'underline' }}>
                Esqueci minha senha
              </Link>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
