import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const prisma = new PrismaClient();

const dedup = (categoria: string, contato: string) =>
  createHash('sha256').update(`${categoria.toLowerCase()}|${contato.trim().toLowerCase()}`).digest('hex').slice(0, 32);

async function main(): Promise<void> {
  const senhaHash = await bcrypt.hash('alphahub123', 10);

  const cliente = await prisma.user.upsert({
    where: { email: 'cliente@alphahub.dev' },
    update: {},
    create: {
      email: 'cliente@alphahub.dev',
      senhaHash,
      nome: 'Marina Cliente',
      bio: 'Fundadora de uma marca de café artesanal.',
      verificado: true,
    },
  });

  const prestador = await prisma.user.upsert({
    where: { email: 'prestador@alphahub.dev' },
    update: {},
    create: {
      email: 'prestador@alphahub.dev',
      senhaHash,
      nome: 'Bruno Designer',
      bio: 'Designer de marca e identidade visual.',
      verificado: true,
    },
  });

  // Admin/moderação (Parte XIV) — garante o papel mesmo em re-execução.
  const admin = await prisma.user.upsert({
    where: { email: 'admin@alphahub.dev' },
    update: { papelSistema: 'ADMIN' },
    create: {
      email: 'admin@alphahub.dev',
      senhaHash,
      nome: 'Alex Admin',
      bio: 'Equipe Alpha Hub — moderação e operação.',
      verificado: true,
      papelSistema: 'ADMIN',
    },
  });

  // ---- Marketplace (idempotente) ----
  let solicitacao = await prisma.solicitacao.findFirst({
    where: { autorId: cliente.id, titulo: 'Identidade visual para café artesanal' },
  });
  if (!solicitacao) {
    solicitacao = await prisma.solicitacao.create({
      data: {
        titulo: 'Identidade visual para café artesanal',
        descricao:
          'Quero logo, paleta de cores, tipografia e aplicação em embalagem e redes sociais. ' +
          'A marca é jovem, sustentável e fala com público urbano.',
        categoria: 'design',
        orcamento: 250000,
        autorId: cliente.id,
      },
    });
    await prisma.solicitacao.create({
      data: {
        titulo: 'Landing page para captação de leads',
        descricao:
          'Preciso de uma landing page responsiva com formulário e integração simples de e-mail.',
        categoria: 'desenvolvimento',
        orcamento: 180000,
        autorId: cliente.id,
      },
    });
  }

  let proposta = await prisma.proposta.findUnique({
    where: { solicitacaoId_autorId: { solicitacaoId: solicitacao.id, autorId: prestador.id } },
  });
  if (!proposta) {
    proposta = await prisma.proposta.create({
      data: {
        solicitacaoId: solicitacao.id,
        autorId: prestador.id,
        mensagem: 'Topo o desafio! Entrego em 3 semanas, com 2 rodadas de revisão e manual de marca.',
        valor: 220000,
        prazoDias: 21,
      },
    });
    const conversa = await prisma.conversa.create({
      data: {
        tipo: 'NEGOCIACAO',
        solicitacaoId: solicitacao.id,
        propostaId: proposta.id,
        participantes: { create: [{ userId: cliente.id }, { userId: prestador.id }] },
      },
    });
    await prisma.mensagem.createMany({
      data: [
        { conversaId: conversa.id, autorId: prestador.id, conteudo: proposta.mensagem },
        { conversaId: conversa.id, autorId: cliente.id, conteudo: 'Adorei a proposta! Pode me mostrar um portfólio parecido?' },
      ],
    });
  }

  // Aceita a proposta (idempotente) — habilita reputação.
  await prisma.proposta.update({ where: { id: proposta.id }, data: { status: 'ACEITA' } });
  await prisma.solicitacao.update({ where: { id: solicitacao.id }, data: { status: 'EM_NEGOCIACAO' } });

  // ---- Reputação (Parte X) ----
  await prisma.avaliacao.upsert({
    where: { autorId_propostaId: { autorId: cliente.id, propostaId: proposta.id } },
    update: {},
    create: {
      autorId: cliente.id,
      alvoId: prestador.id,
      propostaId: proposta.id,
      notaComunicacao: 5,
      notaQualidade: 5,
      notaPrazo: 4,
      comentario: 'Comunicação excelente e entrega dentro do combinado.',
    },
  });

  // ---- Contrato (Parte XI) — ATIVO com escrow simulado ----
  const contratoExiste = await prisma.contrato.findUnique({ where: { propostaId: proposta.id } });
  if (!contratoExiste) {
    const contrato = await prisma.contrato.create({
      data: {
        propostaId: proposta.id,
        clienteId: cliente.id,
        prestadorId: prestador.id,
        escopo: 'Identidade visual completa: logo, paleta, tipografia e manual de marca.',
        valorTotal: 220000,
        prazoDias: 21,
        status: 'ATIVO',
        aceiteCliente: true,
        aceitePrestador: true,
        marcos: {
          create: [
            { titulo: 'Conceito e direção de marca', valor: 80000, ordem: 0, status: 'PENDENTE' },
            { titulo: 'Entrega final e manual', valor: 140000, ordem: 1, status: 'PENDENTE' },
          ],
        },
      },
      include: { marcos: { orderBy: { ordem: 'asc' } } },
    });
    // Escrow simulado retido para cada marco.
    for (const m of contrato.marcos) {
      await prisma.pagamento.create({
        data: { contratoId: contrato.id, marcoId: m.id, valor: m.valor, status: 'RETIDO', referencia: `escrow_sim_${m.id.slice(0, 8)}` },
      });
    }
  }

  // ---- Indicações (Parte VII) ----
  const chave = dedup('desenvolvimento', 'joao@bistro.com');
  const indExiste = await prisma.indicacao.findUnique({
    where: { indicadorId_chaveDedup: { indicadorId: prestador.id, chaveDedup: chave } },
  });
  if (!indExiste) {
    await prisma.indicacao.create({
      data: {
        titulo: 'Restaurante quer cardápio digital com QR',
        descricao: 'Dono do bistrô pediu indicação de quem faça cardápio digital responsivo com QR.',
        categoria: 'desenvolvimento',
        contatoNome: 'João do Bistrô',
        contatoInfo: 'joao@bistro.com',
        consentimento: true,
        valorEstimado: 500000,
        comissaoPct: 10,
        chaveDedup: chave,
        indicadorId: prestador.id,
      },
    });
  }

  // ---- Comunidade / Insights (Parte IX) ----
  const insExiste = await prisma.insight.findFirst({
    where: { autorId: prestador.id, titulo: 'Como precificar identidade visual sem se desvalorizar' },
  });
  if (!insExiste) {
    const insight = await prisma.insight.create({
      data: {
        titulo: 'Como precificar identidade visual sem se desvalorizar',
        conteudo:
          'Considere escopo, número de rodadas de revisão, direitos de uso, prazo e o valor que a marca gera. ' +
          'Cobrar por entregável e não por hora costuma alinhar melhor as expectativas.',
        categoria: 'design',
        autorId: prestador.id,
      },
    });
    await prisma.insightVoto.create({ data: { insightId: insight.id, userId: cliente.id } });
    await prisma.insightComentario.create({
      data: { insightId: insight.id, autorId: cliente.id, conteudo: 'Ótimo ponto sobre direitos de uso!' },
    });
  }

  // ---- Monetização (Parte XX) — catálogo de planos opcionais ----
  const planos: {
    codigo: string; nome: string; descricao: string; preco: number;
    periodicidade: 'UNICO' | 'MENSAL'; tipo: 'ASSINATURA' | 'SERVICO' | 'PATROCINIO';
    recursos: string[]; destaque?: boolean; ordem: number;
  }[] = [
    {
      codigo: 'comunidade', nome: 'Comunidade', descricao: 'O núcleo — sempre gratuito.',
      preco: 0, periodicidade: 'MENSAL', tipo: 'ASSINATURA', ordem: 0,
      recursos: ['Publicar solicitações', 'Enviar propostas', 'Chat e negociação', 'Indicações e comunidade'],
    },
    {
      codigo: 'verificado_pro', nome: 'Verificado Pro', descricao: 'Selo de identidade verificada e destaque no perfil.',
      preco: 2990, periodicidade: 'MENSAL', tipo: 'SERVICO', destaque: true, ordem: 1,
      recursos: ['selo_verificado', 'Selo de identidade verificada', 'Destaque no perfil', 'Suporte prioritário'],
    },
    {
      codigo: 'empresarial', nome: 'Empresarial', descricao: 'Recursos para organizações e equipes.',
      preco: 9990, periodicidade: 'MENSAL', tipo: 'ASSINATURA', ordem: 2,
      recursos: ['Equipe e organização', 'Verificação de empresa', 'Relatórios e BI', 'Integrações e API', 'Suporte dedicado'],
    },
    {
      codigo: 'patrocinio', nome: 'Patrocínio rotulado', descricao: 'Destaque claramente identificado como patrocínio.',
      preco: 19990, periodicidade: 'UNICO', tipo: 'PATROCINIO', ordem: 3,
      recursos: ['Destaque claramente identificado', 'Alcance ampliado por período'],
    },
  ];
  for (const p of planos) {
    await prisma.plano.upsert({
      where: { codigo: p.codigo },
      update: { nome: p.nome, descricao: p.descricao, preco: p.preco, recursos: p.recursos, destaque: p.destaque ?? false, ordem: p.ordem },
      create: { ...p, destaque: p.destaque ?? false },
    });
  }

  console.log('Seed concluído:');
  console.log('  cliente@alphahub.dev   / alphahub123  (cliente)');
  console.log('  prestador@alphahub.dev / alphahub123  (prestador)');
  console.log('  admin@alphahub.dev     / alphahub123  (ADMIN/moderação)');
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
