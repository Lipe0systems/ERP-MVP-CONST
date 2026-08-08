export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
}

export interface Usuario {
  id: string;
  empresa_id: string;
  nome: string;
  email: string;
  papel: "admin" | "membro";
  ativo: boolean;
}

export interface DashboardResumo {
  obras_ativas: number;
  obras_concluidas: number;
  clientes: number;
  contas_a_pagar: number;
  contas_a_receber: number;
  fluxo_de_caixa: { mes: string; entrada: number; saida: number }[];
}

export interface Cliente {
  id: string;
  nome: string;
  documento: string;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
  criado_em: string;
}

export type ClienteInput = Omit<Cliente, "id" | "criado_em">;

export const OBRA_STATUS = [
  "planejamento",
  "em_andamento",
  "pausada",
  "concluida",
  "cancelada",
] as const;

export type ObraStatus = (typeof OBRA_STATUS)[number];

export const OBRA_STATUS_LABEL: Record<ObraStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  pausada: "Pausada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export interface Obra {
  id: string;
  nome: string;
  cliente_id: string;
  endereco?: string | null;
  responsavel?: string | null;
  data_inicio?: string | null;
  data_previsao?: string | null;
  status: ObraStatus;
  valor_previsto?: number | null;
  valor_realizado?: number | null;
  criado_em: string;
}

export interface ObraListItem extends Obra {
  cliente_nome: string;
}

export type ObraInput = Omit<Obra, "id" | "criado_em">;

export const STATUS_CONTA = ["pendente", "liquidado", "cancelado"] as const;
export type StatusConta = (typeof STATUS_CONTA)[number];

export interface ContaPagar {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  fornecedor?: string | null;
  obra_id?: string | null;
  categoria?: string | null;
  data_pagamento?: string | null;
  status: StatusConta;
  observacoes?: string | null;
  criado_em: string;
}

export type ContaPagarInput = Omit<ContaPagar, "id" | "criado_em">;

export interface ContaPagarListItem extends ContaPagar {
  obra_nome?: string | null;
}

export interface ContaReceber {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  cliente_id?: string | null;
  obra_id?: string | null;
  data_recebimento?: string | null;
  status: StatusConta;
  observacoes?: string | null;
  criado_em: string;
}

export type ContaReceberInput = Omit<ContaReceber, "id" | "criado_em">;

export interface ContaReceberListItem extends ContaReceber {
  cliente_nome?: string | null;
  obra_nome?: string | null;
}

export interface FluxoCaixaMes {
  mes: string;
  entrada: number;
  saida: number;
}

export interface FinanceiroResumo {
  total_a_pagar: number;
  total_a_receber: number;
  saldo_previsto: number;
  fluxo_de_caixa: FluxoCaixaMes[];
}

export const STATUS_COMPRA = ["pendente", "aprovada", "recebida", "cancelada"] as const;
export type StatusCompra = (typeof STATUS_COMPRA)[number];

export interface Compra {
  id: string;
  fornecedor: string;
  produto: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  data_compra: string;
  unidade?: string | null;
  obra_id?: string | null;
  status: StatusCompra;
  observacoes?: string | null;
  criado_em: string;
}

export type CompraInput = Omit<Compra, "id" | "criado_em" | "valor_total">;

export interface CompraListItem extends Compra {
  obra_nome?: string | null;
}

export interface ItemEstoque {
  id: string;
  produto: string;
  quantidade: number;
  valor_medio: number;
  valor_total: number;
  unidade?: string | null;
  observacoes?: string | null;
  criado_em: string;
}

export type ItemEstoqueInput = Omit<ItemEstoque, "id" | "criado_em" | "valor_total">;

export const CLIMA_OBRA = [
  "ensolarado",
  "parcialmente_nublado",
  "nublado",
  "chuvoso",
  "tempestade",
] as const;
export type ClimaObra = (typeof CLIMA_OBRA)[number];

export const CLIMA_OBRA_LABEL: Record<ClimaObra, string> = {
  ensolarado: "Ensolarado",
  parcialmente_nublado: "Parcialmente nublado",
  nublado: "Nublado",
  chuvoso: "Chuvoso",
  tempestade: "Tempestade",
};

