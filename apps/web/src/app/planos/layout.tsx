import type { Metadata } from 'next';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Planos',
  description:
    'O núcleo do Alpha Hub é grátis para sempre. Planos opcionais adicionam selo verificado e recursos — sem nunca bloquear a participação.',
  path: '/planos',
});

export default function PlanosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
