import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/**
 * P0 — segurança: usuário com sanção ativa (banimento/suspensão) não consegue
 * logar, mesmo com a senha correta.
 */
describe('Segurança — bloqueio de login (e2e)', () => {
  let app: INestApplication;
  const http = () => app.getHttpServer();
  const stamp = Date.now();
  const email = `banido_${stamp}@test.dev`;
  let tAdmin = '';
  let userId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const u = await request(http()).post('/api/auth/register')
      .send({ email, senha: 'alphahub123', nome: 'Banido' }).expect(201);
    userId = u.body.usuario.id;
    tAdmin = (await request(http()).post('/api/auth/login')
      .send({ email: 'admin@alphahub.dev', senha: 'alphahub123' }).expect(201)).body.token;
  });

  afterAll(async () => app.close());

  it('login funciona antes da sanção', async () => {
    await request(http()).post('/api/auth/login').send({ email, senha: 'alphahub123' }).expect(201);
  });

  it('admin aplica banimento', async () => {
    await request(http()).post('/api/admin/sancoes').set('Authorization', `Bearer ${tAdmin}`)
      .send({ usuarioId: userId, tipo: 'BANIMENTO', motivo: 'teste de bloqueio' }).expect(201);
  });

  it('login é bloqueado (403) mesmo com senha correta', async () => {
    await request(http()).post('/api/auth/login').send({ email, senha: 'alphahub123' }).expect(403);
  });
});
