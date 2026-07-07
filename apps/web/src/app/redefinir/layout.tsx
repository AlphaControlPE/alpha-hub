import type { Metadata } from 'next';

// Fluxo de conta: não indexar.
export const metadata: Metadata = {
  title: 'Criar nova senha',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
