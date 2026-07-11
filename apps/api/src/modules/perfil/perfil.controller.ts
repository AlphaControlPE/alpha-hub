import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { AtualizarPerfilDto } from './dto/atualizar-perfil.dto';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { CreateServicoDto } from './dto/create-servico.dto';
import { PerfilService } from './perfil.service';

@ApiTags('Perfil')
@Controller()
export class PerfilController {
  constructor(private readonly perfil: PerfilService) {}

  @Get('usuarios/:id/perfil')
  @ApiOperation({ summary: 'Perfil público de um prestador (bio, portfólio e serviços)' })
  perfilPublico(@Param('id') id: string) {
    return this.perfil.perfilPublico(id);
  }

  @Get('perfil/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Meu perfil: nome, bio, portfólio e serviços (para edição)' })
  meuPerfil(@CurrentUser() user: UsuarioAutenticado) {
    return this.perfil.meuPerfil(user.id);
  }

  @Patch('perfil/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar meu nome e/ou "sobre você" (bio)' })
  atualizarPerfil(@CurrentUser() user: UsuarioAutenticado, @Body() dto: AtualizarPerfilDto) {
    return this.perfil.atualizarPerfil(user.id, dto);
  }

  @Post('perfil/portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar item de portfólio' })
  adicionarPortfolio(@CurrentUser() user: UsuarioAutenticado, @Body() dto: CreatePortfolioDto) {
    return this.perfil.adicionarPortfolio(user.id, dto);
  }

  @Delete('perfil/portfolio/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover item de portfólio (só o dono)' })
  removerPortfolio(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.perfil.removerPortfolio(id, user.id);
  }

  @Post('perfil/servicos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Adicionar serviço ao catálogo' })
  adicionarServico(@CurrentUser() user: UsuarioAutenticado, @Body() dto: CreateServicoDto) {
    return this.perfil.adicionarServico(user.id, dto);
  }

  @Delete('perfil/servicos/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover serviço do catálogo (só o dono)' })
  removerServico(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.perfil.removerServico(id, user.id);
  }
}
