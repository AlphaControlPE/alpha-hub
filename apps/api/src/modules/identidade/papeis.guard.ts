import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PAPEIS_KEY, PapelSistema } from './papeis.decorator';
import { UsuarioAutenticado } from './jwt.strategy';

/** Autoriza por papel de sistema. Deve rodar após o JwtAuthGuard. */
@Injectable()
export class PapeisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<PapelSistema[]>(PAPEIS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requeridos || requeridos.length === 0) return true;

    const user = context.switchToHttp().getRequest().user as UsuarioAutenticado | undefined;
    if (!user || !requeridos.includes(user.papelSistema)) {
      throw new ForbiddenException('Acesso restrito a moderação/administração');
    }
    return true;
  }
}
