import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DenunciaStatus, Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import {
  AplicarSancaoDto,
  CreateDenunciaDto,
  ResolverDenunciaDto,
} from './dto/moderacao.dto';

const autorPublico = { select: { id: true, nome: true, verificado: true } };
// Dados mínimos do usuário-alvo/aplicador de sanção — sem e-mail nem outros dados sensíveis.
const usuarioMinimo = { select: { id: true, nome: true } };

@Injectable()
export class ModeracaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  async denunciar(denuncianteId: string, dto: CreateDenunciaDto, origem?: string) {
    const denuncia = await this.prisma.denuncia.create({
      data: {
        alvoTipo: dto.alvoTipo,
        alvoId: dto.alvoId,
        motivo: dto.motivo,
        descricao: dto.descricao ?? null,
        denuncianteId,
      },
    });
    await this.audit.registrar({
      acao: 'denuncia.criada',
      entidade: 'Denuncia',
      entidadeId: denuncia.id,
      autorId: denuncianteId,
      depois: { alvoTipo: dto.alvoTipo, alvoId: dto.alvoId, motivo: dto.motivo },
      origem,
    });
    return denuncia;
  }

  async listarDenuncias(status?: DenunciaStatus) {
    const where: Prisma.DenunciaWhereInput = status ? { status } : {};
    return this.prisma.denuncia.findMany({
      where,
      include: { denunciante: autorPublico, resolvidoPor: autorPublico },
      orderBy: [{ status: 'asc' }, { criadoEm: 'desc' }],
      take: 100,
    });
  }

  async resolver(id: string, moderadorId: string, dto: ResolverDenunciaDto, origem?: string) {
    const denuncia = await this.prisma.denuncia.findUnique({ where: { id } });
    if (!denuncia) throw new NotFoundException('Denúncia não encontrada');

    const atualizada = await this.prisma.denuncia.update({
      where: { id },
      data: {
        status: dto.status,
        resolucao: dto.resolucao ?? null,
        resolvidoPorId: moderadorId,
      },
    });
    await this.audit.registrar({
      acao: 'denuncia.resolvida',
      entidade: 'Denuncia',
      entidadeId: id,
      autorId: moderadorId,
      antes: { status: denuncia.status },
      depois: { status: dto.status },
      motivo: dto.resolucao ?? null,
      origem,
    });

    await this.notificacoes.notificar({
      userId: denuncia.denuncianteId,
      categoria: 'moderacao',
      tipo: 'denuncia.resolvida',
      titulo: 'Sua denúncia foi analisada',
      corpo: `A moderação marcou sua denúncia como ${dto.status.toLowerCase()}.`,
      entidade: 'Denuncia',
      entidadeId: id,
    });
    return atualizada;
  }

  async aplicarSancao(adminId: string, dto: AplicarSancaoDto, origem?: string) {
    const alvo = await this.prisma.user.findUnique({ where: { id: dto.usuarioId } });
    if (!alvo) throw new NotFoundException('Usuário não encontrado');

    const sancao = await this.prisma.sancao.create({
      data: {
        usuarioId: dto.usuarioId,
        tipo: dto.tipo,
        motivo: dto.motivo,
        expiraEm: dto.expiraEm ? new Date(dto.expiraEm) : null,
        aplicadaPorId: adminId,
      },
    });
    await this.audit.registrar({
      acao: 'sancao.aplicada',
      entidade: 'Sancao',
      entidadeId: sancao.id,
      autorId: adminId,
      depois: { usuarioId: dto.usuarioId, tipo: dto.tipo },
      motivo: dto.motivo,
      origem,
    });
    return sancao;
  }

  /** Staff: lista sanções aplicadas, com filtro opcional por usuário-alvo. */
  async listarSancoes(usuarioId?: string) {
    const where: Prisma.SancaoWhereInput = usuarioId ? { usuarioId } : {};
    return this.prisma.sancao.findMany({
      where,
      include: { usuario: usuarioMinimo, aplicadaPor: usuarioMinimo },
      orderBy: { criadoEm: 'desc' },
      take: 100,
    });
  }

  /**
   * Revoga uma sanção (só ADMIN). Já-inativa é tratada como conflito (409),
   * seguindo o padrão do módulo para transições de estado já concluídas
   * (ex.: convite já usado, verificação já decidida).
   */
  async desativarSancao(id: string, adminId: string, motivo?: string, origem?: string) {
    const sancao = await this.prisma.sancao.findUnique({ where: { id } });
    if (!sancao) throw new NotFoundException('Sanção não encontrada');
    if (!sancao.ativa) throw new ConflictException('Sanção já está inativa');

    const atualizada = await this.prisma.sancao.update({
      where: { id },
      data: { ativa: false },
    });
    await this.audit.registrar({
      acao: 'sancao.revogada',
      entidade: 'Sancao',
      entidadeId: id,
      autorId: adminId,
      antes: { ativa: true },
      depois: { ativa: false },
      motivo: motivo ?? null,
      origem,
    });
    await this.notificacoes.notificar({
      userId: sancao.usuarioId,
      categoria: 'moderacao',
      tipo: 'sancao.revogada',
      titulo: 'Sanção revogada',
      corpo: `Sua sanção (${sancao.tipo.toLowerCase()}) foi revogada pela moderação.`,
      entidade: 'Sancao',
      entidadeId: id,
    });
    return atualizada;
  }

  /** Métricas operacionais para o painel admin (escopo 15.x). */
  async metricas() {
    const [usuarios, solicitacoes, propostas, indicacoes, insights, denunciasAbertas, sancoesAtivas, auditoria] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.solicitacao.count(),
        this.prisma.proposta.count(),
        this.prisma.indicacao.count(),
        this.prisma.insight.count(),
        this.prisma.denuncia.count({ where: { status: 'ABERTA' } }),
        this.prisma.sancao.count({ where: { ativa: true } }),
        this.prisma.auditLog.count(),
      ]);
    return {
      usuarios,
      solicitacoes,
      propostas,
      indicacoes,
      insights,
      denunciasAbertas,
      sancoesAtivas,
      eventosAuditoria: auditoria,
    };
  }
}
