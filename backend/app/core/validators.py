"""
Validadores de documentos brasileiros (CPF/CNPJ).
Implementação real do algoritmo de dígitos verificadores — não apenas
checagem de tamanho — para evitar cadastro de documentos inválidos.
Camada: Core (utilitário transversal, sem dependência de framework).
"""
import re


def only_digits(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def _calc_dv_cpf(digits: str, peso_inicial: int) -> int:
    soma = sum(int(d) * peso for d, peso in zip(digits, range(peso_inicial, 1, -1)))
    resto = (soma * 10) % 11
    return 0 if resto == 10 else resto


def is_valid_cpf(cpf: str) -> bool:
    cpf = only_digits(cpf)
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    dv1 = _calc_dv_cpf(cpf[:9], 10)
    dv2 = _calc_dv_cpf(cpf[:10], 11)
    return cpf[-2:] == f"{dv1}{dv2}"


def _calc_dv_cnpj(digits: str, pesos: list[int]) -> int:
    soma = sum(int(d) * p for d, p in zip(digits, pesos))
    resto = soma % 11
    return 0 if resto < 2 else 11 - resto


def is_valid_cnpj(cnpj: str) -> bool:
    cnpj = only_digits(cnpj)
    if len(cnpj) != 14 or cnpj == cnpj[0] * 14:
        return False
    pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    dv1 = _calc_dv_cnpj(cnpj[:12], pesos1)
    dv2 = _calc_dv_cnpj(cnpj[:13], pesos2)
    return cnpj[-2:] == f"{dv1}{dv2}"


def is_valid_cpf_cnpj(documento: str) -> bool:
    digits = only_digits(documento)
    if len(digits) == 11:
        return is_valid_cpf(digits)
    if len(digits) == 14:
        return is_valid_cnpj(digits)
    return False
