import { Module } from '@nestjs/common';
import { MercadoPagoService } from '../../common/pagamentos/mercadopago.service';
import { MonetizacaoController } from './monetizacao.controller';
import { MonetizacaoService } from './monetizacao.service';

@Module({
  controllers: [MonetizacaoController],
  providers: [MonetizacaoService, MercadoPagoService],
})
export class MonetizacaoModule {}
