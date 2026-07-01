import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { NegociosService } from './negocios.service';

const origem = (req: Request) =>
  `${req.ip ?? ''} ${(req.headers['user-agent'] as string) ?? ''}`.trim();

@ApiTags('Negócios & Contratos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contratos')
export class NegociosController {
  constructor(private readonly negocios: NegociosService) {}

  @Get()
  @ApiOperation({ summary: 'Meus contratos' })
  meus(@CurrentUser() user: UsuarioAutenticado) {
    return this.negocios.listarMeus(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhar contrato' })
  detalhar(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.negocios.detalhar(id, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Formalizar contrato a partir de proposta aceita' })
  criar(
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: CreateContratoDto,
    @Req() req: Request,
  ) {
    return this.negocios.criar(user.id, dto, origem(req));
  }

  @Post(':id/assinar')
  @ApiOperation({ summary: 'Assinar contrato (ATIVO quando ambos assinam; abre escrow simulado)' })
  assinar(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado, @Req() req: Request) {
    return this.negocios.assinar(id, user.id, origem(req));
  }

  @Post(':id/marcos/:marcoId/entregar')
  @ApiOperation({ summary: 'Prestador entrega um marco' })
  entregar(
    @Param('id') id: string,
    @Param('marcoId') marcoId: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Req() req: Request,
  ) {
    return this.negocios.entregarMarco(id, marcoId, user.id, origem(req));
  }

  @Post(':id/marcos/:marcoId/aprovar')
  @ApiOperation({ summary: 'Cliente aprova o marco e libera o escrow simulado' })
  aprovar(
    @Param('id') id: string,
    @Param('marcoId') marcoId: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Req() req: Request,
  ) {
    return this.negocios.aprovarMarco(id, marcoId, user.id, origem(req));
  }
}
