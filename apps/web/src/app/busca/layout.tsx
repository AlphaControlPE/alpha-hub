import type { Metadata } from 'next';

// Página de resultados de busca: conteúdo dinâmico e derivado de outras
// páginas já indexadas — não faz sentido indexar a própria busca.
export const metadata: Metadata = {
  title: 'Busca',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
