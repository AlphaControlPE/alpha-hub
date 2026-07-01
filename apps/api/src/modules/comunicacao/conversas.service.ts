import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';

const autorPublico = { select: { id: true, nome: true, verificado: true } };

@Injectable()
export class ConversasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  async ehParticipante(conversaId: string, userId: string): Promise<boolean> {
    const p = await this.prisma.participanteConversa.findUnique({
      where: { conversaId_userId: { conversaId, userId } },
    });
    return !!p;
  }

  private async garantirParticipante(conversaId: string, userId: string) {
    if (!(await this.ehParticipante(conversaId, userId))) {
      throw new ForbiddenException('Você não participa desta conversa');
    }
  }

  async listarMinhas(userId: string) {
    return this.prisma.conversa.findMany({
      where: { participantes: { some: { userId } } },
      include: {
        solicitacao: { select: { id: true, titulo: true, status: true } },
        participantes: { include: { user: autorPublico } },
        mensagens: { orderBy: { criadoEm: 'desc' }, take: 1 },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async listarMensagens(conversaId: string, userId: string) {
    const conversa = await this.prisma.conversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new NotFoundException('Conversa não encontrada');
    await this.garantirParticipante(conversaId, userId);

    await this.prisma.participanteConversa.update({
      where: { conversaId_userId: { conversaId, userId } },
      data: { ultimaLeitura: new Date() },
    });

    return this.prisma.mensagem.findMany({
      where: { conversaId },
      include: { autor: autorPublico },
      orderBy: { criadoEm: 'asc' },
    });
  }

  async enviarMensagem(conversaId: string, autorId: string, conteudo: string) {
    const conversa = await this.prisma.conversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new NotFoundException('Conversa não encontrada');
    await this.garantirParticipante(conversaId, autorId);

    const mensagem = await this.prisma.mensagem.create({
      data: { conversaId, autorId, conteudo },
      include: { autor: autorPublico },
    });

    await this.audit.registrar({
      acao: 'mensagem.enviada',
      entidade: 'Mensagem',
      entidadeId: mensagem.id,
      autorId,
      depois: { conversaId },
    });

    // Notifica os demais participantes da conversa.
    const outros = await this.prisma.participanteConversa.findMany({
      where: { conversaId, NOT: { userId: autorId } },
      select: { userId: true },
    });
    const resumo =
      conteudo.length > 60 ? `${conteudo.slice(0, 60)}…` : conteudo;
    await Promise.all(
      outros.map((p) =>
        this.notificacoes.notificar({
          userId: p.userId,
          categoria: 'mensagem',
          tipo: 'mensagem.recebida',
          titulo: `Nova mensagem de ${mensagem.autor.nome}`,
          corpo: resumo,
          link: `/solicitacoes/${conversa.solicitacaoId}`,
          entidade: 'Conversa',
          entidadeId: conversaId,
        }),
      ),
    );

    return mensagem;
  }
}
