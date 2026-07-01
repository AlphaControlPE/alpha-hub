import { Module } from '@nestjs/common';
import { ReputacaoController } from './reputacao.controller';
import { ReputacaoService } from './reputacao.service';

@Module({
  controllers: [ReputacaoController],
  providers: [ReputacaoService],
  exports: [ReputacaoService],
})
export class ReputacaoModule {}
