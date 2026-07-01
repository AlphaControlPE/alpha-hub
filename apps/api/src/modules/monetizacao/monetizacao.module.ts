import { Module } from '@nestjs/common';
import { MonetizacaoController } from './monetizacao.controller';
import { MonetizacaoService } from './monetizacao.service';

@Module({
  controllers: [MonetizacaoController],
  providers: [MonetizacaoService],
})
export class MonetizacaoModule {}
