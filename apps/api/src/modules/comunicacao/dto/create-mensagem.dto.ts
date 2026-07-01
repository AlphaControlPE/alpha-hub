import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMensagemDto {
  @ApiProperty({ example: 'Perfeito, podemos fechar nesse prazo.' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  conteudo!: string;
}
