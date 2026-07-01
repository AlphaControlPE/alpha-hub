import { Module } from '@nestjs/common';
import { PropostasController } from './propostas.controller';
import { PropostasService } from './propostas.service';
import { SolicitacoesController } from './solicitacoes.controller';
import { SolicitacoesService } from './solicitacoes.service';

@Module({
  controllers: [SolicitacoesController, PropostasController],
  providers: [SolicitacoesService, PropostasService],
  exports: [SolicitacoesService, PropostasService],
})
export class MarketplaceModule {}
