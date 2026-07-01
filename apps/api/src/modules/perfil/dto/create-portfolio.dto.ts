import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

// Item de portfólio (caso/trabalho) exibido no perfil público do prestador.
export class CreatePortfolioDto {
  @ApiProperty({ example: 'Identidade visual para cafeteria artesanal' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  titulo!: string;

  @ApiProperty({ example: 'Naming, logo, paleta e aplicação em embalagens. Entrega em 3 semanas.' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  descricao!: string;

  @ApiPropertyOptional({ example: 'https://cdn.exemplo.com/caso.jpg' })
  @IsOptional()
  @IsUrl()
  imagemUrl?: string;

  @ApiPropertyOptional({ example: 'https://behance.net/meu-caso' })
  @IsOptional()
  @IsUrl()
  link?: string;
}
