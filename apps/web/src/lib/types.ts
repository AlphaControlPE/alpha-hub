export interface Usuario {
  id: string;
  nome: string;
  email?: string;
  verificado?: boolean;
  papelSistema?: 'USUARIO' | 'MODERADOR' | 'ADMIN';
}

export interface Indicacao {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  contatoNome: string;
  contatoInfo: string;
  valorEstimado: number | null;
  comissaoPct: number | null;
  status: 'CADASTRADA' | 'RESERVADA' | 'ACEITA' | 'GANHA' | 'PERDIDA' | 'EXPIRADA' | 'EM_DISPUTA';
  criadoEm: string;
  indicador: Usuario;
  destinatario?: Usuario | null;
}

export interface Insight {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: string;
  criadoEm: string;
  autor: Usuario;
  votou?: boolean;
  _count?: { votos: number; comentarios: number };
  comentarios?: { id: string; conteudo: string; criadoEm: string; autor: Usuario }[];
}

export interface Reputacao {
  total: number;
  media: { comunicacao: number; qualidade: number; prazo: number; geral: number };
  avaliacoes: {
    notaComunicacao: number;
    notaQualidade: number;
    notaPrazo: number;
    comentario: string | null;
    criadoEm: string;
    autor: { id: string; nome: string };
  }[];
}

export interface Denuncia {
  id: string;
  alvoTipo: string;
  alvoId: string;
  motivo: string;
  descricao: string | null;
  status: 'ABERTA' | 'EM_ANALISE' | 'PROCEDENTE' | 'IMPROCEDENTE';
  resolucao: string | null;
  criadoEm: string;
  denunciante: Usuario;
}

export type ContratoStatus = 'RASCUNHO' | 'ATIVO' | 'CONCLUIDO' | 'CANCELADO' | 'EM_DISPUTA';
export type MarcoStatus = 'PENDENTE' | 'ENTREGUE' | 'APROVADO' | 'PAGO';
export type PagamentoStatus = 'PENDENTE' | 'RETIDO' | 'LIBERADO' | 'ESTORNADO';

export interface Marco {
  id: string;
  titulo: string;
  descricao: string | null;
  valor: number;
  ordem: number;
  status: MarcoStatus;
}

export interface Pagamento {
  id: string;
  valor: number;
  status: PagamentoStatus;
  metodo: string;
  marcoId: string | null;
}

export interface Contrato {
  id: string;
  escopo: string;
  valorTotal: number;
  prazoDias: number | null;
  status: ContratoStatus;
  aceiteCliente: boolean;
  aceitePrestador: boolean;
  criadoEm: string;
  clienteId: string;
  prestadorId: string;
  cliente: Usuario;
  prestador: Usuario;
  marcos: Marco[];
  pagamentos: Pagamento[];
  proposta?: { id: string; solicitacaoId: string };
}

export interface Notificacao {
  id: string;
  categoria: string;
  tipo: string;
  titulo: string;
  corpo: string;
  link: string | null;
  lida: boolean;
  criadoEm: string;
}

export interface NotificacaoPreferencias {
  proposta: boolean;
  mensagem: boolean;
  contrato: boolean;
  indicacao: boolean;
  comunidade: boolean;
  moderacao: boolean;
}

export interface Plano {
  id: string;
  codigo: string;
  nome: string;
  descricao: string;
  preco: number;
  periodicidade: 'UNICO' | 'MENSAL';
  tipo: 'ASSINATURA' | 'SERVICO' | 'PATROCINIO';
  recursos: string[];
  destaque: boolean;
  ordem: number;
}

export interface Assinatura {
  id: string;
  status: 'ATIVA' | 'CANCELADA';
  inicioEm: string;
  fimEm: string | null;
  plano: Plano;
}

export interface BiOverview {
  liquidez: { usuarios: number; solicitacoes: number; solicitacoesAbertas: number; taxaComResposta: number; propostasPorSolicitacao: number };
  conversao: { propostas: number; propostasAceitas: number; taxaAceite: number; contratos: number; contratosConcluidos: number; taxaConclusao: number };
  confianca: { avaliacoes: number; mediaGeral: number; denunciasAbertas: number };
  conhecimento: { insights: number };
  indicacoes: { total: number; ganhas: number };
  eventosAuditoria: number;
}
export interface FunilEtapa { etapa: string; valor: number; pct: number }
export interface CategoriaBi { categoria: string; total: number }
export interface SeriePonto { dia: string; total: number }

export interface Metricas {
  usuarios: number;
  solicitacoes: number;
  propostas: number;
  indicacoes: number;
  insights: number;
  denunciasAbertas: number;
  sancoesAtivas: number;
  eventosAuditoria: number;
}

export type SolicitacaoStatus = 'ABERTA' | 'EM_NEGOCIACAO' | 'ENCERRADA' | 'CANCELADA';
export type PropostaStatus = 'ENVIADA' | 'EM_NEGOCIACAO' | 'ACEITA' | 'RECUSADA' | 'RETIRADA';

export interface Solicitacao {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  orcamento: number | null;
  status: SolicitacaoStatus;
  criadoEm: string;
  autor: Usuario;
  _count?: { propostas: number };
}

export interface Proposta {
  id: string;
  mensagem: string;
  valor: number | null;
  prazoDias: number | null;
  status: PropostaStatus;
  criadoEm: string;
  autor: Usuario;
  conversa?: { id: string } | null;
  conversaId?: string;
}

export interface Mensagem {
  id: string;
  conteudo: string;
  criadoEm: string;
  autor: Usuario;
}

export interface Paginated<T> {
  dados: T[];
  meta: { page: number; limit: number; total: number; totalPaginas: number };
}
