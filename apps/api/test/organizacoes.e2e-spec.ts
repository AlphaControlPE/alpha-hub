import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

// Gera um CNPJ com dígitos verificadores válidos a partir de uma base de 12
// dígitos — assim cada execução usa um CNPJ único E válido (respeita o @unique).
function cnpjValidoDe(base12: string): string {
  const dig = (base: string): number => {
    let pos = base.length - 7;
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * pos;
      pos = pos - 1 < 2 ? 9 : pos - 1;
    }
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dig(base12);
  const d2 = dig(base12 + d1);
  return `${base12}${d1}${d2}`;
}

/**
 * Parte III — organizações, equipes e verificação:
 * criador vira DONO; adicionar membro por e-mail; papéis; pedir verificação
 * (PENDENTE) e staff aprova (verificado=true); não-staff barrado no painel.
 */
describe('Organizações & verificação (e2e)', () => {
  let app: INestApplication;
  const http = () => app.getHttpServer();
  const stamp = Date.now();
  let tDono = '';
  let tMembro = '';
  let membroId = '';
  let tAdmin = '';
  let orgId = '';
  let conviteToken = '';

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

    tDono = (await reg('dono')).token;
    const m = await reg('membro');
    tMembro = m.token;
    membroId = m.usuario.id;
    tAdmin = (await request(http()).post('/api/auth/login')
      .send({ email: 'admin@alphahub.dev', senha: 'alphahub123' }).expect(201)).body.token;
  });

  afterAll(async () => app.close());

  it('cria organização (criador vira DONO)', async () => {
    const r = await request(http()).post('/api/organizacoes').set('Authorization', `Bearer ${tDono}`)
      .send({ nome: 'Estúdio Alpha', descricao: 'Design e tecnologia.' }).expect(201);
    expect(r.body.meuPapel).toBe('DONO');
    orgId = r.body.id;
  });

  it('adiciona membro por e-mail', async () => {
    const r = await request(http()).post(`/api/organizacoes/${orgId}/membros`).set('Authorization', `Bearer ${tDono}`)
      .send({ email: `membro_${stamp}@test.dev` }).expect(201);
    expect(r.body.papel).toBe('MEMBRO');
  });

  it('membro comum NÃO adiciona outro membro (403)', async () => {
    const outro = await reg('outro');
    await request(http()).post(`/api/organizacoes/${orgId}/membros`).set('Authorization', `Bearer ${tMembro}`)
      .send({ email: outro.usuario.email }).expect(403);
  });

  it('não adiciona e-mail inexistente (404) e nem duplicado (409)', async () => {
    await request(http()).post(`/api/organizacoes/${orgId}/membros`).set('Authorization', `Bearer ${tDono}`)
      .send({ email: `naoexiste_${stamp}@x.com` }).expect(404);
    await request(http()).post(`/api/organizacoes/${orgId}/membros`).set('Authorization', `Bearer ${tDono}`)
      .send({ email: `membro_${stamp}@test.dev` }).expect(409);
  });

  it('detalhe só para membro; membro vê a org', async () => {
    await request(http()).get(`/api/organizacoes/${orgId}`).set('Authorization', `Bearer ${tMembro}`).expect(200);
    const estranho = await reg('estranho');
    await request(http()).get(`/api/organizacoes/${orgId}`).set('Authorization', `Bearer ${estranho.token}`).expect(403);
  });

  it('rejeita pedido sem CNPJ (400) e CNPJ inválido (400)', async () => {
    await request(http()).post(`/api/organizacoes/${orgId}/verificacao`).set('Authorization', `Bearer ${tDono}`)
      .send({}).expect(400); // sem CNPJ
    // formato certo, dígitos verificadores errados (válido seria -81)
    await request(http()).post(`/api/organizacoes/${orgId}/verificacao`).set('Authorization', `Bearer ${tDono}`)
      .send({ documento: '11.222.333/0001-80' }).expect(400);
  });

  it('pede verificação com CNPJ válido (PENDENTE) e normaliza o formato', async () => {
    const cnpj = cnpjValidoDe(String(stamp).padStart(12, '3').slice(-12)); // 14 dígitos, sem máscara
    const r = await request(http()).post(`/api/organizacoes/${orgId}/verificacao`).set('Authorization', `Bearer ${tDono}`)
      .send({ documento: cnpj }).expect(201);
    expect(r.body.verificacaoStatus).toBe('PENDENTE');
    // service normaliza para o padrão "00.000.000/0000-00"
    expect(r.body.documento).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
  });

  it('não-staff é barrado no painel de verificações (403)', async () => {
    await request(http()).get('/api/admin/verificacoes').set('Authorization', `Bearer ${tDono}`).expect(403);
  });

  it('staff aprova verificação -> organização verificada', async () => {
    const lista = await request(http()).get('/api/admin/verificacoes').set('Authorization', `Bearer ${tAdmin}`).expect(200);
    expect(lista.body.some((o: any) => o.id === orgId)).toBe(true);
    const r = await request(http()).patch(`/api/admin/verificacoes/${orgId}`).set('Authorization', `Bearer ${tAdmin}`)
      .send({ decisao: 'APROVADA' }).expect(200);
    expect(r.body.verificado).toBe(true);
    expect(r.body.verificacaoStatus).toBe('APROVADA');
  });

  it('gestor gera convite por link; não-gestor é barrado (403)', async () => {
    await request(http()).post(`/api/organizacoes/${orgId}/convites`).set('Authorization', `Bearer ${tMembro}`)
      .send({}).expect(403);
    const r = await request(http()).post(`/api/organizacoes/${orgId}/convites`).set('Authorization', `Bearer ${tDono}`)
      .send({ papel: 'ADMIN', expiraDias: 3 }).expect(201);
    expect(typeof r.body.token).toBe('string');
    expect(r.body.papel).toBe('ADMIN');
    conviteToken = r.body.token;
  });

  it('token inválido -> 404 (preview e aceite)', async () => {
    await request(http()).get('/api/organizacoes/convite/naoexiste').set('Authorization', `Bearer ${tMembro}`).expect(404);
    await request(http()).post('/api/organizacoes/convite/naoexiste/aceitar').set('Authorization', `Bearer ${tMembro}`).expect(404);
  });

  it('preview mostra a org e o papel do convite', async () => {
    const r = await request(http()).get(`/api/organizacoes/convite/${conviteToken}`).set('Authorization', `Bearer ${tMembro}`).expect(200);
    expect(r.body.org.id).toBe(orgId);
    expect(r.body.papel).toBe('ADMIN');
    expect(r.body.usado).toBe(false);
  });

  it('novo usuário aceita o convite e entra na org; link é de uso único (409)', async () => {
    const convidado = await reg('convidado');
    const r = await request(http()).post(`/api/organizacoes/convite/${conviteToken}/aceitar`).set('Authorization', `Bearer ${convidado.token}`).expect(201);
    expect(r.body.orgId).toBe(orgId);
    expect(r.body.papel).toBe('ADMIN');
    // agora é membro: vê o detalhe da org
    await request(http()).get(`/api/organizacoes/${orgId}`).set('Authorization', `Bearer ${convidado.token}`).expect(200);
    // uso único: aceitar de novo (outro usuário) -> 409
    const outro = await reg('convidado2');
    await request(http()).post(`/api/organizacoes/convite/${conviteToken}/aceitar`).set('Authorization', `Bearer ${outro.token}`).expect(409);
  });

  it('quem já é membro não aceita convite (409)', async () => {
    const r = await request(http()).post(`/api/organizacoes/${orgId}/convites`).set('Authorization', `Bearer ${tDono}`).send({}).expect(201);
    await request(http()).post(`/api/organizacoes/convite/${r.body.token}/aceitar`).set('Authorization', `Bearer ${tDono}`).expect(409);
  });

  it('remove membro (só gestor); dono é imutável', async () => {
    await request(http()).delete(`/api/organizacoes/${orgId}/membros/${membroId}`).set('Authorization', `Bearer ${tDono}`).expect(200);
  });
});
