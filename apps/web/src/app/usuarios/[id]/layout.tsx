import type { Metadata } from 'next';
import { buildMetadata, fetchPublic, truncate } from '@/lib/seo';
import { SITE_URL } from '@/lib/site';
import type { PerfilPublico } from '@/lib/types';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const p = await fetchPublic<PerfilPublico>(`/usuarios/${params.id}/perfil`);
  if (!p) {
    return buildMetadata({
      title: 'Perfil',
      description: 'Perfil público de um profissional no Alpha Hub.',
      path: `/usuarios/${params.id}`,
    });
  }
  const description = p.bio
    ? truncate(p.bio)
    : `Perfil de ${p.nome} no Alpha Hub — portfólio, serviços e reputação.`;
  return buildMetadata({ title: p.nome, description, path: `/usuarios/${p.id}` });
}

export default async function PerfilLayout({
  params,
  children,
}: {
  params: { id: string };
  children: React.ReactNode;
}) {
  const p = await fetchPublic<PerfilPublico>(`/usuarios/${params.id}/perfil`);
  const jsonLd = p
    ? {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        mainEntity: {
          '@type': 'Person',
          name: p.nome,
          url: `${SITE_URL}/usuarios/${p.id}`,
          ...(p.bio ? { description: p.bio } : {}),
          ...(p.servicos?.length
            ? { knowsAbout: p.servicos.map((s) => s.titulo).slice(0, 8) }
            : {}),
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
