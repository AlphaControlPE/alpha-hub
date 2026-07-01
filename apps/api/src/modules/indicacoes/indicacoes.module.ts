import { Module } from '@nestjs/common';
import { IndicacoesController } from './indicacoes.controller';
import { IndicacoesService } from './indicacoes.service';

@Module({
  controllers: [IndicacoesController],
  providers: [IndicacoesService],
})
export class IndicacoesModule {}
