// Blocos de carregamento (shimmer). Anunciados como "carregando" a leitores de tela.

export function Skeleton({
  w,
  h = 14,
  style,
}: {
  w?: number | string;
  h?: number;
  style?: React.CSSProperties;
}) {
  return <span className="skeleton" style={{ display: 'block', width: w ?? '100%', height: h, ...style }} />;
}

/** Skeleton de item de lista (título + linha de texto + chips) — formato dos cards de solicitação. */
export function SkeletonList({ itens = 4 }: { itens?: number }) {
  return (
    <div role="status" aria-label="Carregando conteúdo">
      {Array.from({ length: itens }).map((_, i) => (
        <div key={i} className="sol-item" aria-hidden="true">
          <div className="between">
            <Skeleton w="45%" h={17} />
            <Skeleton w={72} h={20} style={{ borderRadius: 999 }} />
          </div>
          <Skeleton w="85%" style={{ margin: '10px 0' }} />
          <div className="row">
            <Skeleton w={70} h={20} style={{ borderRadius: 999 }} />
            <Skeleton w={110} h={20} style={{ borderRadius: 999 }} />
          </div>
        </div>
      ))}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
