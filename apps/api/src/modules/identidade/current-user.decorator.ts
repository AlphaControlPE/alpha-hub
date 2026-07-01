import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioAutenticado } from './jwt.strategy';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UsuarioAutenticado;
  },
);
