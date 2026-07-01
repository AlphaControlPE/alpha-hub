import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateSolicitacaoDto {
  @ApiProperty({ example: 'Preciso de uma identidade visual para minha marca' })
  @IsString()
  @MinLength(5)
  @MaxLength(140)
  titulo!: string;

  @ApiProperty({ example: 'Marca de café artesanal; quero logo, paleta e aplicação básica.' })
  @IsString()
  @MinLength(20)
  descricao!: string;

  @ApiProperty({ example: 'design' })
  @IsString()
  @MinLength(2)
  categoria!: string;

  @ApiPropertyOptional({ example: 250000, description: 'Orçamento em centavos (opcional)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  orcamento?: number;
}
