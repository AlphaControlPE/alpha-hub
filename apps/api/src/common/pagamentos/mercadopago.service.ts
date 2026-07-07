import { Injectable, Logger } from '@nestjs/common';

export interface PreferenciaCheckout {
  id: string;
  url: string; // init_point — para onde redirecionar o comprador
}

export interface PagamentoMp {
  id: string;
  status: string; // approved | pending | rejected | cancelled | ...
  external_reference?: string;
  transaction_amount?: number; // em reais (decimal)
}

/**
 * Integração com o Mercado Pago (Checkout Pro) via REST — sem SDK.
 * OPCIONAL e gated: sem MP_ACCESS_TOKEN, `disponivel` é false e o checkout
 * fica desligado (nada de fachada; o modo simulado continua para demonstração).
 *
 * Em NODE_ENV=test nada sai para a rede: a última preference criada e um
 * "banco" de pagamentos ficam inspecionáveis/injetáveis pelos e2e.
 */
@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);

  /** Última preference criada em modo teste. */
  static ultimaPreferenciaTeste: Record<string, unknown> | null = null;
  /** Pagamentos simulados em modo teste (id -> pagamento), injetados pelos e2e. */
  static pagamentosTeste = new Map<string, PagamentoMp>();

  get disponivel(): boolean {
    return Boolean(process.env.MP_ACCESS_TOKEN);
  }

  private get baseWeb(): string {
    return (process.env.WEB_ORIGIN ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  private get baseApi(): string {
    return (process.env.API_PUBLIC_URL ?? 'http://localhost:3001').replace(/\/$/, '');
  }

  /** Cria a preference do Checkout Pro (Pix/cartão/boleto conforme conta MP). */
  async criarPreferencia(params: {
    titulo: string;
    precoCentavos: number;
    externalReference: string;
    emailComprador?: string;
  }): Promise<PreferenciaCheckout> {
    const corpo = {
      items: [
        {
          title: params.titulo,
          quantity: 1,
          unit_price: Math.round(params.precoCentavos) / 100,
          currency_id: 'BRL',
        },
      ],
      external_reference: params.externalReference,
      payer: params.emailComprador ? { email: params.emailComprador } : undefined,
      back_urls: {
        success: `${this.baseWeb}/planos?pagamento=sucesso`,
        pending: `${this.baseWeb}/planos?pagamento=pendente`,
        failure: `${this.baseWeb}/planos?pagamento=falha`,
      },
      auto_return: 'approved',
      notification_url: `${this.baseApi}/api/webhooks/mercadopago`,
      statement_descriptor: 'ALPHA HUB',
    };

    if (process.env.NODE_ENV === 'test') {
      MercadoPagoService.ultimaPreferenciaTeste = corpo;
      return { id: `pref_teste_${Date.now()}`, url: 'https://mp.teste/checkout' };
    }

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(corpo),
    });
    if (!res.ok) {
      const texto = await res.text().catch(() => '');
      this.logger.error(`Falha ao criar preference (${res.status}): ${texto.slice(0, 300)}`);
      throw new Error('Falha ao iniciar o checkout de pagamento');
    }
    const dados = (await res.json()) as { id: string; init_point: string };
    return { id: dados.id, url: dados.init_point };
  }

  /**
   * Busca um pagamento direto na API do MP — é a nossa verificação de
   * autenticidade do webhook: só confiamos no que o próprio MP nos devolve.
   */
  async buscarPagamento(id: string): Promise<PagamentoMp | null> {
    if (process.env.NODE_ENV === 'test') {
      return MercadoPagoService.pagamentosTeste.get(id) ?? null;
    }
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    if (!res.ok) {
      this.logger.warn(`Pagamento ${id} não encontrado no MP (${res.status})`);
      return null;
    }
    return (await res.json()) as PagamentoMp;
  }
}
