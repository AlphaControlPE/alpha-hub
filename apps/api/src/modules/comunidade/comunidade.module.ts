import { Module } from '@nestjs/common';
import { ComunidadeController } from './comunidade.controller';
import { ComunidadeService } from './comunidade.service';

@Module({
  controllers: [ComunidadeController],
  providers: [ComunidadeService],
})
export class ComunidadeModule {}
