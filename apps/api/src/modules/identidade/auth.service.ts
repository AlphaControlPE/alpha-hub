import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { AuditService } from '../../common/audit/audit.service';
import { EmailService } from '../../common/email/email.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EsqueciSenhaDto } from './dto/esqueci-senha.dto';
import { LoginDto } from './dto/login.dto';
import { RedefinirSenhaDto } from './dto/redefinir-senha.dto';
import { RegisterDto } from './dto/register.dto';

const TOKEN_VALIDADE_MS = 60 * 60 * 1000; // 1 hora

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export interface AuthResultado {
  token: string;
  usuario: {
    id: string;
    email: string;
    nome: string;
    verificado: boolean;
    papelSistema: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
  ) {}

  /** Recursos opcionais disponíveis (o frontend só exibe o que funciona de verdade). */
  recursos(): { esqueciSenha: boolean } {
    return { esqueciSenha: this.email.disponivel };
  }

  /**
   * "Esqueci a senha": gera token de uso único (1h) e envia por e-mail.
   * Resposta SEMPRE genérica — não revela se o e-mail existe (anti-enumeração).
   * 503 se o provedor de e-mail não estiver configurado (recurso desligado).
   */
  async solicitarRedefinicao(dto: EsqueciSenhaDto, origem?: string): Promise<{ mensagem: string }> {
    if (!this.email.disponivel) {
      throw new ServiceUnavailableException(
        'Redefinição de senha por e-mail não está habilitada nesta instalação.',
      );
    }

    const generica = { mensagem: 'Se este e-mail estiver cadastrado, enviaremos instruções.' };
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return generica;

    const token = randomBytes(32).toString('hex');
    // Um pedido novo invalida os anteriores ainda não usados.
    await this.prisma.tokenRedefinicaoSenha.deleteMany({
      where: { userId: user.id, usadoEm: null },
    });
    await this.prisma.tokenRedefinicaoSenha.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiraEm: new Date(Date.now() + TOKEN_VALIDADE_MS),
      },
    });

    const base = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').replace(/\/$/, '');
    const link = `${base}/redefinir?token=${token}`;
    try {
      await this.email.enviar({
        para: user.email,
        assunto: 'Alpha Hub — redefinição de senha',
        html: [
          `<p>Olá, ${user.nome}.</p>`,
          '<p>Recebemos um pedido para redefinir a senha da sua conta no Alpha Hub.</p>',
          `<p><a href="${link}">Clique aqui para criar uma nova senha</a> (válido por 1 hora).</p>`,
          '<p>Se não foi você, ignore este e-mail — nada muda.</p>',
        ].join('\n'),
      });
    } catch {
      // Falha de envio não pode revelar existência da conta; fica auditada.
      await this.audit.registrar({
        acao: 'usuario.senha_redefinicao_falha_envio',
        entidade: 'User',
        entidadeId: user.id,
        origem,
      });
      return generica;
    }

    await this.audit.registrar({
      acao: 'usuario.senha_redefinicao_solicitada',
      entidade: 'User',
      entidadeId: user.id,
      origem,
    });
    return generica;
  }

  /** Conclui a redefinição: valida token (não usado, não expirado) e troca a senha. */
  async redefinirSenha(dto: RedefinirSenhaDto, origem?: string): Promise<{ mensagem: string }> {
    const registro = await this.prisma.tokenRedefinicaoSenha.findFirst({
      where: { tokenHash: hashToken(dto.token), usadoEm: null, expiraEm: { gt: new Date() } },
    });
    if (!registro) {
      throw new BadRequestException('Link inválido ou expirado. Peça uma nova redefinição.');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: registro.userId }, data: { senhaHash } }),
      this.prisma.tokenRedefinicaoSenha.update({
        where: { id: registro.id },
        data: { usadoEm: new Date() },
      }),
      // Revoga qualquer outro token pendente do usuário.
      this.prisma.tokenRedefinicaoSenha.deleteMany({
        where: { userId: registro.userId, usadoEm: null, id: { not: registro.id } },
      }),
    ]);

    await this.audit.registrar({
      acao: 'usuario.senha_redefinida',
      entidade: 'User',
      entidadeId: registro.userId,
      autorId: registro.userId,
      origem,
    });
    return { mensagem: 'Senha redefinida com sucesso. Você já pode entrar.' };
  }

  async registrar(dto: RegisterDto, origem?: string): Promise<AuthResultado> {
    const existente = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existente) {
      throw new ConflictException('Já existe uma conta com este e-mail');
    }

    const senhaHash = await bcrypt.hash(dto.senha, 10);
    const user = await this.prisma.user.create({
      data: { email: dto.email, senhaHash, nome: dto.nome, bio: dto.bio },
    });

    await this.audit.registrar({
      acao: 'usuario.registrado',
      entidade: 'User',
      entidadeId: user.id,
      autorId: user.id,
      depois: { email: user.email, nome: user.nome },
      origem,
    });

    return this.montarResultado(user);
  }

  async login(dto: LoginDto, origem?: string): Promise<AuthResultado> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.senha, user.senhaHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Bloqueia conta com sanção ativa de suspensão/banimento (P0).
    const sancao = await this.prisma.sancao.findFirst({
      where: {
        usuarioId: user.id,
        ativa: true,
        tipo: { in: ['SUSPENSAO', 'BANIMENTO'] },
        OR: [{ expiraEm: null }, { expiraEm: { gt: new Date() } }],
      },
    });
    if (sancao) {
      throw new ForbiddenException(
        sancao.tipo === 'BANIMENTO'
          ? 'Sua conta foi banida. Fale com o suporte.'
          : 'Sua conta está suspensa temporariamente. Fale com o suporte.',
      );
    }

    await this.audit.registrar({
      acao: 'usuario.login',
      entidade: 'User',
      entidadeId: user.id,
      autorId: user.id,
      origem,
    });

    return this.montarResultado(user);
  }

  private montarResultado(user: {
    id: string;
    email: string;
    nome: string;
    verificado: boolean;
    papelSistema: string;
  }): AuthResultado {
    const token = this.jwt.sign({ sub: user.id, email: user.email });
    return {
      token,
      usuario: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        verificado: user.verificado,
        papelSistema: user.papelSistema,
      },
    };
  }
}
