import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Entrar ou criar conta',
  description:
    'Acesse sua conta Alpha Hub ou cadastre-se grátis para publicar solicitações, enviar propostas e negociar no chat.',
  path: '/login',
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
