import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlvoTipo, SancaoTipo } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateDenunciaDto {
  @ApiProperty({ enum: AlvoTipo })
  @IsEnum(AlvoTipo)
  alvoTipo!: AlvoTipo;

  @ApiProperty({ example: 'cmabc123' })
  @IsString()
  alvoId!: string;

  @ApiProperty({ example: 'spam' })
  @IsString()
  @MinLength(3)
  motivo!: string;

  @ApiPropertyOptional({ example: 'Conteúdo repetido várias vezes.' })
  @IsOptional()
  @IsString()
  descricao?: string;
}

export class ResolverDenunciaDto {
  @ApiProperty({ enum: ['PROCEDENTE', 'IMPROCEDENTE'] })
  @IsIn(['PROCEDENTE', 'IMPROCEDENTE'])
  status!: 'PROCEDENTE' | 'IMPROCEDENTE';

  @ApiPropertyOptional({ example: 'Conteúdo removido e usuário advertido.' })
  @IsOptional()
  @IsString()
  resolucao?: string;
}

export class AplicarSancaoDto {
  @ApiProperty({ example: 'cmuser123' })
  @IsString()
  usuarioId!: string;

  @ApiProperty({ enum: SancaoTipo })
  @IsEnum(SancaoTipo)
  tipo!: SancaoTipo;

  @ApiProperty({ example: 'Reincidência de spam' })
  @IsString()
  @MinLength(3)
  motivo!: string;

  @ApiPropertyOptional({ example: '2026-07-30T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  expiraEm?: string;
}

export class DesativarSancaoDto {
  @ApiPropertyOptional({ example: 'Usuário cumpriu o período de suspensão' })
  @IsOptional()
  @IsString()
  motivo?: string;
}
