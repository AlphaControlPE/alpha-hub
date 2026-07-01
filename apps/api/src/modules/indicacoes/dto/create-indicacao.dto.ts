import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateIndicacaoDto {
  @ApiProperty({ example: 'Restaurante quer reformular cardápio digital' })
  @IsString()
  @MinLength(5)
  titulo!: string;

  @ApiProperty({ example: 'Dono pediu indicação de quem faça cardápio digital com QR.' })
  @IsString()
  @MinLength(20)
  descricao!: string;

  @ApiProperty({ example: 'desenvolvimento' })
  @IsString()
  @MinLength(2)
  categoria!: string;

  @ApiProperty({ example: 'João do Bistrô' })
  @IsString()
  @MinLength(2)
  contatoNome!: string;

  @ApiProperty({ example: 'joao@bistro.com', description: 'Só compartilhado com consentimento' })
  @IsString()
  @MinLength(3)
  contatoInfo!: string;

  @ApiProperty({ example: true, description: 'Confirma base legal/consentimento do contato (LGPD)' })
  @IsBoolean()
  consentimento!: boolean;

  @ApiPropertyOptional({ example: 500000, description: 'Valor estimado em centavos' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  valorEstimado?: number;

  @ApiPropertyOptional({ example: 10, description: 'Comissão acordada (%)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  comissaoPct?: number;
}
