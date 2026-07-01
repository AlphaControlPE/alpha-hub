import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAvaliacaoDto {
  @ApiProperty({ description: 'Proposta aceita que contextualiza a interação' })
  @IsString()
  propostaId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  notaComunicacao!: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  notaQualidade!: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  notaPrazo!: number;

  @ApiPropertyOptional({ example: 'Comunicação ótima e entrega no prazo.' })
  @IsOptional()
  @IsString()
  comentario?: string;
}
