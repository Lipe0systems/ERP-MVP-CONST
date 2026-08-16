import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Termos de Uso — Inovak" };

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <article className="prose prose-sm max-w-none dark:prose-invert">
        <h1>Termos de Uso — Inovak</h1>
        <p className="text-sm text-muted-foreground">Última atualização: 14/08/2026</p>

        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          Este documento está sujeito a atualizações. A versão vigente é sempre a exibida nesta página.
        </p>

        <h2>1. Aceitação dos termos</h2>
        <p>
          Ao criar uma conta e utilizar o Inovak ("Sistema", "Plataforma"), você ("Cliente", "Usuário")
          concorda integralmente com estes Termos de Uso. Se você está aceitando este documento em nome de
          uma empresa, declara ter poderes para vinculá-la a estes termos.
        </p>

        <h2>2. O que é o Inovak</h2>
        <p>
          O Inovak é um sistema de gestão (ERP) em nuvem, voltado para empresas do setor de construção
          civil, oferecendo módulos de gestão de clientes, obras, orçamentos, vendas, compras, estoque,
          financeiro, recursos humanos, documentos e funcionalidades correlatas, no modelo SaaS (Software as
          a Service).
        </p>

        <h2>3. Cadastro e conta</h2>
        <p>
          Para utilizar o Sistema, é necessário criar uma conta vinculada a uma empresa, fornecendo
          informações verdadeiras, completas e atualizadas. O Cliente é responsável por manter a
          confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
          É responsabilidade do administrador da empresa gerenciar corretamente os usuários vinculados à sua
          conta.
        </p>

        <h2>4. Uso permitido</h2>
        <p>
          O Cliente pode utilizar o Sistema exclusivamente para fins lícitos, relacionados à gestão de sua
          própria atividade empresarial. É proibido: usar o Sistema para conteúdo ilegal; tentar acessar
          dados de outras empresas sem autorização; realizar engenharia reversa da Plataforma; usar
          automação para acessar o Sistema fora do uso normal; sobrecarregar deliberadamente a
          infraestrutura; ou compartilhar credenciais com terceiros não autorizados.
        </p>

        <h2>5. Dados inseridos pelo Cliente</h2>
        <p>
          Todo o conteúdo inserido no Sistema pelo Cliente é de propriedade e responsabilidade exclusiva do
          Cliente. O Inovak atua como operador desses dados. O Cliente é o único responsável por garantir
          base legal adequada para inserir dados pessoais de terceiros no Sistema.
        </p>

        <h2>6. Isolamento entre empresas</h2>
        <p>
          O Sistema foi projetado para que cada empresa Cliente tenha acesso exclusivo aos seus próprios
          dados, sem acesso a dados de outras empresas usuárias da Plataforma.
        </p>

        <h2>7. Disponibilidade do serviço</h2>
        <p>
          O Inovak envida esforços razoáveis para manter o Sistema disponível continuamente, mas não
          garante disponibilidade ininterrupta. Manutenções e eventuais indisponibilidades de terceiros
          podem ocorrer.
        </p>

        <h2>8. Backup e continuidade de dados</h2>
        <p>
          O Sistema oferece funcionalidade de exportação/backup de dados. Recomenda-se que o Cliente realize
          exportações periódicas como medida adicional de segurança.
        </p>

        <h2>9. Propriedade intelectual</h2>
        <p>
          O Sistema, seu código-fonte, design e marca são de propriedade do Inovak. Estes Termos não
          transferem ao Cliente nenhum direito de propriedade intelectual — apenas uma licença de uso, não
          exclusiva e intransferível, limitada à vigência da conta.
        </p>

        <h2>10. Limitação de responsabilidade</h2>
        <p>
          O Sistema é fornecido "como está". Na máxima extensão permitida pela lei, o Inovak não se
          responsabiliza por danos indiretos, lucros cessantes ou perda de dados decorrentes do uso do
          Sistema.
        </p>

        <h2>11. Rescisão</h2>
        <p>
          O Cliente pode encerrar sua conta a qualquer momento. O Inovak pode suspender contas que
          violem estes Termos. Após o encerramento, os dados poderão ser mantidos por período razoável e
          depois excluídos, exceto quando a retenção for exigida por lei.
        </p>

        <h2>12. Alterações destes termos</h2>
        <p>
          O Inovak pode atualizar estes Termos periodicamente, comunicando alterações relevantes com
          antecedência razoável.
        </p>

        <h2>13. Lei aplicável</h2>
        <p>Estes Termos são regidos pelas leis da República Federativa do Brasil.</p>

        <h2>14. Contato</h2>
        <p>Em caso de dúvidas: contato@inovak.com.br</p>
      </article>
    </div>
  );
}
