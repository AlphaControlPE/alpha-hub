export const metadata = { title: 'Termos de Uso — Alpha Hub' };

export default function TermosPage() {
  return (
    <div style={{ maxWidth: 760, margin: '24px auto' }}>
      <h1 className="h1">Termos de Uso</h1>
      <p className="muted" style={{ marginBottom: 20 }}>Última atualização: julho de 2026 · versão preliminar.</p>

      <div className="card card-pad" style={{ lineHeight: 1.6 }}>
        <h2 className="h2">1. O que é o Alpha Hub</h2>
        <p>
          O Alpha Hub é um marketplace que conecta clientes e prestadores para solicitações,
          propostas, indicações consentidas e colaboração. O núcleo — publicar solicitações,
          enviar propostas, conversar e indicar — é <strong>gratuito</strong>. Recursos opcionais
          (planos, verificação, patrocínio) não bloqueiam a participação básica.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>2. Papel da plataforma</h2>
        <p>
          A plataforma <strong>aproxima as partes</strong>, mas não é empregadora, contratante,
          garantidora universal nem instituição financeira apenas por isso. Acordos, contratos e
          pagamentos são responsabilidade das partes envolvidas. O pagamento protegido (escrow)
          disponível é <strong>simulado/registrado</strong> nesta fase — a plataforma não movimenta
          dinheiro real.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>3. Conduta e uso aceitável</h2>
        <p>
          Você concorda em não publicar spam, conteúdo ilegal ou enganoso, e em não comercializar
          dados pessoais de terceiros sem base legal. Indicações exigem consentimento e origem
          legítima. Contas que violarem estas regras podem ser advertidas, suspensas ou banidas,
          com registro auditável e direito de contestação.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>4. Conteúdo e reputação</h2>
        <p>
          Avaliações e reputação são ligadas a interações verificáveis. A plataforma modera
          conteúdo denunciado e mantém trilha de auditoria das ações relevantes.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>5. Limitação de responsabilidade</h2>
        <p>
          O serviço é fornecido "como está". Na máxima extensão permitida por lei, a plataforma não
          se responsabiliza por prejuízos decorrentes de acordos entre usuários.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>6. Alterações</h2>
        <p>
          Estes termos podem ser atualizados; mudanças relevantes serão comunicadas. O uso contínuo
          após alterações representa concordância.
        </p>

        <div className="sep" />
        <p className="muted" style={{ fontSize: 13 }}>
          Documento preliminar para operação inicial. Antes de uso comercial amplo, recomenda-se
          revisão jurídica. Dúvidas sobre dados pessoais: veja a <a href="/privacidade" style={{ color: 'var(--primary)' }}>Política de Privacidade</a>.
        </p>
      </div>
    </div>
  );
}
