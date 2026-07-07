'use client';

import { useEffect } from 'react';

// Registra o service worker (PWA offline). Só em produção: em dev o cache
// atrapalharia o HMR. Falha silenciosa — o app funciona normalmente sem SW.
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}
