import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MercadoPagoService } from '../src/common/pagamentos/mercadopago.service';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

/**
 * Pagamento real de planos via Mercado Pago (Checkout Pro) — gated por
 * MP_ACCESS_TOKEN, com MP simulado em memória (NODE_ENV=test).
 */
describe('Pagamentos — Mercado Pago (e2e)', () => {
  let app: INestApplication;
  const http = () => app.getHttpServer();
  const stamp = Date.now();
  const email = `pagador_${stamp}@test.dev`;
  let token = '';
  let planoPago: { id: string; nome: string; preco: number } | null = null;
  let planoGratis: { id: string } | null = null;
  let assinaturaId = '';

  beforeAll(async () => {
    delete process.env.MP_ACCESS_TOKEN;
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    token = (await request(http()).post('/api/auth/register')
      .send({ email, senha: 'senha-pagamentos-1', nome: 'Pagadora' }).expect(201)).body.token;

    const catalogo = (await request(http()).get('/api/planos').expect(200)).body as
      { id: string; nome: string; preco: number }[];
    planoPago = catalogo.find((p) => p.preco > 0) ?? null;
    planoGratis = catalogo.find((p) => p.preco === 0) ?? null;
    expect(planoPago).not.toBeNull();
  });

  afterAll(async () => {
    // Não vazar o gate para os outros specs (mesmo processo com --runInBand).
    delete process.env.MP_ACCESS_TOKEN;
    await app.close();
  });

  it('sem MP_ACCESS_TOKEN: pagamentoReal=false e checkout responde 503', async () => {
    const rec = await request(http()).get('/api/planos/recursos').expect(200);
    expect(rec.body.pagamentoReal).toBe(false);
    await request(http()).post(`/api/planos/${planoPago!.id}/checkout`)
      .set('Authorization', `Bearer ${token}`).expect(503);
  });

  it('sem MP: assinatura simulada de plano pago segue funcionando (modo demo)', async () => {
    const r = await request(http()).post(`/api/planos/${planoPago!.id}/assinar`)
      .set('Authorization', `Bearer ${token}`).expect(201);
    // desfaz para não conflitar com o checkout real adiante
    await request(http()).post(`/api/assinaturas/${r.body.id}/cancelar`)
      .set('Authorization', `Bearer ${token}`).expect(201);
  });

  it('com MP: pagamentoReal=true e o caminho simulado é BLOQUEADO p/ plano pago', async () => {
    process.env.MP_ACCESS_TOKEN = 'TEST-token-e2e';
    const rec = await request(http()).get('/api/planos/recursos').expect(200);
    expect(rec.body.pagamentoReal).toBe(true);
    await request(http()).post(`/api/planos/${planoPago!.id}/assinar`)
      .set('Authorization', `Bearer ${token}`).expect(400);
  });

  it('checkout de plano gratuito: 400 (não precisa de pagamento)', async () => {
    if (!planoGratis) return;
    await request(http()).post(`/api/planos/${planoGratis.id}/checkout`)
      .set('Authorization', `Bearer ${token}`).expect(400);
  });

  it('checkout de plano pago: cria assinatura PENDENTE e devolve URL', async () => {
    MercadoPagoService.ultimaPreferenciaTeste = null;
    const r = await request(http()).post(`/api/planos/${planoPago!.id}/checkout`)
      .set('Authorization', `Bearer ${token}`).expect(201);
    expect(r.body.url).toBeTruthy();
    assinaturaId = r.body.assinaturaId;

    const minhas = (await request(http()).get('/api/planos/minhas')
      .set('Authorization', `Bearer ${token}`).expect(200)).body as
      { id: string; status: string; metodo: string }[];
    const pendente = minhas.find((a) => a.id === assinaturaId);
    expect(pendente?.status).toBe('PENDENTE');
    expect(pendente?.metodo).toBe('mercadopago');

    expect(MercadoPagoService.ultimaPreferenciaTeste).not.toBeNull();
    const pref = MercadoPagoService.ultimaPreferenciaTeste!;
    expect(pref.external_reference).toBe(assinaturaId);
    const item = (pref.items as { unit_price: number }[])[0];
    expect(item.unit_price).toBeCloseTo(planoPago!.preco / 100, 2);
  });

  it('webhook com valor divergente NÃO ativa a assinatura', async () => {
    MercadoPagoService.pagamentosTeste.set('pag_barato', {
      id: 'pag_barato', status: 'approved',
      external_reference: assinaturaId, transaction_amount: 0.01,
    });
    const r = await request(http()).post('/api/webhooks/mercadopago')
      .send({ type: 'payment', data: { id: 'pag_barato' } }).expect(201);
    expect(r.body.acao).toBe('valor_divergente');

    const minhas = (await request(http()).get('/api/planos/minhas')
      .set('Authorization', `Bearer ${token}`).expect(200)).body as { id: string; status: string }[];
    expect(minhas.find((a) => a.id === assinaturaId)?.status).toBe('PENDENTE');
  });

  it('webhook aprovado com valor correto ATIVA a assinatura', async () => {
    MercadoPagoService.pagamentosTeste.set('pag_ok', {
      id: 'pag_ok', status: 'approved',
      external_reference: assinaturaId, transaction_amount: planoPago!.preco / 100,
    });
    const r = await request(http()).post('/api/webhooks/mercadopago')
      .send({ type: 'payment', data: { id: 'pag_ok' } }).expect(201);
    expect(r.body.acao).toBe('ativada');

    const minhas = (await request(http()).get('/api/planos/minhas')
      .set('Authorization', `Bearer ${token}`).expect(200)).body as { id: string; status: string }[];
    expect(minhas.find((a) => a.id === assinaturaId)?.status).toBe('ATIVA');
  });

  it('webhook repetido é idempotente (não duplica nada)', async () => {
    const r = await request(http()).post('/api/webhooks/mercadopago')
      .send({ type: 'payment', data: { id: 'pag_ok' } }).expect(201);
    expect(r.body.acao).toBe('ja_processado');
  });

  it('webhook de pagamento desconhecido: 2xx sem ação (MP não fica reenviando)', async () => {
    const r = await request(http()).post('/api/webhooks/mercadopago')
      .send({ type: 'payment', data: { id: 'nao_existe_123' } }).expect(201);
    expect(r.body.acao).toBe('sem_acao');
  });

  it('checkout com assinatura já ATIVA do plano: 409', async () => {
    await request(http()).post(`/api/planos/${planoPago!.id}/checkout`)
      .set('Authorization', `Bearer ${token}`).expect(409);
  });
});
