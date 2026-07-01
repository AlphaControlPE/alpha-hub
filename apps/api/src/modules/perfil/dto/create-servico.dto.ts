import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

// Serviço oferecido no catálogo do prestador (preço base opcional, em centavos).
export class CreateServicoDto {
  @ApiProperty({ example: 'Landing page institucional' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  titulo!: string;

  @ApiProperty({ example: 'Página única responsiva, copy e integração com formulário de contato.' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  descricao!: string;

  @ApiPropertyOptional({ example: 250000, description: 'Preço base em centavos (opcional)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  precoBase?: number;
}
