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
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';

const autorPublico = { select: { id: true, nome: true, verificado: true } };

export interface Reputacao {
  total: number;
  media: { comunicacao: number; qualidade: number; prazo: number; geral: number };
  avaliacoes: {
    notaComunicacao: number;
    notaQualidade: number;
    notaPrazo: number;
    comentario: string | null;
    criadoEm: Date;
    autor: { id: string; nome: string };
  }[];
}

@Injectable()
export class ReputacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Avaliar exige interação verificável: a proposta deve estar ACEITA e o autor
   * da avaliação deve ser uma das partes (solicitante ou prestador). O alvo é a
   * outra parte. Reputação é multidimensional, nunca uma nota única opaca.
   */
  async avaliar(autorId: string, dto: CreateAvaliacaoDto) {
    const proposta = await this.prisma.proposta.findUnique({
      where: { id: dto.propostaId },
      include: { solicitacao: true },
    });
    if (!proposta) throw new NotFoundException('Proposta não encontrada');
    if (proposta.status !== 'ACEITA') {
      throw new BadRequestException('Só é possível avaliar após a proposta ser aceita');
    }

    const solicitanteId = proposta.solicitacao.autorId;
    const prestadorId = proposta.autorId;
    if (autorId !== solicitanteId && autorId !== prestadorId) {
      throw new ForbiddenException('Apenas as partes da negociação podem avaliar');
    }
    const alvoId = autorId === solicitanteId ? prestadorId : solicitanteId;

    try {
      const avaliacao = await this.prisma.avaliacao.create({
        data: {
          autorId,
          alvoId,
          propostaId: dto.propostaId,
          notaComunicacao: dto.notaComunicacao,
          notaQualidade: dto.notaQualidade,
          notaPrazo: dto.notaPrazo,
          comentario: dto.comentario ?? null,
        },
      });
      await this.audit.registrar({
        acao: 'avaliacao.criada',
        entidade: 'Avaliacao',
        entidadeId: avaliacao.id,
        autorId,
        depois: { alvoId, propostaId: dto.propostaId },
      });
      return avaliacao;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Você já avaliou esta interação');
      }
      throw e;
    }
  }

  async reputacao(userId: string): Promise<Reputacao> {
    const avaliacoes = await this.prisma.avaliacao.findMany({
      where: { alvoId: userId },
      include: { autor: autorPublico },
      orderBy: { criadoEm: 'desc' },
    });

    const total = avaliacoes.length;
    const soma = avaliacoes.reduce(
      (acc, a) => {
        acc.c += a.notaComunicacao;
        acc.q += a.notaQualidade;
        acc.p += a.notaPrazo;
        return acc;
      },
      { c: 0, q: 0, p: 0 },
    );
    const arred = (n: number) => (total ? Math.round((n / total) * 10) / 10 : 0);
    const comunicacao = arred(soma.c);
    const qualidade = arred(soma.q);
    const prazo = arred(soma.p);
    const geral = total ? Math.round(((comunicacao + qualidade + prazo) / 3) * 10) / 10 : 0;

    return {
      total,
      media: { comunicacao, qualidade, prazo, geral },
      avaliacoes: avaliacoes.map((a) => ({
        notaComunicacao: a.notaComunicacao,
        notaQualidade: a.notaQualidade,
        notaPrazo: a.notaPrazo,
        comentario: a.comentario,
        criadoEm: a.criadoEm,
        autor: { id: a.autor.id, nome: a.autor.nome },
      })),
    };
  }

  /** Avaliações que o usuário ainda pode fazer (propostas aceitas, sem avaliação dele). */
  async pendentes(userId: string) {
    const propostasAceitas = await this.prisma.proposta.findMany({
      where: {
        status: 'ACEITA',
        OR: [{ autorId: userId }, { solicitacao: { autorId: userId } }],
      },
      include: { solicitacao: { select: { titulo: true, autorId: true } }, autor: autorPublico },
    });
    const jaAvaliadas = await this.prisma.avaliacao.findMany({
      where: { autorId: userId },
      select: { propostaId: true },
    });
    const set = new Set(jaAvaliadas.map((a) => a.propostaId));
    return propostasAceitas.filter((p) => !set.has(p.id));
  }
}
