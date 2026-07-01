import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface UsuarioAutenticado {
  id: string;
  email: string;
  nome: string;
  papelSistema: 'USUARIO' | 'MODERADOR' | 'ADMIN';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'change-me-in-prod',
    });
  }

  async validate(payload: JwtPayload): Promise<UsuarioAutenticado> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Sessão inválida');
    }
    return {
      id: user.id,
      email: user.email,
      nome: user.nome,
      papelSistema: user.papelSistema,
    };
  }
}
