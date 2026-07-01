import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { Papeis } from '../identidade/papeis.decorator';
import { PapeisGuard } from '../identidade/papeis.guard';
import { BiService } from './bi.service';

@ApiTags('Dados & BI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PapeisGuard)
@Papeis('MODERADOR', 'ADMIN')
@Controller('admin/bi')
export class BiController {
  constructor(private readonly bi: BiService) {}

  @Get('overview')
  @ApiOperation({ summary: 'KPIs operacionais (liquidez, conversão, confiança)' })
  overview() {
    return this.bi.overview();
  }

  @Get('funil')
  @ApiOperation({ summary: 'Funil de conversão' })
  funil() {
    return this.bi.funil();
  }

  @Get('categorias')
  @ApiOperation({ summary: 'Solicitações por categoria' })
  categorias() {
    return this.bi.categorias();
  }

  @Get('serie')
  @ApiOperation({ summary: 'Série temporal de eventos (auditoria) por dia' })
  serie(@Query('dias') dias?: string) {
    return this.bi.serie(dias ? parseInt(dias, 10) : 30);
  }
}
