import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuditModule } from './common/audit/audit.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { BiModule } from './modules/bi/bi.module';
import { BuscaModule } from './modules/busca/busca.module';
import { ComunicacaoModule } from './modules/comunicacao/comunicacao.module';
import { ComunidadeModule } from './modules/comunidade/comunidade.module';
import { IdentidadeModule } from './modules/identidade/identidade.module';
import { IndicacoesModule } from './modules/indicacoes/indicacoes.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { ModeracaoModule } from './modules/moderacao/moderacao.module';
import { MonetizacaoModule } from './modules/monetizacao/monetizacao.module';
import { NegociosModule } from './modules/negocios/negocios.module';
import { NotificacoesModule } from './modules/notificacoes/notificacoes.module';
import { OrganizacoesModule } from './modules/organizacoes/organizacoes.module';
import { PerfilModule } from './modules/perfil/perfil.module';
import { ReputacaoModule } from './modules/reputacao/reputacao.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    NotificacoesModule, // Parte XIII (global)
    IdentidadeModule,
    MarketplaceModule,
    ComunicacaoModule,
    IndicacoesModule, // Parte VII
    ReputacaoModule, // Parte X
    ComunidadeModule, // Parte IX
    BuscaModule, // Parte XII
    ModeracaoModule, // Parte XIV
    NegociosModule, // Parte XI
    BiModule, // Parte XV
    MonetizacaoModule, // Parte XX
    PerfilModule, // Parte IV
    OrganizacoesModule, // Parte III
  ],
  controllers: [AppController],
})
export class AppModule {}
