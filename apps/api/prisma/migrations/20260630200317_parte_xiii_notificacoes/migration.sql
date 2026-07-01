-- CreateTable
CREATE TABLE "notificacoes" (
    "id" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "corpo" TEXT NOT NULL,
    "link" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "entidade" TEXT,
    "entidadeId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacao_preferencias" (
    "id" TEXT NOT NULL,
    "proposta" BOOLEAN NOT NULL DEFAULT true,
    "mensagem" BOOLEAN NOT NULL DEFAULT true,
    "contrato" BOOLEAN NOT NULL DEFAULT true,
    "indicacao" BOOLEAN NOT NULL DEFAULT true,
    "comunidade" BOOLEAN NOT NULL DEFAULT true,
    "moderacao" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notificacao_preferencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notificacoes_userId_lida_criadoEm_idx" ON "notificacoes"("userId", "lida", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "notificacao_preferencias_userId_key" ON "notificacao_preferencias"("userId");

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacao_preferencias" ADD CONSTRAINT "notificacao_preferencias_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
