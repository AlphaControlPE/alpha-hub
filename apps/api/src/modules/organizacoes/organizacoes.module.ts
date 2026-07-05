import { Module } from '@nestjs/common';
import { OrganizacoesController } from './organizacoes.controller';
import { OrganizacoesService } from './organizacoes.service';

// Parte III — organizações, equipes e verificação.
@Module({
  controllers: [OrganizacoesController],
  providers: [OrganizacoesService],
  exports: [OrganizacoesService],
})
export class OrganizacoesModule {}
