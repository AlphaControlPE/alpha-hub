import type { Metadata } from 'next';

// Página privada (exige login): não indexar.
export const metadata: Metadata = {
  title: 'Notificações',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
