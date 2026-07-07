-- AlterEnum
ALTER TYPE "StatusAssinatura" ADD VALUE 'PENDENTE';

-- AlterTable
ALTER TABLE "assinaturas" ADD COLUMN     "pagamentoExternoId" TEXT,
ADD COLUMN     "preferenciaId" TEXT;
