import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { PapelMembro, Prisma } from '@prisma/client';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { formatarCnpj } from '../../common/validacao/cnpj';
import {
  AddMembroDto,
  AlterarPapelDto,
  CreateOrganizacaoDto,
  CriarConviteDto,
  DecidirVerificacaoDto,
  PedirVerificacaoDto,
} from './dto/organizacoes.dto';

// Guarda só o hash do token do convite; o token cru vai apenas no link.
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

// Dados públicos do usuário dentro da org — nunca expor e-mail de terceiros.
const usuarioPublico = { select: { id: true, nome: true } };

@Injectable()
export class OrganizacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notificacoes: NotificacoesService,
  ) {}

  /**
   * Regra de permissão interna: carrega o Membership do usuário na org e
   * valida o papel exigido. ForbiddenException se não membro ou papel fraco.
   */
  private async exigirMembro(orgId: string, userId: string, papeis?: PapelMembro[]) {
    const membro = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId } },
    });
    if (!membro) throw new ForbiddenException('Você não participa desta organização');
    if (papeis && !papeis.includes(membro.papel)) {
      throw new ForbiddenException('Permissão insuficiente na organização');
    }
    return membro;
  }

  /** Traduz violação de unicidade do CNPJ em 409 legível. */
  private tratarErroDocumento(err: unknown): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictException('Este CNPJ já está cadastrado em outra organização');
    }
    throw err;
  }

  /** Cria a organização e torna o criador DONO (atômico via nested create). */
  async criar(userId: string, dto: CreateOrganizacaoDto) {
    try {
      const org = await this.prisma.organization.create({
        data: {
          nome: dto.nome,
          descricao: dto.descricao ?? null,
          documento: dto.documento ? formatarCnpj(dto.documento) : null,
          membros: { create: { userId, papel: 'DONO' } },
        },
      });
      await this.audit.registrar({
        acao: 'organizacao.criada',
        entidade: 'Organization',
        entidadeId: org.id,
        autorId: userId,
        depois: { nome: org.nome, documento: org.documento },
      });
      return { ...org, meuPapel: 'DONO' as PapelMembro, totalMembros: 1 };
    } catch (err) {
      this.tratarErroDocumento(err);
    }
  }

  /** Organizações em que participo, com meu papel e contagem de membros. */
  async minhas(userId: string) {
    const participacoes = await this.prisma.membership.findMany({
      where: { userId },
      include: { org: { include: { _count: { select: { membros: true } } } } },
      orderBy: { criadoEm: 'asc' },
    });
    return participacoes.map(({ org, papel }) => {
      const { _count, ...dados } = org;
      return { ...dados, meuPapel: papel, totalMembros: _count.membros };
    });
  }

  /** Detalhe com membros (id, nome, papel) — só membro vê; sem e-mails de terceiros. */
  async detalhe(orgId: string, userId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        membros: {
          include: { user: usuarioPublico },
          orderBy: { criadoEm: 'asc' },
        },
      },
    });
    if (!org) throw new NotFoundException('Organização não encontrada');
    const meu = org.membros.find((m) => m.userId === userId);
    if (!meu) throw new ForbiddenException('Você não participa desta organização');
    return {
      ...org,
      meuPapel: meu.papel,
      totalMembros: org.membros.length,
      membros: org.membros.map((m) => ({
        userId: m.userId,
        nome: m.user.nome,
        papel: m.papel,
        desde: m.criadoEm,
      })),
    };
  }

  /** Adiciona membro por e-mail (só DONO/ADMIN); nunca cria outro DONO. */
  async adicionarMembro(orgId: string, atorId: string, dto: AddMembroDto) {
    await this.exigirMembro(orgId, atorId, ['DONO', 'ADMIN']);
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organização não encontrada');

    const convidado = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!convidado) throw new NotFoundException('Nenhum usuário cadastrado com este e-mail');

    const jaMembro = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId: convidado.id, orgId } },
    });
    if (jaMembro) throw new ConflictException('Este usuário já é membro da organização');

    const membro = await this.prisma.membership.create({
      data: { orgId, userId: convidado.id, papel: dto.papel ?? 'MEMBRO' },
    });
    await this.audit.registrar({
      acao: 'organizacao.membro.adicionado',
      entidade: 'Membership',
      entidadeId: membro.id,
      autorId: atorId,
      depois: { orgId, userId: convidado.id, papel: membro.papel },
    });
    await this.notificacoes.notificar({
      userId: convidado.id,
      categoria: 'comunidade',
      tipo: 'organizacao.convite',
      titulo: 'Você foi adicionado a uma organização',
      corpo: `Você agora faz parte de "${org.nome}" com papel ${membro.papel}.`,
      link: '/organizacoes',
      entidade: 'Organization',
      entidadeId: orgId,
    });
    return { userId: convidado.id, nome: convidado.nome, papel: membro.papel };
  }

  /**
   * Remove membro: DONO/ADMIN removem terceiros; qualquer membro pode
   * remover a si mesmo (sair). O DONO nunca pode ser removido.
   */
  async removerMembro(orgId: string, atorId: string, alvoUserId: string) {
    const alvo = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId: alvoUserId, orgId } },
    });
    if (!alvo) throw new NotFoundException('Membro não encontrado nesta organização');
    if (alvo.papel === 'DONO') {
      throw new ForbiddenException('O dono não pode ser removido da organização');
    }
    const proprio = atorId === alvoUserId;
    if (!proprio) await this.exigirMembro(orgId, atorId, ['DONO', 'ADMIN']);

    await this.prisma.membership.delete({ where: { id: alvo.id } });
    await this.audit.registrar({
      acao: proprio ? 'organizacao.membro.saiu' : 'organizacao.membro.removido',
      entidade: 'Membership',
      entidadeId: alvo.id,
      autorId: atorId,
      antes: { orgId, userId: alvoUserId, papel: alvo.papel },
    });
    return { removido: true };
  }

  /** Alterna MEMBRO<->ADMIN (só DONO); o papel do DONO é imutável. */
  async alterarPapel(orgId: string, atorId: string, alvoUserId: string, dto: AlterarPapelDto) {
    await this.exigirMembro(orgId, atorId, ['DONO']);
    const alvo = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId: alvoUserId, orgId } },
    });
    if (!alvo) throw new NotFoundException('Membro não encontrado nesta organização');
    if (alvo.papel === 'DONO') {
      throw new ForbiddenException('O papel do dono não pode ser alterado');
    }
    const atualizado = await this.prisma.membership.update({
      where: { id: alvo.id },
      data: { papel: dto.papel },
    });
    await this.audit.registrar({
      acao: 'organizacao.membro.papel_alterado',
      entidade: 'Membership',
      entidadeId: alvo.id,
      autorId: atorId,
      antes: { papel: alvo.papel },
      depois: { papel: atualizado.papel },
    });
    return { userId: alvoUserId, papel: atualizado.papel };
  }

  /**
   * Gera um convite por link (só DONO/ADMIN). Retorna o token cru UMA vez — quem
   * gerou monta o link e compartilha. Uso único, com expiração (1-30 dias).
   */
  async criarConvite(orgId: string, userId: string, dto: CriarConviteDto) {
    await this.exigirMembro(orgId, userId, ['DONO', 'ADMIN']);
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organização não encontrada');

    const token = randomBytes(32).toString('hex');
    const papel = (dto.papel ?? 'MEMBRO') as PapelMembro;
    const expiraEm = new Date(Date.now() + (dto.expiraDias ?? 7) * 86_400_000);

    const convite = await this.prisma.conviteOrganizacao.create({
      data: { orgId, tokenHash: hashToken(token), papel, expiraEm, criadoPorId: userId },
    });
    await this.audit.registrar({
      acao: 'organizacao.convite.criado',
      entidade: 'ConviteOrganizacao',
      entidadeId: convite.id,
      autorId: userId,
      depois: { orgId, papel, expiraEm },
    });
    return { token, papel, expiraEm };
  }

  /** Prévia pública (a quem tem o link): dados mínimos para a tela de aceite. */
  async previewConvite(token: string) {
    const convite = await this.prisma.conviteOrganizacao.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { org: { select: { id: true, nome: true, verificado: true } } },
    });
    if (!convite) throw new NotFoundException('Convite inválido');
    return {
      org: convite.org,
      papel: convite.papel,
      expirado: convite.expiraEm < new Date(),
      usado: convite.usadoEm !== null,
    };
  }

  /** Aceita o convite: o usuário logado entra na org com o papel do convite. */
  async aceitarConvite(token: string, userId: string) {
    const convite = await this.prisma.conviteOrganizacao.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { org: { select: { id: true, nome: true } } },
    });
    if (!convite) throw new NotFoundException('Convite inválido');
    if (convite.usadoEm) throw new ConflictException('Este convite já foi utilizado');
    if (convite.expiraEm < new Date()) throw new GoneException('Este convite expirou');

    const jaMembro = await this.prisma.membership.findUnique({
      where: { userId_orgId: { userId, orgId: convite.orgId } },
    });
    if (jaMembro) throw new ConflictException('Você já participa desta organização');

    // Marca como usado de forma atômica (guarda contra corrida no link único).
    const marcado = await this.prisma.conviteOrganizacao.updateMany({
      where: { id: convite.id, usadoEm: null },
      data: { usadoEm: new Date(), usadoPorId: userId },
    });
    if (marcado.count === 0) throw new ConflictException('Este convite já foi utilizado');

    const membro = await this.prisma.membership.create({
      data: { orgId: convite.orgId, userId, papel: convite.papel },
    });
    await this.audit.registrar({
      acao: 'organizacao.convite.aceito',
      entidade: 'Membership',
      entidadeId: membro.id,
      autorId: userId,
      depois: { orgId: convite.orgId, papel: convite.papel, conviteId: convite.id },
    });

    const novo = await this.prisma.user.findUnique({ where: { id: userId }, select: { nome: true } });
    await this.notificacoes.notificar({
      userId: convite.criadoPorId,
      categoria: 'comunidade',
      tipo: 'organizacao.convite.aceito',
      titulo: 'Convite aceito',
      corpo: `${novo?.nome ?? 'Um novo membro'} entrou em "${convite.org.nome}" pelo link de convite.`,
      link: '/organizacoes',
      entidade: 'Organization',
      entidadeId: convite.orgId,
    });

    return { orgId: convite.orgId, nome: convite.org.nome, papel: convite.papel };
  }

  /** Pede o selo de verificação (só DONO/ADMIN); exige CNPJ preenchido. */
  async pedirVerificacao(orgId: string, userId: string, dto: PedirVerificacaoDto) {
    await this.exigirMembro(orgId, userId, ['DONO', 'ADMIN']);
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organização não encontrada');
    if (org.verificado) throw new ConflictException('Organização já verificada');
    if (org.verificacaoStatus === 'PENDENTE') {
      throw new ConflictException('Já existe um pedido de verificação em análise');
    }
    const documento = dto.documento ? formatarCnpj(dto.documento) : org.documento;
    if (!documento) {
      throw new BadRequestException('Informe o CNPJ (documento) para pedir verificação');
    }
    try {
      const atualizada = await this.prisma.organization.update({
        where: { id: orgId },
        data: { documento, verificacaoStatus: 'PENDENTE' },
      });
      await this.audit.registrar({
        acao: 'organizacao.verificacao.solicitada',
        entidade: 'Organization',
        entidadeId: orgId,
        autorId: userId,
        antes: { verificacaoStatus: org.verificacaoStatus, documento: org.documento },
        depois: { verificacaoStatus: 'PENDENTE', documento },
      });
      return atualizada;
    } catch (err) {
      this.tratarErroDocumento(err);
    }
  }

  /** Staff: organizações aguardando análise de verificação. */
  async listarVerificacoesPendentes() {
    const orgs = await this.prisma.organization.findMany({
      where: { verificacaoStatus: 'PENDENTE' },
      include: {
        membros: { where: { papel: 'DONO' }, include: { user: usuarioPublico } },
      },
      orderBy: { atualizadoEm: 'asc' },
    });
    return orgs.map((o) => {
      const { membros, ...dados } = o;
      return { ...dados, dono: membros[0]?.user ?? null };
    });
  }

  /** Staff: aprova/rejeita a verificação, notifica o DONO e audita antes/depois. */
  async decidirVerificacao(
    orgId: string,
    staffId: string,
    dto: DecidirVerificacaoDto,
    origem?: string,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: { membros: { where: { papel: 'DONO' } } },
    });
    if (!org) throw new NotFoundException('Organização não encontrada');
    if (org.verificacaoStatus !== 'PENDENTE') {
      throw new ConflictException('Não há pedido de verificação pendente para esta organização');
    }

    const aprovada = dto.decisao === 'APROVADA';
    const atualizada = await this.prisma.organization.update({
      where: { id: orgId },
      data: { verificacaoStatus: dto.decisao, verificado: aprovada },
    });
    await this.audit.registrar({
      acao: 'organizacao.verificacao.decidida',
      entidade: 'Organization',
      entidadeId: orgId,
      autorId: staffId,
      antes: { verificacaoStatus: org.verificacaoStatus, verificado: org.verificado },
      depois: { verificacaoStatus: dto.decisao, verificado: aprovada },
      motivo: dto.motivo ?? null,
      origem,
    });

    const dono = org.membros[0];
    if (dono) {
      await this.notificacoes.notificar({
        userId: dono.userId,
        categoria: 'moderacao',
        tipo: 'organizacao.verificacao',
        titulo: aprovada ? 'Verificação aprovada' : 'Verificação rejeitada',
        corpo: aprovada
          ? `A organização "${org.nome}" recebeu o selo de verificada.`
          : `O pedido de verificação de "${org.nome}" foi rejeitado${dto.motivo ? `: ${dto.motivo}` : '.'}`,
        link: '/organizacoes',
        entidade: 'Organization',
        entidadeId: orgId,
      });
    }
    return atualizada;
  }
}
