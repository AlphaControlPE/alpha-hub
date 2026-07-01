import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { SolicitacaoStatus } from '@prisma/client';

export class QuerySolicitacaoDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Busca textual em título e descrição' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'design' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ enum: SolicitacaoStatus })
  @IsOptional()
  @IsEnum(SolicitacaoStatus)
  status?: SolicitacaoStatus;
}
