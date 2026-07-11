import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { Papeis } from '../identidade/papeis.decorator';
import { PapeisGuard } from '../identidade/papeis.guard';
import {
  AddMembroDto,
  AlterarPapelDto,
  CreateOrganizacaoDto,
  CriarConviteDto,
  DecidirVerificacaoDto,
  PedirVerificacaoDto,
} from './dto/organizacoes.dto';
import { OrganizacoesService } from './organizacoes.service';

const origem = (req: Request) =>
  `${req.ip ?? ''} ${(req.headers['user-agent'] as string) ?? ''}`.trim();

@ApiTags('Organizações')
@ApiBearerAuth()
@Controller()
export class OrganizacoesController {
  constructor(private readonly organizacoes: OrganizacoesService) {}

  @Post('organizacoes')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Criar organização (criador vira DONO)' })
  criar(@CurrentUser() user: UsuarioAutenticado, @Body() dto: CreateOrganizacaoDto) {
    return this.organizacoes.criar(user.id, dto);
  }

  @Get('organizacoes/minhas')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Organizações em que participo (com papel e nº de membros)' })
  minhas(@CurrentUser() user: UsuarioAutenticado) {
    return this.organizacoes.minhas(user.id);
  }

  @Get('organizacoes/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Detalhe da organização com membros (só membro)' })
  detalhe(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.organizacoes.detalhe(id, user.id);
  }

  @Post('organizacoes/:id/membros')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Adicionar membro por e-mail (só DONO/ADMIN da org)' })
  adicionarMembro(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: AddMembroDto,
  ) {
    return this.organizacoes.adicionarMembro(id, user.id, dto);
  }

  @Delete('organizacoes/:id/membros/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remover membro (DONO/ADMIN) ou sair da organização' })
  removerMembro(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.organizacoes.removerMembro(id, user.id, userId);
  }

  @Patch('organizacoes/:id/membros/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Alternar papel MEMBRO<->ADMIN (só DONO)' })
  alterarPapel(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: AlterarPapelDto,
  ) {
    return this.organizacoes.alterarPapel(id, user.id, userId, dto);
  }

  @Post('organizacoes/:id/convites')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Gerar link de convite (só DONO/ADMIN); retorna o token uma vez' })
  criarConvite(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: CriarConviteDto,
  ) {
    return this.organizacoes.criarConvite(id, user.id, dto);
  }

  @Get('organizacoes/:id/convites')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar convites da organização com status (só DONO/ADMIN)' })
  listarConvites(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.organizacoes.listarConvites(id, user.id);
  }

  @Delete('organizacoes/:id/convites/:conviteId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Revogar um convite (só DONO/ADMIN)' })
  revogarConvite(
    @Param('id') id: string,
    @Param('conviteId') conviteId: string,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.organizacoes.revogarConvite(id, user.id, conviteId);
  }

  @Get('organizacoes/convite/:token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Prévia de um convite (org, papel, se expirou/usado)' })
  previewConvite(@Param('token') token: string) {
    return this.organizacoes.previewConvite(token);
  }

  @Post('organizacoes/convite/:token/aceitar')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Aceitar convite: entra na organização com o papel do convite' })
  aceitarConvite(@Param('token') token: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.organizacoes.aceitarConvite(token, user.id);
  }

  @Post('organizacoes/:id/verificacao')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Pedir verificação da organização (só DONO/ADMIN; exige CNPJ)' })
  pedirVerificacao(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: PedirVerificacaoDto,
  ) {
    return this.organizacoes.pedirVerificacao(id, user.id, dto);
  }

  @Get('admin/verificacoes')
  @UseGuards(JwtAuthGuard, PapeisGuard)
  @Papeis('MODERADOR', 'ADMIN')
  @ApiOperation({ summary: 'Listar pedidos de verificação pendentes (staff)' })
  listarVerificacoes() {
    return this.organizacoes.listarVerificacoesPendentes();
  }

  @Patch('admin/verificacoes/:orgId')
  @UseGuards(JwtAuthGuard, PapeisGuard)
  @Papeis('MODERADOR', 'ADMIN')
  @ApiOperation({ summary: 'Aprovar/rejeitar verificação de organização (staff)' })
  decidirVerificacao(
    @Param('orgId') orgId: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: DecidirVerificacaoDto,
    @Req() req: Request,
  ) {
    return this.organizacoes.decidirVerificacao(orgId, user.id, dto, origem(req));
  }
}
