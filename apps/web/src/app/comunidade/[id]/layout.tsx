import type { Metadata } from 'next';
import { buildMetadata, fetchPublic, truncate } from '@/lib/seo';
import type { Insight } from '@/lib/types';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const i = await fetchPublic<Insight>(`/insights/${params.id}`);
  if (!i) {
    return buildMetadata({
      title: 'Comunidade',
      description: 'Insights e discussões da comunidade Alpha Hub.',
      path: `/comunidade/${params.id}`,
    });
  }
  return buildMetadata({
    title: i.titulo,
    description: truncate(i.conteudo) || 'Insight da comunidade Alpha Hub.',
    path: `/comunidade/${i.id}`,
  });
}

export default function InsightLayout({ children }: { children: React.ReactNode }) {
  return children;
}
