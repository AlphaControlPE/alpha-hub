import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Indicacao, Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { Paginated, paginar } from '../../common/dto/pagination.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { CreateIndicacaoDto } from './dto/create-indicacao.dto';
import { QueryIndicacaoDto } from './dto/query-indicacao.dto';

const RESERVA_DIAS = 7;
const indicadorPublico = { select: { id: true, nome: true, verificado: true } };

@Injectable()
export class IndicacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  /** Quem pode ver o contato: o indicador e o destinatário (após reserva/aceite). */
  private podeVerContato(ind: Indicacao, userId: string): boolean {
    return ind.indicadorId === userId || ind.destinatarioId === userId;
  }

  private mascarar<T extends Indicacao>(ind: T, userId: string): T {
    if (this.podeVerContato(ind, userId)) return ind;
    return { ...ind, contatoInfo: '••• (visível após reserva)' };
  }

  async criar(indicadorId: string, dto: CreateIndicacaoDto, origem?: string) {
    if (!dto.consentimento) {
      throw new BadRequestException(
        'Cadastro exige consentimento/base legal do contato (LGPD). Dado pessoal sem base legal não é mercadoria.',
      );
    }
    const chaveDedup = createHash('sha256')
      .update(`${dto.categoria.toLowerCase()}|${dto.contatoInfo.trim().toLowerCase()}`)
      .digest('hex')
      .slice(0, 32);

    try {
      const indicacao = await this.prisma.indicacao.create({
        data: {
          titulo: dto.titulo,
          descricao: dto.descricao,
          categoria: dto.categoria.toLowerCase(),
          contatoNome: dto.contatoNome,
          contatoInfo: dto.contatoInfo,
          consentimento: true,
          valorEstimado: dto.valorEstimado ?? null,
          comissaoPct: dto.comissaoPct ?? null,
          chaveDedup,
          indicadorId,
        },
      });

      await this.audit.registrar({
        acao: 'indicacao.cadastrada',
        entidade: 'Indicacao',
        entidadeId: indicacao.id,
        autorId: indicadorId,
        depois: { categoria: indicacao.categoria, comissaoPct: indicacao.comissaoPct },
        motivo: 'base legal: ' + indicacao.baseLegal,
        origem,
      });
      return indicacao;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Você já cadastrou uma indicação para este contato/categoria');
      }
      throw e;
    }
  }

  async listar(userId: string, query: QueryIndicacaoDto): Promise<Paginated<Indicacao>> {
    const where: Prisma.IndicacaoWhereInput = {};
    if (query.categoria) where.categoria = query.categoria.toLowerCase();
    if (query.status) where.status = query.status;
    if (query.minhas === 'true') where.indicadorId = userId;

    const [dados, total] = await this.prisma.$transaction([
      this.prisma.indicacao.findMany({
        where,
        include: { indicador: indicadorPublico, destinatario: indicadorPublico },
        orderBy: { criadoEm: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.indicacao.count({ where }),
    ]);

    return paginar(dados.map((d) => this.mascarar(d, userId)), total, query.page, query.limit);
  }

  async detalhar(id: string, userId: string) {
    const ind = await this.prisma.indicacao.findUnique({
      where: { id },
      include: { indicador: indicadorPublico, destinatario: indicadorPublico },
    });
    if (!ind) throw new NotFoundException('Indicação não encontrada');
    return this.mascarar(ind, userId);
  }

  /** Um prestador reserva uma indicação disponível (escopo 07.06 — aceite e reserva). */
  async reservar(id: string, userId: string, origem?: string) {
    const ind = await this.prisma.indicacao.findUnique({ where: { id } });
    if (!ind) throw new NotFoundException('Indicação não encontrada');
    if (ind.indicadorId === userId) {
      throw new BadRequestException('Você não pode reservar sua própria indicação');
    }
    if (ind.status !== 'CADASTRADA') {
      throw new BadRequestException('Indicação não está disponível para reserva');
    }
    const reservadoAte = new Date(Date.now() + RESERVA_DIAS * 24 * 60 * 60 * 1000);
    const atualizada = await this.prisma.indicacao.update({
      where: { id },
      data: { status: 'RESERVADA', destinatarioId: userId, reservadoAte },
    });
    await this.audit.registrar({
      acao: 'indicacao.reservada',
      entidade: 'Indicacao',
      entidadeId: id,
      autorId: userId,
      antes: { status: ind.status },
      depois: { status: 'RESERVADA' },
      origem,
    });

    await this.notificacoes.notificar({
      userId: ind.indicadorId,
      categoria: 'indicacao',
      tipo: 'indicacao.reservada',
      titulo: 'Sua indicação foi reservada',
      corpo: `Alguém reservou a indicação "${ind.titulo}". O contato foi liberado para a parte.`,
      link: '/indicacoes',
      entidade: 'Indicacao',
      entidadeId: id,
    });
    return atualizada;
  }

  /** Transições de estágio por indicador ou destinatário (aceite/ganha/perdida). */
  async atualizarStatus(
    id: string,
    userId: string,
    status: 'ACEITA' | 'GANHA' | 'PERDIDA',
    origem?: string,
  ) {
    const ind = await this.prisma.indicacao.findUnique({ where: { id } });
    if (!ind) throw new NotFoundException('Indicação não encontrada');
    if (ind.indicadorId !== userId && ind.destinatarioId !== userId) {
      throw new ForbiddenException('Apenas as partes da indicação podem alterá-la');
    }
    const atualizada = await this.prisma.indicacao.update({
      where: { id },
      data: { status },
    });
    await this.audit.registrar({
      acao: `indicacao.${status.toLowerCase()}`,
      entidade: 'Indicacao',
      entidadeId: id,
      autorId: userId,
      antes: { status: ind.status },
      depois: { status },
      origem,
    });
    return atualizada;
  }
}