export interface RegistroDiario {
  id: string;
  obra_id: string;
  data: string;
  observacoes: string;
  clima?: ClimaObra | null;
  fotos: string[];
  criado_em: string;
}

export type RegistroDiarioInput = Omit<RegistroDiario, "id" | "criado_em">;

export interface RegistroDiarioListItem extends RegistroDiario {
  obra_nome: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// === Orçamentos ===

export const STATUS_ORCAMENTO = ["rascunho", "aprovado", "recusado", "cancelado"] as const;
export type StatusOrcamento = (typeof STATUS_ORCAMENTO)[number];

export const STATUS_ORCAMENTO_LABEL: Record<StatusOrcamento, string> = {
  rascunho: "Rascunho",
  aprovado: "Aprovado",
  recusado: "Recusado",
  cancelado: "Cancelado",
};

export interface OrcamentoItem {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  unidade?: string | null;
  estoque_id?: string | null;
}

export interface OrcamentoItemInput {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  unidade?: string | null;
  estoque_id?: string | null;
}

export interface Orcamento {
  id: string;
  numero: number;
  cliente_id: string;
  obra_id?: string | null;
  status: StatusOrcamento;
  validade?: string | null;
  observacoes?: string | null;
  conta_receber_id?: string | null;
  itens: OrcamentoItem[];
  valor_total: number;
  criado_em: string;
}

export interface OrcamentoInput {
  cliente_id: string;
  obra_id?: string | null;
  validade?: string | null;
  observacoes?: string | null;
  itens: OrcamentoItemInput[];
}

export interface OrcamentoListItem {
  id: string;
  numero: number;
  cliente_id: string;
  cliente_nome: string;
  obra_id?: string | null;
  obra_nome?: string | null;
  status: StatusOrcamento;
  validade?: string | null;
  valor_total: number;
  qtd_itens: number;
  conta_receber_id?: string | null;
  observacoes?: string | null;
  criado_em: string;
}

// === Fornecedores ===

export interface Fornecedor {
  id: string;
  nome: string;
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
  criado_em: string;
}

export interface FornecedorInput {
  nome: string;
  documento?: string | null;
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  observacoes?: string | null;
}

// === Cliente expandido (V3) ===
// Substitui a interface anterior — campos novos são opcionais para compatibilidade

export interface ClienteV3 extends Cliente {
  whatsapp?: string | null;
  rg?: string | null;
  sexo?: "M" | "F" | "outro" | null;
  data_nascimento?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

export type ClienteV3Input = Omit<ClienteV3, "id" | "criado_em">;

export interface CepData {
  cep: string;
  logradouro: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
}

// === Banco (V3-F2) ===

export const TIPO_CONTA = ["corrente", "poupanca", "caixa", "outro"] as const;
export type TipoConta = (typeof TIPO_CONTA)[number];
export const TIPO_CONTA_LABEL: Record<TipoConta, string> = {
  corrente: "Conta Corrente",
  poupanca: "Poupança",
  caixa: "Caixa",
  outro: "Outro",
};

export const TIPO_LANCAMENTO = ["entrada", "saida"] as const;
export type TipoLancamento = (typeof TIPO_LANCAMENTO)[number];

export interface ContaBancaria {
  id: string;
  nome: string;
  banco?: string | null;
  agencia?: string | null;
  numero_conta?: string | null;
  tipo: TipoConta;
  saldo_inicial: number;
  saldo_atual: number;
  ativo: boolean;
  observacoes?: string | null;
  criado_em: string;
}

export interface LancamentoBancario {
  id: string;
  conta_id: string;
  tipo: TipoLancamento;
  valor: number;
  descricao: string;
  data: string;
  categoria?: string | null;
  referencia?: string | null;
  criado_em: string;
}

export interface ContaBancariaInput {
  nome: string;
  banco?: string | null;
  agencia?: string | null;
  numero_conta?: string | null;
  tipo: TipoConta;
  saldo_inicial: number;
  observacoes?: string | null;
}

export interface LancamentoBancarioInput {
  conta_id: string;
  tipo: TipoLancamento;
  valor: number;
  descricao: string;
  data: string;
  categoria?: string | null;
  referencia?: string | null;
}

// === Documentos (V3-F4) ===

export interface Documento {
  id: string;
  nome: string;
  arquivo_url: string;
  arquivo_nome: string;
  arquivo_tipo: string;
  arquivo_tamanho: number;
  cliente_id?: string | null;
  obra_id?: string | null;
  orcamento_id?: string | null;
  descricao?: string | null;
  criado_em: string;
}

export interface DocumentoInput {
  nome: string;
  arquivo_url: string;
  arquivo_nome: string;
  arquivo_tipo: string;
  arquivo_tamanho: number;
  cliente_id?: string | null;
  obra_id?: string | null;
  orcamento_id?: string | null;
  descricao?: string | null;
}

// === Atendimentos (V3-F5) ===

export const TIPO_ATENDIMENTO = ["visita", "entrega", "vistoria", "reuniao", "outro"] as const;
export type TipoAtendimento = (typeof TIPO_ATENDIMENTO)[number];
export const TIPO_ATENDIMENTO_LABEL: Record<TipoAtendimento, string> = {
  visita: "Visita", entrega: "Entrega", vistoria: "Vistoria",
  reuniao: "Reunião", outro: "Outro",
};

export const STATUS_ATENDIMENTO = ["agendado", "realizado", "cancelado"] as const;
export type StatusAtendimento = (typeof STATUS_ATENDIMENTO)[number];
export const STATUS_ATENDIMENTO_LABEL: Record<StatusAtendimento, string> = {
  agendado: "Agendado", realizado: "Realizado", cancelado: "Cancelado",
};

export interface AtendimentoListItem {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  obra_id?: string | null;
  obra_nome?: string | null;
  tipo: TipoAtendimento;
  status: StatusAtendimento;
  data: string;
  hora?: string | null;
  responsavel?: string | null;
  descricao?: string | null;
  checklist: string[];
  checklist_ok: string[];
  fotos: string[];
  criado_em: string;
}

export interface AtendimentoInput {
  cliente_id: string;
  obra_id?: string | null;
  tipo: TipoAtendimento;
  status: StatusAtendimento;
  data: string;
  hora?: string | null;
  responsavel?: string | null;
  descricao?: string | null;
  checklist: string[];
  checklist_ok: string[];
  fotos: string[];
  assinatura_url?: string | null;
  observacoes?: string | null;
}

// === Vendas (V3-F6) ===

export const FORMA_PAGAMENTO = ["avista", "parcelado", "boleto", "pix", "cartao", "outro"] as const;
export type FormaPagamento = (typeof FORMA_PAGAMENTO)[number];
export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  avista: "À vista", parcelado: "Parcelado", boleto: "Boleto",
  pix: "PIX", cartao: "Cartão", outro: "Outro",
};

export const STATUS_VENDA = ["aberta", "paga", "cancelada"] as const;
export type StatusVenda = (typeof STATUS_VENDA)[number];
export const STATUS_VENDA_LABEL: Record<StatusVenda, string> = {
  aberta: "Em aberto", paga: "Paga", cancelada: "Cancelada",
};

export interface ParcelaVenda {
  id: string; numero: number; valor: number;
  vencimento: string; conta_receber_id?: string | null;
}

export interface Venda {
  id: string; numero: number; cliente_id: string;
  orcamento_id?: string | null; obra_id?: string | null;
  status: StatusVenda; forma_pagamento: FormaPagamento;
  valor_total: number; desconto: number; valor_liquido: number;
  observacoes?: string | null; parcelas: ParcelaVenda[]; criado_em: string;
}

export interface VendaListItem {
  id: string; numero: number; cliente_id: string; cliente_nome: string;
  orcamento_id?: string | null; obra_id?: string | null; obra_nome?: string | null;
  status: StatusVenda; forma_pagamento: FormaPagamento;
  valor_total: number; desconto: number; valor_liquido: number;
  num_parcelas: number; observacoes?: string | null; criado_em: string;
}

export interface VendaDeOrcamentoInput {
  orcamento_id: string; forma_pagamento: FormaPagamento;
  num_parcelas: number; dias_primeiro_vencimento: number;
  desconto: number; observacoes?: string | null;
}
