import { Module } from '@nestjs/common';
import { IdentidadeModule } from '../identidade/identidade.module';
import { ChatGateway } from './chat.gateway';
import { ConversasController } from './conversas.controller';
import { ConversasService } from './conversas.service';

@Module({
  imports: [IdentidadeModule], // reaproveita o JwtModule para autenticar o socket
  controllers: [ConversasController],
  providers: [ConversasService, ChatGateway],
  exports: [ConversasService],
})
export class ComunicacaoModule {}
