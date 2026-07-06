export const metadata = { title: 'Política de Privacidade — Alpha Hub' };

export default function PrivacidadePage() {
  return (
    <div style={{ maxWidth: 760, margin: '24px auto' }}>
      <h1 className="h1">Política de Privacidade</h1>
      <p className="muted" style={{ marginBottom: 20 }}>
        Última atualização: julho de 2026 · versão preliminar · alinhada à LGPD (Lei 13.709/2018).
      </p>

      <div className="card card-pad" style={{ lineHeight: 1.6 }}>
        <h2 className="h2">1. Dados que coletamos</h2>
        <p>
          Coletamos os dados que você fornece (nome, e-mail, perfil, conteúdo publicado) e dados de
          uso necessários para operar a plataforma (registros de ações, para segurança e auditoria).
          Senhas são armazenadas apenas de forma cifrada (hash), nunca em texto puro.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>2. Para que usamos</h2>
        <p>
          Para prestar o serviço (conectar clientes e prestadores), garantir segurança, prevenir
          abuso, moderar conteúdo e melhorar a plataforma. <strong>Não vendemos dados pessoais.</strong>
          Indicações comerciais só são válidas com consentimento e base legal registrados.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>3. Base legal (LGPD)</h2>
        <p>
          Tratamos dados com base em execução de contrato (prestação do serviço), consentimento
          (quando aplicável, como em indicações), obrigação legal e legítimo interesse para segurança
          e prevenção a fraude.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>4. Compartilhamento</h2>
        <p>
          Dados de perfil públicos ficam visíveis a outros usuários. Contatos de indicações só são
          liberados à parte após reserva. Podemos usar provedores de infraestrutura (hospedagem,
          banco de dados) que processam dados em nosso nome.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>5. Seus direitos</h2>
        <p>
          Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados, e revogar
          consentimentos. Para exercer esses direitos, entre em contato pelo canal de suporte.
        </p>

        <h2 className="h2" style={{ marginTop: 20 }}>6. Retenção e segurança</h2>
        <p>
          Guardamos os dados pelo tempo necessário à finalidade e a obrigações legais. Aplicamos
          medidas de segurança (cifragem de senha, controle de acesso por papéis, limitação de
          requisições e trilha de auditoria).
        </p>

        <div className="sep" />
        <p className="muted" style={{ fontSize: 13 }}>
          Documento preliminar. Antes de uso comercial amplo, recomenda-se revisão jurídica e a
          indicação de um encarregado (DPO) e canal formal de contato.
        </p>
      </div>
    </div>
  );
}
