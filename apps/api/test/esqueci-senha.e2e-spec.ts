import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { EmailService } from '../src/common/email/email.service';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/**
 * "Esqueci a senha" — fluxo completo com e-mail simulado (NODE_ENV=test),
 * anti-enumeração, gate por RESEND_API_KEY e validade/uso único do token.
 */
describe('Esqueci a senha (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const http = () => app.getHttpServer();
  const stamp = Date.now();
  const email = `esqueci_${stamp}@test.dev`;
  const senhaOriginal = 'senha-original-123';
  const senhaNova = 'senha-nova-456';
  let userId = '';
  let token = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    prisma = app.get(PrismaService);

    const u = await request(http()).post('/api/auth/register')
      .send({ email, senha: senhaOriginal, nome: 'Esquecida' }).expect(201);
    userId = u.body.usuario.id;
  });

  afterAll(async () => app.close());

  it('sem RESEND_API_KEY: recurso desligado e /auth/esqueci responde 503 (sem fachada)', async () => {
    delete process.env.RESEND_API_KEY;
    const rec = await request(http()).get('/api/auth/recursos').expect(200);
    expect(rec.body.esqueciSenha).toBe(false);
    await request(http()).post('/api/auth/esqueci').send({ email }).expect(503);
  });

  it('com RESEND_API_KEY: recurso ligado', async () => {
    process.env.RESEND_API_KEY = 're_teste_e2e';
    const rec = await request(http()).get('/api/auth/recursos').expect(200);
    expect(rec.body.esqueciSenha).toBe(true);
  });

  it('e-mail desconhecido: resposta genérica (não revela existência) e nada é enviado', async () => {
    EmailService.ultimoEmailTeste = null;
    const r = await request(http()).post('/api/auth/esqueci')
      .send({ email: `nao_existe_${stamp}@test.dev` }).expect(201);
    expect(r.body.mensagem).toMatch(/Se este e-mail/);
    expect(EmailService.ultimoEmailTeste).toBeNull();
  });

  it('e-mail cadastrado: mesma resposta genérica + e-mail com link de redefinição', async () => {
    EmailService.ultimoEmailTeste = null;
    const r = await request(http()).post('/api/auth/esqueci').send({ email }).expect(201);
    expect(r.body.mensagem).toMatch(/Se este e-mail/);
    const enviado = EmailService.ultimoEmailTeste as { para: string; html: string } | null;
    expect(enviado).not.toBeNull();
    expect(enviado!.para).toBe(email);
    const m = enviado!.html.match(/token=([a-f0-9]{64})/);
    expect(m).not.toBeNull();
    token = m![1];
  });

  it('token de lixo: 400', async () => {
    await request(http()).post('/api/auth/redefinir')
      .send({ token: 'a'.repeat(64), senha: senhaNova }).expect(400);
  });

  it('senha curta: 400 (validação)', async () => {
    await request(http()).post('/api/auth/redefinir')
      .send({ token, senha: 'curta' }).expect(400);
  });

  it('token válido redefine a senha', async () => {
    const r = await request(http()).post('/api/auth/redefinir')
      .send({ token, senha: senhaNova }).expect(201);
    expect(r.body.mensagem).toMatch(/sucesso/);
  });

  it('login funciona com a senha NOVA e falha com a antiga', async () => {
    await request(http()).post('/api/auth/login').send({ email, senha: senhaNova }).expect(201);
    await request(http()).post('/api/auth/login').send({ email, senha: senhaOriginal }).expect(401);
  });

  it('token é de uso único: reutilizar dá 400', async () => {
    await request(http()).post('/api/auth/redefinir')
      .send({ token, senha: 'outra-senha-789' }).expect(400);
  });

  it('token expirado: 400', async () => {
    // Cria token já vencido direto no banco (hash de valor conhecido,
    // aleatório por execução para não colidir com runs anteriores).
    const { createHash, randomBytes } = await import('crypto');
    const cru = randomBytes(32).toString('hex');
    await prisma.tokenRedefinicaoSenha.create({
      data: {
        userId,
        tokenHash: createHash('sha256').update(cru).digest('hex'),
        expiraEm: new Date(Date.now() - 1000),
      },
    });
    await request(http()).post('/api/auth/redefinir')
      .send({ token: cru, senha: senhaNova }).expect(400);
  });
});
