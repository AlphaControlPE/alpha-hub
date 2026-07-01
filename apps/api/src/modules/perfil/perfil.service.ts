import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { CreateServicoDto } from './dto/create-servico.dto';

// Ordena portfólio e serviços do mais recente para o mais antigo.
const maisRecentes = { orderBy: { criadoEm: 'desc' as const } };

@Injectable()
export class PerfilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Perfil público de um prestador: dados públicos do usuário + portfólio +
   * catálogo de serviços. A reputação multidimensional NÃO é duplicada aqui —
   * o frontend a busca em GET /usuarios/:id/reputacao (Parte X).
   */
  async perfilPublico(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        bio: true,
        verificado: true,
        criadoEm: true,
        portfolio: maisRecentes,
        servicos: maisRecentes,
      },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return user;
  }

  /** Portfólio + serviços do próprio usuário (para edição). */
  async meuPerfil(userId: string) {
    const [portfolio, servicos] = await Promise.all([
      this.prisma.portfolioItem.findMany({ where: { userId }, ...maisRecentes }),
      this.prisma.servicoOferecido.findMany({ where: { userId }, ...maisRecentes }),
    ]);
    return { portfolio, servicos };
  }

  async adicionarPortfolio(userId: string, dto: CreatePortfolioDto) {
    const item = await this.prisma.portfolioItem.create({
      data: {
        userId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        imagemUrl: dto.imagemUrl ?? null,
        link: dto.link ?? null,
      },
    });
    await this.audit.registrar({
      acao: 'perfil.portfolio.adicionado',
      entidade: 'PortfolioItem',
      entidadeId: item.id,
      autorId: userId,
      depois: { titulo: item.titulo },
    });
    return item;
  }

  /** Remoção só pelo dono; audita. */
  async removerPortfolio(id: string, userId: string) {
    const item = await this.prisma.portfolioItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item de portfólio não encontrado');
    if (item.userId !== userId) throw new ForbiddenException('Apenas o dono pode remover');
    await this.prisma.portfolioItem.delete({ where: { id } });
    await this.audit.registrar({
      acao: 'perfil.portfolio.removido',
      entidade: 'PortfolioItem',
      entidadeId: id,
      autorId: userId,
      antes: { titulo: item.titulo },
    });
    return { removido: true };
  }

  async adicionarServico(userId: string, dto: CreateServicoDto) {
    const servico = await this.prisma.servicoOferecido.create({
      data: {
        userId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        precoBase: dto.precoBase ?? null,
      },
    });
    await this.audit.registrar({
      acao: 'perfil.servico.adicionado',
      entidade: 'ServicoOferecido',
      entidadeId: servico.id,
      autorId: userId,
      depois: { titulo: servico.titulo },
    });
    return servico;
  }

  /** Remoção só pelo dono; audita. */
  async removerServico(id: string, userId: string) {
    const servico = await this.prisma.servicoOferecido.findUnique({ where: { id } });
    if (!servico) throw new NotFoundException('Serviço não encontrado');
    if (servico.userId !== userId) throw new ForbiddenException('Apenas o dono pode remover');
    await this.prisma.servicoOferecido.delete({ where: { id } });
    await this.audit.registrar({
      acao: 'perfil.servico.removido',
      entidade: 'ServicoOferecido',
      entidadeId: id,
      autorId: userId,
      antes: { titulo: servico.titulo },
    });
    return { removido: true };
  }
}
