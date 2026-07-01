import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/**
 * Fatia vertical ponta-a-ponta:
 * registrar cliente + prestador → criar solicitação → enviar proposta →
 * conversar no chat → aceitar proposta. Exatamente o núcleo do MVP.
 */
describe('Fluxo Alpha Hub (e2e)', () => {
  let app: INestApplication;
  const stamp = Date.now();
  const clienteEmail = `cliente_${stamp}@test.dev`;
  const prestadorEmail = `prestador_${stamp}@test.dev`;
  let tokenCliente = '';
  let tokenPrestador = '';
  let solicitacaoId = '';
  let propostaId = '';
  let conversaId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra o cliente', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: clienteEmail, senha: 'alphahub123', nome: 'Cliente Teste' })
      .expect(201);
    expect(res.body.token).toBeDefined();
    tokenCliente = res.body.token;
  });

  it('registra o prestador', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: prestadorEmail, senha: 'alphahub123', nome: 'Prestador Teste' })
      .expect(201);
    tokenPrestador = res.body.token;
  });

  it('recusa senha curta (validação)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: `x_${stamp}@test.dev`, senha: '123', nome: 'X' })
      .expect(400);
  });

  it('cliente publica uma solicitação', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/solicitacoes')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({
        titulo: 'Preciso de uma logo para minha startup',
        descricao: 'Marca de tecnologia, estilo moderno e minimalista, com manual básico.',
        categoria: 'design',
        orcamento: 200000,
      })
      .expect(201);
    expect(res.body.status).toBe('ABERTA');
    solicitacaoId = res.body.id;
  });

  it('lista solicitações sem autenticação (núcleo gratuito)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/solicitacoes?categoria=design')
      .expect(200);
    expect(Array.isArray(res.body.dados)).toBe(true);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
  });

  it('impede o autor de propor à própria solicitação', async () => {
    await request(app.getHttpServer())
      .post(`/api/solicitacoes/${solicitacaoId}/propostas`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ mensagem: 'Proposta inválida do próprio autor' })
      .expect(400);
  });

  it('prestador envia proposta e abre sala de negociação', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/solicitacoes/${solicitacaoId}/propostas`)
      .set('Authorization', `Bearer ${tokenPrestador}`)
      .send({ mensagem: 'Entrego em 2 semanas com 2 revisões.', valor: 180000, prazoDias: 14 })
      .expect(201);
    expect(res.body.status).toBe('ENVIADA');
    propostaId = res.body.id;
    conversaId = res.body.conversaId;
    expect(conversaId).toBeDefined();
  });

  it('cliente vê a proposta recebida', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/solicitacoes/${solicitacaoId}/propostas`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .expect(200);
    expect(res.body.length).toBe(1);
  });

  it('troca de mensagens no chat da negociação', async () => {
    await request(app.getHttpServer())
      .post(`/api/conversas/${conversaId}/mensagens`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ conteudo: 'Fechado, vamos seguir!' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/conversas/${conversaId}/mensagens`)
      .set('Authorization', `Bearer ${tokenPrestador}`)
      .expect(200);
    // proposta inicial + mensagem do cliente
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('bloqueia quem não participa da conversa', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: `intruso_${stamp}@test.dev`, senha: 'alphahub123', nome: 'Intruso' });
    await request(app.getHttpServer())
      .get(`/api/conversas/${conversaId}/mensagens`)
      .set('Authorization', `Bearer ${res.body.token}`)
      .expect(403);
  });

  it('cliente aceita a proposta', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/propostas/${propostaId}/aceitar`)
      .set('Authorization', `Bearer ${tokenCliente}`)
      .expect(201);
    expect(res.body.status).toBe('ACEITA');
  });

  it('prestador não pode aceitar a própria proposta', async () => {
    await request(app.getHttpServer())
      .post(`/api/propostas/${propostaId}/aceitar`)
      .set('Authorization', `Bearer ${tokenPrestador}`)
      .expect(403);
  });
});
