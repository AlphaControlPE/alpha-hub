import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Rotas públicas (sem auth) para os buscadores. Páginas atrás de login ficam de fora.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const rotas = ['', '/comunidade', '/planos', '/login', '/termos', '/privacidade'];
  return rotas.map((rota) => ({
    url: `${SITE_URL}${rota}` || SITE_URL,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: rota === '' ? 1 : 0.6,
  }));
}
