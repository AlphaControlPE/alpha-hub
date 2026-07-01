-- CreateTable
CREATE TABLE "portfolio_itens" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "imagemUrl" TEXT,
    "link" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "portfolio_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos_oferecidos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "precoBase" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "servicos_oferecidos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portfolio_itens_userId_idx" ON "portfolio_itens"("userId");

-- CreateIndex
CREATE INDEX "servicos_oferecidos_userId_idx" ON "servicos_oferecidos"("userId");

-- AddForeignKey
ALTER TABLE "portfolio_itens" ADD CONSTRAINT "portfolio_itens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos_oferecidos" ADD CONSTRAINT "servicos_oferecidos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
