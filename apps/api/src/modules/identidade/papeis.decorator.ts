import { SetMetadata } from '@nestjs/common';

export type PapelSistema = 'USUARIO' | 'MODERADOR' | 'ADMIN';
export const PAPEIS_KEY = 'papeis';

/** Restringe a rota aos papéis de sistema informados. Use com PapeisGuard. */
export const Papeis = (...papeis: PapelSistema[]) => SetMetadata(PAPEIS_KEY, papeis);
