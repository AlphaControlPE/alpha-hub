import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class PreferenciasDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() proposta?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() mensagem?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() contrato?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() indicacao?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() comunidade?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() moderacao?: boolean;
}
