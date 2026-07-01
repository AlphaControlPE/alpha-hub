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
import { Request } from 'express';
import { IsIn, IsString } from 'class-validator';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { CreateIndicacaoDto } from './dto/create-indicacao.dto';
import { QueryIndicacaoDto } from './dto/query-indicacao.dto';
import { IndicacoesService } from './indicacoes.service';

class StatusDto {
  @IsString()
  @IsIn(['ACEITA', 'GANHA', 'PERDIDA'])
  status!: 'ACEITA' | 'GANHA' | 'PERDIDA';
}

const origem = (req: Request) =>
  `${req.ip ?? ''} ${(req.headers['user-agent'] as string) ?? ''}`.trim();

@ApiTags('Indicações')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('indicacoes')
export class IndicacoesController {
  constructor(private readonly indicacoes: IndicacoesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar indicações (contato mascarado até reserva)' })
  listar(@CurrentUser() user: UsuarioAutenticado, @Query() query: QueryIndicacaoDto) {
    return this.indicacoes.listar(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar indicação' })
  detalhar(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.indicacoes.detalhar(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar indicação consentida (LGPD)' })
  criar(
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: CreateIndicacaoDto,
    @Req() req: Request,
  ) {
    return this.indicacoes.criar(user.id, dto, origem(req));
  }

  @Post(':id/reservar')
  @ApiOperation({ summary: 'Reservar uma indicação disponível' })
  reservar(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado, @Req() req: Request) {
    return this.indicacoes.reservar(id, user.id, origem(req));
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar estágio (ACEITA/GANHA/PERDIDA)' })
  status(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: StatusDto,
    @Req() req: Request,
  ) {
    return this.indicacoes.atualizarStatus(id, user.id, dto.status, origem(req));
  }
}
