import { ShieldAlert } from "lucide-react";
import { ErrorPage } from "./error-page";

/**
 * Não é uma rota própria — não existe uma URL fixa "/403". Este componente
 * é renderizado no LUGAR do conteúdo da página quando uma chamada à API
 * retorna 403 (ver ApiError em lib/api/client.ts), sem trocar de rota.
 *
 * De propósito, a descrição não diz QUAL permissão falta nem POR QUE —
 * expor isso ("você precisa ser admin", "seu papel não permite X") dá
 * pistas sobre a estrutura interna de permissões para quem está tentando
 * acessar algo que não devia.
 */
export function Forbidden403() {
  return (
    <ErrorPage
      status="403"
      icon={ShieldAlert}
      title="Acesso não autorizado"
      description="Você não possui permissão para acessar esta área."
      cor="red"
      primaryAction={{ label: "Ir para o Dashboard", href: "/dashboard" }}
    />
  );
}
