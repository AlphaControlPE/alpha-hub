import type { Metadata } from 'next';
import { API_URL } from '@/lib/api';

// Camada de SEO por página: constrói Metadata consistente (canonical + OpenGraph +
// Twitter) reaproveitando o metadataBase/template definidos no layout raiz.

interface PageSeo {
  title: string;
  description: string;
  path: string; // caminho absoluto começando com "/"
  images?: string[];
  noindex?: boolean;
}

export function buildMetadata({ title, description, path, images = ['/og.png'], noindex }: PageSeo): Metadata {
  // O merge de metadata do Next substitui o objeto openGraph inteiro (não mescla
  // campo a campo com o layout raiz), então o og:image padrão precisa ser
  // reafirmado aqui — senão páginas com openGraph próprio perdem a imagem.
  const ogTitle = `${title} · Alpha Hub`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: path,
      siteName: 'Alpha Hub',
      locale: 'pt_BR',
      title: ogTitle,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images,
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

// Encurta um texto para caber numa meta description (sem cortar no meio de forma feia).
export function truncate(input: string, max = 155): string {
  const clean = (input || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

// Fetch server-side tolerante a falhas (usado em generateMetadata). Nunca lança:
// se a API estiver dormindo/fora, retorna null e a página cai no metadata padrão.
export async function fetchPublic<T>(path: string, timeoutMs = 8000): Promise<T | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`${API_URL}/api${path}`, {
      signal: ctrl.signal,
      next: { revalidate: 600 },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
