import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../identidade/current-user.decorator';
import { JwtAuthGuard } from '../identidade/jwt-auth.guard';
import { UsuarioAutenticado } from '../identidade/jwt.strategy';
import { ConversasService } from './conversas.service';
import { CreateMensagemDto } from './dto/create-mensagem.dto';
import { ChatGateway } from './chat.gateway';

@ApiTags('Comunicação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversas')
export class ConversasController {
  constructor(
    private readonly conversas: ConversasService,
    private readonly gateway: ChatGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Minhas conversas' })
  minhas(@CurrentUser() user: UsuarioAutenticado) {
    return this.conversas.listarMinhas(user.id);
  }

  @Get(':id/mensagens')
  @ApiOperation({ summary: 'Mensagens de uma conversa' })
  mensagens(@Param('id') id: string, @CurrentUser() user: UsuarioAutenticado) {
    return this.conversas.listarMensagens(id, user.id);
  }

  @Post(':id/mensagens')
  @ApiOperation({ summary: 'Enviar mensagem (também emitida em tempo real)' })
  async enviar(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Body() dto: CreateMensagemDto,
  ) {
    const mensagem = await this.conversas.enviarMensagem(id, user.id, dto.conteudo);
    this.gateway.emitirNovaMensagem(id, mensagem);
    return mensagem;
  }
}
