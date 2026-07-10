import type { MetadataRoute } from 'next';

// Web App Manifest (servido em /manifest.webmanifest). Torna o site instalável
// como PWA. Ícones: PNG 192/512 (arquivos estáticos) para máxima compatibilidade
// + SVG maskable/any (nítidos em qualquer tamanho).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alpha Hub — marketplace gratuito',
    short_name: 'Alpha Hub',
    description:
      'Publique solicitações, receba propostas e negocie no chat. Grátis para participar.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0d12',
    theme_color: '#0b0d12',
    lang: 'pt-BR',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
