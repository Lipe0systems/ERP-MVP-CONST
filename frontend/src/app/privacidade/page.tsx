import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Política de Privacidade — Onseg" };

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <article className="prose prose-sm max-w-none dark:prose-invert">
        <h1>Política de Privacidade e Cookies — Onseg</h1>
        <p className="text-sm text-muted-foreground">Última atualização: 14/08/2026</p>

        <h2>1. Quem somos e nosso papel</h2>
        <p>
          Quando você (empresa Cliente) insere dados de seus próprios clientes, funcionários ou fornecedores
          no Sistema, o Onseg atua como <strong>Operador</strong> — você é o <strong>Controlador</strong>,
          responsável por ter base legal para coletar esses dados. Quando tratamos dados da própria empresa
          Cliente e de seus usuários, o Onseg atua como Controlador.
        </p>

        <h2>2. Quais dados coletamos</h2>
        <p>
          Dados de cadastro (empresa, usuários), dados operacionais inseridos no uso do Sistema (clientes,
          obras, orçamentos, financeiro, documentos), e dados técnicos de acesso (IP, navegador, data/hora)
          para segurança e funcionamento. Mantemos registros de auditoria das ações realizadas por cada
          usuário, visíveis para os administradores da própria empresa.
        </p>

        <h2>3. Cookies e armazenamento local</h2>
        <p>
          O Onseg <strong>não usa cookies de publicidade, rastreamento de terceiros ou analytics de
          marketing</strong>. Usamos apenas:
        </p>
        <ul>
          <li><strong>Cookie de sessão (autenticação)</strong> — mantém você conectado ao Sistema. Essencial, não pode ser desativado.</li>
          <li><strong>Armazenamento local (tema)</strong> — lembra sua preferência de modo claro/escuro. Opcional.</li>
          <li><strong>Armazenamento local (preferências do painel)</strong> — lembra os widgets escolhidos no Dashboard. Opcional.</li>
        </ul>
        <p>Não compartilhamos dados de navegação com redes de anúncios.</p>

        <h2>4. Como usamos os dados</h2>
        <p>
          Para viabilizar o funcionamento do Sistema, autenticar usuários, prestar suporte, cumprir
          obrigações legais e melhorar o Sistema. Não vendemos dados pessoais a terceiros, sob nenhuma
          circunstância.
        </p>

        <h2>5. Com quem compartilhamos dados</h2>
        <p>
          Utilizamos os seguintes fornecedores de infraestrutura, como suboperadores: Supabase (banco de
          dados, autenticação e armazenamento), Render (hospedagem do backend) e Vercel (hospedagem do
          frontend).
        </p>

        <h2>6. Isolamento entre empresas</h2>
        <p>
          Os dados de cada empresa Cliente são mantidos isolados dos dados de outras empresas, tanto na
          camada de aplicação quanto na camada de banco de dados.
        </p>

        <h2>7. Segurança</h2>
        <p>
          Adotamos criptografia de senhas, controle de acesso por papéis, comunicação criptografada (HTTPS),
          isolamento multi-tenant e registros de auditoria. Nenhum sistema é 100% imune a incidentes — em
          caso de incidente envolvendo dados pessoais, seguiremos os procedimentos da LGPD.
        </p>

        <h2>8. Retenção e exclusão</h2>
        <p>
          Mantemos os dados enquanto a conta estiver ativa. Quando uma conta é excluída, os dados e acessos
          vinculados são removidos permanentemente, exceto quando a retenção for exigida por lei.
        </p>

        <h2>9. Seus direitos (LGPD)</h2>
        <p>
          Nos termos da Lei 13.709/2018, você tem direito a: confirmação do tratamento, acesso, correção,
          anonimização/eliminação, portabilidade, informação sobre compartilhamento e revogação de
          consentimento. Para exercer esses direitos: contato@onseg.com.br
        </p>
        <p>
          Quando o Onseg atua como Operador, solicitações devem ser direcionadas primeiro à empresa
          Cliente responsável pelo dado (Controladora).
        </p>

        <h2>10. Alterações desta política</h2>
        <p>Podemos atualizar esta Política periodicamente, comunicando alterações relevantes com antecedência.</p>

        <h2>11. Contato</h2>
        <p>Dúvidas sobre esta Política: contato@onseg.com.br</p>
      </article>
    </div>
  );
}
