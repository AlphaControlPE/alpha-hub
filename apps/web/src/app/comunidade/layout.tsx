import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Comunidade',
    description:
      'Insights, discussões e conhecimento compartilhado da comunidade Alpha Hub — aberto a todos.',
    path: '/comunidade',
  }),
  // Título como objeto para manter o template "%s · Alpha Hub" nos filhos
  // (/comunidade/[id]); string simples zeraria o template herdado da raiz.
  title: { default: 'Comunidade', template: '%s · Alpha Hub' },
};

export default function ComunidadeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
