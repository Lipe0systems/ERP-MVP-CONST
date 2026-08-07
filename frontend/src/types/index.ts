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
