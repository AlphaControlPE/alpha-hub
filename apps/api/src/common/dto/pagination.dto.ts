import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Paginação padronizada por offset (escopo 17.01). Limite máximo protege a
 * plataforma contra abuso sem criar paywall ou cota comercial.
 */
export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }
}

export interface Paginated<T> {
  dados: T[];
  meta: { page: number; limit: number; total: number; totalPaginas: number };
}

export function paginar<T>(
  dados: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return {
    dados,
    meta: { page, limit, total, totalPaginas: Math.ceil(total / limit) || 1 },
  };
}
