import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { Paginated, paginar } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSolicitacaoDto } from './dto/create-solicitacao.dto';
import { QuerySolicitacaoDto } from './dto/query-solicitacao.dto';

const autorPublico = { select: { id: true, nome: true, verificado: true } };

@Injectable()
export class SolicitacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async criar(autorId: string, dto: CreateSolicitacaoDto, origem?: string) {
    const solicitacao = await this.prisma.solicitacao.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        categoria: dto.categoria.toLowerCase(),
        orcamento: dto.orcamento ?? null,
        autorId,
      },
      include: { autor: autorPublico, _count: { select: { propostas: true } } },
    });

    await this.audit.registrar({
      acao: 'solicitacao.criada',
      entidade: 'Solicitacao',
      entidadeId: solicitacao.id,
      autorId,
      depois: { titulo: solicitacao.titulo, categoria: solicitacao.categoria },
      origem,
    });

    return solicitacao;
  }

  async listar(query: QuerySolicitacaoDto): Promise<Paginated<unknown>> {
    const where: Prisma.SolicitacaoWhereInput = {};
    if (query.categoria) where.categoria = query.categoria.toLowerCase();
    if (query.status) where.status = query.status;
    if (query.q) {
      where.OR = [
        { titulo: { contains: query.q, mode: 'insensitive' } },
        { descricao: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [dados, total] = await this.prisma.$transaction([
      this.prisma.solicitacao.findMany({
        where,
        include: { autor: autorPublico, _count: { select: { propostas: true } } },
        orderBy: { criadoEm: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.solicitacao.count({ where }),
    ]);

    return paginar(dados, total, query.page, query.limit);
  }

  async detalhar(id: string) {
    const solicitacao = await this.prisma.solicitacao.findUnique({
      where: { id },
      include: { autor: autorPublico, _count: { select: { propostas: true } } },
    });
    if (!solicitacao) throw new NotFoundException('Solicitação não encontrada');
    return solicitacao;
  }
}
