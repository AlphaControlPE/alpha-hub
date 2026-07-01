import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateInsightDto {
  @ApiProperty({ example: 'Como precificar um projeto de identidade visual' })
  @IsString()
  @MinLength(5)
  @MaxLength(160)
  titulo!: string;

  @ApiProperty({ example: 'Considere escopo, rodadas de revisão, direitos de uso e prazo...' })
  @IsString()
  @MinLength(20)
  conteudo!: string;

  @ApiProperty({ example: 'design' })
  @IsString()
  @MinLength(2)
  categoria!: string;
}

export class CreateComentarioDto {
  @ApiProperty({ example: 'Ótimo ponto sobre direitos de uso!' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  conteudo!: string;
}
