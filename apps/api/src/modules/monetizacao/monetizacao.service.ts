import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';

const PERIODO_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class MonetizacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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
