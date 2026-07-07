import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { MercadoPagoService } from '../../common/pagamentos/mercadopago.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const PERIODO_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class MonetizacaoService {
  private readonly logger = new Logger(MonetizacaoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly mp: MercadoPagoService,
  ) {}

  /** Recursos opcionais habilitados (o frontend só oferece o que funciona). */
  recursos(): { pagamentoReal: boolean } {
    return { pagamentoReal: this.mp.disponivel };
  }

  /** Catálogo público de planos opcionais (o núcleo continua gratuito). */
  async catalogo() {
    return this.prisma.plano.findMany({
      where: { ativo: true },
      orderBy: [{ ordem: 'asc' }, { preco: 'asc' }],
    });
  }

  async minhas(userId: string) {
    return this.prisma.assinatura.findMany({
      where: { userId },
      include: { plano: true },
      orderBy: { criadoEm: 'desc' },
    });
  }

  /**
   * Assina um plano opcional. Pagamento é SIMULADO — a plataforma não movimenta
   * dinheiro real. Recursos essenciais nunca dependem disso.
   */
  async assinar(userId: string, planoId: string, origem?: string) {
    const plano = await this.prisma.plano.findUnique({ where: { id: planoId } });
    if (!plano || !plano.ativo) throw new NotFoundException('Plano não encontrado');

    // Com pagamento real habilitado, plano pago NÃO pode ser ativado pelo
    // caminho simulado (anti-bypass). Planos grátis seguem por aqui.
    if (this.mp.disponivel && plano.preco > 0) {
      throw new BadRequestException(
        'Este plano exige pagamento — use o checkout (Pix/cartão).',
      );
    }

    const ativa = await this.prisma.assinatura.findFirst({
      where: { userId, planoId, status: 'ATIVA' },
    });
    if (ativa) throw new ConflictException('Você já tem uma assinatura ativa deste plano');

    const fimEm = plano.periodicidade === 'MENSAL' ? new Date(Date.now() + PERIODO_MS) : null;
    const assinatura = await this.prisma.assinatura.create({
      data: { userId, planoId, fimEm },
      include: { plano: true },
    });

    // Benefício: planos de verificação concedem o selo verificado.
    if (plano.recursos.includes('selo_verificado')) {
      await this.prisma.user.update({ where: { id: userId }, data: { verificado: true } });
    }

    await this.audit.registrar({
      acao: 'assinatura.criada',
      entidade: 'Assinatura',
      entidadeId: assinatura.id,
      autorId: userId,
      depois: { plano: plano.codigo, preco: plano.preco, metodo: 'simulado' },
      motivo: 'Recurso opcional — núcleo permanece gratuito',
      origem,
    });
    return assinatura;
  }

  /**
   * Inicia o pagamento REAL de um plano (Mercado Pago Checkout Pro).
   * Cria a assinatura como PENDENTE e devolve a URL de checkout; a ativação
   * acontece só quando o webhook confirmar o pagamento aprovado.
   */
  async checkout(userId: string, planoId: string, emailComprador?: string, origem?: string) {
    if (!this.mp.disponivel) {
      throw new ServiceUnavailableException(
        'Pagamento real não está habilitado nesta instalação.',
      );
    }
    const plano = await this.prisma.plano.findUnique({ where: { id: planoId } });
    if (!plano || !plano.ativo) throw new NotFoundException('Plano não encontrado');
    if (plano.preco === 0) {
      throw new BadRequestException('Plano gratuito não precisa de pagamento — assine direto.');
    }
    const ativa = await this.prisma.assinatura.findFirst({
      where: { userId, planoId, status: 'ATIVA' },
    });
    if (ativa) throw new ConflictException('Você já tem uma assinatura ativa deste plano');

    // Checkout novo invalida tentativas pendentes anteriores do mesmo plano.
    await this.prisma.assinatura.deleteMany({
      where: { userId, planoId, status: 'PENDENTE' },
    });
    const assinatura = await this.prisma.assinatura.create({
      data: { userId, planoId, status: 'PENDENTE', metodo: 'mercadopago' },
    });

    const pref = await this.mp.criarPreferencia({
      titulo: `Alpha Hub — ${plano.nome}`,
      precoCentavos: plano.preco,
      externalReference: assinatura.id,
      emailComprador,
    });
    await this.prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { preferenciaId: pref.id },
    });

    await this.audit.registrar({
      acao: 'assinatura.checkout_iniciado',
      entidade: 'Assinatura',
      entidadeId: assinatura.id,
      autorId: userId,
      depois: { plano: plano.codigo, preco: plano.preco, metodo: 'mercadopago' },
      origem,
    });
    return { url: pref.url, assinaturaId: assinatura.id };
  }

  /**
   * Webhook do Mercado Pago. NÃO confiamos no corpo recebido: buscamos o
   * pagamento na API do MP com a nossa credencial e validamos referência e
   * valor antes de ativar. Idempotente; responde sempre 2xx para o MP.
   */
  async processarWebhookMp(payload: { type?: string; data?: { id?: string | number } }) {
    const pagamentoId = payload?.data?.id ? String(payload.data.id) : null;
    if (!pagamentoId || (payload.type && payload.type !== 'payment')) {
      return { recebido: true, acao: 'ignorado' };
    }

    const pagamento = await this.mp.buscarPagamento(pagamentoId);
    if (!pagamento || pagamento.status !== 'approved' || !pagamento.external_reference) {
      return { recebido: true, acao: 'sem_acao' };
    }

    const assinatura = await this.prisma.assinatura.findUnique({
      where: { id: pagamento.external_reference },
      include: { plano: true },
    });
    if (!assinatura) return { recebido: true, acao: 'referencia_desconhecida' };

    // Idempotência: pagamento já processado.
    if (assinatura.status === 'ATIVA' && assinatura.pagamentoExternoId === pagamentoId) {
      return { recebido: true, acao: 'ja_processado' };
    }
    if (assinatura.status !== 'PENDENTE') {
      return { recebido: true, acao: 'status_incompativel' };
    }

    // Valor pago precisa bater com o preço do plano (centavos -> reais).
    const esperado = Math.round(assinatura.plano.preco) / 100;
    if (typeof pagamento.transaction_amount !== 'number' || pagamento.transaction_amount < esperado) {
      this.logger.warn(
        `Webhook MP: valor divergente (pago ${pagamento.transaction_amount}, esperado ${esperado}) na assinatura ${assinatura.id}`,
      );
      await this.audit.registrar({
        acao: 'assinatura.pagamento_valor_divergente',
        entidade: 'Assinatura',
        entidadeId: assinatura.id,
        depois: { pagamentoId, pago: pagamento.transaction_amount, esperado },
      });
      return { recebido: true, acao: 'valor_divergente' };
    }

    const fimEm =
      assinatura.plano.periodicidade === 'MENSAL' ? new Date(Date.now() + PERIODO_MS) : null;
    await this.prisma.assinatura.update({
      where: { id: assinatura.id },
      data: { status: 'ATIVA', inicioEm: new Date(), fimEm, pagamentoExternoId: pagamentoId },
    });
    if (assinatura.plano.recursos.includes('selo_verificado')) {
      await this.prisma.user.update({
        where: { id: assinatura.userId },
        data: { verificado: true },
      });
    }

    await this.audit.registrar({
      acao: 'assinatura.pagamento_confirmado',
      entidade: 'Assinatura',
      entidadeId: assinatura.id,
      autorId: assinatura.userId,
      depois: { pagamentoId, plano: assinatura.plano.codigo, valor: assinatura.plano.preco },
      motivo: 'Webhook Mercado Pago (pagamento aprovado, verificado na API)',
    });
    return { recebido: true, acao: 'ativada' };
  }

  async cancelar(id: string, userId: string, origem?: string) {
    const assinatura = await this.prisma.assinatura.findUnique({ where: { id } });
    if (!assinatura) throw new NotFoundException('Assinatura não encontrada');
    if (assinatura.userId !== userId) {
      throw new ForbiddenException('Você não pode cancelar esta assinatura');
    }
    if (assinatura.status === 'CANCELADA') {
      throw new BadRequestException('Assinatura já está cancelada');
    }
    const atualizada = await this.prisma.assinatura.update({
      where: { id },
      data: { status: 'CANCELADA', fimEm: new Date() },
      include: { plano: true },
    });
    await this.audit.registrar({
      acao: 'assinatura.cancelada',
      entidade: 'Assinatura',
      entidadeId: id,
      autorId: userId,
      antes: { status: 'ATIVA' },
      depois: { status: 'CANCELADA' },
      origem,
    });
    return atualizada;
  }
}
