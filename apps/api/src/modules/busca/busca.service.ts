import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

const autorPublico = { select: { id: true, nome: true, verificado: true } };

@Injectable()
export class BuscaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Matching para prestador (escopo 12.x): recomenda solicitações abertas
   * priorizando as categorias em que o usuário já atuou, excluindo as próprias
   * e aquelas em que já enviou proposta. Heurística transparente e auditável.
   */
  async matchingParaPrestador(userId: string) {
    const minhasPropostas = await this.prisma.proposta.findMany({
      where: { autorId: userId },
      select: { solicitacaoId: true, solicitacao: { select: { categoria: true } } },
    });
    const jaPropostas = new Set(minhasPropostas.map((p) => p.solicitacaoId));
    const categoriasInteresse = new Set(
      minhasPropostas.map((p) => p.solicitacao.categoria),
    );

    const abertas = await this.prisma.solicitacao.findMany({
      where: { status: 'ABERTA', NOT: { autorId: userId } },
      include: { autor: autorPublico, _count: { select: { propostas: true } } },
      orderBy: { criadoEm: 'desc' },
      take: 60,
    });

    const recomendadas = abertas
      .filter((s) => !jaPropostas.has(s.id))
      .map((s) => {
        let score = 1;
        const motivos: string[] = [];
        if (categoriasInteresse.has(s.categoria)) {
          score += 3;
          motivos.push(`categoria "${s.categoria}" combina com seu histórico`);
        }
        if ((s._count?.propostas ?? 0) === 0) {
          score += 2;
          motivos.push('ainda sem propostas — boa chance');
        }
        if (s.orcamento) {
          score += 1;
          motivos.push('orçamento informado');
        }
        return { ...s, score, motivos };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return recomendadas;
  }

  /** Busca global em solicitações e insights. */
  async buscaGlobal(q: string) {
    const termo = q.trim();
    if (!termo) return { solicitacoes: [], insights: [] };
    const contains = { contains: termo, mode: 'insensitive' as const };

    const [solicitacoes, insights] = await this.prisma.$transaction([
      this.prisma.solicitacao.findMany({
        where: { OR: [{ titulo: contains }, { descricao: contains }] },
        include: { autor: autorPublico, _count: { select: { propostas: true } } },
        take: 20,
        orderBy: { criadoEm: 'desc' },
      }),
      this.prisma.insight.findMany({
        where: { OR: [{ titulo: contains }, { conteudo: contains }] },
        include: { autor: autorPublico, _count: { select: { votos: true } } },
        take: 20,
        orderBy: { criadoEm: 'desc' },
      }),
    ]);

    return { solicitacoes, insights };
  }
}
