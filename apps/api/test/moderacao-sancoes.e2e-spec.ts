import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/**
 * Moderação — listar e revogar sanções (follow-up de "aplicar sanção"):
 * staff lista (MODERADOR/ADMIN), só ADMIN revoga. Espelha o padrão de
 * listar/revogar convites de organização (e2e: organizacoes.e2e-spec.ts).
 */
describe('Moderação — sanções (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => app.getHttpServer();
  // stamp único mesmo com outros processos de teste rodando em paralelo no mesmo Postgres.
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let tAdmin = '';
  let tModerador = '';
  let tAlvo = '';
  let alvoId = '';
  let sancaoId = '';

  const reg = async (s: string) => {
    const r = await request(http()).post('/api/auth/register')
      .send({ email: `${s}_${stamp}@test.dev`, senha: 'alphahub123', nome: `U ${s}` }).expect(201);
    return r.body;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    prisma = app.get(PrismaService);

    tAdmin = (await request(http()).post('/api/auth/login')
      .send({ email: 'admin@alphahub.dev', senha: 'alphahub123' }).expect(201)).body.token;

    const moderador = await reg('moderador');
    await prisma.user.update({ where: { id: moderador.usuario.id }, data: { papelSistema: 'MODERADOR' } });
    tModerador = moderador.token;

    const alvo = await reg('alvo');
    tAlvo = alvo.token;
    alvoId = alvo.usuario.id;
  }, 30000); // compilação do AppModule + Nest em ts-jest é lenta na primeira execução

  afterAll(async () => app.close());

  it('ADMIN aplica sanção a um usuário', async () => {
    const r = await request(http()).post('/api/admin/sancoes').set('Authorization', `Bearer ${tAdmin}`)
      .send({ usuarioId: alvoId, tipo: 'ADVERTENCIA', motivo: 'Conteúdo impróprio reincidente' }).expect(201);
    expect(r.body.ativa).toBe(true);
    expect(r.body.usuarioId).toBe(alvoId);
    sancaoId = r.body.id;
  });

  it('não-staff é barrado ao listar sanções (403)', async () => {
    await request(http()).get('/api/admin/sancoes').set('Authorization', `Bearer ${tAlvo}`).expect(403);
  });

  it('MODERADOR lista sanções, mas não consegue revogar (403)', async () => {
    const lista = await request(http()).get('/api/admin/sancoes').set('Authorization', `Bearer ${tModerador}`).expect(200);
    expect(Array.isArray(lista.body)).toBe(true);
    expect(lista.body.some((s: any) => s.id === sancaoId)).toBe(true);

    await request(http()).patch(`/api/admin/sancoes/${sancaoId}/desativar`)
      .set('Authorization', `Bearer ${tModerador}`).send({}).expect(403);
  });

  it('filtra listagem por usuarioId', async () => {
    const r = await request(http()).get(`/api/admin/sancoes?usuarioId=${alvoId}`)
      .set('Authorization', `Bearer ${tAdmin}`).expect(200);
    expect(r.body.every((s: any) => s.usuarioId === alvoId)).toBe(true);
    expect(r.body.length).toBeGreaterThan(0);
  });

  it('revogar sanção inexistente -> 404', async () => {
    await request(http()).patch('/api/admin/sancoes/naoexiste/desativar')
      .set('Authorization', `Bearer ${tAdmin}`).send({}).expect(404);
  });

  it('ADMIN revoga a sanção -> ativa=false', async () => {
    const r = await request(http()).patch(`/api/admin/sancoes/${sancaoId}/desativar`)
      .set('Authorization', `Bearer ${tAdmin}`).send({ motivo: 'Período cumprido' }).expect(200);
    expect(r.body.ativa).toBe(false);
  });

  it('revogar sanção já revogada -> 409 (idempotência tratada como conflito, como o resto do módulo)', async () => {
    await request(http()).patch(`/api/admin/sancoes/${sancaoId}/desativar`)
      .set('Authorization', `Bearer ${tAdmin}`).send({}).expect(409);
  });
});
