import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreatePropostaDto {
  @ApiProperty({ example: 'Posso entregar em 3 semanas, com 2 rodadas de revisão.' })
  @IsString()
  @MinLength(10)
  mensagem!: string;

  @ApiPropertyOptional({ example: 180000, description: 'Valor proposto em centavos' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  valor?: number;

  @ApiPropertyOptional({ example: 21, description: 'Prazo em dias' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  prazoDias?: number;
}
