import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { PreferenciasDto } from './dto/preferencias.dto';
import { NotificacoesService } from './notificacoes.service';

@ApiTags('Notificações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoes: NotificacoesService) {}

  @Get()
  @ApiOperation({ summary: 'Minhas notificações (use ?naoLidas=true para filtrar)' })
  listar(@CurrentUser() user: UsuarioAutenticado, @Query('naoLidas') naoLidas?: string) {
    return this.notificacoes.listar(user.id, naoLidas === 'true');
  }

  @Get('contador')
  @ApiOperation({ summary: 'Total de não lidas' })
  contador(@CurrentUser() user: UsuarioAutenticado) {
    return this.notificacoes.naoLidas(user.id);
  }

  @Patch(':id/lida')
  @ApiOperation({ summary: 'Marcar uma notificação como lida' })
  lida(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.notificacoes.marcarLida(id, user.id);
  }

  @Patch('lidas')
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  todasLidas(@CurrentUser() user: UsuarioAutenticado) {
    return this.notificacoes.marcarTodasLidas(user.id);
  }

  @Get('preferencias')
  @ApiOperation({ summary: 'Preferências de notificação' })
  prefs(@CurrentUser() user: UsuarioAutenticado) {
    return this.notificacoes.preferencias(user.id);
  }

  @Patch('preferencias')
  @ApiOperation({ summary: 'Atualizar preferências por categoria' })
  salvarPrefs(@CurrentUser() user: UsuarioAutenticado, @Body() dto: PreferenciasDto) {
    return this.notificacoes.atualizarPreferencias(user.id, dto);
  }
}
