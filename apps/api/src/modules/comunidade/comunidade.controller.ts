import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../identidade/optional-jwt-auth.guard';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { ComunidadeService } from './comunidade.service';
import { CreateComentarioDto, CreateInsightDto } from './dto/create-insight.dto';

@ApiTags('Comunidade')
@Controller('insights')
export class ComunidadeController {
  constructor(private readonly comunidade: ComunidadeService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Listar insights (top ou recentes)' })
  listar(
    @CurrentUser() user: UsuarioAutenticado | undefined,
    @Query('ordenar') ordenar?: string,
    @Query('categoria') categoria?: string,
  ) {
    return this.comunidade.listar(ordenar === 'recentes' ? 'recentes' : 'top', categoria, user?.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Detalhar insight com comentários' })
  detalhar(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado | undefined) {
    return this.comunidade.detalhar(id, user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar insight' })
  criar(@CurrentUser() user: UsuarioAutenticado, @Body() dto: CreateInsightDto) {
    return this.comunidade.criar(user.id, dto);
  }

  @Post(':id/voto')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Votar / desfazer voto (toggle)' })
  voto(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.comunidade.alternarVoto(id, user.id);
  }

  @Post(':id/comentarios')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comentar em um insight' })
  comentar(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: CreateComentarioDto,
  ) {
    return this.comunidade.comentar(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover insight (só o autor)' })
  removerInsight(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.comunidade.removerInsight(id, user.id);
  }

  @Delete(':id/comentarios/:comentarioId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover comentário (só o autor)' })
  removerComentario(
    @Param('id') id: string,
    @Param('comentarioId') comentarioId: string,
    @CurrentUser() user: UsuarioAutenticado,
  ) {
    return this.comunidade.removerComentario(id, comentarioId, user.id);
  }
}
