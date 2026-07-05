import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

// Papéis atribuíveis por convite/gestão. DONO só existe na criação da org.
export type PapelAtribuivel = 'MEMBRO' | 'ADMIN';
const PAPEIS_ATRIBUIVEIS: PapelAtribuivel[] = ['MEMBRO', 'ADMIN'];

export class CreateOrganizacaoDto {
  @ApiProperty({ example: 'Estúdio Aurora' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nome!: string;

  @ApiPropertyOptional({ example: 'Estúdio de design e branding para pequenos negócios.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descricao?: string;

  @ApiPropertyOptional({ example: '12.345.678/0001-90', description: 'CNPJ da organização' })
  @IsOptional()
  @IsString()
  @MinLength(14)
  @MaxLength(18)
  documento?: string;
}

export class AddMembroDto {
  @ApiProperty({ example: 'colega@exemplo.com', description: 'E-mail de um usuário já cadastrado' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: PAPEIS_ATRIBUIVEIS, default: 'MEMBRO' })
  @IsOptional()
  @IsIn(PAPEIS_ATRIBUIVEIS)
  papel?: PapelAtribuivel;
}

export class AlterarPapelDto {
  @ApiProperty({ enum: PAPEIS_ATRIBUIVEIS })
  @IsIn(PAPEIS_ATRIBUIVEIS)
  papel!: PapelAtribuivel;
}

export class PedirVerificacaoDto {
  @ApiPropertyOptional({
    example: '12.345.678/0001-90',
    description: 'CNPJ — obrigatório se a organização ainda não tiver documento',
  })
  @IsOptional()
  @IsString()
  @MinLength(14)
  @MaxLength(18)
  documento?: string;
}

export class DecidirVerificacaoDto {
  @ApiProperty({ enum: ['APROVADA', 'REJEITADA'] })
  @IsIn(['APROVADA', 'REJEITADA'])
  decisao!: 'APROVADA' | 'REJEITADA';

  @ApiPropertyOptional({ example: 'CNPJ divergente da razão social informada.' })
  @IsOptional()
  @IsString()
  motivo?: string;
}
