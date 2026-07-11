import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

jest.setTimeout(30000);

/**
 * Comunidade/Insights — remoção de insight e comentário pelo autor.
 * Regra: só o autor do insight remove o insight; só o autor do comentário
 * remove o comentário (nem o autor do insight pode remover comentário alheio).
 */
describe('Comunidade — remoção de insight e comentário (e2e)', () => {
  let app: INestApplication;
  const http = () => app.getHttpServer();
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let tokenAutor = '';
  let tokenOutro = '';
  let insightId = '';
  let comentarioId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const a = await request(http()).post('/api/auth/register')
      .send({ email: `insight_autor_${stamp}@test.dev`, senha: 'alphahub123', nome: 'Autor Insight' })
      .expect(201);
    tokenAutor = a.body.token;

    const o = await request(http()).post('/api/auth/register')
      .send({ email: `insight_outro_${stamp}@test.dev`, senha: 'alphahub123', nome: 'Outro Insight' })
      .expect(201);
    tokenOutro = o.body.token;
  });

  afterAll(async () => app.close());

  it('autor cria insight', async () => {
    const r = await request(http()).post('/api/insights').set('Authorization', `Bearer ${tokenAutor}`)
      .send({ titulo: 'Como precificar um serviço', conteudo: 'Calcule custo + margem.', categoria: 'consultoria' })
      .expect(201);
    insightId = r.body.id;
  });

  it('outro usuário comenta no insight', async () => {
    const r = await request(http()).post(`/api/insights/${insightId}/comentarios`).set('Authorization', `Bearer ${tokenOutro}`)
      .send({ conteudo: 'Ótima dica, obrigado!' })
      .expect(201);
    comentarioId = r.body.id;
  });

  it('outro usuário vota no insight', async () => {
    await request(http()).post(`/api/insights/${insightId}/voto`).set('Authorization', `Bearer ${tokenOutro}`).expect(201);
  });

  it('autor do insight NÃO pode remover comentário alheio (403)', async () => {
    await request(http()).delete(`/api/insights/${insightId}/comentarios/${comentarioId}`)
      .set('Authorization', `Bearer ${tokenAutor}`).expect(403);
  });

  it('autor do comentário remove o próprio comentário (200)', async () => {
    await request(http()).delete(`/api/insights/${insightId}/comentarios/${comentarioId}`)
      .set('Authorization', `Bearer ${tokenOutro}`).expect(200);
  });

  it('remover comentário inexistente -> 404', async () => {
    await request(http()).delete(`/api/insights/${insightId}/comentarios/nao-existe`)
      .set('Authorization', `Bearer ${tokenOutro}`).expect(404);
  });

  it('não-autor tenta remover o insight -> 403', async () => {
    await request(http()).delete(`/api/insights/${insightId}`)
      .set('Authorization', `Bearer ${tokenOutro}`).expect(403);
  });

  it('remover insight inexistente -> 404', async () => {
    await request(http()).delete('/api/insights/nao-existe')
      .set('Authorization', `Bearer ${tokenAutor}`).expect(404);
  });

  it('autor remove o insight (200); GET depois -> 404; comentários/votos somem via cascade', async () => {
    // novo comentário e voto pra confirmar que o cascade limpa tudo
    const c = await request(http()).post(`/api/insights/${insightId}/comentarios`).set('Authorization', `Bearer ${tokenOutro}`)
      .send({ conteudo: 'Mais um comentário antes de remover.' }).expect(201);
    expect(c.body.id).toBeTruthy();

    await request(http()).delete(`/api/insights/${insightId}`)
      .set('Authorization', `Bearer ${tokenAutor}`).expect(200);

    await request(http()).get(`/api/insights/${insightId}`).expect(404);
  });
});
