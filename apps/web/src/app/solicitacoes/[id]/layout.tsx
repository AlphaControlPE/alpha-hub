import type { Metadata } from 'next';
import { buildMetadata, fetchPublic, truncate } from '@/lib/seo';
import type { Solicitacao } from '@/lib/types';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const s = await fetchPublic<Solicitacao>(`/solicitacoes/${params.id}`);
  if (!s) {
    return buildMetadata({
      title: 'Solicitação',
      description: 'Veja esta solicitação e envie sua proposta no Alpha Hub.',
      path: `/solicitacoes/${params.id}`,
    });
  }
  const prefixo = s.categoria ? `${s.categoria} · ` : '';
  return buildMetadata({
    title: s.titulo,
    description: truncate(`${prefixo}${s.descricao}`) || 'Envie sua proposta no Alpha Hub.',
    path: `/solicitacoes/${s.id}`,
  });
}

export default function SolicitacaoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
