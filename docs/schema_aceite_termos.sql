-- Registra a data/hora em que cada usuário aceitou os Termos de Uso e a
-- Política de Privacidade — necessário para exigir aceite antes de entrar
-- no sistema, e serve como prova de aceite (importante juridicamente).
--
-- termos_versao existe para o futuro: se os termos mudarem de forma
-- relevante, dá pra forçar um novo aceite comparando a versão aceita com
-- a versão atual, sem precisar reconstruir nada.

alter table usuarios add column if not exists termos_aceitos_em timestamp;
alter table usuarios add column if not exists termos_versao varchar(20);
