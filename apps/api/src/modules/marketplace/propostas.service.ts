import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { CreatePropostaDto } from './dto/create-proposta.dto';

const autorPublico = { select: { id: true, nome: true, verificado: true } };

@Injectable()
export class PropostasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  /**
   * Envia uma proposta e abre automaticamente uma sala de negociação (chat)
   * entre o autor da solicitação e o proponente (escopo 06.01 + 08.03).
   */
  async criar(
    solicitacaoId: string,
    autorId: string,
    dto: CreatePropostaDto,
    origem?: string,
  ) {
    const solicitacao = await this.prisma.solicitacao.findUnique({
      where: { id: solicitacaoId },
    });
    if (!solicitacao) throw new NotFoundException('Solicitação não encontrada');
    if (solicitacao.autorId === autorId) {
      throw new BadRequestException('Você não pode enviar proposta à sua própria solicitação');
    }
    if (solicitacao.status === 'ENCERRADA' || solicitacao.status === 'CANCELADA') {
      throw new BadRequestException('Esta solicitação não está aceitando propostas');
    }

    const jaExiste = await this.prisma.proposta.findUnique({
      where: { solicitacaoId_autorId: { solicitacaoId, autorId } },
    });
    if (jaExiste) {
      throw new BadRequestException('Você já enviou uma proposta para esta solicitação');
    }

    const proposta = await this.prisma.$transaction(async (tx) => {
      const p = await tx.proposta.create({
        data: {
          solicitacaoId,
          autorId,
          mensagem: dto.mensagem,
          valor: dto.valor ?? null,
          prazoDias: dto.prazoDias ?? null,
        },
        include: { autor: autorPublico },
      });

      const conversa = await tx.conversa.create({
        data: {
          tipo: 'NEGOCIACAO',
          solicitacaoId,
          propostaId: p.id,
          participantes: {
            create: [{ userId: solicitacao.autorId }, { userId: autorId }],
          },
        },
      });

      // Primeira mensagem da sala = a própria proposta, para dar contexto ao chat.
      await tx.mensagem.create({
        data: { conversaId: conversa.id, autorId, conteudo: dto.mensagem },
      });

      return { ...p, conversaId: conversa.id };
    });

    await this.audit.registrar({
      acao: 'proposta.enviada',
      entidade: 'Proposta',
      entidadeId: proposta.id,
      autorId,
      depois: { solicitacaoId, valor: proposta.valor },
      origem,
    });

    await this.notificacoes.notificar({
      userId: solicitacao.autorId,
      categoria: 'proposta',
      tipo: 'proposta.recebida',
      titulo: 'Nova proposta recebida',
      corpo: `${proposta.autor.nome} enviou uma proposta para "${solicitacao.titulo}".`,
      link: `/solicitacoes/${solicitacaoId}`,
      entidade: 'Solicitacao',
      entidadeId: solicitacaoId,
    });

    return proposta;
  }

  async listarDaSolicitacao(solicitacaoId: string, usuarioId: string) {
    const solicitacao = await this.prisma.solicitacao.findUnique({
      where: { id: solicitacaoId },
    });
    if (!solicitacao) throw new NotFoundException('Solicitação não encontrada');

    const ehDono = solicitacao.autorId === usuarioId;
    const propostas = await this.prisma.proposta.findMany({
      where: {
        solicitacaoId,
        // Dono vê todas; prestador vê apenas a própria proposta.
        ...(ehDono ? {} : { autorId: usuarioId }),
      },
      include: { autor: autorPublico, conversa: { select: { id: true } } },
      orderBy: { criadoEm: 'asc' },
    });
    return propostas;
  }

  async aceitar(propostaId: string, usuarioId: string, origem?: string) {
    const proposta = await this.prisma.proposta.findUnique({
      where: { id: propostaId },
      include: { solicitacao: true },
    });
    if (!proposta) throw new NotFoundException('Proposta não encontrada');
    if (proposta.solicitacao.autorId !== usuarioId) {
      throw new ForbiddenException('Apenas o autor da solicitação pode aceitar propostas');
    }

    const antes = { status: proposta.status };
    const atualizada = await this.prisma.$transaction(async (tx) => {
      const p = await tx.proposta.update({
        where: { id: propostaId },
        data: { status: 'ACEITA' },
      });
      await tx.solicitacao.update({
        where: { id: proposta.solicitacaoId },
        data: { status: 'EM_NEGOCIACAO' },
      });
      return p;
    });

    await this.audit.registrar({
      acao: 'proposta.aceita',
      entidade: 'Proposta',
      entidadeId: propostaId,
      autorId: usuarioId,
      antes,
      depois: { status: 'ACEITA' },
      motivo: 'Selecionada pelo solicitante',
      origem,
    });

    await this.notificacoes.notificar({
      userId: proposta.autorId,
      categoria: 'proposta',
      tipo: 'proposta.aceita',
      titulo: 'Sua proposta foi aceita! 🎉',
      corpo: `Sua proposta para "${proposta.solicitacao.titulo}" foi aceita. Formalize o contrato.`,
      link: `/solicitacoes/${proposta.solicitacaoId}`,
      entidade: 'Proposta',
      entidadeId: propostaId,
    });

    return atualizada;
  }
}
