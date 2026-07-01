-- CreateEnum
CREATE TYPE "ContratoStatus" AS ENUM ('RASCUNHO', 'ATIVO', 'CONCLUIDO', 'CANCELADO', 'EM_DISPUTA');

-- CreateEnum
CREATE TYPE "MarcoStatus" AS ENUM ('PENDENTE', 'ENTREGUE', 'APROVADO', 'PAGO');

-- CreateEnum
CREATE TYPE "PagamentoStatus" AS ENUM ('PENDENTE', 'RETIDO', 'LIBERADO', 'ESTORNADO');

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "escopo" TEXT NOT NULL,
    "valorTotal" INTEGER NOT NULL,
    "prazoDias" INTEGER,
    "status" "ContratoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "aceiteCliente" BOOLEAN NOT NULL DEFAULT false,
    "aceitePrestador" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "propostaId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "prestadorId" TEXT NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "status" "MarcoStatus" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "contratoId" TEXT NOT NULL,

    CONSTRAINT "marcos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "status" "PagamentoStatus" NOT NULL DEFAULT 'PENDENTE',
    "metodo" TEXT NOT NULL DEFAULT 'escrow_simulado',
    "referencia" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "contratoId" TEXT NOT NULL,
    "marcoId" TEXT,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contratos_propostaId_key" ON "contratos"("propostaId");

-- CreateIndex
CREATE INDEX "contratos_status_idx" ON "contratos"("status");

-- CreateIndex
CREATE INDEX "marcos_contratoId_ordem_idx" ON "marcos"("contratoId", "ordem");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_marcoId_key" ON "pagamentos"("marcoId");

-- CreateIndex
CREATE INDEX "pagamentos_contratoId_idx" ON "pagamentos"("contratoId");

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "propostas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_prestadorId_fkey" FOREIGN KEY ("prestadorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marcos" ADD CONSTRAINT "marcos_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_marcoId_fkey" FOREIGN KEY ("marcoId") REFERENCES "marcos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
