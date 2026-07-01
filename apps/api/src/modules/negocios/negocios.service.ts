import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { CreateContratoDto } from './dto/create-contrato.dto';

const parte = { select: { id: true, nome: true, verificado: true } };
const contratoCompleto = {
  cliente: parte,
  prestador: parte,
  marcos: { orderBy: { ordem: 'asc' as const } },
  pagamentos: true,
  proposta: { select: { id: true, solicitacaoId: true } },
};

@Injectable()
export class NegociosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  private ehParte(c: { clienteId: string; prestadorId: string }, userId: string) {
    return c.clienteId === userId || c.prestadorId === userId;
  }

  /** Formaliza um contrato a partir de uma proposta ACEITA (escopo 11.01–11.02). */
  async criar(userId: string, dto: CreateContratoDto, origem?: string) {
    const proposta = await this.prisma.proposta.findUnique({
      where: { id: dto.propostaId },
      include: { solicitacao: true },
    });
    if (!proposta) throw new NotFoundException('Proposta não encontrada');
    if (proposta.status !== 'ACEITA') {
      throw new BadRequestException('Só é possível formalizar contrato de proposta aceita');
    }
    const clienteId = proposta.solicitacao.autorId;
    const prestadorId = proposta.autorId;
    if (userId !== clienteId && userId !== prestadorId) {
      throw new ForbiddenException('Apenas as partes da negociação podem formalizar o contrato');
    }

    const valorTotal = dto.marcos.reduce((s, m) => s + m.valor, 0);

    try {
      const contrato = await this.prisma.contrato.create({
        data: {
          propostaId: dto.propostaId,
          clienteId,
          prestadorId,
          escopo: dto.escopo,
          prazoDias: dto.prazoDias ?? null,
          valorTotal,
          marcos: {
            create: dto.marcos.map((m, i) => ({
              titulo: m.titulo,
              descricao: m.descricao ?? null,
              valor: m.valor,
              ordem: i,
            })),
          },
        },
        include: contratoCompleto,
      });
      await this.audit.registrar({
        acao: 'contrato.criado',
        entidade: 'Contrato',
        entidadeId: contrato.id,
        autorId: userId,
        depois: { valorTotal, marcos: dto.marcos.length },
        origem,
      });
      return contrato;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Esta proposta já possui contrato');
      }
      throw e;
    }
  }

  async listarMeus(userId: string) {
    return this.prisma.contrato.findMany({
      where: { OR: [{ clienteId: userId }, { prestadorId: userId }] },
      include: contratoCompleto,
      orderBy: { criadoEm: 'desc' },
    });
  }

  async detalhar(id: string, userId: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
      include: contratoCompleto,
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado');
    if (!this.ehParte(contrato, userId)) {
      throw new ForbiddenException('Você não participa deste contrato');
    }
    return contrato;
  }

  /**
   * Assinatura das duas partes (11.01). Quando ambas assinam, o contrato fica
   * ATIVO e o escrow SIMULADO é registrado (RETIDO) para cada marco.
   */
  async assinar(id: string, userId: string, origem?: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id },
      include: { marcos: true },
    });
    if (!contrato) throw new NotFoundException('Contrato não encontrado');
    if (!this.ehParte(contrato, userId)) {
      throw new ForbiddenException('Você não participa deste contrato');
    }
    if (contrato.status !== 'RASCUNHO') {
      throw new BadRequestException('Contrato não está em rascunho');
    }

    const ehCliente = contrato.clienteId === userId;
    const data: Prisma.ContratoUpdateInput = ehCliente
      ? { aceiteCliente: true }
      : { aceitePrestador: true };

    const ambos =
      (ehCliente ? true : contrato.aceiteCliente) &&
      (ehCliente ? contrato.aceitePrestador : true);

    const atualizado = await this.prisma.$transaction(async (tx) => {
      await tx.contrato.update({
        where: { id },
        data: { ...data, ...(ambos ? { status: 'ATIVO' } : {}) },
      });
      // Ao ativar, registra o escrow simulado (RETIDO) de cada marco.
      if (ambos) {
        for (const m of contrato.marcos) {
          await tx.pagamento.create({
            data: {
              contratoId: id,
              marcoId: m.id,
              valor: m.valor,
              status: 'RETIDO',
              referencia: `escrow_sim_${m.id.slice(0, 8)}`,
            },
          });
        }
      }
      // Re-busca já com pagamentos criados para retornar estado consistente.
      return tx.contrato.findUniqueOrThrow({ where: { id }, include: contratoCompleto });
    });

    await this.audit.registrar({
      acao: ambos ? 'contrato.ativado' : 'contrato.assinado',
      entidade: 'Contrato',
      entidadeId: id,
      autorId: userId,
      depois: { aceiteCliente: atualizado.aceiteCliente, aceitePrestador: atualizado.aceitePrestador, status: atualizado.status },
      origem,
    });

    const outraParte = userId === contrato.clienteId ? contrato.prestadorId : contrato.clienteId;
    await this.notificacoes.notificar({
      userId: outraParte,
      categoria: 'contrato',
      tipo: ambos ? 'contrato.ativado' : 'contrato.assinado',
      titulo: ambos ? 'Contrato ativado ✅' : 'Contrato assinado',
      corpo: ambos
        ? 'As duas partes assinaram. O contrato está ativo e o escrow foi registrado.'
        : 'A outra parte assinou o contrato. Falta a sua assinatura.',
      link: '/contratos',
      entidade: 'Contrato',
      entidadeId: id,
    });
    return atualizado;
  }

  /** Prestador marca um marco como ENTREGUE (11.03). */
  async entregarMarco(contratoId: string, marcoId: string, userId: string, origem?: string) {
    const { contrato, marco } = await this.carregarMarco(contratoId, marcoId);
    if (contrato.prestadorId !== userId) {
      throw new ForbiddenException('Apenas o prestador entrega o marco');
    }
    if (contrato.status !== 'ATIVO') throw new BadRequestException('Contrato não está ativo');
    if (marco.status !== 'PENDENTE') throw new BadRequestException('Marco não está pendente');

    const atualizado = await this.prisma.marco.update({
      where: { id: marcoId },
      data: { status: 'ENTREGUE' },
    });
    await this.audit.registrar({
      acao: 'marco.entregue',
      entidade: 'Marco',
      entidadeId: marcoId,
      autorId: userId,
      depois: { contratoId },
      origem,
    });

    await this.notificacoes.notificar({
      userId: contrato.clienteId,
      categoria: 'contrato',
      tipo: 'marco.entregue',
      titulo: 'Marco entregue',
      corpo: `O marco "${marco.titulo}" foi entregue. Revise e aprove para liberar o escrow.`,
      link: '/contratos',
      entidade: 'Contrato',
      entidadeId: contratoId,
    });
    return atualizado;
  }

  /**
   * Cliente aprova o marco entregue: libera o escrow simulado (RETIDO→LIBERADO)
   * e marca o marco como PAGO. Se todos os marcos forem pagos, conclui o contrato.
   */
  async aprovarMarco(contratoId: string, marcoId: string, userId: string, origem?: string) {
    const { contrato, marco } = await this.carregarMarco(contratoId, marcoId);
    if (contrato.clienteId !== userId) {
      throw new ForbiddenException('Apenas o cliente aprova o marco');
    }
    if (marco.status !== 'ENTREGUE') {
      throw new BadRequestException('O marco precisa estar entregue para ser aprovado');
    }

    const resultado = await this.prisma.$transaction(async (tx) => {
      await tx.marco.update({ where: { id: marcoId }, data: { status: 'PAGO' } });
      await tx.pagamento.updateMany({
        where: { marcoId, status: 'RETIDO' },
        data: { status: 'LIBERADO' },
      });
      const restantes = await tx.marco.count({
        where: { contratoId, status: { not: 'PAGO' } },
      });
      if (restantes === 0) {
        await tx.contrato.update({ where: { id: contratoId }, data: { status: 'CONCLUIDO' } });
      }
      return { concluido: restantes === 0 };
    });

    await this.audit.registrar({
      acao: 'marco.aprovado',
      entidade: 'Marco',
      entidadeId: marcoId,
      autorId: userId,
      depois: { status: 'PAGO', escrow: 'LIBERADO', contratoConcluido: resultado.concluido },
      motivo: 'Aprovação do cliente libera o escrow simulado',
      origem,
    });

    await this.notificacoes.notificar({
      userId: contrato.prestadorId,
      categoria: 'contrato',
      tipo: resultado.concluido ? 'contrato.concluido' : 'marco.aprovado',
      titulo: resultado.concluido ? 'Contrato concluído 🎉' : 'Marco aprovado',
      corpo: resultado.concluido
        ? 'Todos os marcos foram aprovados e o escrow liberado. Contrato concluído!'
        : `O marco "${marco.titulo}" foi aprovado e o escrow liberado.`,
      link: '/contratos',
      entidade: 'Contrato',
      entidadeId: contratoId,
    });
    return this.detalhar(contratoId, userId);
  }

  private async carregarMarco(contratoId: string, marcoId: string) {
    const marco = await this.prisma.marco.findUnique({
      where: { id: marcoId },
      include: { contrato: true },
    });
    if (!marco || marco.contratoId !== contratoId) {
      throw new NotFoundException('Marco não encontrado');
    }
    return { contrato: marco.contrato, marco };
  }
}
