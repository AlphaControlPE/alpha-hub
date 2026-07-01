import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/** Parte XIII — notificações: disparo por evento, contador, leitura e preferências. */
describe('Notificações (e2e)', () => {
  let app: INestApplication;
  const http = () => app.getHttpServer();
  const stamp = Date.now();
  let tCliente = '';
  let tPrestador = '';
  let propostaId = '';

  const reg = async (s: string) => {
    const r = await request(http()).post('/api/auth/register')
      .send({ email: `${s}_${stamp}@test.dev`, senha: 'alphahub123', nome: `U ${s}` }).expect(201);
    return r.body.token as string;
  };
  const contador = async (tok: string) =>
    (await request(http()).get('/api/notificacoes/contador').set('Authorization', `Bearer ${tok}`).expect(200)).body.total as number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    tCliente = await reg('cli');
    tPrestador = await reg('pre');
  });

  afterAll(async () => app.close());

  it('proposta recebida gera notificação ao cliente', async () => {
    const sol = await request(http()).post('/api/solicitacoes').set('Authorization', `Bearer ${tCliente}`)
      .send({ titulo: 'App de delivery', descricao: 'App simples de pedidos com pagamento.', categoria: 'desenvolvimento' }).expect(201);
    const prop = await request(http()).post(`/api/solicitacoes/${sol.body.id}/propostas`).set('Authorization', `Bearer ${tPrestador}`)
      .send({ mensagem: 'Posso fazer em 3 semanas.', valor: 250000 }).expect(201);
    propostaId = prop.body.id;

    expect(await contador(tCliente)).toBeGreaterThanOrEqual(1);
    const lista = await request(http()).get('/api/notificacoes').set('Authorization', `Bearer ${tCliente}`).expect(200);
    expect(lista.body.some((n: any) => n.tipo === 'proposta.recebida')).toBe(true);
  });

  it('proposta aceita notifica o prestador', async () => {
    await request(http()).post(`/api/propostas/${propostaId}/aceitar`).set('Authorization', `Bearer ${tCliente}`).expect(201);
    expect(await contador(tPrestador)).toBeGreaterThanOrEqual(1);
    const lista = await request(http()).get('/api/notificacoes').set('Authorization', `Bearer ${tPrestador}`).expect(200);
    expect(lista.body.some((n: any) => n.tipo === 'proposta.aceita')).toBe(true);
  });

  it('marcar todas como lidas zera o contador', async () => {
    await request(http()).patch('/api/notificacoes/lidas').set('Authorization', `Bearer ${tCliente}`).expect(200);
    expect(await contador(tCliente)).toBe(0);
  });

  it('preferência desligada interrompe novas notificações da categoria', async () => {
    // cliente desliga notificações de "proposta"
    const p = await request(http()).patch('/api/notificacoes/preferencias').set('Authorization', `Bearer ${tCliente}`)
      .send({ proposta: false }).expect(200);
    expect(p.body.proposta).toBe(false);

    const antes = await contador(tCliente);
    const sol2 = await request(http()).post('/api/solicitacoes').set('Authorization', `Bearer ${tCliente}`)
      .send({ titulo: 'Outra demanda', descricao: 'Mais uma solicitação para testar preferências.', categoria: 'design' }).expect(201);
    const pre2 = await reg('pre2');
    await request(http()).post(`/api/solicitacoes/${sol2.body.id}/propostas`).set('Authorization', `Bearer ${pre2}`)
      .send({ mensagem: 'Proposta de teste de preferência.', valor: 100000 }).expect(201);

    expect(await contador(tCliente)).toBe(antes); // nenhuma nova notificação de proposta
  });
});
