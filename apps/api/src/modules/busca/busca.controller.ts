import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { BuscaService } from './busca.service';

@ApiTags('Busca & Matching')
@Controller()
export class BuscaController {
  constructor(private readonly busca: BuscaService) {}

  @Get('matching/solicitacoes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Solicitações recomendadas para você (prestador)' })
  matching(@CurrentUser() user: UsuarioAutenticado) {
    return this.busca.matchingParaPrestador(user.id);
  }

  @Get('busca')
  @ApiOperation({ summary: 'Busca global em solicitações e insights' })
  buscar(@Query('q') q = '') {
    return this.busca.buscaGlobal(q);
  }
}
