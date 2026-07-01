import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/** Parte XX — monetização opcional: catálogo público, assinar simulado, núcleo intacto. */
describe('Monetização (e2e)', () => {
  let app: INestApplication;
  const http = () => app.getHttpServer();
  const stamp = Date.now();
  let token = '';
  let planoPagoId = '';
  let assinaturaId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const u = await request(http()).post('/api/auth/register')
      .send({ email: `mon_${stamp}@test.dev`, senha: 'alphahub123', nome: 'Mon User' }).expect(201);
    token = u.body.token;
  });

  afterAll(async () => app.close());

  it('catálogo é público e inclui um plano gratuito', async () => {
    const r = await request(http()).get('/api/planos').expect(200);
    expect(r.body.length).toBeGreaterThanOrEqual(2);
    expect(r.body.some((p: any) => p.preco === 0)).toBe(true);
    const pago = r.body.find((p: any) => p.preco > 0);
    expect(pago).toBeDefined();
    planoPagoId = pago.id;
  });

  it('núcleo gratuito NÃO exige assinatura (publicar solicitação sem plano)', async () => {
    await request(http()).post('/api/solicitacoes').set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Preciso de um logotipo', descricao: 'Marca nova de tecnologia, estilo limpo.', categoria: 'design' })
      .expect(201);
  });

  it('assina um plano pago (pagamento simulado)', async () => {
    const r = await request(http()).post(`/api/planos/${planoPagoId}/assinar`).set('Authorization', `Bearer ${token}`).expect(201);
    expect(r.body.status).toBe('ATIVA');
    expect(r.body.metodo).toBe('simulado');
    assinaturaId = r.body.id;
  });

  it('bloqueia assinatura duplicada ativa', async () => {
    await request(http()).post(`/api/planos/${planoPagoId}/assinar`).set('Authorization', `Bearer ${token}`).expect(409);
  });

  it('lista minhas assinaturas', async () => {
    const r = await request(http()).get('/api/planos/minhas').set('Authorization', `Bearer ${token}`).expect(200);
    expect(r.body.length).toBeGreaterThanOrEqual(1);
    expect(r.body[0].plano).toBeDefined();
  });

  it('cancela a assinatura', async () => {
    const r = await request(http()).post(`/api/assinaturas/${assinaturaId}/cancelar`).set('Authorization', `Bearer ${token}`).expect(201);
    expect(r.body.status).toBe('CANCELADA');
  });

  it('exige autenticação para assinar', async () => {
    await request(http()).post(`/api/planos/${planoPagoId}/assinar`).expect(401);
  });
});
