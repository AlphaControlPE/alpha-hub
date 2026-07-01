import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { PropostasService } from './propostas.service';

@ApiTags('Marketplace')
@Controller('propostas')
export class PropostasController {
  constructor(private readonly propostas: PropostasService) {}

  @Post(':id/aceitar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aceitar uma proposta (somente o autor da solicitação)' })
  aceitar(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Req() req: Request,
  ) {
    const origem = `${req.ip ?? ''} ${(req.headers['user-agent'] as string) ?? ''}`.trim();
    return this.propostas.aceitar(id, user.id, origem);
  }
}
