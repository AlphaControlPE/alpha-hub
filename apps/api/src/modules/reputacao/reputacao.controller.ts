import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { CreateAvaliacaoDto } from './dto/create-avaliacao.dto';
import { ReputacaoService } from './reputacao.service';

@ApiTags('Reputação')
@Controller()
export class ReputacaoController {
  constructor(private readonly reputacao: ReputacaoService) {}

  @Get('usuarios/:id/reputacao')
  @ApiOperation({ summary: 'Reputação multidimensional de um usuário (pública)' })
  reputacaoUsuario(@Param('id') id: string) {
    return this.reputacao.reputacao(id);
  }

  @Post('avaliacoes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Avaliar a outra parte de uma proposta aceita' })
  avaliar(@CurrentUser() user: UsuarioAutenticado, @Body() dto: CreateAvaliacaoDto) {
    return this.reputacao.avaliar(user.id, dto);
  }

  @Get('avaliacoes/pendentes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Interações que você ainda pode avaliar' })
  pendentes(@CurrentUser() user: UsuarioAutenticado) {
    return this.reputacao.pendentes(user.id);
  }
}
