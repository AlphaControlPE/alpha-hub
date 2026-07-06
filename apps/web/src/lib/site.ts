// URL pública canônica do site. Sobrescrevível por env no deploy (Render/preview).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://alpha-hub-web.onrender.com'
).replace(/\/$/, '');
