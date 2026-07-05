-- CreateEnum
CREATE TYPE "StatusVerificacao" AS ENUM ('NAO_SOLICITADA', 'PENDENTE', 'APROVADA', 'REJEITADA');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "descricao" TEXT,
ADD COLUMN     "verificacaoStatus" "StatusVerificacao" NOT NULL DEFAULT 'NAO_SOLICITADA';
