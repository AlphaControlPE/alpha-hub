import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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
  ) {}

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
