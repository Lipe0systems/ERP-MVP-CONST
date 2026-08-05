/**
 * Helpers de formatação compartilhados entre Obras, Financeiro e demais
 * módulos — evita duplicar a mesma lógica de moeda/data em cada tela.
 */
export function formatMoeda(valor?: number | null): string {
  if (valor == null) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatData(valor?: string | null): string {
  if (!valor) return "—";
  // "T00:00:00" (sem Z) força interpretação em horário local, evitando o
  // bug clássico de exibir o dia anterior em fusos negativos (ex.: Brasil).
  return new Date(`${valor}T00:00:00`).toLocaleDateString("pt-BR");
}

/**
 * Retorna a data de hoje como "YYYY-MM-DD" no fuso horário LOCAL do
 * usuário — para preencher <input type="date">. `new Date().toISOString()`
 * usa UTC: em fusos negativos (ex.: Brasil, UTC-3), entre ~21h e meia-noite
 * local isso já mostra o dia seguinte. Esta função corrige isso.
 */
export function getLocalISODate(date: Date = new Date()): string {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}
