import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { CreatePropostaDto } from './dto/create-proposta.dto';
import { CreateSolicitacaoDto } from './dto/create-solicitacao.dto';
import { QuerySolicitacaoDto } from './dto/query-solicitacao.dto';
import { PropostasService } from './propostas.service';
import { SolicitacoesService } from './solicitacoes.service';

function origem(req: Request): string {
  return `${req.ip ?? ''} ${(req.headers['user-agent'] as string) ?? ''}`.trim();
}

@ApiTags('Marketplace')
@Controller('solicitacoes')
export class SolicitacoesController {
  constructor(
    private readonly solicitacoes: SolicitacoesService,
    private readonly propostas: PropostasService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar solicitações (filtros + paginação, sem paywall)' })
  listar(@Query() query: QuerySolicitacaoDto) {
    return this.solicitacoes.listar(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar solicitação' })
  detalhar(@Param('id') id: string) {
    return this.solicitacoes.detalhar(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar solicitação' })
  criar(
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: CreateSolicitacaoDto,
    @Req() req: Request,
  ) {
    return this.solicitacoes.criar(user.id, dto, origem(req));
  }

  @Get(':id/propostas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar propostas da solicitação' })
  listarPropostas(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.propostas.listarDaSolicitacao(id, user.id);
  }

  @Post(':id/propostas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar proposta (abre sala de negociação)' })
  enviarProposta(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: CreatePropostaDto,
    @Req() req: Request,
  ) {
    return this.propostas.criar(id, user.id, dto, origem(req));
  }
}
