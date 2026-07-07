import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { fetchPublic } from '@/lib/seo';
import type { Insight, Paginated, Solicitacao } from '@/lib/types';

// Sitemap com rotas públicas estáticas + entidades públicas dinâmicas
// (solicitações e insights). Se a API estiver fora/dormindo, cai só nas
// estáticas — nunca falha o build/requisição.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const rotas = ['', '/comunidade', '/planos', '/login', '/termos', '/privacidade'];
  const estaticas: MetadataRoute.Sitemap = rotas.map((rota) => ({
    url: `${SITE_URL}${rota}` || SITE_URL,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: rota === '' ? 1 : 0.6,
  }));

  const [sols, insights] = await Promise.all([
    fetchPublic<Paginated<Solicitacao>>('/solicitacoes?limit=100'),
    fetchPublic<Insight[]>('/insights'),
  ]);

  const dinamicas: MetadataRoute.Sitemap = [
    ...(sols?.dados ?? []).map((s) => ({
      url: `${SITE_URL}/solicitacoes/${s.id}`,
      lastModified: new Date(s.criadoEm),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...(Array.isArray(insights) ? insights : []).map((i) => ({
      url: `${SITE_URL}/comunidade/${i.id}`,
      lastModified: new Date(i.criadoEm),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ];

  return [...estaticas, ...dinamicas];
}
