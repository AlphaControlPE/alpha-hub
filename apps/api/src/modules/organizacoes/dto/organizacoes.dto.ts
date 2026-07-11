import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ECnpj } from '../../../common/validacao/cnpj';

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

  @ApiPropertyOptional({ example: '11.222.333/0001-81', description: 'CNPJ da organização (validado)' })
  @IsOptional()
  @IsString()
  @ECnpj()
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
    example: '11.222.333/0001-81',
    description: 'CNPJ (validado) — obrigatório se a organização ainda não tiver documento',
  })
  @IsOptional()
  @IsString()
  @ECnpj()
  documento?: string;
}

export class CriarConviteDto {
  @ApiPropertyOptional({ enum: PAPEIS_ATRIBUIVEIS, default: 'MEMBRO', description: 'Papel concedido ao aceitar' })
  @IsOptional()
  @IsIn(PAPEIS_ATRIBUIVEIS)
  papel?: PapelAtribuivel;

  @ApiPropertyOptional({ default: 7, minimum: 1, maximum: 30, description: 'Dias até o link expirar' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  expiraDias?: number;
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
