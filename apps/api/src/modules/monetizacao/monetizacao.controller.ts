import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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

  @Get('planos/recursos')
  @ApiOperation({ summary: 'Recursos de pagamento habilitados nesta instalação' })
  recursos() {
    return this.monetizacao.recursos();
  }

  @Post('planos/:id/checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pagamento real do plano via Mercado Pago (Pix/cartão)' })
  checkout(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado, @Req() req: Request) {
    return this.monetizacao.checkout(user.id, id, user.email, origem(req));
  }

  // Webhook do Mercado Pago (público por natureza; a autenticidade é garantida
  // buscando o pagamento na API do MP — nunca confiamos no corpo recebido).
  @Post('webhooks/mercadopago')
  @ApiOperation({ summary: 'Webhook de notificações do Mercado Pago' })
  webhookMp(@Body() payload: { type?: string; data?: { id?: string | number } }) {
    return this.monetizacao.processarWebhookMp(payload);
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
