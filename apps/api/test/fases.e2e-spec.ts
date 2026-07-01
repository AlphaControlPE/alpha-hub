import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/**
 * Fases VII (indicações), IX (comunidade), X (reputação), XII (matching/busca)
 * e XIV (moderação/admin) — fluxos reais ponta-a-ponta.
 */
describe('Fases VII–XIV (e2e)', () => {
  let app: INestApplication;
  const http = () => app.getHttpServer();
  const stamp = Date.now();
  let tCliente = '';
  let tPrestador = '';
  let tAdmin = '';
  let idPrestador = '';
  let solicitacaoId = '';
  let propostaId = '';
  let insightId = '';

  const reg = async (sufixo: string) => {
    const r = await request(http())
      .post('/api/auth/register')
      .send({ email: `${sufixo}_${stamp}@test.dev`, senha: 'alphahub123', nome: `User ${sufixo}` })
      .expect(201);
    return r.body;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const cli = await reg('cli');
    tCliente = cli.token;
    const pre = await reg('pre');
    tPrestador = pre.token;
    idPrestador = pre.usuario.id;

    // admin vem do seed
    const adm = await request(http())
      .post('/api/auth/login')
      .send({ email: 'admin@alphahub.dev', senha: 'alphahub123' })
      .expect(201);
    tAdmin = adm.body.token;

    // base p/ reputação: solicitação -> proposta -> aceite
    const sol = await request(http())
      .post('/api/solicitacoes')
      .set('Authorization', `Bearer ${tCliente}`)
      .send({ titulo: 'Preciso de um app simples', descricao: 'App de lista de tarefas com login e sync.', categoria: 'desenvolvimento' })
      .expect(201);
    solicitacaoId = sol.body.id;
    const prop = await request(http())
      .post(`/api/solicitacoes/${solicitacaoId}/propostas`)
      .set('Authorization', `Bearer ${tPrestador}`)
      .send({ mensagem: 'Faço em 2 semanas com testes.', valor: 300000, prazoDias: 14 })
      .expect(201);
    propostaId = prop.body.id;
    await request(http()).post(`/api/propostas/${propostaId}/aceitar`).set('Authorization', `Bearer ${tCliente}`).expect(201);
  });

  afterAll(async () => app.close());

  // ---------- Parte VII — Indicações ----------
  it('VII: cadastra indicação com consentimento', async () => {
    const r = await request(http())
      .post('/api/indicacoes')
      .set('Authorization', `Bearer ${tPrestador}`)
      .send({
        titulo: 'Loja quer e-commerce', descricao: 'Dono quer migrar para loja virtual completa.',
        categoria: 'desenvolvimento', contatoNome: 'Cris Loja', contatoInfo: `cris_${stamp}@loja.com`,
        consentimento: true, comissaoPct: 12,
      })
      .expect(201);
    expect(r.body.status).toBe('CADASTRADA');
  });

  it('VII: recusa indicação sem consentimento (LGPD)', async () => {
    await request(http())
      .post('/api/indicacoes')
      .set('Authorization', `Bearer ${tPrestador}`)
      .send({
        titulo: 'Sem consentimento', descricao: 'Tentativa de cadastrar contato sem base legal.',
        categoria: 'marketing', contatoNome: 'Z', contatoInfo: 'z@x.com', consentimento: false,
      })
      .expect(400);
  });

  it('VII: contato fica mascarado para terceiros e some após reserva', async () => {
    const lista = await request(http()).get('/api/indicacoes').set('Authorization', `Bearer ${tCliente}`).expect(200);
    const alvo = lista.body.dados.find((i: any) => i.contatoNome === 'Cris Loja');
    expect(alvo).toBeDefined();
    expect(alvo.contatoInfo).toContain('•');
    const res = await request(http()).post(`/api/indicacoes/${alvo.id}/reservar`).set('Authorization', `Bearer ${tCliente}`).expect(201);
    expect(res.body.status).toBe('RESERVADA');
  });

  // ---------- Parte X — Reputação ----------
  it('X: cliente avalia prestador após aceite', async () => {
    const r = await request(http())
      .post('/api/avaliacoes')
      .set('Authorization', `Bearer ${tCliente}`)
      .send({ propostaId, notaComunicacao: 5, notaQualidade: 4, notaPrazo: 5, comentario: 'Muito bom' })
      .expect(201);
    expect(r.body.alvoId).toBe(idPrestador);
  });

  it('X: bloqueia avaliação duplicada', async () => {
    await request(http()).post('/api/avaliacoes').set('Authorization', `Bearer ${tCliente}`)
      .send({ propostaId, notaComunicacao: 1, notaQualidade: 1, notaPrazo: 1 }).expect(409);
  });

  it('X: reputação agregada multidimensional do prestador', async () => {
    const r = await request(http()).get(`/api/usuarios/${idPrestador}/reputacao`).expect(200);
    expect(r.body.total).toBeGreaterThanOrEqual(1);
    expect(r.body.media).toHaveProperty('comunicacao');
    expect(r.body.media).toHaveProperty('qualidade');
    expect(r.body.media).toHaveProperty('prazo');
  });

  // ---------- Parte IX — Comunidade ----------
  it('IX: cria insight, vota (toggle) e comenta', async () => {
    const ins = await request(http()).post('/api/insights').set('Authorization', `Bearer ${tPrestador}`)
      .send({ titulo: 'Dica de briefing eficiente', conteudo: 'Comece pelo problema, não pela solução desejada.', categoria: 'consultoria' })
      .expect(201);
    insightId = ins.body.id;

    const v1 = await request(http()).post(`/api/insights/${insightId}/voto`).set('Authorization', `Bearer ${tCliente}`).expect(201);
    expect(v1.body).toEqual({ votou: true, total: 1 });
    const v2 = await request(http()).post(`/api/insights/${insightId}/voto`).set('Authorization', `Bearer ${tCliente}`).expect(201);
    expect(v2.body).toEqual({ votou: false, total: 0 });

    await request(http()).post(`/api/insights/${insightId}/comentarios`).set('Authorization', `Bearer ${tCliente}`)
      .send({ conteudo: 'Concordo demais!' }).expect(201);

    const det = await request(http()).get(`/api/insights/${insightId}`).expect(200);
    expect(det.body.comentarios.length).toBe(1);
  });

  // ---------- Parte XII — Matching / Busca ----------
  it('XII: matching recomenda solicitações ao prestador', async () => {
    const r = await request(http()).get('/api/matching/solicitacoes').set('Authorization', `Bearer ${tPrestador}`).expect(200);
    expect(Array.isArray(r.body)).toBe(true);
  });

  it('XII: busca global encontra conteúdo', async () => {
    const r = await request(http()).get('/api/busca?q=app').expect(200);
    expect(r.body).toHaveProperty('solicitacoes');
    expect(r.body).toHaveProperty('insights');
  });

  // ---------- Parte XIV — Moderação / Admin ----------
  it('XIV: usuário denuncia conteúdo', async () => {
    await request(http()).post('/api/denuncias').set('Authorization', `Bearer ${tCliente}`)
      .send({ alvoTipo: 'INSIGHT', alvoId: insightId, motivo: 'spam', descricao: 'teste' }).expect(201);
  });

  it('XIV: não-admin é barrado no painel', async () => {
    await request(http()).get('/api/admin/denuncias').set('Authorization', `Bearer ${tCliente}`).expect(403);
  });

  it('XIV: admin lista, resolve denúncia e vê métricas', async () => {
    const lista = await request(http()).get('/api/admin/denuncias').set('Authorization', `Bearer ${tAdmin}`).expect(200);
    expect(lista.body.length).toBeGreaterThanOrEqual(1);
    const alvo = lista.body.find((d: any) => d.alvoId === insightId);
    await request(http()).patch(`/api/admin/denuncias/${alvo.id}`).set('Authorization', `Bearer ${tAdmin}`)
      .send({ status: 'PROCEDENTE', resolucao: 'Removido' }).expect(200);
    const m = await request(http()).get('/api/admin/metricas').set('Authorization', `Bearer ${tAdmin}`).expect(200);
    expect(m.body).toHaveProperty('usuarios');
    expect(m.body).toHaveProperty('eventosAuditoria');
  });
});
