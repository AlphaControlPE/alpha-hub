import type { Metadata } from 'next';

// Página de aceite de convite (privada, por link): não indexar.
export const metadata: Metadata = {
  title: 'Convite para organização',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
