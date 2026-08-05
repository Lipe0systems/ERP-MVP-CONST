"""
Exceções de domínio, independentes de framework/ORM.
Camada: Domain.
"""


class DependencyExistsError(Exception):
    """
    Levantada quando uma entidade não pode ser removida porque outras
    entidades dependem dela (ex.: tentar remover um Cliente que possui
    Obras vinculadas). Traduzida pela Presentation em HTTP 409.
    """


class DuplicateValueError(Exception):
    """
    Levantada quando uma gravação viola uma restrição de unicidade no banco
    (ex.: produto de Estoque ou documento de Cliente duplicados). Serve como
    rede de segurança contra condições de corrida: a checagem prévia feita no
    use case (get_by_produto/get_by_documento) evita a maioria dos casos,
    mas duas requisições concorrentes ainda podem passar pela checagem antes
    de qualquer uma commitar — sem este tratamento, a segunda geraria um
    IntegrityError não tratado (HTTP 500) em vez de um 409 amigável.
    """
