import { Global, Module } from '@nestjs/common';
import { IdentidadeModule } from '../identidade/identidade.module';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesGateway } from './notificacoes.gateway';
import { NotificacoesService } from './notificacoes.service';

/**
 * @Global: o NotificacoesService é injetado pelos demais domínios (propostas,
 * contratos, mensagens, indicações, moderação) sem precisar reimportar o módulo.
 */
@Global()
@Module({
  imports: [IdentidadeModule], // JwtModule para autenticar o socket
  controllers: [NotificacoesController],
  providers: [NotificacoesService, NotificacoesGateway],
  exports: [NotificacoesService],
})
export class NotificacoesModule {}
