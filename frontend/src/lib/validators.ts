/**
 * Validadores de CPF e CNPJ com verificação dos dígitos verificadores.
 * Mesmo algoritmo do backend (core/validators.py).
 */

export function onlyDigits(v: string): string {
  return v.replace(/\D/g, "");
}

function calcDvCpf(digits: string, pesoInicial: number): number {
  let soma = 0;
  for (let i = 0; i < digits.length; i++) {
    soma += parseInt(digits[i]) * (pesoInicial - i);
  }
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

export function isValidCpf(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11 || d.split("").every((c) => c === d[0])) return false;
  const dv1 = calcDvCpf(d.slice(0, 9), 10);
  const dv2 = calcDvCpf(d.slice(0, 10), 11);
  return d.slice(-2) === `${dv1}${dv2}`;
}

function calcDvCnpj(digits: string, pesos: number[]): number {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) soma += parseInt(digits[i]) * pesos[i];
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function isValidCnpj(cnpj: string): boolean {
  const d = onlyDigits(cnpj);
  if (d.length !== 14 || d.split("").every((c) => c === d[0])) return false;
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv1 = calcDvCnpj(d.slice(0, 12), p1);
  const dv2 = calcDvCnpj(d.slice(0, 13), p2);
  return d.slice(-2) === `${dv1}${dv2}`;
}

export function isValidCpfCnpj(v: string): boolean | string {
  const d = onlyDigits(v);
  if (d.length === 11) return isValidCpf(d) || "CPF inválido";
  if (d.length === 14) return isValidCnpj(d) || "CNPJ inválido";
  return "Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)";
}

export function formatCpfCnpj(v: string): string {
  const d = onlyDigits(v);
  if (d.length === 11) {
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (d.length === 14) {
    return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return v;
}
