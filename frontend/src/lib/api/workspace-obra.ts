import { apiFetch } from "@/lib/api/client";

export interface WorkspaceObra {
  obra: {
    id: string; nome: string; status: string;
    endereco: string | null; responsavel: string | null;
    cliente_id: string | null; data_inicio: string | null;
    data_previsao: string | null; valor_previsto: number;
  };
  compras: {
    id: string; produto: string; fornecedor: string;
    quantidade: number; valor_unitario: number; status: string; data_compra: string | null;
  }[];
  materiais: {
    id: string; produto: string; tipo: string;
    quantidade: number; origem: string | null; destino: string | null; criado_em: string;
  }[];
  equipe: {
    alocacao_id: string; funcionario_nome: string; cargo: string | null;
    funcao: string | null; salario: number; ativa: boolean; data_inicio: string | null;
  }[];
  financeiro: {
    a_pagar: { id: string; descricao: string; valor: number; status: string; vencimento: string | null }[];
    a_receber: { id: string; descricao: string; valor: number; status: string; vencimento: string | null }[];
    total_a_pagar: number;
    total_a_receber: number;
  };
  documentos: {
    id: string; nome: string; arquivo_url: string; arquivo_tipo: string; criado_em: string;
  }[];
  diario: { id: string; observacoes: string | null; criado_em: string }[];
}

export const obterWorkspaceObra = (obraId: string) =>
  apiFetch<WorkspaceObra>(`/obras/${obraId}/workspace`);
