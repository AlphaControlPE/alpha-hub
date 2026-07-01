import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IndicacaoStatus } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryIndicacaoDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'desenvolvimento' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ enum: IndicacaoStatus })
  @IsOptional()
  @IsEnum(IndicacaoStatus)
  status?: IndicacaoStatus;

  @ApiPropertyOptional({ description: 'true = somente as que cadastrei' })
  @IsOptional()
  @IsString()
  minhas?: string;
}
