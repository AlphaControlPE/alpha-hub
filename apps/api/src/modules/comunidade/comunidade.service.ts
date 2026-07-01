import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateComentarioDto, CreateInsightDto } from './dto/create-insight.dto';

const autorPublico = { select: { id: true, nome: true, verificado: true } };

@Injectable()
export class ComunidadeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async criar(autorId: string, dto: CreateInsightDto) {
    const insight = await this.prisma.insight.create({
      data: {
        titulo: dto.titulo,
        conteudo: dto.conteudo,
        categoria: dto.categoria.toLowerCase(),
        autorId,
      },
    });
    await this.audit.registrar({
      acao: 'insight.criado',
      entidade: 'Insight',
      entidadeId: insight.id,
      autorId,
      depois: { categoria: insight.categoria },
    });
    return insight;
  }

  async listar(ordenar: 'top' | 'recentes', categoria?: string, userId?: string) {
    const where: Prisma.InsightWhereInput = categoria
      ? { categoria: categoria.toLowerCase() }
      : {};
    // Sentinela: sem usuário, casa com nada (não retorna votos de terceiros).
    const meuVoto = { where: { userId: userId ?? '__anon__' }, select: { id: true } };
    const insights = await this.prisma.insight.findMany({
      where,
      include: {
        autor: autorPublico,
        _count: { select: { votos: true, comentarios: true } },
        votos: meuVoto,
      },
      orderBy: ordenar === 'recentes' ? { criadoEm: 'desc' } : { votos: { _count: 'desc' } },
      take: 50,
    });
    return insights.map(({ votos, ...i }) => ({ ...i, votou: votos.length > 0 }));
  }

  async detalhar(id: string, userId?: string) {
    const meuVoto = { where: { userId: userId ?? '__anon__' }, select: { id: true } };
    const insight = await this.prisma.insight.findUnique({
      where: { id },
      include: {
        autor: autorPublico,
        comentarios: { include: { autor: autorPublico }, orderBy: { criadoEm: 'asc' } },
        _count: { select: { votos: true } },
        votos: meuVoto,
      },
    });
    if (!insight) throw new NotFoundException('Insight não encontrado');
    const { votos, ...rest } = insight;
    return { ...rest, votou: votos.length > 0 };
  }

  /** Voto é toggle: cria se não existir, remove se existir. */
  async alternarVoto(insightId: string, userId: string) {
    const existente = await this.prisma.insightVoto.findUnique({
      where: { insightId_userId: { insightId, userId } },
    });
    if (existente) {
      await this.prisma.insightVoto.delete({ where: { id: existente.id } });
    } else {
      await this.prisma.insightVoto.create({ data: { insightId, userId } });
    }
    const total = await this.prisma.insightVoto.count({ where: { insightId } });
    return { votou: !existente, total };
  }

  async comentar(insightId: string, autorId: string, dto: CreateComentarioDto) {
    const insight = await this.prisma.insight.findUnique({ where: { id: insightId } });
    if (!insight) throw new NotFoundException('Insight não encontrado');
    return this.prisma.insightComentario.create({
      data: { insightId, autorId, conteudo: dto.conteudo },
      include: { autor: autorPublico },
    });
  }
}
