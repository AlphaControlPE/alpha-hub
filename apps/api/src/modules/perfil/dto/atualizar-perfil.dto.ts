import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Edição do próprio perfil público: nome e "sobre você" (bio). Ambos opcionais —
// envie só o que quer mudar. Bio vazia limpa o campo.
export class AtualizarPerfilDto {
  @ApiPropertyOptional({ example: 'Marina Alves', minLength: 2, maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome?: string;

  @ApiPropertyOptional({ example: 'Designer com 8 anos de experiência em marcas de alimentação.', maxLength: 600 })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  bio?: string;
}
