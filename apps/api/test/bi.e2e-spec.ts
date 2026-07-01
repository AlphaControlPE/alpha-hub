import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/** Parte XV — BI: acesso restrito a staff e formato dos agregados. */
describe('Dados & BI (e2e)', () => {
  let app: INestApplication;
  const http = () => app.getHttpServer();
  const stamp = Date.now();
  let tComum = '';
  let tAdmin = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const u = await request(http()).post('/api/auth/register')
      .send({ email: `bi_${stamp}@test.dev`, senha: 'alphahub123', nome: 'BI User' }).expect(201);
    tComum = u.body.token;
    const adm = await request(http()).post('/api/auth/login')
      .send({ email: 'admin@alphahub.dev', senha: 'alphahub123' }).expect(201);
    tAdmin = adm.body.token;
  });

  afterAll(async () => app.close());

  it('bloqueia usuário comum no BI', async () => {
    await request(http()).get('/api/admin/bi/overview').set('Authorization', `Bearer ${tComum}`).expect(403);
  });

  it('admin vê overview com KPIs de liquidez/conversão/confiança', async () => {
    const r = await request(http()).get('/api/admin/bi/overview').set('Authorization', `Bearer ${tAdmin}`).expect(200);
    expect(r.body.liquidez).toHaveProperty('taxaComResposta');
    expect(r.body.conversao).toHaveProperty('taxaAceite');
    expect(r.body.confianca).toHaveProperty('mediaGeral');
    expect(typeof r.body.eventosAuditoria).toBe('number');
  });

  it('admin vê funil com 5 etapas e percentuais', async () => {
    const r = await request(http()).get('/api/admin/bi/funil').set('Authorization', `Bearer ${tAdmin}`).expect(200);
    expect(r.body.length).toBe(5);
    expect(r.body[0]).toHaveProperty('etapa');
    expect(r.body[0]).toHaveProperty('pct');
  });

  it('admin vê categorias e série temporal', async () => {
    const cats = await request(http()).get('/api/admin/bi/categorias').set('Authorization', `Bearer ${tAdmin}`).expect(200);
    expect(Array.isArray(cats.body)).toBe(true);
    const serie = await request(http()).get('/api/admin/bi/serie?dias=30').set('Authorization', `Bearer ${tAdmin}`).expect(200);
    expect(Array.isArray(serie.body)).toBe(true);
    if (serie.body.length) {
      expect(serie.body[0]).toHaveProperty('dia');
      expect(serie.body[0]).toHaveProperty('total');
    }
  });
});
