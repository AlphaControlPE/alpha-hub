import { Injectable, Logger } from '@nestjs/common';
import { Notificacao } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificacoesGateway } from './notificacoes.gateway';
import { PreferenciasDto } from './dto/preferencias.dto';

export type CategoriaNotificacao =
  | 'proposta'
  | 'mensagem'
  | 'contrato'
  | 'indicacao'
  | 'comunidade'
  | 'moderacao';

export interface NovaNotificacao {
  userId: string;
  categoria: CategoriaNotificacao;
  tipo: string;
  titulo: string;
  corpo: string;
  link?: string;
  entidade?: string;
  entidadeId?: string;
}

const PADRAO = {
  proposta: true,
  mensagem: true,
  contrato: true,
  indicacao: true,
  comunidade: true,
  moderacao: true,
};

@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificacoesGateway,
  ) {}

  /**
   * Cria e entrega uma notificação respeitando a preferência da categoria.
   * Tolerante a falhas: nunca derruba o fluxo de negócio que a disparou.
   */
  async notificar(input: NovaNotificacao): Promise<Notificacao | null> {
    try {
      const pref = await this.prisma.notificacaoPreferencia.findUnique({
        where: { userId: input.userId },
      });
      const ativo = pref
        ? (pref as unknown as Record<string, boolean>)[input.categoria] !== false
        : true;
      if (!ativo) return null;

      const n = await this.prisma.notificacao.create({
        data: {
          userId: input.userId,
          categoria: input.categoria,
          tipo: input.tipo,
          titulo: input.titulo,
          corpo: input.corpo,
          link: input.link ?? null,
          entidade: input.entidade ?? null,
          entidadeId: input.entidadeId ?? null,
        },
      });
      this.gateway.emitirPara(input.userId, n);
      return n;
    } catch (err) {
      this.logger.error(`Falha ao notificar ${input.tipo}`, err as Error);
      return null;
    }
  }

  listar(userId: string, apenasNaoLidas = false) {
    return this.prisma.notificacao.findMany({
      where: { userId, ...(apenasNaoLidas ? { lida: false } : {}) },
      orderBy: { criadoEm: 'desc' },
      take: 50,
    });
  }

  async naoLidas(userId: string): Promise<{ total: number }> {
    const total = await this.prisma.notificacao.count({ where: { userId, lida: false } });
    return { total };
  }

  async marcarLida(id: string, userId: string) {
    await this.prisma.notificacao.updateMany({
      where: { id, userId },
      data: { lida: true },
    });
    return this.naoLidas(userId);
  }

  async marcarTodasLidas(userId: string) {
    await this.prisma.notificacao.updateMany({
      where: { userId, lida: false },
      data: { lida: true },
    });
    return { total: 0 };
  }

  async preferencias(userId: string) {
    const pref = await this.prisma.notificacaoPreferencia.findUnique({ where: { userId } });
    return pref ?? { userId, ...PADRAO };
  }

  async atualizarPreferencias(userId: string, dto: PreferenciasDto) {
    return this.prisma.notificacaoPreferencia.upsert({
      where: { userId },
      update: { ...dto },
      create: { userId, ...PADRAO, ...dto },
    });
  }
}
