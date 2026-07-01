import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class MarcoInputDto {
  @ApiProperty({ example: 'Conceito e moodboard' })
  @IsString()
  @MinLength(2)
  titulo!: string;

  @ApiPropertyOptional({ example: 'Apresentação de 2 direções de marca' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ example: 80000, description: 'Valor do marco em centavos' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  valor!: number;
}

export class CreateContratoDto {
  @ApiProperty({ description: 'Proposta aceita que origina o contrato' })
  @IsString()
  propostaId!: string;

  @ApiProperty({ example: 'Identidade visual completa com manual de marca.' })
  @IsString()
  @MinLength(10)
  escopo!: string;

  @ApiPropertyOptional({ example: 21 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  prazoDias?: number;

  @ApiProperty({ type: [MarcoInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MarcoInputDto)
  marcos!: MarcoInputDto[];
}
