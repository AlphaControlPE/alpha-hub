import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Como o JwtAuthGuard, mas NÃO bloqueia quando não há token: apenas deixa
 * `req.user` indefinido. Útil para conteúdo público que enriquece a resposta
 * quando o usuário está logado (ex.: marcar se já votou).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user as TUser; // sem usuário => undefined, sem lançar
  }
}
