/**
 * Validação de CPF/CNPJ no cliente (mesma lógica de dígito verificador do
 * backend) — feedback imediato ao usuário antes de enviar o formulário.
 */
export function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

function calcDvCpf(digits: string, pesoInicial: number): number {
  let soma = 0;
  let peso = pesoInicial;
  for (const d of digits) {
    soma += Number(d) * peso;
    peso -= 1;
  }
  const resto = (soma * 10) % 11;
  return resto === 10 ? 0 : resto;
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const dv1 = calcDvCpf(cpf.slice(0, 9), 10);
  const dv2 = calcDvCpf(cpf.slice(0, 10), 11);
  return cpf.slice(-2) === `${dv1}${dv2}`;
}

function calcDvCnpj(digits: string, pesos: number[]): number {
  const soma = digits.split("").reduce((acc, d, i) => acc + Number(d) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv1 = calcDvCnpj(cnpj.slice(0, 12), pesos1);
  const dv2 = calcDvCnpj(cnpj.slice(0, 13), pesos2);
  return cnpj.slice(-2) === `${dv1}${dv2}`;
}

export function isValidCpfCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length === 11) return isValidCpf(digits);
  if (digits.length === 14) return isValidCnpj(digits);
  return false;
}

export function formatCpfCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}
