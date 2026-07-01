import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { MonetizacaoService } from './monetizacao.service';

const origem = (req: Request) =>
  `${req.ip ?? ''} ${(req.headers['user-agent'] as string) ?? ''}`.trim();

@ApiTags('Monetização (opcional)')
@Controller()
export class MonetizacaoController {
  constructor(private readonly monetizacao: MonetizacaoService) {}

  @Get('planos')
  @ApiOperation({ summary: 'Catálogo público de planos opcionais (núcleo é grátis)' })
  catalogo() {
    return this.monetizacao.catalogo();
  }

  @Get('planos/minhas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Minhas assinaturas' })
  minhas(@CurrentUser() user: UsuarioAutenticado) {
    return this.monetizacao.minhas(user.id);
  }

  @Post('planos/:id/assinar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assinar plano (pagamento simulado)' })
  assinar(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado, @Req() req: Request) {
    return this.monetizacao.assinar(user.id, id, origem(req));
  }

  @Post('assinaturas/:id/cancelar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar assinatura' })
  cancelar(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado, @Req() req: Request) {
    return this.monetizacao.cancelar(id, user.id, origem(req));
  }
}
