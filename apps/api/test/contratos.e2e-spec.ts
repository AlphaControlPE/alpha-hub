import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/**
 * Parte XI — ciclo de vida do contrato:
 * formalizar -> assinar (2 partes) -> entregar marco -> aprovar (libera escrow) -> concluir.
 */
describe('Contratos / Negócios (e2e)', () => {
  let app: INestApplication;
  const http = () => app.getHttpServer();
  const stamp = Date.now();
  let tCliente = '';
  let tPrestador = '';
  let propostaId = '';
  let contratoId = '';
  let marco1 = '';
  let marco2 = '';

  const reg = async (s: string) => {
    const r = await request(http()).post('/api/auth/register')
      .send({ email: `${s}_${stamp}@test.dev`, senha: 'alphahub123', nome: `U ${s}` }).expect(201);
    return r.body.token as string;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    tCliente = await reg('cli');
    tPrestador = await reg('pre');

    const sol = await request(http()).post('/api/solicitacoes').set('Authorization', `Bearer ${tCliente}`)
      .send({ titulo: 'Site institucional', descricao: 'Site responsivo com 5 páginas e blog.', categoria: 'desenvolvimento' }).expect(201);
    const prop = await request(http()).post(`/api/solicitacoes/${sol.body.id}/propostas`).set('Authorization', `Bearer ${tPrestador}`)
      .send({ mensagem: 'Entrego em 4 semanas.', valor: 300000, prazoDias: 28 }).expect(201);
    propostaId = prop.body.id;
    await request(http()).post(`/api/propostas/${propostaId}/aceitar`).set('Authorization', `Bearer ${tCliente}`).expect(201);
  });

  afterAll(async () => app.close());

  it('formaliza contrato a partir da proposta aceita', async () => {
    const r = await request(http()).post('/api/contratos').set('Authorization', `Bearer ${tCliente}`)
      .send({
        propostaId, escopo: 'Site institucional completo com blog.', prazoDias: 28,
        marcos: [{ titulo: 'Layout aprovado', valor: 120000 }, { titulo: 'Site no ar', valor: 180000 }],
      }).expect(201);
    expect(r.body.status).toBe('RASCUNHO');
    expect(r.body.valorTotal).toBe(300000);
    contratoId = r.body.id;
    marco1 = r.body.marcos[0].id;
    marco2 = r.body.marcos[1].id;
  });

  it('não permite formalizar duas vezes a mesma proposta', async () => {
    await request(http()).post('/api/contratos').set('Authorization', `Bearer ${tCliente}`)
      .send({ propostaId, escopo: 'Tentativa duplicada de contrato.', marcos: [{ titulo: 'Item', valor: 1000 }] }).expect(409);
  });

  it('só fica ATIVO após as duas assinaturas', async () => {
    const a1 = await request(http()).post(`/api/contratos/${contratoId}/assinar`).set('Authorization', `Bearer ${tCliente}`).expect(201);
    expect(a1.body.status).toBe('RASCUNHO');
    expect(a1.body.aceiteCliente).toBe(true);
    const a2 = await request(http()).post(`/api/contratos/${contratoId}/assinar`).set('Authorization', `Bearer ${tPrestador}`).expect(201);
    expect(a2.body.status).toBe('ATIVO');
    // escrow simulado retido para cada marco
    expect(a2.body.pagamentos.length).toBe(2);
    expect(a2.body.pagamentos.every((p: any) => p.status === 'RETIDO')).toBe(true);
  });

  it('cliente não pode entregar marco (papel errado)', async () => {
    await request(http()).post(`/api/contratos/${contratoId}/marcos/${marco1}/entregar`).set('Authorization', `Bearer ${tCliente}`).expect(403);
  });

  it('fluxo entregar -> aprovar libera escrow e conclui ao final', async () => {
    await request(http()).post(`/api/contratos/${contratoId}/marcos/${marco1}/entregar`).set('Authorization', `Bearer ${tPrestador}`).expect(201);
    const ap1 = await request(http()).post(`/api/contratos/${contratoId}/marcos/${marco1}/aprovar`).set('Authorization', `Bearer ${tCliente}`).expect(201);
    expect(ap1.body.status).toBe('ATIVO'); // ainda falta o marco 2
    const liberado = ap1.body.pagamentos.find((p: any) => p.marcoId === marco1);
    expect(liberado.status).toBe('LIBERADO');

    await request(http()).post(`/api/contratos/${contratoId}/marcos/${marco2}/entregar`).set('Authorization', `Bearer ${tPrestador}`).expect(201);
    const ap2 = await request(http()).post(`/api/contratos/${contratoId}/marcos/${marco2}/aprovar`).set('Authorization', `Bearer ${tCliente}`).expect(201);
    expect(ap2.body.status).toBe('CONCLUIDO');
    expect(ap2.body.marcos.every((m: any) => m.status === 'PAGO')).toBe(true);
  });

  it('terceiro não acessa o contrato', async () => {
    const tOutro = await reg('out');
    await request(http()).get(`/api/contratos/${contratoId}`).set('Authorization', `Bearer ${tOutro}`).expect(403);
  });
});
