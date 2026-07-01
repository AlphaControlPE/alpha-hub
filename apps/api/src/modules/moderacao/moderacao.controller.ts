import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DenunciaStatus } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { Papeis } from '../identidade/papeis.decorator';
import { PapeisGuard } from '../identidade/papeis.guard';
import {
  AplicarSancaoDto,
  CreateDenunciaDto,
  ResolverDenunciaDto,
} from './dto/moderacao.dto';
import { ModeracaoService } from './moderacao.service';

const origem = (req: Request) =>
  `${req.ip ?? ''} ${(req.headers['user-agent'] as string) ?? ''}`.trim();

@ApiTags('Moderação & Admin')
@ApiBearerAuth()
@Controller()
export class ModeracaoController {
  constructor(private readonly moderacao: ModeracaoService) {}

  @Post('denuncias')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Denunciar um conteúdo ou usuário' })
  denunciar(
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: CreateDenunciaDto,
    @Req() req: Request,
  ) {
    return this.moderacao.denunciar(user.id, dto, origem(req));
  }

  @Get('admin/denuncias')
  @UseGuards(JwtAuthGuard, PapeisGuard)
  @Papeis('MODERADOR', 'ADMIN')
  @ApiOperation({ summary: 'Listar denúncias (moderação)' })
  listar(@Query('status') status?: DenunciaStatus) {
    return this.moderacao.listarDenuncias(status);
  }

  @Patch('admin/denuncias/:id')
  @UseGuards(JwtAuthGuard, PapeisGuard)
  @Papeis('MODERADOR', 'ADMIN')
  @ApiOperation({ summary: 'Resolver denúncia' })
  resolver(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: ResolverDenunciaDto,
    @Req() req: Request,
  ) {
    return this.moderacao.resolver(id, user.id, dto, origem(req));
  }

  @Post('admin/sancoes')
  @UseGuards(JwtAuthGuard, PapeisGuard)
  @Papeis('ADMIN')
  @ApiOperation({ summary: 'Aplicar sanção a um usuário' })
  sancionar(
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: AplicarSancaoDto,
    @Req() req: Request,
  ) {
    return this.moderacao.aplicarSancao(user.id, dto, origem(req));
  }

  @Get('admin/metricas')
  @UseGuards(JwtAuthGuard, PapeisGuard)
  @Papeis('MODERADOR', 'ADMIN')
  @ApiOperation({ summary: 'Métricas operacionais' })
  metricas() {
    return this.moderacao.metricas();
  }
}
