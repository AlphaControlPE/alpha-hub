import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

const pct = (parte: number, total: number) =>
  total === 0 ? 0 : Math.round((parte / total) * 1000) / 10;

@Injectable()
export class BiService {
  constructor(private readonly prisma: PrismaService) {}

  /** KPIs operacionais agregados (escopo 15.x): liquidez, conversão, confiança, conhecimento. */
  async overview() {
    const p = this.prisma;
    const [
      usuarios,
      solicitacoes,
      solicitacoesAbertas,
      solicitacoesComProposta,
      propostas,
      propostasAceitas,
      contratos,
      contratosConcluidos,
      indicacoes,
      indicacoesGanhas,
      avaliacoes,
      denunciasAbertas,
      insights,
      eventos,
    ] = await p.$transaction([
      p.user.count(),
      p.solicitacao.count(),
      p.solicitacao.count({ where: { status: 'ABERTA' } }),
      p.solicitacao.count({ where: { propostas: { some: {} } } }),
      p.proposta.count(),
      p.proposta.count({ where: { status: 'ACEITA' } }),
      p.contrato.count(),
      p.contrato.count({ where: { status: 'CONCLUIDO' } }),
      p.indicacao.count(),
      p.indicacao.count({ where: { status: 'GANHA' } }),
      p.avaliacao.aggregate({ _count: { _all: true }, _avg: { notaComunicacao: true, notaQualidade: true, notaPrazo: true } }),
      p.denuncia.count({ where: { status: 'ABERTA' } }),
      p.insight.count(),
      p.auditLog.count(),
    ]);

    const mediaDims = [
      avaliacoes._avg.notaComunicacao ?? 0,
      avaliacoes._avg.notaQualidade ?? 0,
      avaliacoes._avg.notaPrazo ?? 0,
    ];
    const mediaGeral = avaliacoes._count._all
      ? Math.round((mediaDims.reduce((a, b) => a + b, 0) / 3) * 10) / 10
      : 0;

    return {
      liquidez: {
        usuarios,
        solicitacoes,
        solicitacoesAbertas,
        taxaComResposta: pct(solicitacoesComProposta, solicitacoes),
        propostasPorSolicitacao: solicitacoes ? Math.round((propostas / solicitacoes) * 10) / 10 : 0,
      },
      conversao: {
        propostas,
        propostasAceitas,
        taxaAceite: pct(propostasAceitas, propostas),
        contratos,
        contratosConcluidos,
        taxaConclusao: pct(contratosConcluidos, contratos),
      },
      confianca: {
        avaliacoes: avaliacoes._count._all,
        mediaGeral,
        denunciasAbertas,
      },
      conhecimento: { insights },
      indicacoes: { total: indicacoes, ganhas: indicacoesGanhas },
      eventosAuditoria: eventos,
    };
  }

  /** Funil de conversão: solicitação -> proposta -> aceite -> contrato -> concluído. */
  async funil() {
    const p = this.prisma;
    const [solicitacoes, comProposta, comAceite, contratos, concluidos] = await p.$transaction([
      p.solicitacao.count(),
      p.solicitacao.count({ where: { propostas: { some: {} } } }),
      p.solicitacao.count({ where: { propostas: { some: { status: 'ACEITA' } } } }),
      p.contrato.count(),
      p.contrato.count({ where: { status: 'CONCLUIDO' } }),
    ]);
    const etapas = [
      { etapa: 'Solicitações', valor: solicitacoes },
      { etapa: 'Com proposta', valor: comProposta },
      { etapa: 'Proposta aceita', valor: comAceite },
      { etapa: 'Contrato', valor: contratos },
      { etapa: 'Concluído', valor: concluidos },
    ];
    return etapas.map((e) => ({ ...e, pct: pct(e.valor, solicitacoes) }));
  }

  /** Distribuição de solicitações por categoria. */
  async categorias() {
    const grupos = await this.prisma.solicitacao.groupBy({
      by: ['categoria'],
      _count: { _all: true },
      orderBy: { _count: { categoria: 'desc' } },
    });
    return grupos.map((g) => ({ categoria: g.categoria, total: g._count._all }));
  }

  /** Série temporal de eventos (trilha de auditoria) por dia nos últimos N dias. */
  async serie(dias = 30) {
    const d = Math.min(Math.max(dias, 1), 180);
    const desde = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
    const linhas = await this.prisma.$queryRaw<{ dia: Date; total: bigint }[]>(Prisma.sql`
      SELECT date_trunc('day', "criadoEm") AS dia, COUNT(*)::int AS total
      FROM "audit_logs"
      WHERE "criadoEm" >= ${desde}
      GROUP BY 1
      ORDER BY 1 ASC
    `);
    return linhas.map((l) => ({
      dia: new Date(l.dia).toISOString().slice(0, 10),
      total: Number(l.total),
    }));
  }
}
