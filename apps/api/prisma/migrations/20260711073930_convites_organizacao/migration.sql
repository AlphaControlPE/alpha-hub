-- CreateTable
CREATE TABLE "convites_organizacao" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "papel" "PapelMembro" NOT NULL DEFAULT 'MEMBRO',
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "orgId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "usadoPorId" TEXT,

    CONSTRAINT "convites_organizacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "convites_organizacao_tokenHash_key" ON "convites_organizacao"("tokenHash");

-- CreateIndex
CREATE INDEX "convites_organizacao_orgId_idx" ON "convites_organizacao"("orgId");

-- AddForeignKey
ALTER TABLE "convites_organizacao" ADD CONSTRAINT "convites_organizacao_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convites_organizacao" ADD CONSTRAINT "convites_organizacao_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convites_organizacao" ADD CONSTRAINT "convites_organizacao_usadoPorId_fkey" FOREIGN KEY ("usadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
