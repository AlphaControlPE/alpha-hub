import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  autorId?: string | null;
  antes?: Prisma.InputJsonValue | null;
  depois?: Prisma.InputJsonValue | null;
  motivo?: string | null;
  origem?: string | null;
  correlacao?: string | null;
}

/**
 * Trilha de auditoria (escopo 17.08): antes, depois, autor, origem, motivo,
 * correlação e integridade. É deliberadamente tolerante a falhas — auditar
 * nunca deve derrubar a operação de negócio, mas falhas são registradas.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async registrar(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          acao: entry.acao,
          entidade: entry.entidade,
          entidadeId: entry.entidadeId ?? null,
          autorId: entry.autorId ?? null,
          antes: entry.antes ?? Prisma.JsonNull,
          depois: entry.depois ?? Prisma.JsonNull,
          motivo: entry.motivo ?? null,
          origem: entry.origem ?? null,
          correlacao: entry.correlacao ?? null,
        },
      });
    } catch (err) {
      this.logger.error(`Falha ao registrar auditoria de ${entry.acao}`, err as Error);
    }
  }
}
