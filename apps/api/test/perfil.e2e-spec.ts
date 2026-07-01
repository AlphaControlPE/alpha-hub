import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/**
 * Parte IV — perfis e portfólio: dono edita portfólio/serviços; perfil público
 * mostra tudo sem autenticação; remoção é restrita ao dono.
 */
describe('Perfil & Portfólio (e2e)', () => {
  let app: INestApplication;
  const http = () => app.getHttpServer();
  const stamp = Date.now();
  let token = '';
  let userId = '';
  let tokenOutro = '';
  let portfolioId = '';
  let servicoId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    const u = await request(http()).post('/api/auth/register')
      .send({ email: `perfil_${stamp}@test.dev`, senha: 'alphahub123', nome: 'Dono Perfil', bio: 'Faço sites.' })
      .expect(201);
    token = u.body.token;
    userId = u.body.usuario.id;

    const o = await request(http()).post('/api/auth/register')
      .send({ email: `outro_${stamp}@test.dev`, senha: 'alphahub123', nome: 'Outro User' })
      .expect(201);
    tokenOutro = o.body.token;
  });

  afterAll(async () => app.close());

  it('adiciona item de portfólio', async () => {
    const r = await request(http()).post('/api/perfil/portfolio').set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Site para padaria', descricao: 'Site institucional com cardápio e mapa.', link: 'https://exemplo.com/case' })
      .expect(201);
    portfolioId = r.body.id;
  });

  it('adiciona serviço ao catálogo', async () => {
    const r = await request(http()).post('/api/perfil/servicos').set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Landing page', descricao: 'Página única responsiva com formulário.', precoBase: 250000 })
      .expect(201);
    servicoId = r.body.id;
    expect(r.body.precoBase).toBe(250000);
  });

  it('perfil público mostra bio, portfólio e serviços SEM autenticação', async () => {
    const r = await request(http()).get(`/api/usuarios/${userId}/perfil`).expect(200);
    expect(r.body.nome).toBe('Dono Perfil');
    expect(r.body.bio).toBe('Faço sites.');
    expect(r.body.portfolio.length).toBe(1);
    expect(r.body.servicos.length).toBe(1);
    // não vaza dados sensíveis
    expect(r.body.email).toBeUndefined();
    expect(r.body.senhaHash).toBeUndefined();
  });

  it('meu perfil (autenticado) lista os itens para edição', async () => {
    const r = await request(http()).get('/api/perfil/me').set('Authorization', `Bearer ${token}`).expect(200);
    expect(r.body.portfolio.length).toBe(1);
    expect(r.body.servicos.length).toBe(1);
  });

  it('outro usuário NÃO remove item alheio (403)', async () => {
    await request(http()).delete(`/api/perfil/portfolio/${portfolioId}`)
      .set('Authorization', `Bearer ${tokenOutro}`).expect(403);
  });

  it('dono remove portfólio e serviço', async () => {
    await request(http()).delete(`/api/perfil/portfolio/${portfolioId}`)
      .set('Authorization', `Bearer ${token}`).expect(200);
    await request(http()).delete(`/api/perfil/servicos/${servicoId}`)
      .set('Authorization', `Bearer ${token}`).expect(200);
    const r = await request(http()).get(`/api/usuarios/${userId}/perfil`).expect(200);
    expect(r.body.portfolio.length).toBe(0);
    expect(r.body.servicos.length).toBe(0);
  });

  it('valida entrada (título curto -> 400)', async () => {
    await request(http()).post('/api/perfil/portfolio').set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'ab', descricao: 'curta demais' }).expect(400);
  });
});
