-- CreateEnum
CREATE TYPE "PapelSistema" AS ENUM ('USUARIO', 'MODERADOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "IndicacaoStatus" AS ENUM ('CADASTRADA', 'RESERVADA', 'ACEITA', 'GANHA', 'PERDIDA', 'EXPIRADA', 'EM_DISPUTA');

-- CreateEnum
CREATE TYPE "AlvoTipo" AS ENUM ('SOLICITACAO', 'PROPOSTA', 'MENSAGEM', 'INSIGHT', 'USUARIO');

-- CreateEnum
CREATE TYPE "DenunciaStatus" AS ENUM ('ABERTA', 'EM_ANALISE', 'PROCEDENTE', 'IMPROCEDENTE');

-- CreateEnum
CREATE TYPE "SancaoTipo" AS ENUM ('ADVERTENCIA', 'SUSPENSAO', 'BANIMENTO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "papelSistema" "PapelSistema" NOT NULL DEFAULT 'USUARIO';

-- CreateTable
CREATE TABLE "indicacoes" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "contatoNome" TEXT NOT NULL,
    "contatoInfo" TEXT NOT NULL,
    "consentimento" BOOLEAN NOT NULL DEFAULT false,
    "baseLegal" TEXT NOT NULL DEFAULT 'consentimento',
    "valorEstimado" INTEGER,
    "comissaoPct" DOUBLE PRECISION,
    "status" "IndicacaoStatus" NOT NULL DEFAULT 'CADASTRADA',
    "reservadoAte" TIMESTAMP(3),
    "chaveDedup" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "indicadorId" TEXT NOT NULL,
    "destinatarioId" TEXT,

    CONSTRAINT "indicacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "notaComunicacao" INTEGER NOT NULL,
    "notaQualidade" INTEGER NOT NULL,
    "notaPrazo" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT NOT NULL,
    "alvoId" TEXT NOT NULL,
    "propostaId" TEXT NOT NULL,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_votos" (
    "id" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insightId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "insight_votos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_comentarios" (
    "id" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "insightId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "insight_comentarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "denuncias" (
    "id" TEXT NOT NULL,
    "alvoTipo" "AlvoTipo" NOT NULL,
    "alvoId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "DenunciaStatus" NOT NULL DEFAULT 'ABERTA',
    "resolucao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "denuncianteId" TEXT NOT NULL,
    "resolvidoPorId" TEXT,

    CONSTRAINT "denuncias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sancoes" (
    "id" TEXT NOT NULL,
    "tipo" "SancaoTipo" NOT NULL,
    "motivo" TEXT NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "expiraEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "aplicadaPorId" TEXT NOT NULL,

    CONSTRAINT "sancoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "indicacoes_status_idx" ON "indicacoes"("status");

-- CreateIndex
CREATE INDEX "indicacoes_categoria_idx" ON "indicacoes"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "indicacoes_indicadorId_chaveDedup_key" ON "indicacoes"("indicadorId", "chaveDedup");

-- CreateIndex
CREATE INDEX "avaliacoes_alvoId_idx" ON "avaliacoes"("alvoId");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_autorId_propostaId_key" ON "avaliacoes"("autorId", "propostaId");

-- CreateIndex
CREATE INDEX "insights_categoria_idx" ON "insights"("categoria");

-- CreateIndex
CREATE UNIQUE INDEX "insight_votos_insightId_userId_key" ON "insight_votos"("insightId", "userId");

-- CreateIndex
CREATE INDEX "insight_comentarios_insightId_criadoEm_idx" ON "insight_comentarios"("insightId", "criadoEm");

-- CreateIndex
CREATE INDEX "denuncias_status_idx" ON "denuncias"("status");

-- CreateIndex
CREATE INDEX "denuncias_alvoTipo_alvoId_idx" ON "denuncias"("alvoTipo", "alvoId");

-- CreateIndex
CREATE INDEX "sancoes_usuarioId_ativa_idx" ON "sancoes"("usuarioId", "ativa");

-- AddForeignKey
ALTER TABLE "indicacoes" ADD CONSTRAINT "indicacoes_indicadorId_fkey" FOREIGN KEY ("indicadorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicacoes" ADD CONSTRAINT "indicacoes_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_alvoId_fkey" FOREIGN KEY ("alvoId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_propostaId_fkey" FOREIGN KEY ("propostaId") REFERENCES "propostas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_votos" ADD CONSTRAINT "insight_votos_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "insights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_votos" ADD CONSTRAINT "insight_votos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_comentarios" ADD CONSTRAINT "insight_comentarios_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "insights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insight_comentarios" ADD CONSTRAINT "insight_comentarios_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_denuncianteId_fkey" FOREIGN KEY ("denuncianteId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "denuncias" ADD CONSTRAINT "denuncias_resolvidoPorId_fkey" FOREIGN KEY ("resolvidoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sancoes" ADD CONSTRAINT "sancoes_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sancoes" ADD CONSTRAINT "sancoes_aplicadaPorId_fkey" FOREIGN KEY ("aplicadaPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
